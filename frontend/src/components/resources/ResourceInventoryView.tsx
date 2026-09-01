import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Search, 
  X 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { resourcesApi } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { ResourceItem } from '../../types';

export const ResourceInventoryView: React.FC = () => {
  const { currency, refreshKey } = useApp();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [envFilter, setEnvFilter] = useState<string>('All');
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  useEffect(() => {
    fetchResources();
  }, [serviceFilter, envFilter, search, refreshKey]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourcesApi.list({
        service: serviceFilter !== 'All' ? serviceFilter : undefined,
        environment: envFilter !== 'All' ? envFilter : undefined,
        search: search || undefined
      });
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
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
            Cloud Resources
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-cloud inventory tracking hourly spend, utilization, and carbon ratings.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Services</option>
            <option value="EC2">EC2</option>
            <option value="SageMaker">SageMaker</option>
            <option value="RDS">RDS</option>
            <option value="EKS">EKS</option>
            <option value="S3">S3</option>
            <option value="Lambda">Lambda</option>
          </select>

          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="All">All Environments</option>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="overflow-x-auto rounded-xl bg-slate-900/30">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800/60">
            <tr>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Region / Env</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Daily Cost</th>
              <th className="py-3 px-4">Utilization</th>
              <th className="py-3 px-4">Carbon</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300">
            {loading && resources.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">Loading resources...</td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">No resources found.</td>
              </tr>
            ) : (
              resources.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <span className="text-white font-medium block">{r.name}</span>
                    <span className="text-[10px] text-slate-500">{r.id}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {r.service}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {r.region} • {r.environment}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      r.status === 'Running' ? 'text-emerald-400 bg-emerald-500/10' :
                      r.status === 'Idle' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                    {formatCurrency(r.daily_cost_inr, currency)}/day
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {r.utilization_percent}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.carbon_rating === 'Low' ? 'text-emerald-400' :
                      r.carbon_rating === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {r.carbon_rating}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedResource(r)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedResource.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedResource.id}</p>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-xl space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Hourly Rate</span>
                <span className="text-sm font-bold text-white">{formatCurrency(selectedResource.hourly_cost_inr, currency)}/hr</span>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Daily Burn</span>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(selectedResource.daily_cost_inr, currency)}/day</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedResource(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
