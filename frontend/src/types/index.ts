export interface DashboardSummary {
  total_charging_stations: number;
  total_charging_ports: number;
  average_charging_power_kw: number;
  countries_covered: number;
  average_demand_score: number;
  fast_charging_stations: number;
  fast_charging_ratio_percent: number;
  is_synthetic: boolean;
  data_source_label: string;
}

export interface CountryData {
  id: number;
  country: string;
  station_count: number;
  port_count: number;
  fast_station_share: number;
  median_power_kw: number;
  future_growth_index: number;
  is_synthetic: boolean;
  updated_at?: string;
}

export interface ChartSeriesData {
  infrastructure_by_country: Array<{
    country: string;
    stations: number;
    ports: number;
    fast_share: number;
    growth_index: number;
  }>;
  power_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  demand_distribution: Array<{
    range: string;
    count: number;
  }>;
  top_growth_countries: Array<{
    country: string;
    growth_index: number;
    stations: number;
    median_power: number;
  }>;
  ev_type_distribution: Array<{
    type: string;
    count: number;
  }>;
}

export interface ChargingStationItem {
  id: number;
  station_id: string;
  station_name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  station_count: number;
  port_count: number;
  charging_power_kw: number;
  fast_station_share: number;
  fast_port_share: number;
  median_power_kw: number;
  demand_score: number;
  is_synthetic: boolean;
}

export interface DemandPredictionResult {
  demand_score: number;
  demand_tier: 'High' | 'Moderate' | 'Low';
  inputs: {
    station_count: number;
    port_count: number;
    fast_station_share: number;
    fast_port_share: number;
    median_power_kw: number;
  };
  model_version: string;
}

export interface GrowthPredictionResult {
  future_growth_index: number;
  growth_category: 'Exponential' | 'Strong' | 'Moderate' | 'Emerging';
  inputs: {
    station_count: number;
    port_count: number;
    fast_station_share: number;
    median_power_kw: number;
  };
  model_version: string;
}

export interface ClusterStation {
  id: number;
  station_id: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  power_kw: number;
  demand_score: number;
  cluster_id: number;
  is_hotspot?: boolean;
  is_noise?: boolean;
}

export interface ClusterStats {
  cluster_id: number;
  centroid_lat: number;
  centroid_lng: number;
  station_count: number;
  total_ports: number;
  avg_power_kw: number;
  avg_demand_score: number;
  top_cities: string[];
}

export interface HotspotStats {
  cluster_id: number;
  centroid_lat: number;
  centroid_lng: number;
  station_count: number;
  total_ports: number;
  avg_power_kw: number;
  avg_demand_score: number;
  cities: string[];
  countries: string[];
}

export interface ClusteringResult {
  algorithm: 'kmeans' | 'dbscan';
  k?: number;
  eps_km?: number;
  min_samples?: number;
  total_stations: number;
  clusters?: ClusterStats[];
  hotspots?: HotspotStats[];
  hotspots_count?: number;
  noise_count?: number;
  stations: ClusterStation[];
}

export interface EVModelItem {
  id: number;
  manufacturer: string;
  model: string;
  battery_capacity_kwh: number;
  max_charging_power_kw: number;
  vehicle_type: string;
  estimated_10_80_mins?: number;
  power_deficit_kw?: number;
}

export interface CompatibilityResult {
  station_power_kw: number;
  total_models: number;
  compatible_count: number;
  incompatible_count: number;
  compatibility_rate_percent: number;
  compatible_models: EVModelItem[];
  incompatible_models: EVModelItem[];
  technical_advisory: string;
}

export interface ChatMessageItem {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any[];
  tool_responses?: any[];
  timestamp?: string;
}

export interface DatasetItem {
  id: number;
  name: string;
  filename: string;
  dataset_type: 'stations' | 'growth' | 'ev_models';
  row_count: number;
  is_active: boolean;
  is_synthetic: boolean;
  uploaded_at: string;
}

export interface ModelMetricsMeta {
  model_name: string;
  version: string;
  r2_score: number;
  mae: number;
  mse: number;
  rmse: number;
  feature_importances: Record<string, number>;
  actual_vs_predicted: Array<{ actual: number; predicted: number }>;
  n_samples_train: number;
  n_samples_test: number;
  trained_at: string;
}

export interface SystemModelInfo {
  models: {
    demand_prediction: ModelMetricsMeta;
    country_growth_prediction: ModelMetricsMeta;
  };
  last_updated: string;
  training_environment: {
    scikit_learn_version: string;
    random_state: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  service: string;
  database: string;
  models_status: 'loaded' | 'unloaded';
  version: string;
}
