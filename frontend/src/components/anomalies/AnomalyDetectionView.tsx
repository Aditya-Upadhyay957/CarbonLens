import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Server, 
  Clock, 
  CheckCircle2, 
  Zap,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { anomaliesApi } from '../../services/api';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { AnomalyItem } from '../../types';

export const AnomalyDetectionView: React.FC = () => {
  const { currency, refreshKey, navigateToAnomalyInvestigation, triggerCostSpikeSimulation, isSimulating } = useApp();
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const data = await anomaliesApi.list(
          severityFilter !== 'All' ? severityFilter : undefined,
          serviceFilter !== 'All' ? serviceFilter : undefined
        );
        setAnomalies(data || []);
      } catch (err) {
        console.error('Failed to load anomalies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, [severityFilter, serviceFilter, refreshKey]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Anomaly Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine-learned deviation models detecting infrastructure cost spikes and abnormal traffic.
          </p>
        </div>

        <button
          onClick={() => triggerCostSpikeSimulation('EC2')}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-all disabled:opacity-50 self-start"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Cost Spike'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Severity:</span>
          <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-lg">
            {['All', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Service:</span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Services</option>
            <option value="EC2">EC2</option>
            <option value="SageMaker">SageMaker</option>
            <option value="RDS">RDS</option>
            <option value="Lambda">Lambda</option>
          </select>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {loading && anomalies.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading anomalies...</div>
        ) : anomalies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">No active anomalies</p>
            <p className="text-xs text-slate-400 mt-1">All telemetry aligns with rolling statistical baselines.</p>
          </div>
        ) : (
          anomalies.map((anom) => {
            const isCritical = anom.severity === 'CRITICAL';

            return (
              <div
                key={anom.id}
                className="p-5 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {anom.severity}
                      </span>
                      <span className="text-sm font-semibold text-white">{anom.title}</span>
                      <span className="text-xs font-mono text-emerald-400">
                        +{anom.cost_increase_pct}%
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{anom.id}</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {anom.probable_cause}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-0.5">
                      <div className="flex items-center gap-1">
                        <Server className="w-3.5 h-3.5 text-slate-500" />
                        <span>{anom.service} • {anom.environment} ({anom.region})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatRelativeTime(anom.detected_at)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Confidence: {anom.ai_confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-slate-400">
                        Normal: {formatCurrency(anom.baseline_cost_inr, currency)} → Current: <strong className="text-white">{formatCurrency(anom.current_cost_inr, currency)}</strong>
                      </div>
                      <div className="text-xs font-semibold text-rose-400 mt-0.5">
                        +{formatCurrency(anom.potential_impact_inr, currency)}/day impact
                      </div>
                    </div>

                    <button
                      onClick={() => navigateToAnomalyInvestigation(anom.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Investigate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
