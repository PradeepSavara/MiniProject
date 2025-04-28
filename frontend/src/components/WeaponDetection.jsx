import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    LinearProgress,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Tabs,
    Tab,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { detectImage, detectVideo } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function WeaponDetection() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [processedUrl, setProcessedUrl] = useState(null);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [fileType, setFileType] = useState('image');
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;
    const videoRef = useRef(null);

    const resetState = () => {
        setResult(null);
        setError(null);
        setProcessedUrl(null);
        setProgress(0);
        setProgressMessage('');
        setRetryCount(0);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (!isImage && !isVideo) {
                setError('Please select an image or video file');
                return;
            }
            
            setFileType(isImage ? 'image' : 'video');
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            resetState();
        }
    };

    const handleDetect = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);
        setProgress(0);
        setProgressMessage('Starting detection...');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch(`http://localhost:5000/api/${fileType}/detect`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to process file');
            }

            // Set the processed URL
            if (fileType === 'image' && data.processed_image_url) {
                setProcessedUrl(`http://localhost:5000${data.processed_image_url}`);
            } else if (fileType === 'video' && data.processed_video_url) {
                setProcessedUrl(`http://localhost:5000${data.processed_video_url}`);
            }

            // Set the detection results
            setResult({
                detections: data.detections_summary ? Object.entries(data.detections_summary).map(([class_name, info]) => ({
                    class: class_name,
                    confidence: info.max_confidence
                })) : [],
                detections_summary: data.detections_summary || {},
                processing_time: data.processing_time,
                total_frames: data.total_frames,
                processed_frames: data.processed_frames
            });

            setRetryCount(0);
        } catch (err) {
            console.error('Detection error:', err);
            const errorMessage = err.response?.data?.error || err.message || 'An error occurred during detection';
            setError(errorMessage);

            // Implement retry mechanism
            if (retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setProgressMessage(`Retrying... Attempt ${retryCount + 1}/${MAX_RETRIES}`);
                setTimeout(() => handleDetect(), 2000); // Retry after 2 seconds
            } else {
                setError(`Failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
            }
        } finally {
            if (retryCount >= MAX_RETRIES) {
                setLoading(false);
            }
        }
    };

    const getConfidenceDistribution = (detections) => {
        if (!detections || detections.length === 0) return null;

        const confidenceRanges = {
            '0-20%': 0,
            '21-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-100%': 0
        };

        detections.forEach(detection => {
            const confidence = detection.confidence * 100;
            if (confidence <= 20) confidenceRanges['0-20%']++;
            else if (confidence <= 40) confidenceRanges['21-40%']++;
            else if (confidence <= 60) confidenceRanges['41-60%']++;
            else if (confidence <= 80) confidenceRanges['61-80%']++;
            else confidenceRanges['81-100%']++;
        });

        return {
            labels: Object.keys(confidenceRanges),
            datasets: [{
                label: 'Number of Detections',
                data: Object.values(confidenceRanges),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };
    };

    const getWeaponTypeDistribution = (detections) => {
        if (!detections || detections.length === 0) return null;

        const weaponTypes = {};
        detections.forEach(detection => {
            weaponTypes[detection.class] = (weaponTypes[detection.class] || 0) + 1;
        });

        return {
            labels: Object.keys(weaponTypes),
            datasets: [{
                label: 'Number of Detections',
                data: Object.values(weaponTypes),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
            <Typography variant="h4" gutterBottom>
                Weapon Detection
            </Typography>
            
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                    >
                        Upload Image or Video
                        <VisuallyHiddenInput 
                            type="file" 
                            onChange={handleFileSelect} 
                            accept="image/*,video/*"
                        />
                    </Button>

                    {preview && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            {fileType === 'image' ? (
                                <img 
                                    src={preview} 
                                    alt="Preview" 
                                    style={{ maxWidth: '100%', maxHeight: '400px' }} 
                                />
                            ) : (
                                <video 
                                    ref={videoRef}
                                    src={preview}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                                />
                            )}
                        </Box>
                    )}

                    {selectedFile && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDetect}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                            fullWidth
                        >
                            {loading ? 'Detecting...' : 'Detect Weapons'}
                        </Button>
                    )}

                    {loading && (
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress variant="determinate" value={progress} />
                            <Typography variant="body2" color="text.secondary" align="center">
                                {progressMessage}
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </Paper>

            {result && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Detection Results
                            </Typography>
                            {processedUrl && (
                                <Box sx={{ mt: 2, mb: 3 }}>
                                    {fileType === 'image' ? (
                                        <img 
                                            src={processedUrl} 
                                            alt="Processed" 
                                            style={{ maxWidth: '100%', maxHeight: '400px' }} 
                                        />
                                    ) : (
                                        <video 
                                            src={processedUrl}
                                            controls
                                            style={{ maxWidth: '100%', maxHeight: '400px' }}
                                        />
                                    )}
                                </Box>
                            )}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Confidence Distribution
                                            </Typography>
                                            {result.detections && result.detections.length > 0 ? (
                                                <Bar 
                                                    data={getConfidenceDistribution(result.detections)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' },
                                                            title: { display: false }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography color="text.secondary">
                                                    No detections found
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Weapon Types
                                            </Typography>
                                            {result.detections && result.detections.length > 0 ? (
                                                <Bar 
                                                    data={getWeaponTypeDistribution(result.detections)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: { position: 'top' },
                                                            title: { display: false }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography color="text.secondary">
                                                    No detections found
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Add Weapon Information Section */}
                            {result.detections_summary && Object.keys(result.detections_summary).length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Weapon Information
                                    </Typography>
                                    <Grid container spacing={3}>
                                        {Object.entries(result.detections_summary).map(([weaponClass, data]) => (
                                            <Grid item xs={12} key={weaponClass}>
                                                <Card>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Typography variant="h6">
                                                                {data.weapon_info?.name || weaponClass}
                                                            </Typography>
                                                            <Typography variant="subtitle1" color="text.secondary">
                                                                Count: {data.count} | Max Confidence: {(data.max_confidence * 100).toFixed(1)}%
                                                            </Typography>
                                                        </Box>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Description
                                                        </Typography>
                                                        <Typography variant="body2" paragraph>
                                                            {data.weapon_info?.description || 'No description available'}
                                                        </Typography>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Specifications
                                                        </Typography>
                                                        <Grid container spacing={2}>
                                                            {data.weapon_info?.specifications && Object.entries(data.weapon_info.specifications).map(([key, value]) => (
                                                                <Grid item xs={6} key={key}>
                                                                    <Typography variant="body2">
                                                                        <strong>{key.replace('_', ' ').title()}:</strong> {value}
                                                                    </Typography>
                                                                </Grid>
                                                            ))}
                                                        </Grid>

                                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                                            Risk Assessment
                                                        </Typography>
                                                        <Typography variant="body2" paragraph>
                                                            {data.risk_assessment?.threat_analysis || 'No threat analysis available'}
                                                        </Typography>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Risk Level: {data.risk_assessment?.risk_level || 'Unknown'}
                                                        </Typography>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Recommended Actions
                                                        </Typography>
                                                        <List dense>
                                                            {data.risk_assessment?.recommended_actions?.map((action, index) => (
                                                                <ListItem key={index}>
                                                                    <ListItemIcon>
                                                                        <CheckCircleIcon color="primary" />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={action} />
                                                                </ListItem>
                                                            ))}
                                                        </List>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Safety Measures
                                                        </Typography>
                                                        <List dense>
                                                            {data.risk_assessment?.safety_measures?.map((measure, index) => (
                                                                <ListItem key={index}>
                                                                    <ListItemIcon>
                                                                        <SecurityIcon color="success" />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={measure} />
                                                                </ListItem>
                                                            ))}
                                                        </List>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Emergency Procedures
                                                        </Typography>
                                                        <List dense>
                                                            {data.risk_assessment?.emergency_procedures?.map((procedure, index) => (
                                                                <ListItem key={index}>
                                                                    <ListItemIcon>
                                                                        <WarningIcon color="error" />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={procedure} />
                                                                </ListItem>
                                                            ))}
                                                        </List>

                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Prevention Measures
                                                        </Typography>
                                                        <List dense>
                                                            {data.weapon_info?.prevention_measures?.map((measure, index) => (
                                                                <ListItem key={index}>
                                                                    <ListItemIcon>
                                                                        <SecurityIcon color="info" />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={measure} />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default WeaponDetection; 