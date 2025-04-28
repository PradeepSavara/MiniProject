from flask import Blueprint

# Create blueprints
image_bp = Blueprint('image', __name__)
video_bp = Blueprint('video', __name__)

# Import routes after creating blueprints to avoid circular imports
from .image_routes import image_bp
from .video_routes import video_bp

# Export blueprints
__all__ = ['image_bp', 'video_bp'] 