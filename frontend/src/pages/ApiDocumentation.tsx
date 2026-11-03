import React, { useState } from 'react';
import { Code, Terminal, Copy, Check, ChevronDown, ChevronRight, Play } from 'lucide-react';
import axios from 'axios';

interface EndpointSpec {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  category: string;
  summary: string;
  description: string;
  sampleRequest?: any;
  sampleResponse: any;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    category: 'Dashboard',
    method: 'GET',
    path: '/api/dashboard/summary',
    summary: 'Global KPI Metrics',
    description: 'Retrieves global network totals including station count, ports, average power, and synthetic demo data flags.',
    sampleResponse: {
      total_charging_stations: 847,
      total_charging_ports: 62402,
      average_charging_power_kw: 173.1,
      countries_covered: 22,
      average_demand_score: 83.67,
      fast_charging_stations: 847,
      fast_charging_ratio_percent: 100.0,
      is_synthetic: true,
      data_source_label: 'Synthetic Demonstration Data',
    },
  },
  {
    category: 'Dashboard',
    method: 'GET',
    path: '/api/dashboard/countries',
    summary: 'Country Infrastructure Summary',
    description: 'Lists all countries with their current station counts, port numbers, fast charger shares, and growth indices.',
    sampleResponse: [
      {
        id: 1,
        country: 'China',
        station_count: 220000,
        port_count: 1850000,
        fast_station_share: 0.42,
        median_power_kw: 120.0,
        future_growth_index: 99.0,
      },
      {
        id: 2,
        country: 'United States',
        station_count: 68000,
        port_count: 195000,
        fast_station_share: 0.28,
        median_power_kw: 150.0,
        future_growth_index: 98.6,
      },
    ],
  },
  {
    category: 'Machine Learning',
    method: 'POST',
    path: '/api/predict-demand',
    summary: 'Predict EV Station Demand Score',
    description: 'Executes GradientBoostingRegressor with IQR outlier capping and standard scaling to predict hub demand (0 to 100).',
    sampleRequest: {
      station_count: 20,
      port_count: 60,
      fast_station_share: 0.35,
      fast_port_share: 0.4,
      median_power_kw: 120.0,
    },
    sampleResponse: {
      demand_score: 77.82,
      demand_tier: 'High',
      inputs: {
        station_count: 20.0,
        port_count: 60.0,
        fast_station_share: 0.35,
        fast_port_share: 0.4,
        median_power_kw: 120.0,
      },
      model_version: '1.0.0',
    },
  },
  {
    category: 'Machine Learning',
    method: 'POST',
    path: '/api/predict-country-growth',
    summary: 'Predict Country Future Growth Index',
    description: 'Evaluates country infrastructure parameters using GradientBoosting (R²=0.964) to forecast long-term growth (0-100).',
    sampleRequest: {
      station_count: 38000,
      port_count: 125000,
      fast_station_share: 0.24,
      median_power_kw: 110.0,
    },
    sampleResponse: {
      future_growth_index: 88.5,
      growth_category: 'Exponential',
      inputs: {
        station_count: 38000.0,
        port_count: 125000.0,
        fast_station_share: 0.24,
        median_power_kw: 110.0,
      },
      model_version: '1.0.0',
    },
  },
  {
    category: 'Clustering',
    method: 'POST',
    path: '/api/cluster-locations',
    summary: 'Geographic Clustering (KMeans / DBSCAN)',
    description: 'Computes KMeans territorial centroids or DBSCAN density hotspots using haversine metric on radian coordinates.',
    sampleRequest: {
      algorithm: 'dbscan',
      eps_km: 80.0,
      min_samples: 4,
      country: 'Germany',
    },
    sampleResponse: {
      algorithm: 'dbscan',
      eps_km: 80.0,
      min_samples: 4,
      total_stations: 64,
      hotspots_count: 4,
      noise_count: 3,
      hotspots: [
        {
          cluster_id: 0,
          station_count: 16,
          total_ports: 52,
          avg_power_kw: 145.0,
          avg_demand_score: 81.2,
          centroid_lat: 52.52,
          centroid_lng: 13.4,
          cities: ['Berlin'],
        },
      ],
    },
  },
  {
    category: 'Compatibility',
    method: 'POST',
    path: '/api/predict-compatibility',
    summary: 'EV Power Compatibility Check',
    description: 'Evaluates vehicle acceptance. Rule: EV model max charging power <= station power in kW.',
    sampleRequest: {
      charging_power_kw: 150.0,
    },
    sampleResponse: {
      station_power_kw: 150.0,
      total_models: 62,
      compatible_count: 28,
      incompatible_count: 34,
      compatibility_rate_percent: 45.2,
      compatible_models: [
        {
          manufacturer: 'Volkswagen',
          model: 'ID.4 Pro',
          max_charging_power_kw: 135.0,
          battery_capacity_kwh: 82.0,
          estimated_10_80_mins: 34.8,
        },
      ],
      technical_advisory: 'Compatibility indicates this station provides sufficient power...',
    },
  },
  {
    category: 'AI Assistant',
    method: 'POST',
    path: '/api/chat',
    summary: 'Send AI Assistant Message',
    description: 'Queries the conversational assistant with automatic backend analytical tool invocation.',
    sampleRequest: {
      message: 'Predict EV demand if station count is 20 and port count is 60',
      session_id: 'session_demo',
    },
    sampleResponse: {
      session_id: 'session_demo',
      role: 'assistant',
      content: '### ⚡ EV Demand Score Prediction\n- Predicted Demand Score: 77.82 / 100...',
      tool_calls: [
        {
          name: 'predict_ev_demand',
          arguments: { station_count: 20, port_count: 60, median_power_kw: 120 },
        },
      ],
    },
  },
  {
    category: 'System',
    method: 'GET',
    path: '/api/health',
    summary: 'Health & Status Check',
    description: 'Returns live connectivity status for PostgreSQL database and loaded ML model artifacts.',
    sampleResponse: {
      status: 'healthy',
      service: 'EV Charge Intelligence Platform',
      database: 'healthy',
      models_status: 'loaded',
      version: '1.0.0',
    },
  },
];

export const ApiDocumentation: React.FC = () => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [openEndpoints, setOpenEndpoints] = useState<Record<string, boolean>>({
    '/api/predict-demand': true,
    '/api/dashboard/summary': true,
  });

  const [testResponse, setTestResponse] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const toggleEndpoint = (path: string) => {
    setOpenEndpoints((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const copyCurl = (ep: EndpointSpec) => {
    let curl = `curl -X ${ep.method} "http://localhost:5000${ep.path}"`;
    if (ep.method === 'POST') {
      curl += ` -H "Content-Type: application/json" -d '${JSON.stringify(ep.sampleRequest)}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedPath(ep.path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const executeLiveTest = async (ep: EndpointSpec) => {
    setTesting((prev) => ({ ...prev, [ep.path]: true }));
    try {
      let res;
      if (ep.method === 'GET') {
        res = await axios.get(ep.path);
      } else if (ep.method === 'POST') {
        res = await axios.post(ep.path, ep.sampleRequest || {});
      }
      if (res) {
        setTestResponse((prev) => ({ ...prev, [ep.path]: res.data }));
      }
    } catch (err: any) {
      setTestResponse((prev) => ({
        ...prev,
        [ep.path]: { error: err.response?.data || err.message },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [ep.path]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              REST API Documentation & Explorer
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              OpenAPI 3.0 Compatible
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete interactive reference for EV Charge Intelligence REST endpoints with live testing and sample payloads.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-gray-300 bg-slate-900 border border-sky-500/20 px-3 py-1.5 rounded-xl">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Base URL: http://localhost:5000/api</span>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {ENDPOINTS.map((ep, idx) => {
          const isOpen = !!openEndpoints[ep.path];
          const hasResponse = testResponse[ep.path];
          const isCurrentlyTesting = testing[ep.path];

          const methodBadge =
            ep.method === 'GET'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : ep.method === 'POST'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

          return (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel overflow-hidden transition-all"
            >
              {/* Endpoint Header Bar */}
              <div
                onClick={() => toggleEndpoint(ep.path)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${methodBadge}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-white tracking-wide">
                    {ep.path}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    — {ep.summary}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-gray-400">
                    {ep.category}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isOpen && (
                <div className="p-5 pt-0 border-t border-slate-800/60 space-y-4 text-xs">
                  <p className="text-gray-300 mt-3 leading-relaxed">{ep.description}</p>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => executeLiveTest(ep)}
                      disabled={isCurrentlyTesting}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isCurrentlyTesting ? 'Executing...' : 'Try It Out (Live)'}</span>
                    </button>
                    <button
                      onClick={() => copyCurl(ep)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      {copiedPath === ep.path ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy cURL</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sample Request Body */}
                  {ep.sampleRequest && (
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] text-gray-400 font-semibold">
                        Request Body (application/json):
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                        {JSON.stringify(ep.sampleRequest, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Live Response or Sample Response */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-gray-400 font-semibold">
                        {hasResponse ? 'Live Server Response (200 OK):' : 'Sample Response Schema (200 OK):'}
                      </span>
                      {hasResponse && (
                        <span className="text-[10px] text-emerald-400 font-mono">Live In-Memory Verified</span>
                      )}
                    </div>
                    <pre
                      className={`p-3 rounded-xl bg-slate-950 border font-mono text-[11px] overflow-x-auto max-h-60 ${
                        hasResponse ? 'border-emerald-500/40 text-emerald-300' : 'border-slate-800 text-gray-300'
                      }`}
                    >
                      {JSON.stringify(hasResponse || ep.sampleResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
