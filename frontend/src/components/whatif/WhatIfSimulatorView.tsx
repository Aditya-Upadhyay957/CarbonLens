import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ArrowRight, 
  Leaf, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingDown,
  Globe2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { schedulerApi } from '../../services/api';
import { formatCurrency, formatCarbon } from '../../utils/formatters';
import { WhatIfResult } from '../../types';

export const WhatIfSimulatorView: React.FC = () => {
  const { currency } = useApp();

  const [workloadType, setWorkloadType] = useState<string>('AI Training');
  const [currentHour, setCurrentHour] = useState<number>(15); // 3:00 PM
  const [targetHour, setTargetHour] = useState<number>(3);    // 3:00 AM
  const [duration, setDuration] = useState<number>(4.0);
  const [computeUnits, setComputeUnits] = useState<number>(8.0);
  const [region, setRegion] = useState<string>('ap-south-1');

  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const runWhatIf = async () => {
      try {
        setLoading(true);
        const res = await schedulerApi.whatIf({
          workload_type: workloadType,
          current_hour: currentHour,
          target_hour: targetHour,
          duration_hours: duration,
          compute_units: computeUnits,
          region
        });
        setResult(res);
      } catch (err) {
        console.error('What-If simulation failed:', err);
      } finally {
        setLoading(false);
      }
    };
    runWhatIf();
  }, [workloadType, currentHour, targetHour, duration, computeUnits, region]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
            "What-If?" Migration & Time-Shift Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactively explore cost and carbon consequences of shifting flexible compute jobs across 24-hour grid windows.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800/90 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Workload Profile</label>
            <select
              value={workloadType}
              onChange={(e) => setWorkloadType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
            >
              <option value="AI Training">AI Training (GPU Clusters)</option>
              <option value="Batch Analytics">Batch Data Analytics</option>
              <option value="Data Pipeline">ETL / Data Pipeline</option>
              <option value="Database Backup">Database Backup & Sync</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Compute Units (Nodes / GPUs)</label>
            <input
              type="number"
              value={computeUnits}
              onChange={(e) => setComputeUnits(Number(e.target.value))}
              min={1}
              max={64}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Job Duration (Hours)</label>
            <input
              type="number"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={0.5}
              max={24}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Target Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
            >
              <option value="ap-south-1">Mumbai / India (ap-south-1)</option>
              <option value="ap-south-2">Hyderabad / India (ap-south-2)</option>
              <option value="ap-southeast-1">Singapore (ap-southeast-1)</option>
              <option value="eu-central-1">Frankfurt / Germany (eu-central-1)</option>
              <option value="us-east-1">N. Virginia / USA (us-east-1)</option>
            </select>
          </div>
        </div>

        {/* Dual Interactive Sliders for Current vs Target Hour */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
          {/* Slider 1: Current Start Hour */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">1. Current Execution Time</span>
              <span className="font-bold text-rose-400 font-mono text-sm">
                {new Date(2026, 0, 1, currentHour, 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={currentHour}
              onChange={(e) => setCurrentHour(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>12:00 AM</span>
              <span>12:00 PM</span>
              <span>11:00 PM</span>
            </div>
          </div>

          {/* Slider 2: Proposed Target Hour */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium">2. Proposed Target Time</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {new Date(2026, 0, 1, targetHour, 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={targetHour}
              onChange={(e) => setTargetHour(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-emerald-500/70 font-mono">
              <span>12:00 AM</span>
              <span>12:00 PM</span>
              <span>11:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Results Card */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current State */}
            <div className="p-5 rounded-2xl glass-panel border border-slate-800/90 space-y-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">CURRENT EXECUTION ({result.current_hour_label})</span>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Cost per run:</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(result.current_cost_inr, currency)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Emissions per run:</span>
                  <span className="text-lg font-bold text-slate-300">{result.current_carbon_gco2} gCO₂e</span>
                </div>
              </div>
            </div>

            {/* Target State */}
            <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/[0.04] space-y-3">
              <span className="text-[10px] text-emerald-300 font-mono uppercase block">TARGET EXECUTION ({result.target_hour_label})</span>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-emerald-400/80 block">Cost per run:</span>
                  <span className="text-xl font-bold text-emerald-400">{formatCurrency(result.target_cost_inr, currency)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400/80 block">Emissions per run:</span>
                  <span className="text-lg font-bold text-emerald-300">{result.target_carbon_gco2} gCO₂e</span>
                </div>
              </div>
            </div>

            {/* Delta & Annualized ROI */}
            <div className="p-5 rounded-2xl glass-panel border border-teal-500/30 bg-teal-500/[0.04] space-y-3">
              <span className="text-[10px] text-teal-300 font-mono uppercase block">NET SAVINGS & IMPACT</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Cost Delta:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {result.cost_diff_inr >= 0 ? `-${formatCurrency(result.cost_diff_inr, currency)}` : `+${formatCurrency(-result.cost_diff_inr, currency)}`} ({result.savings_pct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Carbon Delta:</span>
                  <span className="text-sm font-bold text-teal-300 font-mono">
                    {result.carbon_diff_gco2 >= 0 ? `-${result.carbon_diff_gco2} gCO₂` : `+${-result.carbon_diff_gco2} gCO₂`} ({result.carbon_reduction_pct}%)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 block">Annualized Projected Savings (Daily Run):</span>
                  <span className="text-base font-bold text-emerald-400">
                    {formatCurrency(result.annual_projected_savings_inr, currency)}/yr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Verdict Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {result.executive_verdict}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
