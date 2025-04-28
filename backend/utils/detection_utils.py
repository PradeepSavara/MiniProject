import cv2
import numpy as np
from ultralytics import YOLO
import os
import logging
from typing import List, Dict, Any, Union
import torch
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def load_model(model_path: str) -> YOLO:
    """Load the YOLO model from the specified path."""
    try:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        logger.info(f"Loading model from: {model_path}")
        
        # Load the YOLO model
        model = YOLO(model_path)
        
        # Set model to evaluation mode
        model.eval()
        
        # Force CPU usage
        model.to('cpu')
        
        logger.info("Model loaded successfully")
        return model
    
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

def detect_weapons(model: YOLO, frame: np.ndarray, conf_threshold: float = 0.3) -> List[Dict[str, Any]]:
    """Detect weapons in a single frame."""
    try:
        # Run inference
        results = model(frame, conf=conf_threshold)
        
        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = model.names[class_id]
                
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)]
                })
        
        return detections
        
    except Exception as e:
        logger.error(f"Error in detect_weapons: {str(e)}")
        raise

def process_detection(
    model: YOLO,
    image: np.ndarray,
    conf_threshold: float = 0.3,
    max_size: int = 640
) -> Dict[str, Any]:
    """Process an image for weapon detection."""
    try:
        # Run inference
        results = model(image, conf=conf_threshold, imgsz=max_size)
        
        # Process results
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = model.names[class_id]
                
                detections.append({
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [float(x1), float(y1), float(x2), float(y2)]
                })
        
        # Draw detections on the image
        processed_image = draw_detections(image, detections)
        
        # Save the processed image
        os.makedirs('processed_images', exist_ok=True)
        processed_image_path = os.path.join('processed_images', f'processed_{int(time.time())}.jpg')
        cv2.imwrite(processed_image_path, processed_image)
        
        return {
            'detections': detections,
            'processed_image_path': processed_image_path
        }
        
    except Exception as e:
        logger.error(f"Error in process_detection: {str(e)}")
        raise

def process_video_detection(
    model: YOLO,
    cap: cv2.VideoCapture,
    conf_threshold: float = 0.3,
    max_size: int = 640
) -> Dict[str, Any]:
    """Process a video for weapon detection."""
    try:
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.debug(f"Video properties: {width}x{height} @ {fps}fps, Total frames: {total_frames}")
        
        # Create output video writer
        os.makedirs('processed_videos', exist_ok=True)
        output_path = os.path.join('processed_videos', f'processed_{int(time.time())}.mp4')
        
        # Try different codecs
        codecs = ['mp4v', 'XVID', 'MJPG']
        writer = None
        
        for codec in codecs:
            try:
                fourcc = cv2.VideoWriter_fourcc(*codec)
                writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                if writer.isOpened():
                    logger.debug(f"Successfully created video writer with codec: {codec}")
                    break
            except Exception as e:
                logger.warning(f"Failed to create video writer with codec {codec}: {str(e)}")
                if writer:
                    writer.release()
                writer = None
        
        if not writer or not writer.isOpened():
            raise Exception("Failed to create video writer with any codec")
        
        # Process video frames
        frame_count = 0
        detections = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            try:
                # Run inference on frame
                results = model(frame, conf=conf_threshold, imgsz=max_size)
                
                # Process results
                frame_detections = []
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        # Get box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = model.names[class_id]
                        
                        frame_detections.append({
                            'class': class_name,
                            'confidence': confidence,
                            'bbox': [float(x1), float(y1), float(x2), float(y2)]
                        })
                
                # Draw detections on frame
                processed_frame = draw_detections(frame, frame_detections)
                
                # Write processed frame
                writer.write(processed_frame)
                
                # Add frame detections to overall detections
                detections.extend(frame_detections)
                
                frame_count += 1
                if frame_count % 10 == 0:  # Log progress every 10 frames
                    logger.debug(f"Processed {frame_count}/{total_frames} frames")
                
            except Exception as e:
                logger.error(f"Error processing frame {frame_count}: {str(e)}")
                continue
        
        # Release resources
        writer.release()
        cap.release()
        
        logger.debug(f"Video processing completed. Processed {frame_count} frames")
        
        return {
            'detections': detections,
            'processed_video_path': output_path
        }
        
    except Exception as e:
        logger.error(f"Error in process_video_detection: {str(e)}")
        raise

def draw_detections(image: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
    """Draw bounding boxes and labels on the image."""
    try:
        # Make a copy of the image
        img = image.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            class_name = det['class']
            confidence = det['confidence']
            
            # Draw bounding box
            cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            
            # Create label
            label = f"{class_name} {confidence:.2f}"
            
            # Get text size
            (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            # Draw background rectangle for text
            cv2.rectangle(img, (int(x1), int(y1) - text_height - 4), 
                         (int(x1) + text_width, int(y1)), (0, 255, 0), -1)
            
            # Draw text
            cv2.putText(img, label, (int(x1), int(y1) - 4),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        return img
        
    except Exception as e:
        logger.error(f"Error in draw_detections: {str(e)}")
        raise 