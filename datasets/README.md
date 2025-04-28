# Weapon Detection Datasets

This directory contains the datasets used for training and evaluating the weapon detection system.
# used Dataset : Weapon Detection Dataset - yolov8
## Dataset Structure

### Training Dataset
- Location: `datasets/train/`
- Total images: 5000
- Classes: Gun, Knife
- Format: JPEG/PNG
- Resolution: Various (resized to 640x384 for training)
- Annotations: YOLO format

### Validation Dataset
- Location: `datasets/val/`
- Total images: 1000
- Classes: Gun, Knife
- Format: JPEG/PNG
- Resolution: Various (resized to 640x384 for validation)
- Annotations: YOLO format

### Test Dataset
- Location: `datasets/test/`
- Total images: 500
- Classes: Gun, Knife
- Format: JPEG/PNG
- Resolution: Various (resized to 640x384 for testing)
- Annotations: YOLO format

## Dataset Statistics

### Class Distribution
| Class | Training | Validation | Test | Total |
|-------|----------|------------|------|-------|
| Gun | 3500 | 700 | 350 | 4550 |
| Knife | 2500 | 500 | 250 | 3250 |
| Total | 6000 | 1200 | 600 | 7800 |

### Image Characteristics
- Average image size: 1280x720
- Minimum image size: 640x480
- Maximum image size: 1920x1080
- Average objects per image: 1.2
- Maximum objects per image: 5

## Data Collection

### Sources
1. Public datasets
2. Internet sources
3. Custom collected data
4. Synthetic data

### Collection Methods
1. Web scraping
2. Manual annotation
3. Data augmentation
4. Synthetic generation

## Data Preprocessing

### Steps
1. Image resizing
2. Normalization
3. Data augmentation
4. Annotation conversion

### Augmentation Techniques
1. Random rotation
2. Random flip
3. Random brightness
4. Random contrast
5. Random noise

## Annotation Format

### YOLO Format
```
<class_id> <x_center> <y_center> <width> <height>
```

### Class IDs
- 0: Gun
- 1: Knife

## Usage

1. Download the datasets
2. Place in appropriate directories
3. Update config.py with paths
4. Run preprocessing script

## License

This dataset is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- Dataset contributors
- Annotation team
- Data collection team 
