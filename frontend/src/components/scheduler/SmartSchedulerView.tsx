import React, { useState } from 'react';
import { 
  CalendarClock, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { schedulerApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { JobScheduleResponse } from '../../types';
import confetti from 'canvas-confetti';

export const SmartSchedulerView: React.FC = () => {
  const { currency, addToast } = useApp();

  const [jobName, setJobName] = useState<string>('LLM Batch Embedding & Fine-Tuning');
  const [jobType, setJobType] = useState<string>('AI Training');
  const [durationHours, setDurationHours] = useState<number>(3.0);
  const [computeUnits, setComputeUnits] = useState<number>(16.0);
  const [currentHour, setCurrentHour] = useState<number>(15); // 3:00 PM
  const [deadlineHour, setDeadlineHour] = useState<number>(8); // 8:00 AM
  const [preferredRegion, setPreferredRegion] = useState<string>('ap-south-1');
  const [optimizationGoal, setOptimizationGoal] = useState<string>('Balanced');

  const [result, setResult] = useState<JobScheduleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    handleOptimize();
  }, []);

  const handleOptimize = async () => {
    try {
      setLoading(true);
      const res = await schedulerApi.optimize({
        job_name: jobName,
        job_type: jobType,
        duration_hours: Number(durationHours),
        compute_units: Number(computeUnits),
        current_schedule_hour: Number(currentHour),
        deadline_hour: Number(deadlineHour),
        preferred_region: preferredRegion,
        optimization_goal: optimizationGoal
      });
      setResult(res);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      addToast({
        type: 'success',
        title: 'Schedule Optimized',
        description: `Optimal execution window: ${res.recommended_time_label} (-${res.carbon_reduction_pct}% CO₂).`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        description: err?.message || 'Could not optimize schedule',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Smart Scheduler
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimizes delay-tolerant batch and AI workloads for off-peak cost savings and minimum grid emissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Form */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Workload Configuration
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Job Name</label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full bg-slate-900 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="AI Training">AI Training (GPU)</option>
                  <option value="Batch Analytics">Batch Analytics</option>
                  <option value="Data Pipeline">Data Pipeline</option>
                  <option value="Database Backup">Database Backup</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Compute Units</label>
                <input
                  type="number"
                  value={computeUnits}
                  onChange={(e) => setComputeUnits(Number(e.target.value))}
                  min={1}
                  max={128}
                  className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  min={0.5}
                  max={24}
                  className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Current Schedule</label>
                <select
                  value={currentHour}
                  onChange={(e) => setCurrentHour(Number(e.target.value))}
                  className="w-full bg-slate-900 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(2026, 0, 1, i, 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Optimization Goal</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-0.5 rounded-lg">
                {['Balanced', 'Lowest Cost', 'Lowest Carbon'].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setOptimizationGoal(goal)}
                    className={`py-1.5 rounded text-[11px] font-medium transition-all ${
                      optimizationGoal === goal
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Region</label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
              >
                <option value="ap-south-1">Mumbai / India (ap-south-1)</option>
                <option value="ap-south-2">Hyderabad / India (ap-south-2)</option>
                <option value="ap-southeast-1">Singapore (ap-southeast-1)</option>
                <option value="eu-central-1">Frankfurt / Germany (eu-central-1)</option>
                <option value="us-east-1">N. Virginia / USA (us-east-1)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Optimizing...' : 'Calculate Optimal Slot'}</span>
          </button>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Recommended Execution Slot</h2>
                  <span className="text-xs font-semibold text-emerald-400">
                    -{result.carbon_reduction_pct}% Carbon • -{result.savings_pct}% Cost
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/50 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Baseline</span>
                    <p className="text-sm font-semibold text-slate-200">{result.current_time_label}</p>
                    <div className="text-xs text-slate-300 pt-1 space-y-0.5">
                      <div>Cost: {formatCurrency(result.current_cost_inr, currency)}</div>
                      <div>Emissions: {result.current_carbon_gco2} gCO₂e</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 space-y-1.5">
                    <span className="text-[10px] text-emerald-400 uppercase font-mono block">Recommended Window</span>
                    <p className="text-sm font-bold text-emerald-300">{result.recommended_time_label}</p>
                    <div className="text-xs text-emerald-200 pt-1 space-y-0.5">
                      <div>Cost: {formatCurrency(result.recommended_cost_inr, currency)}</div>
                      <div>Emissions: {result.recommended_carbon_gco2} gCO₂e</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {result.optimization_summary}
                </p>
              </div>

              {/* 24-Hour Matrix */}
              <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
                <h3 className="text-xs font-semibold text-slate-200">24-Hour Candidate Score Matrix</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.all_windows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#172033" />
                      <XAxis dataKey="time_label" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val: any, name: string, item: any) => [
                          `${formatCurrency(item.payload.estimated_cost_inr, currency)} | ${item.payload.estimated_carbon_gco2} gCO₂`,
                          'Cost & Carbon'
                        ]}
                      />
                      <Bar dataKey="combined_score" radius={[3, 3, 0, 0]}>
                        {result.all_windows.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.is_recommended ? '#10b981' : entry.is_current ? '#f43f5e' : '#1e293b'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
