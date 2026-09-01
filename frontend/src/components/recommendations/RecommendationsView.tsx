import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Check 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { recommendationsApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { RecommendationItem } from '../../types';
import confetti from 'canvas-confetti';

export const RecommendationsView: React.FC = () => {
  const { currency, refreshKey, addToast } = useApp();
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  useEffect(() => {
    fetchRecs();
  }, [categoryFilter, priorityFilter, refreshKey]);

  const fetchRecs = async () => {
    try {
      setLoading(true);
      const data = await recommendationsApi.list(
        categoryFilter !== 'All' ? categoryFilter : undefined,
        priorityFilter !== 'All' ? priorityFilter : undefined
      );
      setRecs(data || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string, title: string) => {
    try {
      await recommendationsApi.apply(id);
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
      addToast({
        type: 'success',
        title: 'Action Applied',
        description: `Applied: "${title}"`,
      });
      fetchRecs();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err?.message || 'Could not apply recommendation',
      });
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await recommendationsApi.dismiss(id);
      addToast({
        type: 'info',
        title: 'Dismissed',
        description: `Recommendation ${id} dismissed.`,
      });
      fetchRecs();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Dismiss Failed',
        description: err?.message || 'Could not dismiss recommendation',
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Optimization Recommendations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized engineering action plans scored by financial savings, carbon reduction, and reliability.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Architectural Guardrail">Architectural Guardrail</option>
            <option value="Scheduling">Scheduling</option>
            <option value="Rightsizing">Rightsizing</option>
            <option value="Cost Optimization">Cost Optimization</option>
            <option value="Cost & Carbon">Cost & Carbon</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Priority:</span>
          <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-lg">
            {['All', 'CRITICAL', 'HIGH', 'MEDIUM'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  priorityFilter === p
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading recommendations...</div>
        ) : recs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">All recommendations addressed</p>
          </div>
        ) : (
          recs.map((rec) => {
            const isApplied = rec.status === 'Applied';
            const isDismissed = rec.status === 'Dismissed';

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-xl bg-slate-900/40 transition-colors ${
                  isApplied ? 'opacity-50' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        rec.priority === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-400'
                          : rec.priority === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-sm font-semibold text-white">{rec.title}</span>
                      <span className="text-xs font-mono text-slate-400">({rec.service} • {rec.category})</span>
                    </div>

                    <p className="text-xs text-slate-300">{rec.reason}</p>
                    <p className="text-xs text-emerald-400 font-medium">Action: {rec.action_text}</p>
                  </div>

                  <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">
                        +{formatCurrency(rec.financial_saving_monthly_inr, currency)}/mo
                      </div>
                      <div className="text-xs text-teal-300">
                        -{rec.carbon_reduction_pct}% Carbon
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApplied ? (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </span>
                      ) : isDismissed ? (
                        <span className="text-xs text-slate-500">Dismissed</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDismiss(rec.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                            title="Dismiss"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApply(rec.id, rec.title)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95"
                          >
                            Apply
                          </button>
                        </>
                      )}
                    </div>
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
