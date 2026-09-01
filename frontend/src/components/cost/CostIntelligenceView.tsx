import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Layers, 
  Globe, 
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { costApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const CostIntelligenceView: React.FC = () => {
  const { currency, refreshKey } = useApp();
  const [days, setDays] = useState<number>(30);
  const [granularity, setGranularity] = useState<'daily' | 'hourly'>('daily');
  const [selectedEnv, setSelectedEnv] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');

  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCostData = async () => {
      try {
        setLoading(true);
        const [tsData, bdData] = await Promise.all([
          costApi.getTimeseries(days, granularity, selectedEnv, selectedService),
          costApi.getBreakdown(days)
        ]);
        setTimeseries(tsData.timeseries || []);
        setBreakdown(bdData);
      } catch (err) {
        console.error('Error fetching cost analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCostData();
  }, [days, granularity, selectedEnv, selectedService, refreshKey]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Clean Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cost Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-dimensional allocation across compute, serverless, and database infrastructure.
          </p>
        </div>

        {/* Clean Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Days selector */}
          <div className="flex bg-slate-900/60 rounded-lg p-0.5 text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  days === d ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Granularity */}
          <div className="flex bg-slate-900/60 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1 rounded font-medium ${
                granularity === 'daily' ? 'bg-slate-800 text-slate-200' : 'text-slate-400'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setGranularity('hourly')}
              className={`px-2.5 py-1 rounded font-medium ${
                granularity === 'hourly' ? 'bg-slate-800 text-slate-200' : 'text-slate-400'
              }`}
            >
              Hourly
            </button>
          </div>

          {/* Environment Filter */}
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="bg-slate-900 text-xs text-slate-300 font-medium px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Environments</option>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
          </select>

          {/* Service Filter */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-slate-900 text-xs text-slate-300 font-medium px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Services</option>
            <option value="EC2">EC2</option>
            <option value="SageMaker">SageMaker</option>
            <option value="RDS">RDS</option>
            <option value="EKS">EKS</option>
            <option value="S3">S3</option>
            <option value="Lambda">Lambda</option>
          </select>
        </div>
      </div>

      {/* Main Cost Timeline Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Spend Over Time</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtered for {selectedEnv} • {selectedService} ({days} days)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">TOTAL SPEND</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatCurrency(breakdown?.total_cost_inr || 842640, currency)}
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="costAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#172033" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickFormatter={(val) => val ? val.substring(5) : ''} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                formatter={(value: any, name: string) => [
                  formatCurrency(Number(value), currency),
                  name === 'actual_cost_inr' ? 'Actual Spend' : 'Projected Baseline'
                ]}
              />
              <Area type="monotone" dataKey="actual_cost_inr" stroke="#10b981" strokeWidth={2} fill="url(#costAreaGradient)" />
              <Area type="monotone" dataKey="projected_cost_inr" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Dimensional Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Cost by Service */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Spend by Service</h2>
            <span className="text-[10px] text-slate-400">AWS</span>
          </div>

          <div className="space-y-3">
            {(breakdown?.by_service || []).map((s: any, idx: number) => (
              <div key={s.service} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{s.service}</span>
                  <span className="text-slate-400 font-mono">{formatCurrency(s.cost_inr, currency)} ({s.cost_pct}%)</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.cost_pct}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Cost by Environment */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Spend by Environment</h2>
              <span className="text-[10px] text-slate-400">Tiers</span>
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown?.by_environment || []}
                    dataKey="cost_inr"
                    nameKey="environment"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {(breakdown?.by_environment || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1120', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => formatCurrency(Number(val), currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            {(breakdown?.by_environment || []).map((e: any, idx: number) => (
              <div key={e.environment} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300">{e.environment}</span>
                </div>
                <span className="font-mono text-slate-400">{formatCurrency(e.cost_inr, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Cost by Region */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Regional Distribution</h2>
            <span className="text-[10px] text-slate-400">Global</span>
          </div>

          <div className="space-y-2.5">
            {(breakdown?.by_region || []).map((r: any) => (
              <div key={r.region} className="p-3 bg-slate-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">{r.region_name}</p>
                  <p className="text-[10px] text-slate-400">{r.region}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-400">{formatCurrency(r.cost_inr, currency)}</p>
                  <span className="text-[10px] text-slate-400">{r.carbon_intensity_gco2_kwh} gCO₂</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
