import axios, { AxiosError } from 'axios';
import type {
  ConversationResponse,
  PreviewResponse,
  LeadCaptureData,
  ProgressResponse,
  Session,
  RefinementResponse,
  SocialProof,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Error handler
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    throw new Error((error.response.data as any)?.detail || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Please try again.');
  } else {
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

export const consultantAPI = {
  async startConversation(userId: string, idea: string): Promise<ConversationResponse> {
    try {
      const response = await api.post<ConversationResponse>('/conversation/start', {
        user_id: userId,
        idea,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async continueConversation(sessionId: string, message: string): Promise<ConversationResponse> {
    try {
      const response = await api.post<ConversationResponse>('/conversation/continue', {
        session_id: sessionId,
        message,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async generatePreview(sessionId: string): Promise<PreviewResponse> {
    try {
      const response = await api.post<PreviewResponse>('/preview/generate', {
        session_id: sessionId,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async captureLead(data: LeadCaptureData) {
    try {
      const response = await api.post('/lead/capture', data);
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async getProgress(sessionId: string): Promise<ProgressResponse> {
    try {
      const response = await api.get<ProgressResponse>(`/progress/${sessionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async getReport(sessionId: string): Promise<Session> {
    try {
      const response = await api.post<Session>('/report/get', {
        session_id: sessionId,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async refineReport(sessionId: string, additionalInfo: string): Promise<RefinementResponse> {
    try {
      const response = await api.post<RefinementResponse>('/report/refine', {
        session_id: sessionId,
        additional_info: additionalInfo,
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async getSocialProof(): Promise<SocialProof> {
    try {
      const response = await api.get<SocialProof>('/social-proof');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError);
      throw error;
    }
  },

  async downloadReportPDF(sessionId: string): Promise<void> {
    try {
      const response = await api.get(`/report/${sessionId}/download-pdf`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai-agent-report-${sessionId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },
};