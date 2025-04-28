from flask import Blueprint, request, jsonify, current_app, send_file, send_from_directory
from flask_socketio import emit
import os
from werkzeug.utils import secure_filename
from utils.detection_utils import process_detection, load_model, detect_weapons, draw_detections
from utils.weapon_info import WeaponInfo
from utils.email_utils import EmailNotifier
import logging
import time
import psutil
import cv2
import numpy as np
from config import Config
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
image_bp = Blueprint('image', __name__)

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
                f"Image: {class_name} detected"
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
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}

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
    for directory in [Config.UPLOAD_FOLDER, Config.PROCESSED_IMAGES_DIR]:
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

@image_bp.route('/detect', methods=['POST'])
def process_image():
    """Process image for weapon detection"""
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
        
        # Read and process image
        try:
            image = cv2.imread(input_path)
            if image is None:
                return jsonify({'success': False, 'error': 'Error reading image file'}), 500
                
            # Get image dimensions
            height, width = image.shape[:2]
            
            # Optimized preprocessing
            # 1. Resize image if too large (optimized for detection)
            max_dimension = 640
            if max(width, height) > max_dimension:
                scale = max_dimension / max(width, height)
                image = cv2.resize(image, None, fx=scale, fy=scale)
            
            # 2. Quick contrast enhancement (only if image is dark)
            mean_intensity = np.mean(image)
            if mean_intensity < 100:  # Only enhance if image is dark
                image = cv2.convertScaleAbs(image, alpha=1.2, beta=0)
            
            # Detect weapons with optimized confidence threshold
            detections = detect_weapons(weapon_model, image, conf_threshold=0.35)
            
            # Draw detections and collect information
            detections_summary = {}
            for detection in detections:
                class_name = detection['class']
                confidence = detection['confidence']
                
                # Only process detections with confidence above threshold
                if confidence >= 0.35:
                    # Scale detection coordinates back to original image size
                    if max(width, height) > max_dimension:
                        scale = width / image.shape[1]
                        detection['bbox'] = [int(x * scale) for x in detection['bbox']]
                    
                    # Get weapon information from cache or API
                    cached_data = get_cached_weapon_info(class_name, confidence)
                    
                    # Update detections summary
                    if class_name not in detections_summary:
                        detections_summary[class_name] = {
                            'count': 0,
                            'max_confidence': 0,
                            'info': cached_data['info'],
                            'risk_assessment': cached_data['risk_assessment']
                        }
                    
                    detections_summary[class_name]['count'] += 1
                    detections_summary[class_name]['max_confidence'] = max(
                        detections_summary[class_name]['max_confidence'],
                        confidence
                    )
            
            # Draw all detections on the original image
            image = draw_detections(image, detections)
            
            # Save processed image
            output_path = os.path.join(Config.PROCESSED_IMAGES_DIR, f'processed_{filename}')
            cv2.imwrite(output_path, image)
            
            # Remove original file
            try:
                os.remove(input_path)
            except Exception as e:
                logger.error(f"Error removing original file: {str(e)}")
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Log results
            logger.info(f"Image processing completed in {processing_time:.2f} seconds")
            logger.info(f"Total detections: {sum(d['count'] for d in detections_summary.values())}")
            for class_name, data in detections_summary.items():
                logger.info(f"  {class_name}: {data['count']} detections (max confidence: {data['max_confidence']:.2f})")
            
            # Prepare response data
            response_data = {
                'success': True,
                'processing_time': processing_time,
                'detections': detections,
                'detections_summary': {
                    class_name: {
                        'count': data['count'],
                        'max_confidence': data['max_confidence'],
                        'weapon_info': data['info'],
                        'risk_assessment': data['risk_assessment']
                    } for class_name, data in detections_summary.items()
                },
                'processed_image_url': f'/api/image/processed/{filename}'
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
            
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@image_bp.route('/processed/<filename>')
def serve_processed_image(filename):
    """Serve processed image file"""
    try:
        processed_path = os.path.join(Config.PROCESSED_IMAGES_DIR, f'processed_{filename}')
        if not os.path.exists(processed_path):
            return jsonify({'error': 'Processed image not found'}), 404
            
        return send_file(processed_path, mimetype='image/jpeg')
        
    except Exception as e:
        logger.error(f"Error serving processed image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@image_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    return response 