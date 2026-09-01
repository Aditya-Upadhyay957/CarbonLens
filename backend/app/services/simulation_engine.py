import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.entities import (
    CloudResource, UsageEvent, BillingEvent, Anomaly, AIAnalysis,
    CarbonReading, ScheduledJob, Recommendation, SystemEvent, FinOpsReport
)
from app.services.anomaly_detector import anomaly_detector
from app.providers.carbon_provider import carbon_provider

class SimulationEngine:
    """
    Generates high-fidelity cloud billing, telemetry, and anomaly data.
    Provides 5 specialized live demo scenarios for hackathon presentations.
    """

    def seed_initial_database(self, db: Session):
        """
        Seeds rich, believable cloud infrastructure data if database is empty.
        """
        if db.query(CloudResource).count() > 0:
            return

        now = datetime.utcnow()

        # 1. Cloud Resources
        resources = [
            CloudResource(
                id="i-02831ae9f01", name="prod-api-cluster-node-01", service="EC2",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=84.0, daily_cost_inr=2016.0, utilization_percent=82.4,
                carbon_rating="Medium", risk_level="Normal", instance_type="c6i.4xlarge",
                tags={"Squad": "Core Platform", "Workload": "API Gateway"}
            ),
            CloudResource(
                id="i-09124be3f88", name="prod-worker-asg-node-07", service="EC2",
                provider="AWS", region="ap-south-1", environment="Production", status="High Utilization",
                hourly_cost_inr=168.0, daily_cost_inr=4032.0, utilization_percent=94.1,
                carbon_rating="High", risk_level="Warning", instance_type="c6i.8xlarge",
                tags={"Squad": "Payments", "AutoScaling": "prod-worker-asg"}
            ),
            CloudResource(
                id="sagemaker-ep-h100-01", name="llm-rag-embedding-inference", service="SageMaker",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=540.0, daily_cost_inr=12960.0, utilization_percent=68.5,
                carbon_rating="High", risk_level="Normal", instance_type="ml.g5.12xlarge",
                tags={"Squad": "AI/ML", "Model": "BGE-Large-En"}
            ),
            CloudResource(
                id="sagemaker-tr-p4de-idle", name="distributed-finetune-nlp-run", service="SageMaker",
                provider="AWS", region="ap-south-1", environment="Staging", status="Idle",
                hourly_cost_inr=840.0, daily_cost_inr=20160.0, utilization_percent=1.2,
                carbon_rating="Critical", risk_level="Critical", instance_type="ml.p4de.24xlarge",
                tags={"Squad": "Research", "IdleHours": "14"}
            ),
            CloudResource(
                id="db-aurora-prod-writer", name="prod-aurora-postgresql-main", service="RDS",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=210.0, daily_cost_inr=5040.0, utilization_percent=76.0,
                carbon_rating="Medium", risk_level="Normal", instance_type="db.r6g.4xlarge",
                tags={"Engine": "PostgreSQL 15", "MultiAZ": "True"}
            ),
            CloudResource(
                id="eks-cluster-core-prod", name="prod-finops-eks-cluster", service="EKS",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=320.0, daily_cost_inr=7680.0, utilization_percent=71.3,
                carbon_rating="Medium", risk_level="Normal", instance_type="m6i.4xlarge",
                tags={"Kubernetes": "v1.29", "Nodes": "18"}
            ),
            CloudResource(
                id="s3-bucket-artifacts-prod", name="carbonlens-telemetry-archive-prod", service="S3",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=38.0, daily_cost_inr=912.0, utilization_percent=45.0,
                carbon_rating="Low", risk_level="Normal", instance_type="Standard Storage (42 TB)",
                tags={"Compliance": "GDPR", "Tier": "Standard"}
            ),
            CloudResource(
                id="lambda-stream-ingest", name="prod-event-stream-transformer", service="Lambda",
                provider="AWS", region="ap-south-1", environment="Production", status="Running",
                hourly_cost_inr=42.0, daily_cost_inr=1008.0, utilization_percent=88.0,
                carbon_rating="Low", risk_level="Normal", instance_type="Serverless (2048MB)",
                tags={"Runtime": "Python 3.11", "Concurrencies": "120"}
            ),
            CloudResource(
                id="cf-dist-prod-edge", name="carbonlens-global-cdn", service="CloudFront",
                provider="AWS", region="global", environment="Production", status="Running",
                hourly_cost_inr=28.0, daily_cost_inr=672.0, utilization_percent=60.0,
                carbon_rating="Low", risk_level="Normal", instance_type="Edge Distribution",
                tags={"PointsOfPresence": "450+"}
            )
        ]
        for r in resources:
            db.add(r)

        # 2. Historical Billing Events (past 30 days)
        base_daily_spend = 28100.0 # ~₹8.4 Lakhs / month
        services_weights = {
            "EC2": 0.38,
            "SageMaker": 0.24,
            "RDS": 0.16,
            "EKS": 0.12,
            "S3": 0.06,
            "Lambda": 0.03,
            "CloudFront": 0.01
        }
        for d in range(30, -1, -1):
            day_time = now - timedelta(days=d)
            # Add weekend dampening
            is_weekend = day_time.weekday() >= 5
            day_multiplier = 0.82 if is_weekend else 1.05
            day_noise = random.uniform(0.95, 1.05)
            
            day_total = base_daily_spend * day_multiplier * day_noise
            
            for svc, weight in services_weights.items():
                svc_cost = day_total * weight
                emissions = svc_cost * 0.0062 # ~6.2g CO2 per Rupee of cloud spend
                be = BillingEvent(
                    timestamp=day_time,
                    service=svc,
                    region="ap-south-1",
                    environment="Production" if svc != "SageMaker" else random.choice(["Production", "Staging"]),
                    cost_inr=round(svc_cost, 2),
                    projected_cost_inr=round(svc_cost * 1.08, 2),
                    usage_amount=round(svc_cost / 15.0, 1),
                    usage_unit="Compute-Hours",
                    estimated_emissions_kg=round(emissions, 2)
                )
                db.add(be)

        # 3. Active Initial Anomalies
        anomalies = [
            Anomaly(
                id="ANOM-2841",
                title="EC2 Runaway Autoscaling & Spend Surge",
                service="EC2",
                environment="Production",
                region="ap-south-1",
                severity="CRITICAL",
                detected_at=now - timedelta(minutes=45),
                anomaly_score=0.912,
                cost_increase_pct=284.0,
                baseline_cost_inr=4200.0,
                current_cost_inr=16130.0,
                potential_impact_inr=11930.0,
                probable_cause="Runaway autoscaling triggered by unthrottled upstream retry storm",
                ai_confidence=87.5,
                status="Active",
                telemetry_data={
                    "cpu_usage": 72.4,
                    "instance_count": 31,
                    "previous_instance_count": 8,
                    "request_count": 48200,
                    "retry_rate": 22.4,
                    "error_rate": 6.8,
                    "asg_name": "prod-payments-asg"
                }
            ),
            Anomaly(
                id="ANOM-2842",
                title="Idle SageMaker GPU Cluster Post-Training",
                service="SageMaker",
                environment="Staging",
                region="ap-south-1",
                severity="HIGH",
                detected_at=now - timedelta(hours=3, minutes=15),
                anomaly_score=0.785,
                cost_increase_pct=145.0,
                baseline_cost_inr=2400.0,
                current_cost_inr=5880.0,
                potential_impact_inr=3480.0,
                probable_cause="ml.p4de.24xlarge training cluster left running without active jobs",
                ai_confidence=94.0,
                status="Active",
                telemetry_data={
                    "cpu_usage": 1.2,
                    "gpu_utilization_pct": 0.0,
                    "instance_count": 2,
                    "idle_duration_hours": 14.5,
                    "cluster_name": "nlp-distributed-train-h100"
                }
            ),
            Anomaly(
                id="ANOM-2843",
                title="RDS Read Replica IOPS Thrashing",
                service="RDS",
                environment="Production",
                region="ap-south-1",
                severity="MEDIUM",
                detected_at=now - timedelta(hours=7),
                anomaly_score=0.580,
                cost_increase_pct=64.0,
                baseline_cost_inr=3100.0,
                current_cost_inr=5084.0,
                potential_impact_inr=1984.0,
                probable_cause="Unindexed query join triggering automated IOPS auto-scaling",
                ai_confidence=82.0,
                status="Active",
                telemetry_data={
                    "cpu_usage": 88.0,
                    "iops_count": 14200,
                    "db_instance": "prod-aurora-writer",
                    "slow_queries_count": 340
                }
            )
        ]
        for a in anomalies:
            db.add(a)

        # 4. System Events
        events = [
            SystemEvent(
                timestamp=now - timedelta(minutes=46),
                event_type="USAGE_EVENT",
                service="EC2",
                resource_id="prod-payments-asg",
                severity="INFO",
                message="EC2 Auto Scaling Group scaled out from 8 to 31 instances in response to target tracking metric.",
                metadata_json={"instance_count": 31}
            ),
            SystemEvent(
                timestamp=now - timedelta(minutes=45),
                event_type="ANOMALY_DETECTED",
                service="EC2",
                resource_id="ANOM-2841",
                severity="CRITICAL",
                message="ML Anomaly Detector flagged critical spend spike (+284%) in EC2 Production.",
                metadata_json={"anomaly_score": 0.912, "severity": "CRITICAL"}
            ),
            SystemEvent(
                timestamp=now - timedelta(minutes=44),
                event_type="AI_ANALYSIS",
                service="EC2",
                resource_id="ANOM-2841",
                severity="INFO",
                message="AI Cost Investigator formulated root-cause hypothesis: 'Runaway autoscaling triggered by upstream retry storm'.",
                metadata_json={"confidence": 87.5}
            ),
            SystemEvent(
                timestamp=now - timedelta(minutes=40),
                event_type="RECOMMENDATION",
                service="EC2",
                resource_id="REC-801",
                severity="WARNING",
                message="Generated actionable guardrail: 'Enforce ASG MaxSize cap of 14 instances'.",
                metadata_json={"monthly_savings_inr": 32400.0}
            )
        ]
        for ev in events:
            db.add(ev)

        # 5. Scheduled Jobs
        job = ScheduledJob(
            id="JOB-1049",
            name="Daily Customer Sentiment RAG Vector Indexing",
            job_type="Batch Analytics",
            duration_hours=2.5,
            compute_units=16.0,
            current_schedule_hour=15, # 3:00 PM
            recommended_schedule_hour=3, # 3:00 AM
            deadline_hour=8,
            preferred_region="ap-south-1",
            optimization_goal="Balanced",
            current_cost_inr=1840.0,
            recommended_cost_inr=1520.0,
            cost_savings_inr=320.0,
            cost_savings_pct=17.4,
            current_carbon_gco2=420.0,
            recommended_carbon_gco2=310.0,
            carbon_reduction_pct=26.2,
            status="Optimized"
        )
        db.add(job)

        db.commit()

    def simulate_cost_spike_event(self, db: Session, service: str = "EC2") -> Dict[str, Any]:
        """
        Executes live simulation sequence when 'Simulate Cost Spike' is triggered.
        """
        now = datetime.utcnow()
        anomaly_id = f"ANOM-{random.randint(3000, 9999)}"
        
        # Determine randomized spike magnitude
        cost_multiplier = random.uniform(2.8, 3.9)
        baseline = 4200.0
        current = round(baseline * cost_multiplier, 2)
        impact = round(current - baseline, 2)
        pct_inc = round(((current - baseline) / baseline) * 100.0, 1)

        instance_count = random.randint(28, 42)
        cpu = random.uniform(68.0, 84.0)
        retry_rate = random.uniform(18.0, 26.0)

        # ML Anomaly calculation
        is_anom, score, severity, _ = anomaly_detector.evaluate_telemetry(
            current_cost=current,
            baseline_cost=baseline,
            cpu_usage=cpu,
            request_count=52000,
            instance_count=instance_count,
            error_rate=6.2,
            retry_rate=retry_rate
        )

        anomaly = Anomaly(
            id=anomaly_id,
            title=f"{service} Instant Spend Surge (+{pct_inc:.0f}%)",
            service=service,
            environment="Production",
            region="ap-south-1",
            severity=severity,
            detected_at=now,
            anomaly_score=score,
            cost_increase_pct=pct_inc,
            baseline_cost_inr=baseline,
            current_cost_inr=current,
            potential_impact_inr=impact,
            probable_cause="Runaway autoscaling due to synthetic retry loop escalation",
            ai_confidence=89.0,
            status="Active",
            telemetry_data={
                "cpu_usage": round(cpu, 1),
                "instance_count": instance_count,
                "previous_instance_count": 8,
                "request_count": 52000,
                "retry_rate": round(retry_rate, 1),
                "error_rate": 6.2,
                "surge_timestamp": now.isoformat()
            }
        )
        db.add(anomaly)

        # Live Event Pipeline Sequence
        ev1 = SystemEvent(
            timestamp=now - timedelta(seconds=6),
            event_type="USAGE_EVENT",
            service=service,
            resource_id="prod-app-asg",
            severity="WARNING",
            message=f"{service} node instances expanded rapidly from 8 to {instance_count} units.",
            metadata_json={"instances": instance_count}
        )
        ev2 = SystemEvent(
            timestamp=now - timedelta(seconds=4),
            event_type="ANOMALY_DETECTED",
            service=service,
            resource_id=anomaly_id,
            severity=severity,
            message=f"Isolation Forest detector triggered: Composite anomaly score {score:.3f} ({severity}).",
            metadata_json={"score": score, "cost_increase_pct": pct_inc}
        )
        ev3 = SystemEvent(
            timestamp=now - timedelta(seconds=2),
            event_type="AI_ANALYSIS",
            service=service,
            resource_id=anomaly_id,
            severity="INFO",
            message="AI Root-Cause Investigator initiated telemetry correlation across trace logs.",
            metadata_json={"service": service}
        )
        ev4 = SystemEvent(
            timestamp=now,
            event_type="RECOMMENDATION",
            service=service,
            resource_id="REC-801",
            severity="WARNING",
            message=f"Actionable guardrail ready: Capping ASG to 14 nodes will save ₹{impact:,.2f}/day.",
            metadata_json={"impact_inr": impact}
        )
        db.add_all([ev1, ev2, ev3, ev4])
        db.commit()
        db.refresh(anomaly)

        return {
            "anomaly_id": anomaly.id,
            "severity": anomaly.severity,
            "cost_increase_pct": anomaly.cost_increase_pct,
            "current_cost_inr": anomaly.current_cost_inr,
            "potential_impact_inr": anomaly.potential_impact_inr,
            "message": f"Simulated {service} cost spike successfully generated and processed by ML pipeline."
        }

    def trigger_scenario(self, db: Session, scenario_id: str) -> Dict[str, Any]:
        """
        Executes one of the 5 dedicated hackathon demo scenarios.
        """
        now = datetime.utcnow()

        if scenario_id == "runaway_autoscaling":
            return self.simulate_cost_spike_event(db, service="EC2")

        elif scenario_id == "retry_loop":
            anom_id = f"ANOM-{random.randint(4000, 9999)}"
            anom = Anomaly(
                id=anom_id,
                title="Lambda Recursive Invocation Loop & SQS Flood",
                service="Lambda",
                environment="Production",
                region="ap-south-1",
                severity="CRITICAL",
                detected_at=now,
                anomaly_score=0.945,
                cost_increase_pct=412.0,
                baseline_cost_inr=800.0,
                current_cost_inr=4096.0,
                potential_impact_inr=3296.0,
                probable_cause="Recursive S3-to-Lambda invocation without prefix filtering",
                ai_confidence=96.0,
                status="Active",
                telemetry_data={
                    "invocations_per_min": 142000,
                    "concurrency_limit_hit": True,
                    "sqs_queue_depth": 850000,
                    "error_rate": 18.4,
                    "retry_rate": 34.2
                }
            )
            db.add(anom)
            db.add(SystemEvent(
                timestamp=now, event_type="ANOMALY_DETECTED", service="Lambda",
                resource_id=anom_id, severity="CRITICAL",
                message="Critical serverless invocation recursion detected (142k invocations/min).",
                metadata_json={"concurrency": "Saturated"}
            ))
            db.commit()
            return {"scenario": "Retry Loop Cost Spike", "anomaly_id": anom_id, "status": "Triggered"}

        elif scenario_id == "idle_gpu":
            anom_id = f"ANOM-{random.randint(4000, 9999)}"
            anom = Anomaly(
                id=anom_id,
                title="Idle High-Performance GPU Cluster (ml.p4de.24xlarge)",
                service="SageMaker",
                environment="Staging",
                region="ap-south-1",
                severity="HIGH",
                detected_at=now,
                anomaly_score=0.820,
                cost_increase_pct=180.0,
                baseline_cost_inr=2400.0,
                current_cost_inr=6720.0,
                potential_impact_inr=4320.0,
                probable_cause="H100 8-GPU node unutilized for 16 consecutive hours",
                ai_confidence=97.0,
                status="Active",
                telemetry_data={
                    "gpu_utilization_pct": 0.1,
                    "memory_used_gb": 4.2,
                    "memory_total_gb": 640.0,
                    "hourly_burn_rate_inr": 840.0
                }
            )
            db.add(anom)
            db.add(SystemEvent(
                timestamp=now, event_type="ANOMALY_DETECTED", service="SageMaker",
                resource_id=anom_id, severity="HIGH",
                message="SageMaker GPU cluster idle burn rate alert triggered (₹840/hr).",
                metadata_json={"gpu_util": "0.1%"}
            ))
            db.commit()
            return {"scenario": "Idle GPU Resource", "anomaly_id": anom_id, "status": "Triggered"}

        elif scenario_id == "carbon_batch":
            # Add or update job recommendation
            job_id = "JOB-BATCH-DEMO"
            db.add(SystemEvent(
                timestamp=now, event_type="SCHEDULER_DECISION", service="SageMaker",
                resource_id=job_id, severity="SUCCESS",
                message="Smart Scheduler computed optimal window at 03:00 AM: 26.2% carbon reduction + ₹320 savings.",
                metadata_json={"carbon_reduction": "26.2%", "savings_inr": 320.0}
            ))
            db.commit()
            return {"scenario": "Carbon-Aware Batch Optimization", "job_id": job_id, "status": "Triggered"}

        elif scenario_id == "multiregion":
            db.add(SystemEvent(
                timestamp=now, event_type="RECOMMENDATION", service="Global",
                resource_id="REC-MULTIREG", severity="INFO",
                message="Multi-region audit: Frankfurt (eu-central-1) and N. Virginia (us-east-1) provide 42% lower carbon intensity for non-latency sensitive workloads.",
                metadata_json={"cleanest_region": "eu-central-1"}
            ))
            db.commit()
            return {"scenario": "Multi-Region Cost Comparison", "status": "Triggered"}

        return {"error": f"Unknown scenario_id: {scenario_id}"}

simulation_engine = SimulationEngine()
