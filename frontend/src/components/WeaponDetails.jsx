import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Chip, Grid } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';

const WeaponDetails = ({ weaponSummary }) => {
    if (!weaponSummary || Object.keys(weaponSummary).length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Weapon Detection Summary
            </Typography>
            
            {Object.entries(weaponSummary).map(([weaponClass, data]) => (
                <Paper key={weaponClass} sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {data.info?.name || weaponClass}
                        </Typography>
                        <Chip
                            icon={<WarningIcon />}
                            label={`Risk Level: ${data.risk_assessment?.risk_level}`}
                            color={data.risk_assessment?.risk_level === 'Critical' ? 'error' : 'warning'}
                        />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* OpenAI Information */}
                    {data.openai_info && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Detailed Weapon Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {data.openai_info.summary}
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Properties:</Typography>
                                    <List dense>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Model" 
                                                secondary={data.openai_info.properties.model || 'Unknown'} 
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Type" 
                                                secondary={data.openai_info.properties.type || 'Unknown'} 
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Specifications" 
                                                secondary={data.openai_info.properties.specifications || 'Unknown'} 
                                            />
                                        </ListItem>
                                    </List>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Additional Details:</Typography>
                                    <List dense>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Effective Range" 
                                                secondary={data.openai_info.properties.effective_range || 'Unknown'} 
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Weight" 
                                                secondary={data.openai_info.properties.weight || 'Unknown'} 
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Manufacturer" 
                                                secondary={data.openai_info.properties.manufacturer || 'Unknown'} 
                                            />
                                        </ListItem>
                                    </List>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    
                    {/* Local Information */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Detection Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {data.info?.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Type: {data.info?.type}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Detection Statistics
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Detections: {data.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Maximum Confidence: {(data.max_confidence * 100).toFixed(2)}%
                        </Typography>
                    </Box>
                    
                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Recommended Prevention Measures
                        </Typography>
                        <List dense>
                            {data.risk_assessment?.recommendations.map((measure, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={measure} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
};

export default WeaponDetails; 