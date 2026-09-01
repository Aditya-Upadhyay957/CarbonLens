from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(String, primary_key=True, index=True) # e.g. "i-02831ae9f01"
    name = Column(String, index=True)
    service = Column(String, index=True) # "EC2", "Lambda", "S3", "RDS", "EKS", "SageMaker", "CloudFront"
    provider = Column(String, default="AWS")
    region = Column(String, default="ap-south-1")
    environment = Column(String, default="Production") # "Production", "Staging", "Development"
    status = Column(String, default="Running") # "Running", "Idle", "Stopped", "High Utilization"
    hourly_cost_inr = Column(Float, default=0.0)
    daily_cost_inr = Column(Float, default=0.0)
    utilization_percent = Column(Float, default=0.0)
    carbon_rating = Column(String, default="Medium") # "Low", "Medium", "High", "Critical"
    risk_level = Column(String, default="Normal") # "Normal", "Warning", "Critical"
    instance_type = Column(String, nullable=True)
    tags = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resource_id = Column(String, index=True)
    service = Column(String, index=True)
    metric_name = Column(String) # "cpu_utilization", "request_count", "memory_usage", "iops", "bytes_transferred"
    metric_value = Column(Float)
    unit = Column(String)
    region = Column(String, default="ap-south-1")
    environment = Column(String, default="Production")

class BillingEvent(Base):
    __tablename__ = "billing_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    service = Column(String, index=True)
    region = Column(String, default="ap-south-1")
    environment = Column(String, default="Production")
    cost_inr = Column(Float)
    projected_cost_inr = Column(Float, nullable=True)
    usage_amount = Column(Float)
    usage_unit = Column(String)
    estimated_emissions_kg = Column(Float, default=0.0)

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String, primary_key=True, index=True) # e.g. "ANOM-8921"
    title = Column(String)
    service = Column(String, index=True)
    environment = Column(String, default="Production")
    region = Column(String, default="ap-south-1")
    severity = Column(String, default="HIGH") # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    detected_at = Column(DateTime, default=datetime.utcnow)
    anomaly_score = Column(Float) # 0.0 to 1.0 (ML output)
    cost_increase_pct = Column(Float) # e.g. 284.0
    baseline_cost_inr = Column(Float) # e.g. 4200.0
    current_cost_inr = Column(Float) # e.g. 16130.0
    potential_impact_inr = Column(Float) # e.g. 11930.0
    probable_cause = Column(String) # Short text e.g. "Runaway autoscaling"
    ai_confidence = Column(Float, default=85.0) # 0 to 100
    status = Column(String, default="Active") # "Active", "Investigating", "Resolved", "Ignored"
    telemetry_data = Column(JSON, default=dict) # CPU, instance count, retry rate, request count etc.
    
    analysis = relationship("AIAnalysis", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    anomaly_id = Column(String, ForeignKey("anomalies.id"), unique=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    provider_used = Column(String, default="Deterministic FinOps LLM")
    
    summary = Column(Text)
    probable_causes = Column(JSON) # List of string causes
    evidence = Column(JSON) # Structured evidence metrics
    confidence_score = Column(Float)
    business_impact = Column(Text)
    estimated_financial_loss = Column(Float)
    recommended_actions = Column(JSON) # List of step-by-step action strings
    remediation_code = Column(Text, nullable=True)
    
    anomaly = relationship("Anomaly", back_populates="analysis")

class CarbonReading(Base):
    __tablename__ = "carbon_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    region_code = Column(String, index=True) # "ap-south-1", "ap-south-2", "ap-southeast-1", "eu-central-1", "us-east-1"
    region_name = Column(String) # "Mumbai, India", "Singapore", etc.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    carbon_intensity_gco2_kwh = Column(Float) # Grid intensity in gCO2/kWh
    renewable_pct = Column(Float) # % clean power in grid
    grid_source = Column(String) # e.g. "Solar Peak", "Coal Dominant", "Hydro/Wind"
    is_simulated = Column(Boolean, default=True)

class ScheduledJob(Base):
    __tablename__ = "scheduled_jobs"

    id = Column(String, primary_key=True, index=True) # "JOB-1049"
    name = Column(String)
    job_type = Column(String) # "AI Training", "Data Pipeline", "Batch Analytics", "Database Backup"
    duration_hours = Column(Float)
    compute_units = Column(Float) # GPU hours / vCPU hours
    current_schedule_hour = Column(Integer) # 0 to 23
    recommended_schedule_hour = Column(Integer)
    deadline_hour = Column(Integer)
    preferred_region = Column(String, default="ap-south-1")
    optimization_goal = Column(String, default="Balanced") # "Lowest Cost", "Lowest Carbon", "Balanced"
    
    current_cost_inr = Column(Float)
    recommended_cost_inr = Column(Float)
    cost_savings_inr = Column(Float)
    cost_savings_pct = Column(Float)
    
    current_carbon_gco2 = Column(Float)
    recommended_carbon_gco2 = Column(Float)
    carbon_reduction_pct = Column(Float)
    
    status = Column(String, default="Optimized") # "Scheduled", "Optimized", "Running", "Completed"
    schedule_matrix = Column(JSON, default=list) # 24-hour cost & carbon comparison points
    created_at = Column(DateTime, default=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True) # "REC-301"
    title = Column(String)
    service = Column(String)
    category = Column(String) # "Cost Optimization", "Carbon Reduction", "Rightsizing", "Scheduling", "Architectural"
    priority = Column(String, default="HIGH") # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    financial_saving_monthly_inr = Column(Float)
    carbon_reduction_pct = Column(Float)
    confidence = Column(Float, default=90.0)
    reason = Column(Text)
    action_text = Column(Text)
    status = Column(String, default="Open") # "Open", "Applied", "Dismissed"
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String, index=True) # "BILLING_EVENT", "USAGE_EVENT", "ANOMALY_DETECTED", "AI_ANALYSIS", "SCHEDULER_DECISION", "RECOMMENDATION", "SCENARIO_TRIGGERED"
    service = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    severity = Column(String, default="INFO") # "INFO", "WARNING", "CRITICAL", "SUCCESS"
    message = Column(Text)
    metadata_json = Column(JSON, default=dict)

class FinOpsReport(Base):
    __tablename__ = "finops_reports"

    id = Column(String, primary_key=True, index=True) # "RPT-2026-001"
    title = Column(String)
    report_type = Column(String) # "Weekly Cost", "Monthly FinOps", "Carbon Impact", "Anomaly Report", "Optimization Report"
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    generated_at = Column(DateTime, default=datetime.utcnow)
    total_spend_inr = Column(Float)
    total_carbon_kg = Column(Float)
    identified_savings_inr = Column(Float)
    anomaly_count = Column(Integer)
    executive_summary = Column(Text)
    raw_data_summary = Column(JSON, default=dict)
