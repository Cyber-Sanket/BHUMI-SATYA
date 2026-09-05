import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawBase ? `${rawBase.replace(/\/$/, '')}/api/v1` : '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Health
  checkHealth: () => {
    const url = rawBase ? `${rawBase.replace(/\/$/, '')}/health` : '/health';
    return axios.get(url);
  },

  // Auth
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
    }
    return res.data;
  },

  getMe: () => api.get('/auth/me'),

  // Projects
  getProjects: () => api.get('/projects/'),

  // Parcels
  getParcels: (projectId = null) => {
    const url = projectId ? `/parcels/?project_id=${projectId}` : '/parcels/';
    return api.get(url);
  },

  getParcel: (id) => api.get(`/parcels/${id}`),

  updateParcelStage: (id, targetStage) => 
    api.post(`/parcels/${id}/stage`, { target_stage: targetStage }),

  // Evidence
  submitEvidence: (payload) => api.post('/evidence', payload),

  getParcelEvidence: (parcelId) => api.get(`/evidence/${parcelId}`),

  evaluateVerdict: (parcelId) => api.post(`/evidence/evaluate/${parcelId}`),

  // Alerts & Audit
  getAlerts: (resolved = null) => {
    const url = resolved !== null ? `/alerts/?resolved=${resolved}` : '/alerts/';
    return api.get(url);
  },

  resolveAlert: (id) => api.patch(`/alerts/${id}/resolve`),

  getAuditLogs: (parcelId = null) => {
    const url = parcelId ? `/audit-logs/?parcel_id=${parcelId}` : '/audit-logs/';
    return api.get(url);
  },

  // Landowner Portal
  getLandownerParcel: (parcelCode) => api.get(`/landowner/parcel/${parcelCode}`),
};

export default apiService;
