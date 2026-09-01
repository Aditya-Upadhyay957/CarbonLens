import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { ToastContainer } from './components/layout/ToastContainer';

// Views
import { OverviewView } from './components/dashboard/OverviewView';
import { CostIntelligenceView } from './components/cost/CostIntelligenceView';
import { AnomalyDetectionView } from './components/anomalies/AnomalyDetectionView';
import { AIEvaluationView } from './components/ai/AIEvaluationView';
import { CarbonIntelligenceView } from './components/carbon/CarbonIntelligenceView';
import { SmartSchedulerView } from './components/scheduler/SmartSchedulerView';
import { RecommendationsView } from './components/recommendations/RecommendationsView';
import { ResourceInventoryView } from './components/resources/ResourceInventoryView';
import { EventStreamView } from './components/events/EventStreamView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

export const App: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'cost':
        return <CostIntelligenceView />;
      case 'anomalies':
        return <AnomalyDetectionView />;
      case 'ai':
        return <AIEvaluationView />;
      case 'carbon':
        return <CarbonIntelligenceView />;
      case 'scheduler':
        return <SmartSchedulerView />;
      case 'recommendations':
        return <RecommendationsView />;
      case 'resources':
        return <ResourceInventoryView />;
      case 'events':
        return <EventStreamView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#070c18] text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto pb-12">
          {renderActiveView()}
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default App;
