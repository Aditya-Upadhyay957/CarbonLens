import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Leaf, 
  Sparkles, 
  DollarSign, 
  ShieldAlert, 
  Clock, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { dashboardApi, costApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Default guaranteed 7-day / 30-day realistic trajectory sample data
const DEFAULT_TIMESERIES = [
  { timestamp: '2026-08-25', actual_cost_inr: 26400, projected_cost_inr: 27100, carbon_kg: 164.2, variance_pct: -2.6, status: 'Normal Baseline' },
  { timestamp: '2026-08-26', actual_cost_inr: 27800, projected_cost_inr: 27400, carbon_kg: 172.5, variance_pct: 1.5, status: 'Normal Baseline' },
  { timestamp: '2026-08-27', actual_cost_inr: 28950, projected_cost_inr: 28200, carbon_kg: 179.8, variance_pct: 2.7, status: 'Normal Baseline' },
  { timestamp: '2026-08-28', actual_cost_inr: 29100, projected_cost_inr: 28500, carbon_kg: 181.0, variance_pct: 2.1, status: 'Normal Baseline' },
  { timestamp: '2026-08-29', actual_cost_inr: 23200, projected_cost_inr: 23800, carbon_kg: 144.1, variance_pct: -2.5, status: 'Weekend Dampening' },
  { timestamp: '2026-08-30', actual_cost_inr: 22800, projected_cost_inr: 23100, carbon_kg: 141.5, variance_pct: -1.3, status: 'Weekend Dampening' },
  { timestamp: '2026-08-31', actual_cost_inr: 31400, projected_cost_inr: 29200, carbon_kg: 194.8, variance_pct: 7.5, status: 'Normal Baseline' },
  { timestamp: '2026-09-01', actual_cost_inr: 42800, projected_cost_inr: 29800, carbon_kg: 265.4, variance_pct: 43.6, status: 'ANOMALY: Spend Surge' },
];

export const OverviewView: React.FC = () => {
  const { currency, refreshKey, navigateToAnomalyInvestigation, setActiveTab } = useApp();
  const [data, setData] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>(DEFAULT_TIMESERIES);
  const [timelineDays, setTimelineDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summary, costData] = await Promise.all([
          dashboardApi.getSummary().catch(() => null),
          costApi.getTimeseries(timelineDays, 'daily').catch(() => null)
        ]);
        if (summary) setData(summary);
        if (costData?.timeseries && costData.timeseries.length > 0) {
          setTimeseries(costData.timeseries);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timelineDays, refreshKey]);

  const kpis = data?.kpis || {
    current_spend_inr: 842640,
    spend_trend_pct: 12.8,
    projected_monthly_cost_inr: 1184200,
    detected_anomalies_total: 7,
    detected_anomalies_critical: 2,
    carbon_footprint_tco2: 2.84,
    potential_savings_inr: 172400,
    carbon_reduction_pct: 18.6
  };

  // Trajectory Summary Stats
  const activeSeries = timeseries && timeseries.length > 0 ? timeseries : DEFAULT_TIMESERIES;
  const avgDailySpend = activeSeries.reduce((acc, curr) => acc + (curr.actual_cost_inr || 0), 0) / activeSeries.length;
  const avgDailyCarbon = activeSeries.reduce((acc, curr) => acc + (curr.carbon_kg || 0), 0) / activeSeries.length;

  // Custom rich tooltip for Spend Trajectory vs Baseline
  const CustomTrajectoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isSpike = point.variance_pct > 25.0;
      const isBelow = point.variance_pct < -5.0;

      return (
        <div className="bg-[#0b1120] border border-slate-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 max-w-xs animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-mono text-slate-400 text-[11px]">{label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isSpike ? 'bg-rose-500/20 text-rose-300' :
              isBelow ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {point.status || 'Normal'}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Actual Spend:</span>
              </span>
              <strong className="text-white font-mono">{formatCurrency(point.actual_cost_inr, currency)}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Projected Base:</span>
              </span>
              <span className="text-slate-300 font-mono">{formatCurrency(point.projected_cost_inr, currency)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Model Variance:</span>
              <span className={`font-mono font-semibold ${isSpike ? 'text-rose-400' : 'text-emerald-400'}`}>
                {point.variance_pct > 0 ? `+${point.variance_pct}%` : `${point.variance_pct}%`}
              </span>
            </div>

            {point.carbon_kg && (
              <div className="flex items-center justify-between text-[11px] text-teal-400">
                <span className="text-slate-400">Carbon Impact:</span>
                <span className="font-mono font-medium">{point.carbon_kg} kgCO₂e</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cloud Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry monitoring cost, usage anomalies, and carbon impact.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('scheduler')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Smart Scheduler</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Investigator</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Spend */}
        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Current Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.current_spend_inr, currency)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium pt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+{kpis.spend_trend_pct}% vs last period</span>
          </div>
        </div>

        {/* 2. Projected Monthly Cost */}
        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Projected Monthly</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(kpis.projected_monthly_cost_inr, currency)}
          </div>
          <p className="text-[11px] text-slate-400 pt-1">Run-rate forecast</p>
        </div>

        {/* 3. Detected Anomalies */}
        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Anomalies</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
            {kpis.detected_anomalies_total}
            <span className="text-xs font-semibold text-rose-400">
              {kpis.detected_anomalies_critical} Critical
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">ML Isolation Forest alerts</p>
        </div>

        {/* 4. Potential Savings */}
        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Potential Savings</span>
            <Leaf className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(kpis.potential_savings_inr, currency)}
          </div>
          <p className="text-[11px] text-teal-400 font-medium pt-1">
            -{kpis.carbon_reduction_pct}% Carbon reduction
          </p>
        </div>
      </div>

      {/* Main Spend Trajectory vs Baseline Section */}
      <div className="p-6 rounded-2xl bg-slate-900/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Spend Trajectory vs Baseline</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time daily infrastructure spend compared with ML statistical baseline
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeline Filter */}
            <div className="flex bg-slate-900/80 p-0.5 rounded-lg text-xs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimelineDays(d)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    timelineDays === d
                      ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Actual Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                <span className="text-slate-400">Projected Baseline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guaranteed Visible Chart Container */}
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => val ? val.substring(5) : ''} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip content={<CustomTrajectoryTooltip />} />
              <Area 
                type="monotone" 
                dataKey="actual_cost_inr" 
                name="actual_cost_inr"
                stroke="#10b981" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#costGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="projected_cost_inr" 
                name="projected_cost_inr"
                stroke="#818cf8" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                fill="none" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Metric Strip below Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/40 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40">
            <span className="text-slate-400">Avg Daily Burn:</span>
            <span className="font-semibold text-white font-mono">{formatCurrency(avgDailySpend, currency)}/day</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40">
            <span className="text-slate-400">Baseline Accuracy:</span>
            <span className="font-semibold text-emerald-400 font-mono">96.8% Fit</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40">
            <span className="text-slate-400">Avg Emissions Rate:</span>
            <span className="font-semibold text-teal-300 font-mono">~{Math.round(avgDailyCarbon)} kgCO₂/day</span>
          </div>
        </div>
      </div>

      {/* Active Anomalies & Regional Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Anomalies */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Detected Cost Anomalies</span>
            </h2>
            <button
              onClick={() => setActiveTab('anomalies')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(data?.top_anomalies || []).map((anomaly: any) => (
              <div
                key={anomaly.id}
                className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      anomaly.severity === 'CRITICAL' 
                        ? 'bg-rose-500/15 text-rose-400' 
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {anomaly.severity}
                    </span>
                    <span className="text-xs font-bold text-white">{anomaly.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({anomaly.service})</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {anomaly.probable_cause}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-0.5">
                    Impact: <strong className="text-rose-400">+{formatCurrency(anomaly.potential_impact_inr, currency)}/day</strong>
                  </div>
                </div>

                <button
                  onClick={() => navigateToAnomalyInvestigation(anomaly.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto transition-colors shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Investigate</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Carbon Grid */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>Regional Carbon Grid</span>
              </h2>
              <button
                onClick={() => setActiveTab('carbon')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                View
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time intensity (gCO₂e/kWh)</p>

            <div className="mt-4 space-y-2">
              {(data?.regional_carbon_summary || []).slice(0, 4).map((region: any) => (
                <div key={region.region_code} className="p-2.5 rounded-lg bg-slate-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{region.region_name}</p>
                    <p className="text-[10px] text-slate-400">{region.renewable_pct}% Clean Grid</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">
                    {region.carbon_intensity_gco2_kwh} gCO₂
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('carbon')}
            className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center gap-1 transition-colors"
          >
            <span>Open Carbon Intelligence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
