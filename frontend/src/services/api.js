import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json'
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const detectImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post('/image/detect', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error detecting image:', error);
        throw error;
    }
};

export const detectVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post('/video/detect', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error detecting video:', error);
        throw error;
    }
}; 