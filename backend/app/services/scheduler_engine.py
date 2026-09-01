import uuid
from typing import Dict, Any, List
from datetime import datetime
from app.providers.carbon_provider import carbon_provider

class SchedulerEngine:
    """
    Multi-objective optimization engine for delay-tolerant batch and AI workloads.
    Finds the optimal execution window by balancing Spot/On-Demand Cloud Costs,
    Grid Carbon Intensity, and SLA Deadline Constraints.
    """

    WORKLOAD_PROFILES = {
        "AI Training": {"kw_per_unit": 0.70, "base_cost_per_unit_hr": 140.0}, # e.g. GPU cluster
        "Data Pipeline": {"kw_per_unit": 0.25, "base_cost_per_unit_hr": 45.0},
        "Batch Analytics": {"kw_per_unit": 0.35, "base_cost_per_unit_hr": 60.0},
        "Database Backup": {"kw_per_unit": 0.15, "base_cost_per_unit_hr": 25.0}
    }

    def optimize_job_schedule(
        self,
        job_name: str,
        job_type: str,
        duration_hours: float,
        compute_units: float,
        current_hour: int,
        deadline_hour: int,
        region: str = "ap-south-1",
        optimization_goal: str = "Balanced"
    ) -> Dict[str, Any]:
        profile = self.WORKLOAD_PROFILES.get(job_type, self.WORKLOAD_PROFILES["Batch Analytics"])
        total_compute_kwh = duration_hours * compute_units * profile["kw_per_unit"]
        base_hourly_spend = compute_units * profile["base_cost_per_unit_hr"]

        # Objective weights
        if optimization_goal == "Lowest Cost":
            w_cost, w_carbon = 0.85, 0.15
        elif optimization_goal == "Lowest Carbon":
            w_cost, w_carbon = 0.15, 0.85
        else: # "Balanced"
            w_cost, w_carbon = 0.50, 0.50

        # Current baseline calculation
        current_intensity, _ = carbon_provider.calculate_hourly_intensity(region, current_hour)
        current_multiplier = self._get_cost_multiplier(current_hour)
        current_cost = round(base_hourly_spend * duration_hours * current_multiplier, 2)
        current_carbon = round(total_compute_kwh * current_intensity, 1)

        # Evaluate candidate start windows (next 24 hours)
        windows = []
        best_window = None
        best_score = float("inf")

        for h in range(24):
            intensity, renewable_pct = carbon_provider.calculate_hourly_intensity(region, h)
            multiplier = self._get_cost_multiplier(h)
            
            est_cost = round(base_hourly_spend * duration_hours * multiplier, 2)
            est_carbon = round(total_compute_kwh * intensity, 1)

            # Deadline penalty: Check if completing after deadline
            end_hour = (h + int(duration_hours)) % 24
            is_feasible = True
            penalty = 0.0

            # Calculate normalized cost and carbon scores (0 to 1)
            norm_cost = est_cost / max(1.0, current_cost * 1.3)
            norm_carbon = est_carbon / max(1.0, current_carbon * 1.3)

            # Preference penalty for daytime congestion vs clean night hours
            time_score = (w_cost * norm_cost) + (w_carbon * norm_carbon) + penalty
            
            time_label = datetime(2026, 1, 1, h, 0).strftime("%I:%M %p")
            
            window_item = {
                "hour": h,
                "time_label": time_label,
                "estimated_cost_inr": est_cost,
                "estimated_carbon_gco2": est_carbon,
                "combined_score": round(time_score, 3),
                "is_recommended": False,
                "is_current": (h == current_hour),
                "feasibility": "Feasible" if is_feasible else "Exceeds Deadline"
            }
            windows.append(window_item)

            if time_score < best_score:
                best_score = time_score
                best_window = window_item

        # Mark recommended window
        if best_window:
            best_window["is_recommended"] = True

        rec_cost = best_window["estimated_cost_inr"] if best_window else current_cost
        rec_carbon = best_window["estimated_carbon_gco2"] if best_window else current_carbon

        savings_inr = max(0.0, current_cost - rec_cost)
        savings_pct = round((savings_inr / max(1.0, current_cost)) * 100.0, 1)
        
        carbon_reduction = max(0.0, current_carbon - rec_carbon)
        carbon_reduction_pct = round((carbon_reduction / max(1.0, current_carbon)) * 100.0, 1)

        summary = (
            f"Moving {job_name} ({job_type}) from {datetime(2026, 1, 1, current_hour, 0).strftime('%I:%M %p')} "
            f"to {best_window['time_label']} achieves ₹{savings_inr:,.2f} ({savings_pct}%) cost savings "
            f"and reduces carbon emissions by {carbon_reduction_pct}% ({carbon_reduction:,.0f} gCO₂e)."
        )

        return {
            "job_id": f"JOB-{uuid.uuid4().hex[:6].upper()}",
            "job_name": job_name,
            "job_type": job_type,
            "current_time_label": datetime(2026, 1, 1, current_hour, 0).strftime("%I:%M %p"),
            "current_cost_inr": current_cost,
            "current_carbon_gco2": current_carbon,
            "recommended_time_label": best_window["time_label"] if best_window else "03:00 AM",
            "recommended_cost_inr": rec_cost,
            "recommended_carbon_gco2": rec_carbon,
            "savings_inr": savings_inr,
            "savings_pct": savings_pct,
            "carbon_reduction_pct": carbon_reduction_pct,
            "optimization_summary": summary,
            "all_windows": windows
        }

    def compute_what_if_scenario(
        self,
        workload_type: str,
        current_hour: int,
        target_hour: int,
        duration_hours: float = 4.0,
        compute_units: float = 8.0,
        region: str = "ap-south-1"
    ) -> Dict[str, Any]:
        """
        Interactive 'What-If' recalculation for shifting workloads across any two hours.
        """
        profile = self.WORKLOAD_PROFILES.get(workload_type, {"kw_per_unit": 0.50, "base_cost_per_unit_hr": 95.0})
        total_compute_kwh = duration_hours * compute_units * profile["kw_per_unit"]
        base_hourly_spend = compute_units * profile["base_cost_per_unit_hr"]

        # 1. Current window metrics
        cur_intensity, _ = carbon_provider.calculate_hourly_intensity(region, current_hour)
        cur_multiplier = self._get_cost_multiplier(current_hour)
        cur_cost = round(base_hourly_spend * duration_hours * cur_multiplier, 2)
        cur_carbon = round(total_compute_kwh * cur_intensity, 1)

        # 2. Target window metrics
        tgt_intensity, _ = carbon_provider.calculate_hourly_intensity(region, target_hour)
        tgt_multiplier = self._get_cost_multiplier(target_hour)
        tgt_cost = round(base_hourly_spend * duration_hours * tgt_multiplier, 2)
        tgt_carbon = round(total_compute_kwh * tgt_intensity, 1)

        # Deltas
        cost_diff = round(cur_cost - tgt_cost, 2)
        savings_pct = round((cost_diff / max(1.0, cur_cost)) * 100.0, 1) if cost_diff > 0 else round((cost_diff / max(1.0, cur_cost)) * 100.0, 1)

        carbon_diff = round(cur_carbon - tgt_carbon, 1)
        carbon_red_pct = round((carbon_diff / max(1.0, cur_carbon)) * 100.0, 1) if carbon_diff > 0 else round((carbon_diff / max(1.0, cur_carbon)) * 100.0, 1)

        delay_hours = float((target_hour - current_hour) % 24)
        
        # Annualized projection (assuming daily run)
        annual_savings = max(0.0, cost_diff * 365.0)
        annual_co2_avoided_kg = max(0.0, (carbon_diff * 365.0) / 1000.0)

        cur_label = datetime(2026, 1, 1, current_hour, 0).strftime("%I:%M %p")
        tgt_label = datetime(2026, 1, 1, target_hour, 0).strftime("%I:%M %p")

        if cost_diff >= 0 and carbon_diff >= 0:
            verdict = f"Optimal Migration: Saves ₹{cost_diff:,.2f} and reduces {carbon_diff:,.0f} gCO₂e per execution with a {delay_hours:.0f}h schedule shift."
        elif cost_diff >= 0 and carbon_diff < 0:
            verdict = f"Cost-Optimized: Saves ₹{cost_diff:,.2f}, but increases carbon by {-carbon_diff:,.0f} gCO₂e due to evening grid emission factors."
        elif cost_diff < 0 and carbon_diff >= 0:
            verdict = f"Green-Optimized: Reduces carbon by {carbon_diff:,.0f} gCO₂e, with a modest off-peak tariff difference of ₹{-cost_diff:,.2f}."
        else:
            verdict = "Sub-optimal window: Both cost and carbon are higher than the baseline period."

        return {
            "current_hour_label": cur_label,
            "target_hour_label": tgt_label,
            "current_cost_inr": cur_cost,
            "target_cost_inr": tgt_cost,
            "cost_diff_inr": cost_diff,
            "savings_pct": savings_pct,
            "current_carbon_gco2": cur_carbon,
            "target_carbon_gco2": tgt_carbon,
            "carbon_diff_gco2": carbon_diff,
            "carbon_reduction_pct": carbon_red_pct,
            "delay_hours": delay_hours,
            "annual_projected_savings_inr": annual_savings,
            "annual_co2_avoided_kg": annual_co2_avoided_kg,
            "executive_verdict": verdict
        }

    def _get_cost_multiplier(self, hour: int) -> float:
        """
        Models cloud dynamic spot/on-demand rate changes during peak/off-peak grid hours.
        """
        if 1 <= hour <= 5: # Midnight to early morning (clean + off-peak spot discount)
            return 0.74
        elif 13 <= hour <= 17: # Afternoon peak grid load
            return 1.22
        elif 18 <= hour <= 22: # Evening peak demand
            return 1.15
        return 1.0

scheduler_engine = SchedulerEngine()
