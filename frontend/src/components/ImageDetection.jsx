import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Typography, 
    Paper, 
    Alert, 
    CircularProgress,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ListItemIcon,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';

const ImageDetection = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [detectionResults, setDetectionResults] = useState(null);
    const [loadingState, setLoadingState] = useState('idle'); // idle, loading, success, error
    const [retryAttempt, setRetryAttempt] = useState(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const resetState = () => {
        setDetectionResults(null);
        setError(null);
        setLoadingState('idle');
        setRetryAttempt(0);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            resetState();
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setIsProcessing(true);
        setLoadingState('loading');
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

            const response = await fetch('http://localhost:5000/api/image/detect', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to process image');
            }

            setDetectionResults(data);
            setLoadingState('success');
            setRetryAttempt(0);
            setIsProcessing(false); // Ensure processing state is cleared on success
        } catch (error) {
            console.error('Detection error:', error);
            if (error.name === 'AbortError') {
                setError('Request timed out. Please try again with a smaller image or better connection.');
            } else {
                setError(error.message);
            }
            setLoadingState('error');
            setIsProcessing(false); // Ensure processing state is cleared on error

            if (retryAttempt < MAX_RETRIES) {
                setRetryAttempt(prev => prev + 1);
                setTimeout(() => handleUpload(), RETRY_DELAY);
            }
        }
    };

    const getRiskLevelColor = (riskLevel) => {
        switch (riskLevel?.toLowerCase()) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const renderWeaponDetails = () => {
        if (!detectionResults?.detections_summary) return null;

        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Weapon Details
                    </Typography>
                    {Object.entries(detectionResults.detections_summary).map(([weaponClass, data], index) => (
                        <Accordion key={index} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                        {data.weapon_info?.name || weaponClass} ({(data.max_confidence * 100).toFixed(1)}% confidence)
                                    </Typography>
                                    <Chip
                                        label={data.risk_assessment?.risk_level || 'Unknown'}
                                        color={getRiskLevelColor(data.risk_assessment?.risk_level)}
                                        size="small"
                                        sx={{ ml: 2 }}
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <InfoIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Description"
                                            secondary={data.weapon_info?.description || 'No description available'}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemIcon>
                                            <WarningIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Threat Analysis"
                                            secondary={data.risk_assessment?.threat_analysis || 'No threat analysis available'}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemIcon>
                                            <SecurityIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Recommended Actions"
                                            secondary={
                                                <Box component="span">
                                                    {data.risk_assessment?.recommended_actions?.map((action, i) => (
                                                        <Box key={i} component="span" display="block">
                                                            {action}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemIcon>
                                            <SecurityIcon color="info" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Safety Measures"
                                            secondary={
                                                <Box component="span">
                                                    {data.risk_assessment?.safety_measures?.map((measure, i) => (
                                                        <Box key={i} component="span" display="block">
                                                            {measure}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemIcon>
                                            <WarningIcon color="error" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Emergency Procedures"
                                            secondary={
                                                <Box component="span">
                                                    {data.risk_assessment?.emergency_procedures?.map((procedure, i) => (
                                                        <Box key={i} component="span" display="block">
                                                            {procedure}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemIcon>
                                            <SecurityIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Prevention Measures"
                                            secondary={
                                                <Box component="span">
                                                    {data.weapon_info?.prevention_measures?.map((measure, i) => (
                                                        <Box key={i} component="span" display="block">
                                                            {measure}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </CardContent>
            </Card>
        );
    };

    const renderConfidenceGraph = () => {
        if (!detectionResults?.detections) return null;

        const graphData = detectionResults.detections.map((detection, index) => ({
            name: `Detection ${index + 1}`,
            confidence: detection.confidence * 100,
            class: detection.class,
        }));

        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Confidence Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="confidence"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderLoadingState = () => {
        if (loadingState === 'loading') {
            return (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {retryAttempt > 0 ? `Retrying... Attempt ${retryAttempt}/${MAX_RETRIES}` : 'Processing image...'}
                    </Typography>
                </Box>
            );
        }
        return null;
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Upload Image
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                id="image-upload"
                            />
                            <label htmlFor="image-upload">
                                <Button variant="contained" component="span" sx={{ mb: 2 }}>
                                    Select Image
                                </Button>
                            </label>
                            {previewUrl && (
                                <Box sx={{ mt: 2 }}>
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                                    />
                                </Box>
                            )}
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <CircularProgress size={24} sx={{ mr: 1 }} />
                                            Processing...
                                        </>
                                    ) : (
                                        'Detect Weapons'
                                    )}
                                </Button>
                            </Box>
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            {renderLoadingState()}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    {detectionResults && (
                        <>
                            {renderWeaponDetails()}
                            {renderConfidenceGraph()}
                            {detectionResults.processed_image_url && (
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Processed Image
                                        </Typography>
                                        <img
                                            src={`http://localhost:5000${detectionResults.processed_image_url}`}
                                            alt="Processed"
                                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImageDetection; 