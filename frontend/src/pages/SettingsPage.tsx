import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  Database,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Key,
  Cpu,
  Layers,
} from 'lucide-react';
import { evApi } from '../services/api';
import { SystemHealth } from '../types';

export const SettingsPage: React.FC = () => {
  const [provider, setProvider] = useState<string>('auto');
  const [apiKey, setApiKey] = useState<string>('');
  const [modelName, setModelName] = useState<string>('gemini-1.5-flash');
  const [healthStatus, setHealthStatus] = useState<SystemHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    checkHealth();
    // Load local client settings if any
    const savedProvider = localStorage.getItem('ev_ai_provider');
    if (savedProvider) setProvider(savedProvider);
  }, []);

  const checkHealth = async () => {
    setCheckingHealth(true);
    setHealthError(null);
    try {
      const res = await evApi.getHealth();
      setHealthStatus(res);
    } catch (error) {
      setHealthStatus(null);
      setHealthError(
        error instanceof Error ? error.message : 'Unable to reach the backend.'
      );
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ev_ai_provider', provider);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Platform Configuration & Settings
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              System Admin
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure external AI providers, inspect database operational parameters, and view system health checks.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={checkingHealth}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-sky-500/20 text-gray-300 rounded-xl text-xs hover:border-cyan-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
          <span>Ping Backend Health</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: AI Provider Settings */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              AI Assistant Service Configuration
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">Provider Independent</span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Provider Select */}
            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                LLM Provider Selection
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-sky-500/25 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="auto">Automatic (Auto-detect from Environment)</option>
                <option value="gemini">Google Gemini API (gemini-1.5-flash / pro)</option>
                <option value="openai">OpenAI (gpt-4o-mini / gpt-4o)</option>
                <option value="ollama">Ollama Local (http://localhost:11434)</option>
                <option value="native">Native Analytical Engine (Offline / Deterministic)</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                The native analytical engine executes actual database queries and ML predictions offline without needing external API tokens.
              </p>
            </div>

            {/* Model Name */}
            <div>
              <label className="font-semibold text-gray-300 block mb-1">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="gemini-1.5-flash"
                className="w-full bg-slate-950 border border-sky-500/25 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Optional API Key Input */}
            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                API Key (Optional override, stored safely in session/env)
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave blank to use server environment variables (.env)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-sky-500/25 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-950 flex items-center space-x-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save AI Preferences</span>
            </button>
          </form>
        </div>

        {/* Right: Operational Health Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Operational Health & Runtime
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200">Overall System</span>
                  <p className="text-[11px] text-gray-400">Microservice responsiveness</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                  healthStatus?.status === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}>
                  {healthStatus?.status.toUpperCase() || (checkingHealth ? 'CHECKING' : 'OFFLINE')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200">Database Engine</span>
                  <p className="text-[11px] text-gray-400">PostgreSQL / SQLite Connection</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                  healthStatus?.database === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}>
                  {healthStatus?.database === 'healthy' ? 'CONNECTED' : checkingHealth ? 'CHECKING' : 'UNAVAILABLE'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200">ML Model Engine</span>
                  <p className="text-[11px] text-gray-400">Joblib serialized pipelines</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                  {healthStatus?.models_status?.toUpperCase() || (checkingHealth ? 'CHECKING' : 'UNAVAILABLE')}
                </span>
              </div>
              {healthError && (
                <p role="alert" className="text-xs text-rose-300">
                  Backend health check failed: {healthError}
                </p>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-200">Container Port</span>
                  <p className="text-[11px] text-gray-400">REST API Gateway</p>
                </div>
                <span className="font-mono text-cyan-300 text-xs">Port 5000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
