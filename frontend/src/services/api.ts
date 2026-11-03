import axios from 'axios';
import {
  DashboardSummary,
  CountryData,
  ChartSeriesData,
  ChargingStationItem,
  DemandPredictionResult,
  GrowthPredictionResult,
  ClusteringResult,
  CompatibilityResult,
  EVModelItem,
  DatasetItem,
  SystemModelInfo,
  SystemHealth,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const evApi = {
  // Dashboard
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  getCountries: async (): Promise<CountryData[]> => {
    const res = await api.get<CountryData[]>('/dashboard/countries');
    return res.data;
  },

  getCharts: async (): Promise<ChartSeriesData> => {
    const res = await api.get<ChartSeriesData>('/dashboard/charts');
    return res.data;
  },

  getStations: async (params?: { page?: number; per_page?: number; country?: string; search?: string }): Promise<{
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    stations: ChargingStationItem[];
  }> => {
    const res = await api.get('/dashboard/stations', { params });
    return res.data;
  },

  // Demand Prediction
  predictDemand: async (features: {
    station_count: number;
    port_count: number;
    fast_station_share: number;
    fast_port_share: number;
    median_power_kw: number;
  }): Promise<DemandPredictionResult> => {
    const res = await api.post<DemandPredictionResult>('/predict-demand', features);
    return res.data;
  },

  getDemandModelInfo: async () => {
    const res = await api.get('/models/demand/info');
    return res.data;
  },

  // Growth Prediction
  predictGrowth: async (features: {
    station_count: number;
    port_count: number;
    fast_station_share: number;
    median_power_kw: number;
  }): Promise<GrowthPredictionResult> => {
    const res = await api.post<GrowthPredictionResult>('/predict-country-growth', features);
    return res.data;
  },

  getGrowthModelInfo: async () => {
    const res = await api.get('/models/growth/info');
    return res.data;
  },

  // Clustering
  getClusters: async (payload: {
    algorithm: 'kmeans' | 'dbscan';
    k?: number;
    eps_km?: number;
    min_samples?: number;
    country?: string;
  }): Promise<ClusteringResult> => {
    const res = await api.post<ClusteringResult>('/cluster-locations', payload);
    return res.data;
  },

  // Compatibility
  checkCompatibility: async (payload: {
    charging_power_kw: number;
    vehicle_type?: string;
  }): Promise<CompatibilityResult> => {
    const res = await api.post<CompatibilityResult>('/predict-compatibility', payload);
    return res.data;
  },

  getEvModels: async (): Promise<{ count: number; models: EVModelItem[] }> => {
    const res = await api.get('/ev-models');
    return res.data;
  },

  // Chatbot
  sendMessage: async (message: string, sessionId?: string): Promise<{
    session_id: string;
    role: string;
    content: string;
    tool_calls?: any[];
    tool_responses?: any[];
    timestamp?: string;
  }> => {
    const res = await api.post('/chat', { message, session_id: sessionId });
    return res.data;
  },

  getChatHistory: async (sessionId: string) => {
    const res = await api.get(`/chat/history?session_id=${sessionId}`);
    return res.data;
  },

  clearChatHistory: async (sessionId: string) => {
    const res = await api.delete(`/chat/history?session_id=${sessionId}`);
    return res.data;
  },

  // Datasets
  getDatasets: async (): Promise<{ datasets: DatasetItem[] }> => {
    const res = await api.get('/datasets');
    return res.data;
  },

  uploadDataset: async (formData: FormData) => {
    const res = await api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getDatasetPreview: async (datasetId?: number) => {
    const url = datasetId ? `/datasets/preview?dataset_id=${datasetId}` : '/datasets/preview';
    const res = await api.get(url);
    return res.data;
  },

  deleteDataset: async (datasetId: number) => {
    const res = await api.delete(`/datasets/${datasetId}`);
    return res.data;
  },

  // System
  getHealth: async (): Promise<SystemHealth> => {
    const res = await api.get<SystemHealth>('/health');
    return res.data;
  },

  getModelInfo: async (): Promise<SystemModelInfo> => {
    const res = await api.get<SystemModelInfo>('/model-info');
    return res.data;
  },

  retrainModels: async () => {
    const res = await api.post('/retrain-models');
    return res.data;
  },
};

export default api;
