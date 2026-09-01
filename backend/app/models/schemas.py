from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Dashboard & Summary Schemas ---
class SummaryKPIs(BaseModel):
    current_spend_inr: float
    current_spend_usd: float
    spend_trend_pct: float
    projected_monthly_cost_inr: float
    projected_monthly_cost_usd: float
    detected_anomalies_total: int
    detected_anomalies_critical: int
    carbon_footprint_tco2: float
    potential_savings_inr: float
    potential_savings_usd: float
    carbon_reduction_pct: float
    last_updated: datetime

class DashboardResponse(BaseModel):
    kpis: SummaryKPIs
    top_anomalies: List[Dict[str, Any]]
    recent_events: List[Dict[str, Any]]
    regional_carbon_summary: List[Dict[str, Any]]
    quick_savings_opportunities: List[Dict[str, Any]]

# --- Cost Schemas ---
class CostTimeseriesPoint(BaseModel):
    timestamp: str
    actual_cost_inr: float
    projected_cost_inr: float
    carbon_kg: float

class ServiceCostBreakdown(BaseModel):
    service: str
    cost_inr: float
    cost_pct: float
    carbon_kg: float
    trend_pct: float

class EnvironmentCostBreakdown(BaseModel):
    environment: str
    cost_inr: float
    cost_pct: float

class RegionCostBreakdown(BaseModel):
    region: str
    region_name: str
    cost_inr: float
    carbon_intensity_gco2_kwh: float

class CostAnalyticsResponse(BaseModel):
    timeseries: List[CostTimeseriesPoint]
    by_service: List[ServiceCostBreakdown]
    by_environment: List[EnvironmentCostBreakdown]
    by_region: List[RegionCostBreakdown]
    total_cost_inr: float
    period_days: int

# --- Anomaly Schemas ---
class AnomalyBase(BaseModel):
    id: str
    title: str
    service: str
    environment: str
    region: str
    severity: str
    detected_at: datetime
    anomaly_score: float
    cost_increase_pct: float
    baseline_cost_inr: float
    current_cost_inr: float
    potential_impact_inr: float
    probable_cause: str
    ai_confidence: float
    status: str
    telemetry_data: Dict[str, Any]

class AnomalyResponse(AnomalyBase):
    has_ai_analysis: bool

# --- AI Investigation Schemas ---
class AIInvestigationRequest(BaseModel):
    anomaly_id: str
    user_notes: Optional[str] = None
    force_refresh: Optional[bool] = False

class AIInvestigationResponse(BaseModel):
    anomaly_id: str
    service: str
    generated_at: datetime
    provider_used: str
    summary: str
    probable_causes: List[str]
    evidence: Dict[str, Any]
    confidence_score: float
    business_impact: str
    estimated_financial_loss_inr: float
    recommended_actions: List[str]
    remediation_code: Optional[str] = None

# --- Carbon Schemas ---
class CarbonGridReading(BaseModel):
    region_code: str
    region_name: str
    carbon_intensity_gco2_kwh: float
    renewable_pct: float
    grid_source: str
    is_simulated: bool
    status: str # "Optimal", "Moderate", "High Carbon"

class CarbonTimelinePoint(BaseModel):
    hour: int
    time_label: str
    intensity_gco2_kwh: float
    cost_multiplier: float
    renewable_pct: float

class CarbonIntelligenceResponse(BaseModel):
    current_grid: List[CarbonGridReading]
    regional_comparison: List[CarbonGridReading]
    today_workload_cost_inr: float
    today_emissions_kg: float
    optimization_potential_carbon_pct: float
    optimization_potential_cost_pct: float
    diurnal_curve: List[CarbonTimelinePoint]

# --- Scheduler Schemas ---
class JobScheduleRequest(BaseModel):
    job_name: str
    job_type: str = "Batch Analytics" # "AI Training", "Data Pipeline", "Batch Analytics", "Database Backup"
    duration_hours: float = 2.0
    compute_units: float = 16.0 # GPU / vCPU count
    current_schedule_hour: int = 15 # 3:00 PM
    deadline_hour: int = 8 # Next morning 8:00 AM
    preferred_region: str = "ap-south-1"
    optimization_goal: str = "Balanced" # "Lowest Cost", "Lowest Carbon", "Balanced"

class ScheduleWindowResult(BaseModel):
    hour: int
    time_label: str
    estimated_cost_inr: float
    estimated_carbon_gco2: float
    combined_score: float
    is_recommended: bool
    is_current: bool
    feasibility: str

class JobScheduleResponse(BaseModel):
    job_id: str
    job_name: str
    job_type: str
    current_time_label: str
    current_cost_inr: float
    current_carbon_gco2: float
    recommended_time_label: str
    recommended_cost_inr: float
    recommended_carbon_gco2: float
    savings_inr: float
    savings_pct: float
    carbon_reduction_pct: float
    optimization_summary: str
    all_windows: List[ScheduleWindowResult]

# --- What-If Simulator Schemas ---
class WhatIfRequest(BaseModel):
    workload_type: str = "AI Training (SageMaker / H100)"
    current_hour: int = 15 # 3:00 PM
    target_hour: int = 3   # 3:00 AM
    duration_hours: float = 4.0
    compute_units: float = 8.0
    region: str = "ap-south-1"

class WhatIfResponse(BaseModel):
    current_hour_label: str
    target_hour_label: str
    current_cost_inr: float
    target_cost_inr: float
    cost_diff_inr: float
    savings_pct: float
    current_carbon_gco2: float
    target_carbon_gco2: float
    carbon_diff_gco2: float
    carbon_reduction_pct: float
    delay_hours: float
    annual_projected_savings_inr: float
    annual_co2_avoided_kg: float
    executive_verdict: str

# --- Recommendations Schemas ---
class RecommendationResponse(BaseModel):
    id: str
    title: str
    service: str
    category: str
    priority: str
    financial_saving_monthly_inr: float
    carbon_reduction_pct: float
    confidence: float
    reason: str
    action_text: str
    status: str
    created_at: datetime

# --- Resource Schemas ---
class ResourceItem(BaseModel):
    id: str
    name: str
    service: str
    provider: str
    region: str
    environment: str
    status: str
    hourly_cost_inr: float
    daily_cost_inr: float
    utilization_percent: float
    carbon_rating: str
    risk_level: str
    instance_type: Optional[str] = None
    tags: Dict[str, Any]

# --- Event Stream Schemas ---
class SystemEventItem(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    service: Optional[str]
    resource_id: Optional[str]
    severity: str
    message: str
    metadata_json: Dict[str, Any]

# --- Reports Schemas ---
class ReportGenerateRequest(BaseModel):
    report_type: str = "Monthly FinOps" # "Weekly Cost", "Monthly FinOps", "Carbon Impact", "Anomaly Report", "Optimization Report"
    date_range_days: int = 30

class FinOpsReportResponse(BaseModel):
    id: str
    title: str
    report_type: str
    period_start: datetime
    period_end: datetime
    generated_at: datetime
    total_spend_inr: float
    total_carbon_kg: float
    identified_savings_inr: float
    anomaly_count: int
    executive_summary: str
    raw_data_summary: Dict[str, Any]

# --- Simulation & Settings Schemas ---
class DemoScenarioRequest(BaseModel):
    scenario_id: str # "runaway_autoscaling", "retry_loop", "idle_gpu", "carbon_batch", "multiregion"

class SettingsUpdateRequest(BaseModel):
    llm_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    carbon_provider: Optional[str] = None
    carbon_api_key: Optional[str] = None
    simulation_mode: Optional[bool] = None
    default_currency: Optional[str] = None
