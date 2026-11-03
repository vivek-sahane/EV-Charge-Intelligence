import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  Database,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DashboardSummary } from '../types';

interface NavbarProps {
  summary: DashboardSummary | null;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ summary, onOpenChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    if (query.includes('demand') || query.includes('predict demand')) {
      navigate('/demand');
    } else if (query.includes('growth') || query.includes('country')) {
      navigate('/growth');
    } else if (query.includes('cluster') || query.includes('map') || query.includes('hotspot')) {
      navigate('/clustering');
    } else if (query.includes('compat') || query.includes('model') || query.includes('vehicle')) {
      navigate('/compatibility');
    } else if (query.includes('data') || query.includes('upload') || query.includes('csv')) {
      navigate('/datasets');
    } else if (query.includes('perf') || query.includes('metric') || query.includes('r2')) {
      navigate('/models');
    } else if (query.includes('api') || query.includes('doc')) {
      navigate('/api-docs');
    } else {
      navigate(`/clustering?search=${encodeURIComponent(searchQuery)}`);
    }
    setSearchQuery('');
  };

  const isSynthetic = summary ? summary.is_synthetic : true;

  return (
    <header className="h-18 sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-md border-b border-sky-500/10 px-6 flex items-center justify-between">
      {/* Search Input */}
      <div className="flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations, countries, models, predictions... (Press Enter)"
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-sky-500/20 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Active Data Mode Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-help transition-all ${
            isSynthetic
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
          title={
            isSynthetic
              ? 'Active analytics run on representative synthetic demonstration data. Upload your own CSV in Dataset Management for live numbers.'
              : 'Active analytics run on verified user-uploaded dataset.'
          }
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isSynthetic ? 'Demo Dataset Active' : 'Live Verified Data'}
          </span>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenChat}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-400/40 text-cyan-300 rounded-xl text-xs font-semibold shadow-sm hover:shadow-cyan-500/20 transition-all group"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden md:inline">Ask AI Assistant</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-sky-500/20 rounded-2xl shadow-2xl p-4 z-50 glass-dropdown animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-gray-200">System Notifications</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-mono">
                  3 New
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-800/40 border border-sky-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-200">ML Models Trained & Verified</p>
                    <p className="text-[11px] text-gray-400">Demand (R² 0.952) & Growth (R² 0.964) ready.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-800/40 border border-sky-500/10">
                  <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-200">Global Infrastructure Synced</p>
                    <p className="text-[11px] text-gray-400">
                      {summary ? `${summary.total_charging_stations} stations cataloged.` : 'Database ready.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-900/50">
              AD
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-200 leading-tight">Admin Analyst</span>
              <span className="text-[10px] text-gray-400 leading-tight">Infrastructure Lead</span>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-sky-500/20 rounded-2xl shadow-2xl p-3 z-50 glass-dropdown animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-gray-200">Administrator</p>
                <p className="text-[11px] text-gray-400 truncate">admin@evcharge.ai</p>
              </div>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Platform Settings</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={() => {
                    navigate('/datasets');
                    setShowProfile(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Dataset Ingestion</span>
                  <Database className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
