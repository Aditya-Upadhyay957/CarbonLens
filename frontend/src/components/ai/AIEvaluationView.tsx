import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { anomaliesApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { AnomalyItem, AIAnalysisResult } from '../../types';

export const AIEvaluationView: React.FC = () => {
  const { currency, selectedAnomalyId, setSelectedAnomalyId, refreshKey, addToast } = useApp();
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [currentAnomaly, setCurrentAnomaly] = useState<AnomalyItem | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const data = await anomaliesApi.list();
        setAnomalies(data || []);
        if (data && data.length > 0) {
          const target = data.find((a: AnomalyItem) => a.id === selectedAnomalyId) || data[0];
          setCurrentAnomaly(target);
          setSelectedAnomalyId(target.id);
        }
      } catch (err) {
        console.error('Failed to load anomalies:', err);
      }
    };
    fetchList();
  }, [refreshKey]);

  useEffect(() => {
    if (!currentAnomaly) return;
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const res = await anomaliesApi.explain(currentAnomaly.id);
        setAnalysis(res);
      } catch (err) {
        console.error('AI explanation failed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [currentAnomaly?.id]);

  const handleSelectAnomaly = (id: string) => {
    const target = anomalies.find((a) => a.id === id);
    if (target) {
      setCurrentAnomaly(target);
      setSelectedAnomalyId(target.id);
    }
  };

  const handleForceRefresh = async () => {
    if (!currentAnomaly) return;
    try {
      setLoading(true);
      const res = await anomaliesApi.explain(currentAnomaly.id, true);
      setAnalysis(res);
      addToast({
        type: 'success',
        title: 'Analysis Refreshed',
        description: `Regenerated root cause analysis for ${currentAnomaly.id}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Investigation Failed',
        description: err?.message || 'Could not rerun AI engine',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRemediation = () => {
    if (analysis?.remediation_code) {
      navigator.clipboard.writeText(analysis.remediation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'info',
        title: 'Command Copied',
        description: 'Remediation snippet copied to clipboard.',
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Cost Investigator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Root-cause reasoning across trace logs, CPU metrics, and autoscaling events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={currentAnomaly?.id || ''}
            onChange={(e) => handleSelectAnomaly(e.target.value)}
            className="bg-slate-900 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            {anomalies.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                {a.id} — {a.service} ({a.severity})
              </option>
            ))}
          </select>

          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            title="Re-analyze"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-slate-900/30 rounded-2xl space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Investigating Telemetry...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Metadata Bar */}
          <div className="p-4 rounded-xl bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-white">{currentAnomaly?.title}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Provider: {analysis.provider_used} • Generated {new Date(analysis.generated_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-emerald-400 font-semibold">
              Confidence: {analysis.confidence_score}%
            </div>
          </div>

          {/* 4 Quadrants without box-in-a-box clutter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. What Happened? */}
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. What Happened?
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {analysis.summary}
              </p>
              <div className="pt-2 text-xs text-slate-400">
                Baseline: {formatCurrency(currentAnomaly?.baseline_cost_inr || 4200, currency)}/day → Current: <strong className="text-rose-400">+{currentAnomaly?.cost_increase_pct}%</strong>
              </div>
            </div>

            {/* 2. Why Did It Happen? */}
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Why Did It Happen? (Root Cause)
              </span>
              <div className="space-y-2">
                {analysis.probable_causes.map((cause, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{cause}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* 3. Business Impact */}
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                3. Business & Financial Impact
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {analysis.business_impact}
              </p>
              <div className="text-xs font-bold text-rose-400 pt-1">
                Projected Loss: +{formatCurrency(analysis.estimated_financial_loss_inr, currency)}/day
              </div>
            </div>

            {/* 4. Remediation Actions */}
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                4. Step-by-Step Remediation
              </span>
              <div className="space-y-2">
                {analysis.recommended_actions.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remediation CLI Snippet */}
          {analysis.remediation_code && (
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Automated CLI Remediation</span>
                </span>
                <button
                  onClick={copyRemediation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-[#050811] font-mono text-xs text-emerald-300 overflow-x-auto">
                <code>{analysis.remediation_code}</code>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">Select an anomaly to investigate.</div>
      )}
    </div>
  );
};
