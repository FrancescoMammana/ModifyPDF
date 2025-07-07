import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

class ApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // PDF Operations
  async uploadPDF(file, userId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('user_id', userId);
    }

    const response = await this.axiosInstance.post('/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPDFDocument(pdfId) {
    const response = await this.axiosInstance.get(`/pdf/document/${pdfId}`);
    return response.data;
  }

  async getPDFFileUrl(pdfId) {
    return `${API}/pdf/file/${pdfId}`;
  }

  async deletePDFDocument(pdfId) {
    const response = await this.axiosInstance.delete(`/pdf/document/${pdfId}`);
    return response.data;
  }

  // Annotation Operations
  async createAnnotation(annotation) {
    const response = await this.axiosInstance.post('/pdf/annotations', annotation);
    return response.data;
  }

  async getAnnotations(pdfId) {
    const response = await this.axiosInstance.get(`/pdf/annotations/${pdfId}`);
    return response.data;
  }

  async updateAnnotation(annotationId, updates) {
    const response = await this.axiosInstance.put(`/pdf/annotations/${annotationId}`, updates);
    return response.data;
  }

  async deleteAnnotation(annotationId) {
    const response = await this.axiosInstance.delete(`/pdf/annotations/${annotationId}`);
    return response.data;
  }

  // Signature Operations
  async createSignature(name, imageData, fileType, userId = null) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image_data', imageData);
    formData.append('file_type', fileType);
    if (userId) {
      formData.append('user_id', userId);
    }

    const response = await this.axiosInstance.post('/pdf/signatures', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getSignatures(userId = null) {
    const params = userId ? { user_id: userId } : {};
    const response = await this.axiosInstance.get('/pdf/signatures', { params });
    return response.data;
  }

  async deleteSignature(signatureId) {
    const response = await this.axiosInstance.delete(`/pdf/signatures/${signatureId}`);
    return response.data;
  }

  // Project Operations
  async createProject(project) {
    const response = await this.axiosInstance.post('/pdf/projects', project);
    return response.data;
  }

  async getProject(projectId) {
    const response = await this.axiosInstance.get(`/pdf/projects/${projectId}`);
    return response.data;
  }

  async updateProject(projectId, updates) {
    const response = await this.axiosInstance.put(`/pdf/projects/${projectId}`, updates);
    return response.data;
  }

  async getProjects(userId = null) {
    const params = userId ? { user_id: userId } : {};
    const response = await this.axiosInstance.get('/pdf/projects', { params });
    return response.data;
  }

  async deleteProject(projectId) {
    const response = await this.axiosInstance.delete(`/pdf/projects/${projectId}`);
    return response.data;
  }

  // Utility Methods
  async healthCheck() {
    const response = await this.axiosInstance.get('/');
    return response.data;
  }

  // Error handling helper
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'Server error';
      throw new Error(`${error.response.status}: ${message}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Other error
      throw new Error(error.message || 'Unknown error');
    }
  }
}

export default new ApiService();