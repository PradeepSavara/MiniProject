from flask import Blueprint, request, jsonify, current_app, send_file, Response, send_from_directory
import os
from werkzeug.utils import secure_filename
from utils.detection_utils import load_model, detect_weapons, draw_detections
from utils.weapon_info import WeaponInfo
from utils.email_utils import EmailNotifier
from config import Config
import logging
import time
import psutil
import cv2
import re
from flask_socketio import emit
import numpy as np
import shutil
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
video_bp = Blueprint('video', __name__)

# Create necessary directories
Config.create_directories()

# Load the weapon detection model
weapon_model = load_model(Config.WEAPON_MODEL_PATH)

# Initialize weapon info and email notifier
weapon_info = WeaponInfo()
email_notifier = EmailNotifier()

# Cache for weapon information and risk assessments
weapon_cache = {}

def get_cached_weapon_info(class_name, confidence):
    """Get weapon information from cache or fetch from API if not cached"""
    if class_name not in weapon_cache:
        # Fetch weapon information and risk assessment
        weapon_data = weapon_info.get_weapon_info(class_name)
        risk_assessment = weapon_info.get_risk_assessment(class_name, confidence)
        
        # Store in cache
        weapon_cache[class_name] = {
            'info': weapon_data,
            'risk_assessment': risk_assessment
        }
        
        # Send email alert if high risk
        if risk_assessment.get('risk_level', '').lower() in ['high', 'critical']:
            email_notifier.send_weapon_alert(
                weapon_data,
                f"Video: {class_name} detected"
            )
    
    return weapon_cache[class_name]

def ensure_directory_exists(directory):
    """Ensure directory exists and has write permissions"""
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Created directory: {directory}")
        if not os.access(directory, os.W_OK):
            logger.error(f"No write permissions for directory: {directory}")
            return False
        return True
    except Exception as e:
        logger.error(f"Error creating directory {directory}: {str(e)}")
        return False

def allowed_file(filename):
    """Check if the file type is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'mp4', 'avi', 'mov'}

def get_system_info():
    """Get system information for logging"""
    try:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        return {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available': memory.available / (1024 * 1024)  # Convert to MB
        }
    except Exception as e:
        logger.warning(f"Error getting system info: {str(e)}")
        return {
            'cpu_percent': 0,
            'memory_percent': 0,
            'memory_available': 0
        }

def log_system_info():
    """Log system information for debugging"""
    try:
        system_info = get_system_info()
        logger.info(f"System Info - CPU: {system_info['cpu_percent']}%, Memory: {system_info['memory_percent']}%, Available: {system_info['memory_available']:.2f}MB")
    except Exception as e:
        logger.warning(f"Error logging system info: {str(e)}")

def cleanup_old_files():
    """Remove files older than 24 hours from upload and processed directories"""
    current_time = time.time()
    for directory in [Config.UPLOAD_FOLDER, Config.PROCESSED_VIDEOS_FOLDER]:
        try:
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                if os.path.isfile(file_path):
                    file_age = current_time - os.path.getmtime(file_path)
                    if file_age > 24 * 3600:  # 24 hours in seconds
                        os.remove(file_path)
                        logger.info(f"Removed old file: {file_path}")
        except Exception as e:
            logger.error(f"Error cleaning up files in {directory}: {str(e)}")

def draw_bounding_box(frame, x1, y1, x2, y2, label, confidence):
    """Draw a bounding box with label on the frame"""
    try:
        # Convert coordinates to integers
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
        
        # Draw the bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Create the label text
        label_text = f"{label}: {confidence:.2f}"
        
        # Calculate text size
        (text_width, text_height), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        
        # Draw background rectangle for text
        cv2.rectangle(frame, (x1, y1 - text_height - 10), (x1 + text_width, y1), (0, 255, 0), -1)
        
        # Draw the text
        cv2.putText(frame, label_text, (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        return frame
    except Exception as e:
        logger.error(f"Error drawing bounding box: {str(e)}")
        return frame

@video_bp.route('/detect', methods=['POST'])
def process_video():
    """Process video for weapon detection"""
    try:
        start_time = time.time()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
            
        # Clean up old files
        cleanup_old_files()
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        input_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(input_path)
        
        # Initialize video capture
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            return jsonify({'success': False, 'error': 'Error opening video file'}), 500
            
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"Video properties - FPS: {fps}, Resolution: {width}x{height}, Total frames: {total_frames}")
        
        # Create output video writer with H.264 codec
        output_path = os.path.join(Config.PROCESSED_VIDEOS_FOLDER, f'processed_{filename}')
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # Use H.264 codec
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            return jsonify({'success': False, 'error': 'Error creating output video'}), 500
            
        # Process video frames
        frame_count = 0
        detections_summary = {}
        confidence_data = []  # Store confidence data for each frame
        
        # Pre-allocate frame buffer for faster processing
        frame_buffer = np.zeros((height, width, 3), dtype=np.uint8)
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                try:
                    # Copy frame to buffer for faster processing
                    np.copyto(frame_buffer, frame)
                    
                    # Preprocess frame for better detection
                    # 1. Resize frame if too large (optimized for detection)
                    max_dimension = 640  # Reduced from 1280 for faster processing
                    if max(width, height) > max_dimension:
                        scale = max_dimension / max(width, height)
                        frame_buffer = cv2.resize(frame_buffer, None, fx=scale, fy=scale)
                    
                    # 2. Quick contrast enhancement
                    frame_buffer = cv2.convertScaleAbs(frame_buffer, alpha=1.2, beta=0)
                    
                    # 3. Light Gaussian blur for noise reduction
                    frame_buffer = cv2.GaussianBlur(frame_buffer, (3, 3), 0)
                    
                    # Detect weapons with adjusted confidence threshold
                    detections = detect_weapons(weapon_model, frame_buffer, conf_threshold=0.25)
                    
                    # Draw detections and collect information
                    frame_detections = []
                    for detection in detections:
                        class_name = detection['class']
                        confidence = detection['confidence']
                        
                        # Only process detections with confidence above threshold
                        if confidence >= 0.25:
                            # Scale detection coordinates back to original frame size
                            if max(width, height) > max_dimension:
                                scale = width / frame_buffer.shape[1]
                                detection['bbox'] = [int(x * scale) for x in detection['bbox']]
                            
                            # Draw detection on original frame
                            frame = draw_detections(frame, [detection])
                            
                            # Get weapon information from cache or API
                            cached_data = get_cached_weapon_info(class_name, confidence)
                            
                            # Update detections summary
                            if class_name not in detections_summary:
                                detections_summary[class_name] = {
                                    'count': 0,
                                    'max_confidence': 0,
                                    'frames_detected': [],
                                    'info': cached_data['info'],
                                    'risk_assessment': cached_data['risk_assessment']
                                }
                            
                            detections_summary[class_name]['count'] += 1
                            detections_summary[class_name]['max_confidence'] = max(
                                detections_summary[class_name]['max_confidence'],
                                confidence
                            )
                            detections_summary[class_name]['frames_detected'].append(frame_count)
                            
                            # Add to frame detections
                            frame_detections.append({
                                'class': class_name,
                                'confidence': confidence,
                                'frame': frame_count
                            })
                    
                    # Add confidence data for this frame
                    confidence_data.extend(frame_detections)
                    
                    # Log detection results for debugging
                    if frame_detections:
                        logger.info(f"Frame {frame_count}/{total_frames}: Detected {len(frame_detections)} weapons")
                        for detection in frame_detections:
                            logger.info(f"  - {detection['class']} (confidence: {detection['confidence']:.2f})")
                    
                except Exception as e:
                    logger.error(f"Error processing frame {frame_count}: {str(e)}")
                    continue
                
                # Write processed frame
                out.write(frame)
                frame_count += 1
                
                # Log progress every 100 frames
                if frame_count % 100 == 0:
                    logger.info(f"Processed {frame_count}/{total_frames} frames ({(frame_count/total_frames)*100:.1f}%)")
                
        except Exception as e:
            logger.error(f"Error during video processing: {str(e)}")
            return jsonify({'success': False, 'error': f'Error processing video: {str(e)}'}), 500
        finally:
            # Release resources
            cap.release()
            out.release()
            
            # Remove original file
            try:
                os.remove(input_path)
            except Exception as e:
                logger.error(f"Error removing original file: {str(e)}")
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log final results
        logger.info(f"Video processing completed in {processing_time:.2f} seconds")
        logger.info(f"Total frames processed: {frame_count}")
        logger.info(f"Total detections: {sum(d['count'] for d in detections_summary.values())}")
        for class_name, data in detections_summary.items():
            logger.info(f"  {class_name}: {data['count']} detections (max confidence: {data['max_confidence']:.2f})")
        
        # Prepare response data
        response_data = {
            'success': True,
            'total_frames': total_frames,
            'processed_frames': frame_count,
            'processing_time': processing_time,
            'detections_summary': detections_summary,
            'confidence_data': confidence_data,
            'processed_video_url': f'/api/video/processed/{filename}'
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@video_bp.route('/processed/<filename>')
def serve_processed_video(filename):
    """Serve processed video file"""
    try:
        processed_path = os.path.join(Config.PROCESSED_VIDEOS_FOLDER, f'processed_{filename}')
        if not os.path.exists(processed_path):
            return jsonify({'error': 'Processed video not found'}), 404
            
        return send_file(processed_path, mimetype='video/mp4')
        
    except Exception as e:
        logger.error(f"Error serving processed video: {str(e)}")
        return jsonify({'error': str(e)}), 500

@video_bp.after_request
def after_request(response):
    try:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Range'
        return response
    except Exception as e:
        logger.error(f"Error in after_request: {str(e)}")
        return response 