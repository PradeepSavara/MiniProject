import os

class Config:
    # Base directory
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    PROCESSED_VIDEOS_FOLDER = os.path.join(BASE_DIR, 'processed_videos')
    PROCESSED_IMAGES_DIR = os.path.join(BASE_DIR, 'processed_images')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4', 'avi', 'mov'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Model settings
    WEAPON_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best.pt')
    
    # Create necessary directories
    @classmethod
    def create_directories(cls):
        """Create all necessary directories with proper permissions"""
        try:
            for folder in [cls.UPLOAD_FOLDER, cls.PROCESSED_VIDEOS_FOLDER, cls.PROCESSED_IMAGES_DIR]:
                if not os.path.exists(folder):
                    os.makedirs(folder)
                    print(f"Created directory: {folder}")
                if not os.access(folder, os.W_OK):
                    print(f"Warning: No write permissions for directory: {folder}")
        except Exception as e:
            print(f"Error creating directories: {str(e)}")
            raise 