from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import time
from flask_socketio import emit

violence_bp = Blueprint('violence', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def preprocess_frame(frame, target_size=(224, 224)):
    # Resize frame
    frame = cv2.resize(frame, target_size)
    # Convert BGR to RGB
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # Normalize pixel values
    frame = frame.astype(np.float32) / 255.0
    # Add batch dimension
    frame = np.expand_dims(frame, axis=0)
    return frame

@violence_bp.route('/detect', methods=['POST'])
def detect_violence():
    start_time = time.time()
    try:
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file part in request',
                'details': 'Please ensure you are sending a file with the key "file"'
            }), 400
        
        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({
                'error': 'No selected file',
                'details': 'Please select a file to upload'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'details': f'Allowed types: {current_app.config["ALLOWED_EXTENSIONS"]}'
            }), 400
        
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(current_app.root_path, current_app.config['UPLOAD_FOLDER'])
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        
        try:
            file.save(filepath)
        except Exception as e:
            return jsonify({
                'error': 'Error saving file',
                'details': str(e)
            }), 500
        
        try:
            # Read video
            cap = cv2.VideoCapture(filepath)
            if not cap.isOpened():
                return jsonify({
                    'error': 'Failed to open video',
                    'details': 'The video file could not be opened'
                }), 400
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Process frames
            violence_scores = []
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every nth frame (adjust based on performance needs)
                if frame_count % fps == 0:
                    # Preprocess frame
                    processed_frame = preprocess_frame(frame)
                    
                    # Get violence prediction
                    prediction = current_app.config['VIOLENCE_MODEL'].predict(processed_frame)
                    violence_score = float(prediction[0][0])
                    violence_scores.append(violence_score)
                
                frame_count += 1
            
            # Calculate average violence score
            avg_violence_score = sum(violence_scores) / len(violence_scores) if violence_scores else 0
            
            # Determine if video contains violence
            is_violent = avg_violence_score > 0.5  # Adjust threshold as needed
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Construct response
            response = {
                'success': True,
                'is_violent': is_violent,
                'violence_score': avg_violence_score,
                'processing_time': processing_time,
                'total_frames_analyzed': len(violence_scores),
                'total_frames': total_frames
            }
            
            return jsonify(response)
            
        except Exception as e:
            return jsonify({
                'error': 'Error processing video',
                'details': str(e)
            }), 500
        finally:
            # Clean up
            if os.path.exists(filepath):
                os.remove(filepath)
            if 'cap' in locals():
                cap.release()
    
    except Exception as e:
        return jsonify({
            'error': 'An unexpected error occurred',
            'details': str(e)
        }), 500 