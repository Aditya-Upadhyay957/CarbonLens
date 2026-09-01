export interface SummaryKPIs {
  current_spend_inr: number;
  current_spend_usd: number;
  spend_trend_pct: number;
  projected_monthly_cost_inr: number;
  projected_monthly_cost_usd: number;
  detected_anomalies_total: number;
  detected_anomalies_critical: number;
  carbon_footprint_tco2: number;
  potential_savings_inr: number;
  potential_savings_usd: number;
  carbon_reduction_pct: number;
  last_updated: string;
}

export interface AnomalyItem {
  id: string;
  title: string;
  service: string;
  environment: string;
  region: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detected_at: string;
  anomaly_score: number;
  cost_increase_pct: number;
  baseline_cost_inr: number;
  current_cost_inr: number;
  potential_impact_inr: number;
  probable_cause: string;
  ai_confidence: number;
  status: string;
  telemetry_data?: Record<string, any>;
  has_ai_analysis?: boolean;
}

export interface AIAnalysisResult {
  anomaly_id: string;
  generated_at: string;
  provider_used: string;
  summary: string;
  probable_causes: string[];
  evidence: Record<string, any>;
  confidence_score: number;
  business_impact: string;
  estimated_financial_loss_inr: number;
  recommended_actions: string[];
  remediation_code?: string;
}

export interface CarbonGridReading {
  region_code: string;
  region_name: string;
  carbon_intensity_gco2_kwh: number;
  renewable_pct: number;
  grid_source: string;
  is_simulated: boolean;
  status: string;
}

export interface CarbonTimelinePoint {
  hour: number;
  time_label: string;
  intensity_gco2_kwh: number;
  cost_multiplier: number;
  renewable_pct: number;
}

export interface CarbonIntelligenceData {
  current_grid: CarbonGridReading[];
  regional_comparison: CarbonGridReading[];
  today_workload_cost_inr: number;
  today_emissions_kg: number;
  optimization_potential_carbon_pct: number;
  optimization_potential_cost_pct: number;
  diurnal_curve: CarbonTimelinePoint[];
}

export interface ScheduleWindowResult {
  hour: number;
  time_label: string;
  estimated_cost_inr: number;
  estimated_carbon_gco2: number;
  combined_score: number;
  is_recommended: boolean;
  is_current: boolean;
  feasibility: string;
}

export interface JobScheduleResponse {
  job_id: string;
  job_name: string;
  job_type: string;
  current_time_label: string;
  current_cost_inr: number;
  current_carbon_gco2: number;
  recommended_time_label: string;
  recommended_cost_inr: number;
  recommended_carbon_gco2: number;
  savings_inr: number;
  savings_pct: number;
  carbon_reduction_pct: number;
  optimization_summary: string;
  all_windows: ScheduleWindowResult[];
}

export interface WhatIfResult {
  current_hour_label: string;
  target_hour_label: string;
  current_cost_inr: number;
  target_cost_inr: number;
  cost_diff_inr: number;
  savings_pct: number;
  current_carbon_gco2: number;
  target_carbon_gco2: number;
  carbon_diff_gco2: number;
  carbon_reduction_pct: number;
  delay_hours: number;
  annual_projected_savings_inr: number;
  annual_co2_avoided_kg: number;
  executive_verdict: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  service: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  financial_saving_monthly_inr: number;
  carbon_reduction_pct: number;
  confidence: number;
  reason: string;
  action_text: string;
  status: 'Open' | 'Applied' | 'Dismissed';
  created_at: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  service: string;
  provider: string;
  region: string;
  environment: string;
  status: string;
  hourly_cost_inr: number;
  daily_cost_inr: number;
  utilization_percent: number;
  carbon_rating: string;
  risk_level: string;
  instance_type?: string;
  tags: Record<string, any>;
}

export interface SystemEventItem {
  id: number;
  timestamp: string;
  event_type: 'BILLING_EVENT' | 'USAGE_EVENT' | 'ANOMALY_DETECTED' | 'AI_ANALYSIS' | 'SCHEDULER_DECISION' | 'RECOMMENDATION' | 'SCENARIO_TRIGGERED';
  service?: string;
  resource_id?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  message: string;
  metadata_json: Record<string, any>;
}

export interface FinOpsReportItem {
  id: string;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  total_spend_inr: number;
  total_carbon_kg: number;
  identified_savings_inr: number;
  anomaly_count: number;
  executive_summary: string;
  raw_data_summary: Record<string, any>;
}
