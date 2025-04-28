import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import logging
from utils.detection_utils import load_model
from routes.video_routes import video_bp
from routes.image_routes import image_bp
from config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # Configure CORS with more specific settings
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Range"],
            "expose_headers": ["Content-Range", "Content-Length", "Content-Type"]
        }
    })
    
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

    # Create necessary directories
    for folder in [Config.UPLOAD_FOLDER, 'processed_images', 'processed_videos']:
        if not os.path.exists(folder):
            os.makedirs(folder)
            logger.info(f"Created directory: {folder}")

    # Configure app settings
    app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
    app.config['ALLOWED_EXTENSIONS'] = Config.ALLOWED_EXTENSIONS
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

    # Load weapon detection model
    weapon_model = load_model(Config.WEAPON_MODEL_PATH)
    app.config['WEAPON_MODEL'] = weapon_model
    logger.info("Weapon detection model loaded successfully")

    # Register blueprints with proper URL prefixes
    app.register_blueprint(image_bp, url_prefix='/api/image')
    app.register_blueprint(video_bp, url_prefix='/api/video')
    logger.info("Blueprints registered successfully")

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "healthy", "model_loaded": "WEAPON_MODEL" in app.config}

    @socketio.on('connect')
    def handle_connect():
        logger.info('Client connected')
        emit('connection_response', {'data': 'Connected'})

    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info('Client disconnected')

    return app, socketio

if __name__ == "__main__":
    try:
        app, socketio = create_app()
        logger.info("Starting Flask server...")
        
        # Set debug mode based on environment
        debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
        
        # Run the server
        socketio.run(
            app,
            host="0.0.0.0",
            port=5000,
            debug=debug,
            use_reloader=False  # Disable reloader to prevent socket errors
        )
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1) 