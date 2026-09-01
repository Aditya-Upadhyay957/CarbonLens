import React, { useState, useEffect } from 'react';
import { 
  Check, 
  RotateCcw, 
  Sparkles, 
  Leaf 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { settingsApi, simulationApi } from '../../services/api';

export const SettingsView: React.FC = () => {
  const { currency, setCurrency, addToast, triggerGlobalRefresh } = useApp();

  const [llmProvider, setLlmProvider] = useState<string>('mock');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [carbonProvider, setCarbonProvider] = useState<string>('simulated');
  const [carbonKey, setCarbonKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.get();
      setLlmProvider(data.llm_provider || 'mock');
      setCarbonProvider(data.carbon_provider || 'simulated');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.update({
        llm_provider: llmProvider,
        openai_api_key: openaiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
        carbon_provider: carbonProvider,
        carbon_api_key: carbonKey || undefined,
        default_currency: currency
      });
      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Configuration updated successfully.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: err?.message || 'Could not update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    try {
      await simulationApi.resetDemoData();
      triggerGlobalRefresh();
      addToast({
        type: 'info',
        title: 'Data Reset',
        description: 'Baseline telemetry restored.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        description: err?.message || 'Could not reset demo data',
      });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure AI models, carbon feeds, and simulation data.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. AI Provider */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">AI Cost Investigator Provider</span>
            <span className="text-[10px] text-emerald-400 font-mono">Offline Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'mock', name: 'CarbonLens Local', desc: 'Deterministic FinOps engine (Zero API keys needed)' },
              { id: 'openai', name: 'OpenAI', desc: 'GPT-4o structured reasoning' },
              { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3 FinOps analysis' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLlmProvider(p.id)}
                className={`p-3.5 rounded-xl text-left transition-colors ${
                  llmProvider === p.id
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/70'
                }`}
              >
                <p className="font-semibold text-white">{p.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>

          {llmProvider === 'openai' && (
            <div className="pt-2">
              <label className="text-slate-400 block mb-1">OpenAI API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
              />
            </div>
          )}

          {llmProvider === 'anthropic' && (
            <div className="pt-2">
              <label className="text-slate-400 block mb-1">Anthropic API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 2. Carbon Feeds */}
        <div className="p-6 rounded-2xl bg-slate-900/30 space-y-4">
          <span className="font-bold text-slate-200 block">Carbon Intensity Feed</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'simulated', name: 'Diurnal Regional Curves', desc: 'Mathematical model of solar and wind off-peak valleys' },
              { id: 'live', name: 'CO₂Signal / Live API', desc: 'Live grid emissions via API key' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCarbonProvider(c.id)}
                className={`p-3.5 rounded-xl text-left transition-colors ${
                  carbonProvider === c.id
                    ? 'bg-teal-500/10 text-teal-300'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-900/70'
                }`}
              >
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{c.desc}</p>
              </button>
            ))}
          </div>

          {carbonProvider === 'live' && (
            <div className="pt-2">
              <label className="text-slate-400 block mb-1">Carbon API Key</label>
              <input
                type="password"
                placeholder="Key..."
                value={carbonKey}
                onChange={(e) => setCarbonKey(e.target.value)}
                className="w-full bg-slate-900 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 3. Reset Baseline */}
        <div className="p-6 rounded-2xl bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-200 block">Reset Telemetry Baseline</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Restores simulated AWS billing history and initial anomalies.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 self-start shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
