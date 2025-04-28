from flask import Flask
from flask_cors import CORS
from config import Config
import logging
from routes.image_routes import image_bp
from routes.video_routes import video_bp
from utils.weapon_info import WeaponInfo

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(image_bp)
    app.register_blueprint(video_bp)
    
    # Initialize weapon info
    weapon_info = WeaponInfo()
    
    return app 