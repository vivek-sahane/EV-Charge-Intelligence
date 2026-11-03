import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { evApi } from '../services/api';
import {
  LayoutDashboard,
  Zap,
  TrendingUp,
  Globe,
  BatteryCharging,
  Bot,
  Database,
  Cpu,
  Code,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

type BackendStatus = 'checking' | 'active' | 'degraded' | 'offline';

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let mounted = true;

    const checkBackendHealth = async () => {
      try {
        const health = await evApi.getHealth();
        if (mounted) {
          setBackendStatus(health.status === 'healthy' ? 'active' : 'degraded');
        }
      } catch {
        if (mounted) setBackendStatus('offline');
      }
    };

    void checkBackendHealth();
    const intervalId = window.setInterval(checkBackendHealth, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const backendStatusLabel = {
    checking: 'Checking',
    active: 'Active',
    degraded: 'Degraded',
    offline: 'Offline',
  }[backendStatus];
  const backendStatusColor =
    backendStatus === 'active'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : backendStatus === 'offline'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  const backendDotColor =
    backendStatus === 'active'
      ? 'bg-emerald-400'
      : backendStatus === 'offline'
      ? 'bg-rose-400'
      : 'bg-amber-400';

  const navItems = [
    { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'EV Demand Prediction', path: '/demand', icon: Zap },
    { name: 'Country Growth Prediction', path: '/growth', icon: TrendingUp },
    { name: 'Geographic Clustering', path: '/clustering', icon: Globe },
    { name: 'EV Compatibility', path: '/compatibility', icon: BatteryCharging },
    { name: 'AI Assistant', path: '/assistant', icon: Bot, highlight: true },
    { name: 'Dataset Management', path: '/datasets', icon: Database },
    { name: 'Model Performance', path: '/models', icon: Cpu },
    { name: 'API Documentation', path: '/api-docs', icon: Code },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out bg-[#0f172a]/95 backdrop-blur-xl border-r border-sky-500/15 flex flex-col ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-sky-500/10">
        {!collapsed ? (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent truncate">
                EV CHARGE
              </span>
              <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">
                INTELLIGENCE AI
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title="Toggle Sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-800/60'
                } ${item.highlight ? 'ring-1 ring-cyan-500/30' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'text-gray-400 group-hover:text-cyan-300'
                    }`}
                  />
                  {!collapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  {item.highlight && !collapsed && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold uppercase tracking-wider">
                      AI
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-cyan-300 text-xs rounded-md shadow-xl border border-cyan-500/20 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-sky-500/10">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/15 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Backend Engine
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${backendStatusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${backendDotColor} ${backendStatus === 'active' ? 'animate-ping' : ''}`}></span>
                {backendStatusLabel}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 flex items-center justify-between">
              <span>ML Pipelines</span>
              <span className="text-cyan-400 font-mono">GradientBoost</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
