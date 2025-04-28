import React from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Card,
    CardContent,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';

function Home() {
    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom align="center">
                Weapon Detection System
            </Typography>
            
            <Typography variant="h6" color="text.secondary" paragraph align="center">
                Upload images or videos to detect weapons using advanced AI technology
            </Typography>

            <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Card component={Link} to="/image" sx={{ 
                        textDecoration: 'none',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s ease-in-out'
                        }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <PhotoCameraIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                                <Typography variant="h5" component="div">
                                    Image Detection
                                </Typography>
                                <Typography variant="body1" color="text.secondary" align="center">
                                    Upload an image to detect weapons. The system will analyze the content and identify any potential weapons with confidence scores.
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    startIcon={<SecurityIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Try Image Detection
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card component={Link} to="/video" sx={{ 
                        textDecoration: 'none',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s ease-in-out'
                        }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <VideocamIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                                <Typography variant="h5" component="div">
                                    Video Detection
                                </Typography>
                                <Typography variant="body1" color="text.secondary" align="center">
                                    Upload a video to detect weapons. The system will analyze each frame and provide detailed detection results with confidence scores.
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    startIcon={<SecurityIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Try Video Detection
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    How It Works
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                1. Upload
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Select an image or video file from your device
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                2. Process
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Our AI model analyzes the content for weapon detection
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                3. Results
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                View detailed detection results and analysis
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default Home; 