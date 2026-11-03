import React, { useState, useEffect } from 'react';
import {
  BatteryCharging,
  Zap,
  CheckCircle2,
  XCircle,
  Filter,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { evApi } from '../services/api';
import { CompatibilityResult, EVModelItem } from '../types';

export const EVCompatibility: React.FC = () => {
  const [stationPowerKw, setStationPowerKw] = useState<number>(150);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  useEffect(() => {
    checkCompatibility();
  }, [stationPowerKw, vehicleTypeFilter]);

  const checkCompatibility = async () => {
    setLoading(true);
    try {
      const res = await evApi.checkCompatibility({
        charging_power_kw: Number(stationPowerKw),
        vehicle_type: vehicleTypeFilter !== 'All' ? vehicleTypeFilter : undefined,
      });
      setResult(res);
    } catch (e) {
      console.error('Failed to evaluate compatibility', e);
    } finally {
      setLoading(false);
    }
  };

  const powerPresets = [50, 75, 100, 150, 200, 250, 300, 350];
  const vehicleTypes = ['All', 'SUV', 'Sedan', 'Hatchback', 'Crossover', 'Pickup', 'Sports', 'Van'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              EV Power Compatibility Prediction
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Rule Engine & Charging Limits
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Evaluate vehicle fleet acceptance across available station charging power (kW). Rule: max charging power ≤ station power.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-sky-500/20 px-3 py-1.5 rounded-xl text-xs text-cyan-400 font-mono font-semibold">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Active Power: {stationPowerKw} kW</span>
        </div>
      </div>

      {/* Control Filters */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/15 glass-panel space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Station Power Presets */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-2">
              Select Available Station Charging Power (kW):
            </label>
            <div className="flex flex-wrap gap-2">
              {powerPresets.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setStationPowerKw(kw)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    stationPowerKw === kw
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-950'
                      : 'bg-slate-950 border-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {kw} kW
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-sky-500/20 self-start lg:self-end">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-gray-400 font-medium">Vehicle Class:</span>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-100 font-semibold focus:outline-none cursor-pointer"
            >
              {vehicleTypes.map((vt) => (
                <option key={vt} value={vt} className="bg-slate-900">
                  {vt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Power Range Slider */}
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Continuous Fine-tuning:</span>
            <span className="text-cyan-400 font-mono font-bold">{stationPowerKw} kW Output</span>
          </div>
          <input
            type="range"
            min="30"
            max="360"
            step="5"
            value={stationPowerKw}
            onChange={(e) => setStationPowerKw(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/30 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-mono font-semibold">Compatible Vehicles</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {result?.compatible_count || 0} Models
            </h3>
            <span className="text-[11px] text-emerald-400/80 font-mono">
              {result?.compatibility_rate_percent || 0}% of catalog fleet
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-rose-500/30 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-mono font-semibold">Incompatible Vehicles</span>
            <h3 className="text-2xl font-black text-rose-400 mt-1">
              {result?.incompatible_count || 0} Models
            </h3>
            <span className="text-[11px] text-rose-400/80 font-mono">
              Vehicle intake limit &gt; {stationPowerKw} kW
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-sky-500/20 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase font-mono font-semibold">Fleet Evaluated</span>
            <h3 className="text-2xl font-black text-white mt-1">
              {result?.total_models || 0} Models
            </h3>
            <span className="text-[11px] text-cyan-400 font-mono">
              Filter: {vehicleTypeFilter}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <BatteryCharging className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Models Grid: Compatible Vehicles */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Compatible EV Models (Max Power ≤ {stationPowerKw} kW)
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {result?.compatible_models.length} Vehicles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {result?.compatible_models.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-2"
            >
              <div>
                <span className="text-[10px] uppercase font-mono font-semibold text-emerald-400">
                  {m.manufacturer}
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">{m.model}</h4>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-gray-300">
                  {m.vehicle_type}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-gray-300">
                <div className="flex justify-between">
                  <span>Battery Capacity:</span>
                  <strong className="text-white font-mono">{m.battery_capacity_kwh} kWh</strong>
                </div>
                <div className="flex justify-between">
                  <span>Max Peak Intake:</span>
                  <strong className="text-emerald-400 font-mono">{m.max_charging_power_kw} kW</strong>
                </div>
                {m.estimated_10_80_mins && (
                  <div className="flex justify-between text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      10-80% Session:
                    </span>
                    <strong className="font-mono">~{m.estimated_10_80_mins} mins</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
          {result?.compatible_models.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500 text-xs">
              No EV models in this category support charging at or below {stationPowerKw} kW.
            </div>
          )}
        </div>
      </div>

      {/* Incompatible Models Section */}
      {result && result.incompatible_models.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Incompatible High-Intake Models (Demand &gt; {stationPowerKw} kW)
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {result.incompatible_models.length} Vehicles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.incompatible_models.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-950/40 border border-rose-500/15 text-xs space-y-1"
              >
                <div className="font-semibold text-gray-200">
                  {m.manufacturer} {m.model}
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Intake Rating:</span>
                  <strong className="text-rose-400 font-mono">{m.max_charging_power_kw} kW</strong>
                </div>
                <div className="text-[10px] text-rose-400 font-mono">
                  Deficit: -{m.power_deficit_kw} kW power shortfall
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engineering Charging Advisory Box */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-sky-500/20 text-xs text-gray-400 flex items-start space-x-3">
        <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div>
          <strong className="text-gray-200">Technical Advisory on Real-world Session Dynamics:</strong>
          <p className="mt-0.5 leading-relaxed">
            {result?.technical_advisory}
          </p>
        </div>
      </div>
    </div>
  );
};
