import React, { useState, useRef } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { detectViolence } from '../services/api';
import { useTheme } from '@mui/material/styles';

const ViolenceDetection = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const fileInputRef = useRef(null);
    const theme = useTheme();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setDetectionResult(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a video file first');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setDetectionResult(null);

        try {
            const response = await detectViolence(selectedFile);
            setDetectionResult(response);
        } catch (err) {
            setError(err.message || 'Failed to analyze video');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
            setError(null);
            setDetectionResult(null);
        } else {
            setError('Please drop a valid video file');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2
                }}
            >
                <Typography variant="h5" gutterBottom>
                    Violence Detection Analysis
                </Typography>

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 600,
                        p: 3,
                        border: '2px dashed',
                        borderColor: theme.palette.primary.main,
                        borderRadius: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        mb: 2,
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="video/*"
                        onChange={handleFileChange}
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="body1">
                        {selectedFile ? selectedFile.name : 'Drag and drop a video file here or click to select'}
                    </Typography>
                </Box>

                {selectedFile && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpload}
                        disabled={isProcessing}
                        sx={{ mb: 2 }}
                    >
                        {isProcessing ? 'Analyzing...' : 'Analyze Video'}
                    </Button>
                )}

                {isProcessing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CircularProgress size={24} />
                        <Typography>Analyzing video for violence...</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {detectionResult && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <Paper 
                            sx={{ 
                                p: 3, 
                                backgroundColor: detectionResult.is_violent ? 
                                    theme.palette.error.light : 
                                    theme.palette.success.light,
                                color: 'white'
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Analysis Result
                            </Typography>
                            <Typography variant="body1">
                                This video is classified as: {detectionResult.is_violent ? 'Violent' : 'Non-Violent'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Confidence: {(detectionResult.confidence * 100).toFixed(2)}%
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Processing Time: {detectionResult.processing_time.toFixed(2)} seconds
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ViolenceDetection; 