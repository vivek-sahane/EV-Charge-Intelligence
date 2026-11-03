import React, { useState, useEffect } from 'react';
import {
  Zap,
  BatteryCharging,
  Globe,
  TrendingUp,
  Activity,
  Download,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { evApi } from '../services/api';
import {
  DashboardSummary,
  ChartSeriesData,
  CountryData,
  ChargingStationItem,
} from '../types';

export const OverviewDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartSeriesData | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [stations, setStations] = useState<ChargingStationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalStations, setTotalStations] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchStations();
  }, [selectedCountry, tableSearch, page]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [sumRes, chartRes, countryRes] = await Promise.all([
        evApi.getSummary(),
        evApi.getCharts(),
        evApi.getCountries(),
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
      setCountries(countryRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setLoadError('Unable to load dashboard data. Check that the backend is running, then retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await evApi.getStations({
        page,
        per_page: 8,
        country: selectedCountry !== 'All' ? selectedCountry : undefined,
        search: tableSearch.trim() || undefined,
      });
      setStations(res.stations);
      setTotalStations(res.total);
    } catch (err) {
      console.error('Failed to load stations', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchStations()]);
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (!stations.length) return;
    const headers = [
      'Station ID',
      'Name',
      'Country',
      'City',
      'Ports',
      'Charging Power (kW)',
      'Fast Station Share',
      'Demand Score',
    ];
    const rows = stations.map((s) => [
      s.station_id,
      `"${s.station_name}"`,
      s.country,
      s.city,
      s.port_count,
      s.charging_power_kw,
      s.fast_station_share,
      s.demand_score,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ev_stations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-400">Loading EV Infrastructure Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!summary && loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md rounded-2xl bg-slate-900/70 border border-rose-500/25 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white">Dashboard unavailable</h1>
          <p className="text-sm text-gray-400 mt-2">{loadError}</p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold disabled:opacity-50"
          >
            {refreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Charging Stations',
      value: summary?.total_charging_stations.toLocaleString() || '0',
      sub: 'Global mapped sites',
      icon: Zap,
      gradient: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Total Charging Ports',
      value: summary?.total_charging_ports.toLocaleString() || '0',
      sub: 'Active physical connectors',
      icon: BatteryCharging,
      gradient: 'from-blue-500/20 to-indigo-600/10',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Average Station Power',
      value: `${summary?.average_charging_power_kw || 0} kW`,
      sub: 'Mean grid capability',
      icon: Activity,
      gradient: 'from-indigo-500/20 to-purple-600/10',
      border: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      title: 'Countries Monitored',
      value: summary?.countries_covered || '0',
      sub: 'Active regional markets',
      icon: Globe,
      gradient: 'from-teal-500/20 to-emerald-600/10',
      border: 'border-teal-500/30',
      iconColor: 'text-teal-400',
    },
    {
      title: 'Average Demand Score',
      value: `${summary?.average_demand_score || 0}`,
      sub: 'Scale 0 to 100 benchmark',
      icon: TrendingUp,
      gradient: 'from-purple-500/20 to-pink-600/10',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Fast-Charging Plazas',
      value: summary?.fast_charging_stations.toLocaleString() || '0',
      sub: `${summary?.fast_charging_ratio_percent || 0}% of all stations (≥50 kW)`,
      icon: Layers,
      gradient: 'from-amber-500/20 to-orange-600/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Overview Dashboard
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Live Analytics
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time geospatial analytics, power distribution, and network performance indicators.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-900 border border-sky-500/20 hover:border-cyan-400/40 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/40 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Source Notice Banner */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-md ${
          summary?.is_synthetic
            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {summary?.is_synthetic ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            <strong>Data Mode:</strong> {summary?.data_source_label}.{' '}
            {summary?.is_synthetic
              ? 'All figures reflect our representative benchmark dataset. To test with your proprietary real data, use Dataset Management.'
              : 'All metrics derived from verified user-uploaded database records.'}
          </span>
        </div>
        <span className="font-mono text-[11px] underline cursor-pointer hover:opacity-80">
          Dataset Details
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-gradient-to-b ${kpi.gradient} bg-slate-900/60 border ${kpi.border} shadow-lg glass-panel-hover flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl bg-slate-800/80 ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white tracking-tight">{kpi.value}</span>
                <p className="text-[11px] text-gray-400 mt-1 truncate">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Infrastructure by Country (Bar) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Top Countries by EV Charging Stations
              </h3>
              <p className="text-xs text-gray-400">Total station infrastructure deployment across primary territories</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.infrastructure_by_country || []} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="country" stroke="#64748b" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="stations" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Station Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fast vs Slow Charging Distribution (Donut) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Charging Power Distribution
            </h3>
            <p className="text-xs text-gray-400">Network share by charger speed tier</p>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.power_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts?.power_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Demand Score Distribution */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Station Demand Score Distribution
            </h3>
            <p className="text-xs text-gray-400">Histogram of station utilization scores across the network</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.demand_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Station Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Future Growth Index Countries */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Top Countries by Future Growth Index
            </h3>
            <p className="text-xs text-gray-400">Predicted infrastructure momentum using GradientBoostingRegressor</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.top_growth_countries || []} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="country" stroke="#64748b" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="growth_index" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Growth Index (0-100)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charging Stations Data Table */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Charging Stations Catalog & Utilization
            </h3>
            <p className="text-xs text-gray-400">
              Showing {stations.length} of {totalStations} mapped stations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Country Filter */}
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-sky-500/20 text-xs text-gray-300">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All Countries</option>
                {countries.slice(0, 20).map((c) => (
                  <option key={c.id} value={c.country} className="bg-slate-900">
                    {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by city or hub..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-sky-500/20 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Station Name / ID</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Ports</th>
                <th className="px-4 py-3">Charging Power</th>
                <th className="px-4 py-3">Fast Share</th>
                <th className="px-4 py-3">Demand Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {stations.map((stn) => (
                <tr key={stn.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-100">{stn.station_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{stn.station_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{stn.city}</div>
                    <div className="text-[10px] text-gray-400">{stn.country}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-200">{stn.port_count} ports</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                      {stn.charging_power_kw} kW
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{Math.round(stn.fast_station_share * 100)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, stn.demand_score)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-white text-[11px]">{stn.demand_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Operational
                    </span>
                  </td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No stations match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-gray-400">
          <span>
            Page {page} of {Math.ceil(totalStations / 8) || 1}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-lg bg-slate-950 border border-sky-500/20 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 8 >= totalStations}
              className="px-3 py-1 rounded-lg bg-slate-950 border border-sky-500/20 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
