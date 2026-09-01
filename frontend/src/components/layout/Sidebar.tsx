import React from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  AlertTriangle, 
  Sparkles, 
  Leaf, 
  Lightbulb, 
  Server, 
  Activity, 
  FileText, 
  Settings, 
  CheckCircle2
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cost', label: 'Cost Intelligence', icon: DollarSign },
  { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, badge: '3 Active' },
  { id: 'ai', label: 'AI Cost Investigator', icon: Sparkles },
  { id: 'carbon', label: 'Carbon Intelligence', icon: Leaf },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, badge: '5' },
  { id: 'resources', label: 'Cloud Resources', icon: Server },
  { id: 'events', label: 'Usage Events', icon: Activity },
  { id: 'reports', label: 'Reports & Export', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <aside className="w-60 h-screen bg-[#070c18] flex flex-col justify-between shrink-0 sticky top-0 z-30 select-none border-r border-slate-800/40">
      {/* Brand Identity */}
      <div>
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Carbon<span className="text-emerald-400">Lens</span></span>
            <p className="text-[10px] text-slate-400 font-medium">AI Cloud Intelligence</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-2.5 py-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded text-slate-400 bg-slate-800/50 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-2 border-t border-slate-800/40">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Operational</span>
        </div>
        <div className="text-xs text-slate-300 font-medium truncate">
          Demo FinOps Admin
        </div>
      </div>
    </aside>
  );
};
