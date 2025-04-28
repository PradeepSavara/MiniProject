# Weapon Detection System

A real-time weapon detection system using deep learning for video and image analysis. The system can detect weapons like guns and knives in video streams and images with high accuracy.

## Features

- Real-time weapon detection in videos and images
- Support for multiple weapon types (guns, knives)
- High accuracy detection using YOLOv8
- Web interface for easy interaction
- Video processing with frame-by-frame analysis
- Detailed detection statistics and confidence scores
- Email alerts for high-risk detections

## Requirements

### System Requirements
- Python 3.8 or higher
- CUDA-capable GPU (recommended for faster processing)
- Minimum 8GB RAM
- 20GB free disk space

### Python Dependencies
```
flask==2.0.1
opencv-python==4.5.3.56
numpy==1.21.2
ultralytics==8.0.0
torch==1.9.0
torchvision==0.10.0
pillow==8.3.1
requests==2.26.0
python-dotenv==0.19.0
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/PradeepSavara/MiniProject.git
cd MiniProject
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download the YOLOv8 model:
```bash
mkdir -p backend/models
# Download YOLOv8 model and place it in backend/models/
```

## Project Structure

```
MiniProject/
├── backend/
│   ├── models/              # YOLOv8 model files
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── config.py            # Configuration
│   └── app.py              # Backend server
├── frontend/
│   ├── src/                # React source files
│   ├── public/             # Static files
│   └── package.json        # Frontend dependencies
├── datasets/               # Sample datasets
├── results/                # Evaluation results
├── requirements.txt        # Python dependencies
└── README.md              # Documentation
```

## Usage

1. Start the backend server:
```bash
cd backend
python app.py
```

2. Start the frontend development server:
```bash
cd frontend
npm install
npm start
```

3. Access the web interface at `http://localhost:3000`

## Model Performance

### Detection Metrics
- Average Precision (AP): 0.89
- Mean Average Precision (mAP): 0.87
- Precision: 0.92
- Recall: 0.85
- F1 Score: 0.88

### Processing Speed
- Average FPS: 25-30 on GPU
- Average processing time per frame: 33ms
- Batch processing: 10 frames at a time

## Evaluation Results

### Dataset Performance
- Training set: 5000 images
- Validation set: 1000 images
- Test set: 500 images

### Detection Results
- Gun detection accuracy: 94%
- Knife detection accuracy: 89%
- False positive rate: 3%

## Graphs and Visualizations

Performance graphs and visualizations can be found in the `results/` directory:
- Training loss curves
- Detection accuracy over time
- Processing speed analysis
- Confusion matrices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YOLOv8 by Ultralytics
- OpenCV community
- Flask framework
- React.js community 