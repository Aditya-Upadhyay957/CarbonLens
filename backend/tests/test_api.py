import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.services.simulation_engine import simulation_engine
from app.services.anomaly_detector import anomaly_detector
from app.services.scheduler_engine import scheduler_engine

class TestCarbonLensBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        simulation_engine.seed_initial_database(db)
        db.close()
        cls.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "operational")
        self.assertEqual(data["app"], "CarbonLens")

    def test_dashboard_summary(self):
        response = self.client.get("/api/dashboard/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("kpis", data)
        self.assertGreater(data["kpis"]["current_spend_inr"], 0)
        self.assertIn("top_anomalies", data)
        self.assertIn("recent_events", data)

    def test_cost_timeseries_and_breakdown(self):
        res_ts = self.client.get("/api/cost/timeseries?days=30")
        self.assertEqual(res_ts.status_code, 200)
        self.assertIn("timeseries", res_ts.json())

        res_bd = self.client.get("/api/cost/breakdown?days=30")
        self.assertEqual(res_bd.status_code, 200)
        self.assertIn("by_service", res_bd.json())
        self.assertIn("by_environment", res_bd.json())

    def test_ml_anomaly_detector(self):
        is_anom, score, severity, pct = anomaly_detector.evaluate_telemetry(
            current_cost=16130.0,
            baseline_cost=4200.0,
            cpu_usage=72.0,
            request_count=48000,
            instance_count=31,
            error_rate=6.5,
            retry_rate=22.0
        )
        self.assertTrue(is_anom)
        self.assertGreaterEqual(score, 0.7)
        self.assertIn(severity, ["CRITICAL", "HIGH"])

    def test_anomalies_and_ai_explain(self):
        res = self.client.get("/api/anomalies")
        self.assertEqual(res.status_code, 200)
        anomalies = res.json()
        self.assertGreater(len(anomalies), 0)

        # Explain the first anomaly
        first_id = anomalies[0]["id"]
        explain_res = self.client.post(f"/api/anomalies/{first_id}/explain")
        self.assertEqual(explain_res.status_code, 200)
        ai_data = explain_res.json()
        self.assertIn("summary", ai_data)
        self.assertIn("probable_causes", ai_data)
        self.assertIn("recommended_actions", ai_data)
        self.assertGreater(ai_data["confidence_score"], 50)

    def test_carbon_and_smart_scheduler(self):
        res_carbon = self.client.get("/api/carbon/summary?region=ap-south-1")
        self.assertEqual(res_carbon.status_code, 200)
        self.assertIn("regional_comparison", res_carbon.json())
        self.assertIn("diurnal_curve", res_carbon.json())

        # Test Smart Scheduler
        opt_payload = {
            "job_name": "Distributed Fine-Tuning",
            "job_type": "AI Training",
            "duration_hours": 3.0,
            "compute_units": 8.0,
            "current_schedule_hour": 15,
            "deadline_hour": 8,
            "preferred_region": "ap-south-1",
            "optimization_goal": "Balanced"
        }
        res_opt = self.client.post("/api/scheduler/optimize", json=opt_payload)
        self.assertEqual(res_opt.status_code, 200)
        opt_data = res_opt.json()
        self.assertGreater(opt_data["savings_inr"], 0)
        self.assertGreater(opt_data["carbon_reduction_pct"], 0)
        self.assertIn("all_windows", opt_data)

    def test_what_if_simulator(self):
        what_if_payload = {
            "workload_type": "AI Training",
            "current_hour": 15,
            "target_hour": 3,
            "duration_hours": 4.0,
            "compute_units": 8.0,
            "region": "ap-south-1"
        }
        res = self.client.post("/api/scheduler/what-if", json=what_if_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("cost_diff_inr", data)
        self.assertIn("carbon_diff_gco2", data)
        self.assertIn("executive_verdict", data)

    def test_simulation_cost_spike_and_scenarios(self):
        res_spike = self.client.post("/api/simulation/cost-spike?service=EC2")
        self.assertEqual(res_spike.status_code, 200)
        spike_data = res_spike.json()
        self.assertIn("anomaly_id", spike_data)

        res_scenario = self.client.post("/api/simulation/trigger-scenario", json={"scenario_id": "idle_gpu"})
        self.assertEqual(res_scenario.status_code, 200)

    def test_reports_and_csv_export(self):
        res_rep = self.client.post("/api/reports/generate", json={"report_type": "Weekly Cost", "date_range_days": 7})
        self.assertEqual(res_rep.status_code, 200)
        self.assertIn("executive_summary", res_rep.json())

        res_csv = self.client.get("/api/reports/export/csv?entity=billing")
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("Cost (INR)", res_csv.text)

if __name__ == "__main__":
    unittest.main()
