import React from 'react';
import { 
  Play, 
  Flame, 
  RotateCw, 
  Cpu, 
  SunMedium, 
  Globe2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  color: string;
}

const scenarios: Scenario[] = [
  {
    id: 'runaway_autoscaling',
    name: '1. Runaway Autoscaling',
    description: 'EC2 instance count spikes 8 → 31 nodes',
    icon: Flame,
    tag: 'FinOps Anomaly',
    color: 'from-rose-500/20 to-orange-500/10 border-rose-500/30 text-rose-300 hover:border-rose-400'
  },
  {
    id: 'retry_loop',
    name: '2. Retry Loop Storm',
    description: 'Lambda recursion generates 142k invocations/min',
    icon: RotateCw,
    tag: 'Serverless Anomaly',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400'
  },
  {
    id: 'idle_gpu',
    name: '3. Idle GPU Resource',
    description: 'H100 GPU cluster left active at ₹840/hr',
    icon: Cpu,
    tag: 'AI/ML Waste',
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300 hover:border-purple-400'
  },
  {
    id: 'carbon_batch',
    name: '4. Carbon Batch Shift',
    description: 'Shifts training job: 26.2% carbon cut + ₹320 saved',
    icon: SunMedium,
    tag: 'GreenOps',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
  },
  {
    id: 'multiregion',
    name: '5. Multi-Region Comparison',
    description: 'Compares Mumbai, Frankfurt, Singapore carbon grids',
    icon: Globe2,
    tag: 'Multi-Cloud',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300 hover:border-blue-400'
  }
];

export const ScenarioBar: React.FC = () => {
  const { triggerScenario, isSimulating } = useApp();

  return (
    <div className="bg-[#0c1326] border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>HACKATHON DEMO SCENARIOS</span>
        </div>
        <span className="text-[11px] text-slate-400 hidden xl:inline">1-Click Live Test Scenarios:</span>
      </div>

      <div className="flex items-center gap-2">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => triggerScenario(sc.id, sc.name)}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gradient-to-r ${sc.color} text-xs font-medium transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-sm shrink-0`}
              title={sc.description}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <span className="font-semibold">{sc.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
