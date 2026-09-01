import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { reportsApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { FinOpsReportItem } from '../../types';

export const ReportsView: React.FC = () => {
  const { currency, addToast, refreshKey } = useApp();
  const [reports, setReports] = useState<FinOpsReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<FinOpsReportItem | null>(null);
  const [reportType, setReportType] = useState<string>('Monthly FinOps');
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.list();
      setReports(data || []);
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await reportsApi.generate(reportType, days);
      addToast({
        type: 'success',
        title: 'Report Generated',
        description: `Generated ${res.title} successfully.`,
      });
      await fetchReports();
      setSelectedReport(res);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: err?.message || 'Could not generate report',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCsv = (entity: string) => {
    const url = reportsApi.getDownloadUrl(entity);
    window.open(url, '_blank');
    addToast({
      type: 'info',
      title: 'CSV Export',
      description: `Downloading carbonlens_${entity}_export.csv`,
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Reports & Export
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Executive summaries and raw CSV data exports for auditing and FinOps reporting.
          </p>
        </div>

        {/* CSV Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCsv('billing')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Billing CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('resources')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Resources CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('anomalies')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Anomalies CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Archive */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Generate Report
            </span>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Template</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-900 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="Weekly Cost">Weekly Cloud Spend & Variance</option>
                  <option value="Monthly FinOps">Monthly Executive FinOps Review</option>
                  <option value="Carbon Impact">Carbon & Sustainability Report</option>
                  <option value="Anomaly Report">Cost Anomaly & Incident Log</option>
                  <option value="Optimization Report">Rightsizing & ROI Plan</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Lookback</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-slate-900 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generating ? 'Generating...' : 'Generate Report'}</span>
              </button>
            </div>
          </div>

          {/* Archive */}
          <div className="p-6 rounded-2xl bg-slate-900/30 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Report Archive
            </span>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                    selectedReport?.id === r.id
                      ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <p className="font-medium text-white">{r.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{r.id}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Preview */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="p-6 rounded-2xl bg-slate-900/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {new Date(selectedReport.period_start).toLocaleDateString()} — {new Date(selectedReport.period_end).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleExportCsv('billing')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 self-start"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Total Spend</span>
                  <span className="text-sm font-bold text-white font-mono">{formatCurrency(selectedReport.total_spend_inr, currency)}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Emissions</span>
                  <span className="text-sm font-bold text-teal-400 font-mono">{selectedReport.total_carbon_kg} kgCO₂e</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Identified Savings</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">+{formatCurrency(selectedReport.identified_savings_inr, currency)}</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Anomalies</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">{selectedReport.anomaly_count}</span>
                </div>
              </div>

              {/* Summary Text */}
              <div className="p-5 rounded-xl bg-slate-900/40 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedReport.executive_summary}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400">Select or generate a report.</div>
          )}
        </div>
      </div>
    </div>
  );
};
