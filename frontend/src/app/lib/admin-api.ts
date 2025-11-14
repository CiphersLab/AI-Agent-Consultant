import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminAPI = {
  async getAnalytics() {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  async getTopLeads(limit: number = 100) {
    const response = await api.get(`/analytics/top-leads?limit=${limit}`);
    return response.data;
  },

  async getLeadDetails(leadId: string) {
    const response = await api.get(`/analytics/lead/${leadId}`);
    return response.data;
  },
};