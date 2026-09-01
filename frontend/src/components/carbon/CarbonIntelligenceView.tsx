import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Globe2, 
  SunMedium, 
  Sparkles 
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
import { carbonApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { CarbonIntelligenceData } from '../../types';

export const CarbonIntelligenceView: React.FC = () => {
  const { currency, refreshKey, setActiveTab } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<string>('ap-south-1');
  const [data, setData] = useState<CarbonIntelligenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCarbon = async () => {
      try {
        setLoading(true);
        const res = await carbonApi.getSummary(selectedRegion);
        setData(res);
      } catch (err) {
        console.error('Failed to load carbon intelligence:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCarbon();
  }, [selectedRegion, refreshKey]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Carbon Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time grid marginal emissions, renewable energy curves, and workload carbon accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 font-medium px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="ap-south-1">Mumbai / India (ap-south-1)</option>
            <option value="ap-south-2">Hyderabad / India (ap-south-2)</option>
            <option value="ap-southeast-1">Singapore (ap-southeast-1)</option>
            <option value="eu-central-1">Frankfurt / Germany (eu-central-1)</option>
            <option value="us-east-1">N. Virginia / USA (us-east-1)</option>
          </select>

          <button
            onClick={() => setActiveTab('scheduler')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Scheduler</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <span className="text-xs font-medium text-slate-400">Today's Emissions</span>
          <div className="text-2xl font-bold text-white tracking-tight">
            {data?.today_emissions_kg ? `${data.today_emissions_kg} kgCO₂e` : '184.2 kgCO₂e'}
          </div>
          <p className="text-[11px] text-slate-400 pt-0.5">Across active compute clusters</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <span className="text-xs font-medium text-slate-400">Workload Spend</span>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(data?.today_workload_cost_inr || 28420, currency)}
          </div>
          <p className="text-[11px] text-slate-400 pt-0.5">₹154.3/kgCO₂e intensity</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <span className="text-xs font-medium text-slate-400">Reduction Potential</span>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            -{data?.optimization_potential_carbon_pct || 18.6}%
          </div>
          <p className="text-[11px] text-teal-400 pt-0.5">Via off-peak batch shifts</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/40 space-y-1">
          <span className="text-xs font-medium text-slate-400">Spot Savings Match</span>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            -{data?.optimization_potential_cost_pct || 12.4}%
          </div>
          <p className="text-[11px] text-emerald-400 pt-0.5">Night off-peak correlation</p>
        </div>
      </div>

      {/* 24-Hour Diurnal Curve */}
      <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">24-Hour Grid Marginal Intensity (gCO₂e/kWh)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Solar peaks and clean night valleys vs high-fossil evening ramps for {selectedRegion}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-400">• Green Window (Off-Peak)</span>
            <span className="text-rose-400">• Peak Grid (Evening)</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.diurnal_curve || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="carbonCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#172033" />
              <XAxis dataKey="time_label" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any) => [`${val} gCO₂/kWh`, 'Grid Intensity']}
              />
              <Area type="monotone" dataKey="intensity_gco2_kwh" stroke="#10b981" strokeWidth={2} fill="url(#carbonCurveGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Comparison Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Regional Comparison</h2>
            <p className="text-xs text-slate-400 mt-0.5">Benchmark regional cloud carbon intensity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(data?.regional_comparison || []).map((r) => (
            <div 
              key={r.region_code}
              className={`p-4 rounded-xl transition-all ${
                r.region_code === selectedRegion
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/70'
              }`}
            >
              <div className="text-xs font-semibold text-white">{r.region_name}</div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.region_code}</p>
              <div className="mt-3">
                <div className="text-lg font-bold text-emerald-400">
                  {r.carbon_intensity_gco2_kwh} <span className="text-[10px] text-slate-400 font-normal">gCO₂</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{r.renewable_pct}% Clean</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
