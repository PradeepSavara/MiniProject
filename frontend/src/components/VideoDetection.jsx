import React, { useState } from "react";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const VisuallyHiddenInput = styled("input")`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

const VideoDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      const response = await fetch("http://localhost:5000/api/video/detect", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to process video");
      }

      setDetectionResults(data);
      setProcessedVideoUrl(`http://localhost:5000/api/video/processed/${selectedFile.name}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        setError("Request timed out. Please try again with a smaller video file.");
      } else {
        setError(`Error processing video: ${error.message}`);
      }
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderConfidenceGraph = () => {
    if (!detectionResults?.confidence_data?.length) return null;

    const data = detectionResults.confidence_data.map((item) => ({
      frame: item.frame,
      confidence: item.confidence * 100,
      name: item.class,
    }));

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Confidence Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frame" label={{ value: "Frame Number", position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: "Confidence (%)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderDetectionSummary = () => {
    if (!detectionResults?.detections_summary) return null;

    const summaryData = Object.entries(detectionResults.detections_summary).map(([weapon, data]) => ({
      name: weapon,
      count: data.count,
      maxConfidence: data.max_confidence * 100,
    }));

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detection Summary
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: "Count", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: "Max Confidence (%)", angle: 90, position: "insideRight" }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Detection Count" />
              <Bar yAxisId="right" dataKey="maxConfidence" fill="#82ca9d" name="Max Confidence" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderWeaponDetails = () => {
    if (!detectionResults?.detections_summary) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Weapon Details
          </Typography>
          <List>
            {Object.entries(detectionResults.detections_summary).map(([weapon, data]) => (
              <React.Fragment key={weapon}>
                <ListItem>
                  <ListItemText
                    primary={weapon}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          Count: {data.count}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.primary">
                          Max Confidence: {(data.max_confidence * 100).toFixed(2)}%
                        </Typography>
                        <br />
                        {data.info && (
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Type: {data.info.type || "Unknown"}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.primary">
                              Description: {data.info.description || "No description available"}
                            </Typography>
                          </>
                        )}
                        {data.risk_assessment && (
                          <>
                            <br />
                            <Typography component="span" variant="body2" color="text.primary">
                              Risk Level: {data.risk_assessment.risk_level}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.primary">
                              Recommended Actions: {data.risk_assessment.recommended_actions.join(", ")}
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Video Weapon Detection
        </Typography>
        <Typography variant="body1" paragraph>
          Upload a video file to detect weapons. Supported formats: MP4, AVI, MOV
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<VideoLibraryIcon />}
          >
            Select Video
            <VisuallyHiddenInput type="file" accept="video/*" onChange={handleFileSelect} />
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? "Processing..." : "Upload and Detect"}
          </Button>
        </Box>

        {selectedFile && (
          <Typography variant="body2" color="text.secondary">
            Selected file: {selectedFile.name}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {isProcessing && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {detectionResults && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Processing Results
              </Typography>
              <Typography variant="body1">
                Total Frames: {detectionResults.total_frames}
                <br />
                Processed Frames: {detectionResults.processed_frames}
                <br />
                Processing Time: {detectionResults.processing_time.toFixed(2)} seconds
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            {renderConfidenceGraph()}
          </Grid>

          <Grid item xs={12}>
            {renderDetectionSummary()}
          </Grid>

          <Grid item xs={12}>
            {renderWeaponDetails()}
          </Grid>

          {processedVideoUrl && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Processed Video
                </Typography>
                <video
                  controls
                  width="100%"
                  src={processedVideoUrl}
                  style={{ maxWidth: "100%" }}
                />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default VideoDetection;