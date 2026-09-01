import React, { createContext, useContext, useState, useEffect } from 'react';
import { simulationApi, dashboardApi } from '../services/api';
import confetti from 'canvas-confetti';

export type NavTab = 
  | 'overview' 
  | 'cost' 
  | 'anomalies' 
  | 'ai' 
  | 'carbon' 
  | 'scheduler' 
  | 'recommendations' 
  | 'resources' 
  | 'events' 
  | 'reports' 
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currency: 'INR' | 'USD';
  setCurrency: (c: 'INR' | 'USD') => void;
  selectedProvider: string;
  setSelectedProvider: (p: string) => void;
  dateRange: string;
  setDateRange: (r: string) => void;
  isSimulating: boolean;
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (id: string | null) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerCostSpikeSimulation: (service?: string) => Promise<void>;
  triggerScenario: (scenarioId: string, scenarioName: string) => Promise<void>;
  refreshKey: number;
  triggerGlobalRefresh: () => void;
  navigateToAnomalyInvestigation: (anomalyId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [selectedProvider, setSelectedProvider] = useState<string>('AWS');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>('ANOM-2841');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerGlobalRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const navigateToAnomalyInvestigation = (anomalyId: string) => {
    setSelectedAnomalyId(anomalyId);
    setActiveTab('ai');
  };

  const triggerCostSpikeSimulation = async (service: string = 'EC2') => {
    try {
      setIsSimulating(true);
      addToast({
        type: 'warning',
        title: 'Simulation Pipeline Started',
        description: `Generating abnormal ${service} telemetry surge into stream...`,
      });

      const res = await simulationApi.simulateCostSpike(service);
      setSelectedAnomalyId(res.anomaly_id);
      triggerGlobalRefresh();

      setTimeout(() => {
        setIsSimulating(false);
        addToast({
          type: 'error',
          title: `CRITICAL ${service} Anomaly Detected`,
          description: `+${res.cost_increase_pct}% surge flagged by ML Isolation Forest. ID: ${res.anomaly_id}`,
        });
      }, 800);
    } catch (err: any) {
      setIsSimulating(false);
      addToast({
        type: 'error',
        title: 'Simulation Failed',
        description: err?.message || 'Could not trigger simulation event',
      });
    }
  };

  const triggerScenario = async (scenarioId: string, scenarioName: string) => {
    try {
      setIsSimulating(true);
      const res = await simulationApi.triggerScenario(scenarioId);
      triggerGlobalRefresh();
      
      if (res.anomaly_id) {
        setSelectedAnomalyId(res.anomaly_id);
      }

      setIsSimulating(false);
      addToast({
        type: 'success',
        title: `Scenario Loaded: ${scenarioName}`,
        description: 'Dashboard, ML models, and event pipeline updated with live state.',
      });

      if (scenarioId === 'carbon_batch') {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
      }
    } catch (err: any) {
      setIsSimulating(false);
      addToast({
        type: 'error',
        title: 'Scenario Failed',
        description: err?.message || 'Failed to trigger demo scenario',
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currency,
        setCurrency,
        selectedProvider,
        setSelectedProvider,
        dateRange,
        setDateRange,
        isSimulating,
        selectedAnomalyId,
        setSelectedAnomalyId,
        toasts,
        addToast,
        removeToast,
        triggerCostSpikeSimulation,
        triggerScenario,
        refreshKey,
        triggerGlobalRefresh,
        navigateToAnomalyInvestigation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
