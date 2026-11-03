import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  Globe,
  Sliders,
  Flame,
  Radio,
  Filter,
  Layers,
  Info,
  MapPin,
  Compass,
} from 'lucide-react';
import { evApi } from '../services/api';
import { ClusteringResult, CountryData } from '../types';

const CLUSTER_COLORS = [
  '#00f2fe', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#eab308', '#10b981', '#14b8a6', '#6366f1', '#d946ef',
  '#f43f5e', '#84cc16', '#06b6d4', '#a855f7', '#fb923c', '#22c55e',
];

// Helper to recenter map when country or clusters change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const GeographicClustering: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<'kmeans' | 'dbscan'>('kmeans');
  const [kValue, setKValue] = useState<number>(8);
  const [epsKm, setEpsKm] = useState<number>(80);
  const [minSamples, setMinSamples] = useState<number>(4);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [countries, setCountries] = useState<CountryData[]>([]);

  const [clusterData, setClusterData] = useState<ClusteringResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.0, 10.0]);
  const [mapZoom, setMapZoom] = useState<number>(2);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    executeClustering();
  }, [algorithm, kValue, epsKm, minSamples, selectedCountry]);

  const loadCountries = async () => {
    try {
      const data = await evApi.getCountries();
      setCountries(data);
    } catch (e) {
      console.error('Failed to load countries for filter', e);
    }
  };

  const executeClustering = async () => {
    setLoading(true);
    try {
      const res = await evApi.getClusters({
        algorithm,
        k: algorithm === 'kmeans' ? kValue : undefined,
        eps_km: algorithm === 'dbscan' ? epsKm : undefined,
        min_samples: algorithm === 'dbscan' ? minSamples : undefined,
        country: selectedCountry !== 'All' ? selectedCountry : undefined,
      });
      setClusterData(res);

      // Adjust map view if stations exist
      if (res.stations && res.stations.length > 0) {
        if (selectedCountry !== 'All') {
          const lats = res.stations.map((s) => s.latitude);
          const lngs = res.stations.map((s) => s.longitude);
          const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
          const meanLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
          setMapCenter([meanLat, meanLng]);
          setMapZoom(5);
        } else {
          setMapCenter([30.0, 15.0]);
          setMapZoom(2);
        }
      }
    } catch (e) {
      console.error('Clustering calculation failed', e);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (clusterId: number, isNoise?: boolean) => {
    if (isNoise || clusterId === -1) return '#64748b'; // Slate gray for DBSCAN noise
    return CLUSTER_COLORS[Math.abs(clusterId) % CLUSTER_COLORS.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Geographic Clustering & Hotspots
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              OpenStreetMap + Haversine
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Segment regional charging networks with KMeans centroids or discover high-density charging corridors with DBSCAN haversine metric.
          </p>
        </div>

        {/* Algorithm Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-sky-500/25">
          <button
            onClick={() => setAlgorithm('kmeans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              algorithm === 'kmeans'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>KMeans (Centroids)</span>
          </button>
          <button
            onClick={() => setAlgorithm('dbscan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              algorithm === 'dbscan'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>DBSCAN (Haversine Hotspots)</span>
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/15 glass-panel flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Country Filter */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-sky-500/20">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400 font-medium">Territory:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-gray-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900">Global (All Countries)</option>
              {countries.map((c) => (
                <option key={c.id} value={c.country} className="bg-slate-900">
                  {c.country}
                </option>
              ))}
            </select>
          </div>

          {/* KMeans Controls */}
          {algorithm === 'kmeans' && (
            <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-sky-500/20">
              <span className="text-gray-400 font-medium">Clusters (k):</span>
              <input
                type="range"
                min="2"
                max="16"
                value={kValue}
                onChange={(e) => setKValue(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-400 font-mono font-bold">k = {kValue}</span>
            </div>
          )}

          {/* DBSCAN Controls */}
          {algorithm === 'dbscan' && (
            <>
              <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-sky-500/20">
                <span className="text-gray-400 font-medium">Epsilon (Radius):</span>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="10"
                  value={epsKm}
                  onChange={(e) => setEpsKm(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-400 font-mono font-bold">{epsKm} km</span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-sky-500/20">
                <span className="text-gray-400 font-medium">Min Samples:</span>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={minSamples}
                  onChange={(e) => setMinSamples(Number(e.target.value))}
                  className="w-20 h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-400 font-mono font-bold">{minSamples} pts</span>
              </div>
            </>
          )}
        </div>

        {/* Stats Summary Pill */}
        <div className="flex items-center space-x-3 text-gray-300 font-mono">
          <span>
            Stations Mapped: <strong className="text-cyan-400">{clusterData?.total_stations || 0}</strong>
          </span>
          {algorithm === 'dbscan' && (
            <>
              <span className="text-slate-600">|</span>
              <span>
                Corridors: <strong className="text-emerald-400">{clusterData?.hotspots_count || 0}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span>
                Noise Points: <strong className="text-slate-400">{clusterData?.noise_count || 0}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="rounded-3xl border border-sky-500/25 overflow-hidden shadow-2xl relative h-[520px] bg-slate-950">
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Calculating Geographic Distance Matrix...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          {/* CartoDB Dark Matter Tiles for ultra-modern SaaS theme */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Station Markers */}
          {clusterData?.stations.map((stn) => {
            const color = getMarkerColor(stn.cluster_id, stn.is_noise);
            return (
              <CircleMarker
                key={stn.id}
                center={[stn.latitude, stn.longitude]}
                radius={stn.is_noise ? 4 : 6}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: stn.is_noise ? 0.35 : 0.8,
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1 max-w-[200px]">
                    <div className="font-bold text-gray-100">{stn.name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {stn.city}, {stn.country}
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-700 text-[11px]">
                      <span>Power:</span>
                      <span className="font-bold text-white">{stn.power_kw} kW</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Demand Score:</span>
                      <span className="font-bold text-cyan-300">{stn.demand_score}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Cluster ID:</span>
                      <span className="font-mono font-bold" style={{ color }}>
                        {stn.is_noise ? 'Noise (-1)' : `Cluster #${stn.cluster_id}`}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 right-4 z-[400] p-3 rounded-2xl bg-slate-950/90 border border-sky-500/20 backdrop-blur-md text-[11px] max-w-[260px] shadow-xl">
          <div className="font-bold text-gray-200 mb-1.5 flex items-center justify-between">
            <span>Cluster Key</span>
            <span className="text-[10px] text-cyan-400 font-mono uppercase">{algorithm}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {algorithm === 'kmeans'
              ? Array.from({ length: kValue }).map((_, idx) => (
                  <span
                    key={idx}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                    ></span>
                    <span className="text-gray-300 font-mono text-[10px]">C{idx}</span>
                  </span>
                ))
              : (
                  <>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span className="text-gray-300 font-mono text-[10px]">Hotspot</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      <span className="text-gray-300 font-mono text-[10px]">Noise (-1)</span>
                    </span>
                  </>
                )}
          </div>
        </div>
      </div>

      {/* Cluster / Hotspot Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {algorithm === 'kmeans' &&
          clusterData?.clusters?.map((c) => (
            <div
              key={c.cluster_id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 glass-panel space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 font-bold text-gray-100 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length] }}
                  ></span>
                  <span>Cluster #{c.cluster_id}</span>
                </span>
                <span className="text-[11px] text-cyan-400 font-mono font-semibold">
                  {c.station_count} stations
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800 text-gray-300">
                <div>Total Ports: <strong className="text-white">{c.total_ports}</strong></div>
                <div>Avg Power: <strong className="text-white">{c.avg_power_kw} kW</strong></div>
                <div>Avg Demand: <strong className="text-cyan-400">{c.avg_demand_score}</strong></div>
                <div>Centroid: <strong className="text-gray-400 font-mono">{c.centroid_lat}, {c.centroid_lng}</strong></div>
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                Hub Cities: {c.top_cities.join(', ')}
              </div>
            </div>
          ))}

        {algorithm === 'dbscan' &&
          clusterData?.hotspots?.map((h) => (
            <div
              key={h.cluster_id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/15 glass-panel space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2 font-bold text-gray-100 text-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dense Hotspot #{h.cluster_id}</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                  {h.station_count} stations
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800 text-gray-300">
                <div>Total Ports: <strong className="text-white">{h.total_ports}</strong></div>
                <div>Avg Power: <strong className="text-white">{h.avg_power_kw} kW</strong></div>
                <div>Avg Demand: <strong className="text-cyan-400">{h.avg_demand_score}</strong></div>
                <div>Core: <strong className="text-gray-400 font-mono">{h.centroid_lat}, {h.centroid_lng}</strong></div>
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                Corridor: {h.cities.slice(0, 4).join(', ')} ({h.countries.join(', ')})
              </div>
            </div>
          ))}
      </div>

      {/* Geospatial Mathematical Disclosure */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-sky-500/20 text-xs text-gray-400 flex items-start space-x-3">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <strong className="text-gray-200">Mathematical Accuracy Standard:</strong>
          <span className="ml-1">
            DBSCAN clusters are computed using the <strong>Haversine geodesic metric on spherical radian coordinates</strong>{' '}
            (<code>ε_rad = ε_km / 6371.0088</code>). Euclidean planar distance is never applied directly across latitude and longitude,
            preserving authentic spatial density across varying latitudinal meridians.
          </span>
        </div>
      </div>
    </div>
  );
};
