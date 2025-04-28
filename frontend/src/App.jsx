import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import Home from './components/Home';
import ImageDetection from './components/ImageDetection';
import VideoDetection from './components/VideoDetection';
import './styles.css';

function App() {
    const [snowflakes, setSnowflakes] = useState([]);

    useEffect(() => {
        const createSnowflakes = () => {
            const flakes = Array.from({ length: 10 }, (_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 5}s`,
                animationDelay: `${Math.random() * 3}s`,
                fontSize: `${Math.random() * 10 + 10}px`
            }));
            setSnowflakes(flakes);
        };

        createSnowflakes();
        const interval = setInterval(createSnowflakes, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Router>
            <div className="app">
                {snowflakes.map((flake) => (
                    <div
                        key={flake.id}
                        className="snowflake"
                        style={{
                            left: flake.left,
                            animationDuration: flake.animationDuration,
                            animationDelay: flake.animationDelay,
                            fontSize: flake.fontSize
                        }}
                    >
                        ❄
                    </div>
                ))}
                
                <AppBar 
                    position="static" 
                    sx={{ 
                        background: 'linear-gradient(45deg, #6B46C1 30%, #2B6CB0 90%)',
                        boxShadow: `
                            0 3px 5px 2px rgba(107, 70, 193, .3),
                            0 6px 10px 2px rgba(43, 108, 176, .2),
                            inset 0 0 10px rgba(255, 255, 255, .1)
                        `,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: `
                                0 5px 15px 2px rgba(107, 70, 193, .4),
                                0 10px 20px 2px rgba(43, 108, 176, .3),
                                inset 0 0 15px rgba(255, 255, 255, .2)
                            `,
                        }
                    }}
                >
                    <Toolbar>
                        <Typography 
                            variant="h6" 
                            component={Link} 
                            to="/" 
                            sx={{ 
                                flexGrow: 1, 
                                textDecoration: 'none', 
                                color: 'inherit',
                                fontWeight: 'bold',
                                letterSpacing: '1px',
                                transition: 'all 0.3s ease',
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    textShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                                }
                            }}
                        >
                            Weapon Detection System
                        </Typography>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/image"
                            sx={{
                                transition: 'all 0.3s ease',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                }
                            }}
                        >
                            Image Detection
                        </Button>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/video"
                            sx={{
                                transition: 'all 0.3s ease',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                                }
                            }}
                        >
                            Video Detection
                        </Button>
                    </Toolbar>
                </AppBar>

                <Container 
                    sx={{ 
                        mt: 4,
                        animation: 'fadeIn 0.5s ease-in',
                        '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateY(20px)' },
                            to: { opacity: 1, transform: 'translateY(0)' }
                        },
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 245, 255, 0.95))',
                        borderRadius: '20px',
                        boxShadow: `
                            0 10px 30px rgba(107, 70, 193, 0.2),
                            0 20px 60px rgba(43, 108, 176, 0.1),
                            inset 0 0 20px rgba(255, 255, 255, 0.1)
                        `,
                        padding: '30px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: `
                                0 15px 40px rgba(107, 70, 193, 0.3),
                                0 25px 80px rgba(43, 108, 176, 0.2),
                                inset 0 0 30px rgba(255, 255, 255, 0.2)
                            `,
                            transform: 'translateY(-5px)',
                        }
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/image" element={<ImageDetection />} />
                        <Route path="/video" element={<VideoDetection />} />
                    </Routes>
                </Container>
            </div>
        </Router>
    );
}

export default App; 