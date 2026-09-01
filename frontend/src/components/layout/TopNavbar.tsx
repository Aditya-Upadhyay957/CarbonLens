import React, { useState } from 'react';
import { 
  Search, 
  Cloud, 
  Calendar, 
  RefreshCw, 
  Bell, 
  Sparkles, 
  DollarSign, 
  IndianRupee, 
  ShieldAlert,
  Zap,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopNavbar: React.FC = () => {
  const { 
    currency, 
    setCurrency, 
    selectedProvider, 
    setSelectedProvider, 
    dateRange, 
    setDateRange,
    isSimulating,
    triggerGlobalRefresh,
    triggerCostSpikeSimulation,
    triggerScenario
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);

  const scenarioOptions = [
    { id: 'runaway_autoscaling', name: 'Runaway Autoscaling (+284%)' },
    { id: 'retry_loop', name: 'Serverless Retry Loop Flood' },
    { id: 'idle_gpu', name: 'Idle SageMaker GPU Cluster' },
    { id: 'carbon_batch', name: 'Carbon-Aware Batch Optimization' },
    { id: 'multiregion', name: 'Multi-Region Grid Shift' },
  ];

  return (
    <header className="h-14 border-b border-slate-800/60 bg-[#070c18]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between gap-4">
      {/* Left: Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources, anomalies..."
            className="w-full bg-slate-900/60 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/40 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Discrete Simulation Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsScenarioMenuOpen(!isScenarioMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Simulate</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isScenarioMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in duration-150">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 font-semibold border-b border-slate-800/80 mb-1">
                Telemetry Scenarios
              </div>
              <button
                onClick={() => {
                  triggerCostSpikeSimulation('EC2');
                  setIsScenarioMenuOpen(false);
                }}
                disabled={isSimulating}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center justify-between"
              >
                <span>Simulate EC2 Cost Spike</span>
                <span className="text-[10px] text-rose-400 font-mono">+284%</span>
              </button>
              {scenarioOptions.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    triggerScenario(sc.id, sc.name);
                    setIsScenarioMenuOpen(false);
                  }}
                  disabled={isSimulating}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  {sc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800/80 text-xs">
          <button
            onClick={() => setCurrency('INR')}
            className={`px-2 py-1 rounded font-medium transition-all ${
              currency === 'INR'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2 py-1 rounded font-medium transition-all ${
              currency === 'USD'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            USD ($)
          </button>
        </div>

        {/* Cloud Provider */}
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="bg-slate-900 text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="AWS" className="bg-slate-900">AWS Cloud</option>
          <option value="GCP" className="bg-slate-900">Google Cloud</option>
          <option value="Azure" className="bg-slate-900">Azure</option>
        </select>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-slate-900 text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="7d" className="bg-slate-900">Last 7 Days</option>
          <option value="30d" className="bg-slate-900">Last 30 Days</option>
          <option value="90d" className="bg-slate-900">Last 90 Days</option>
        </select>

        {/* Refresh */}
        <button
          onClick={triggerGlobalRefresh}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3.5 z-50 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200">Alerts</span>
                <span className="text-[10px] text-emerald-400 font-mono">3 New</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <p className="font-semibold text-rose-300 text-xs">EC2 Autoscaling Spike</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">+284% spend anomaly in Production.</p>
                </div>
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="font-semibold text-amber-300 text-xs">Idle GPU Cluster</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">H100 node unutilized in Staging.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
