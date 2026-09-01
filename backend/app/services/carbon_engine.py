from typing import List, Dict, Any
from datetime import datetime
from app.providers.carbon_provider import carbon_provider

class CarbonEngine:
    """
    Computes grid carbon metrics, regional comparisons, and emissions calculations.
    """

    async def get_carbon_intelligence_summary(self, region: str = "ap-south-1") -> Dict[str, Any]:
        # 1. Fetch current regional readings
        regions = ["ap-south-1", "ap-south-2", "ap-southeast-1", "eu-central-1", "us-east-1"]
        regional_data = []
        for r_code in regions:
            data = await carbon_provider.get_regional_intensity(r_code)
            # Determine health status
            intensity = data["carbon_intensity_gco2_kwh"]
            if intensity < 350:
                data["status"] = "Optimal (Green)"
            elif intensity < 550:
                data["status"] = "Moderate"
            else:
                data["status"] = "High Carbon Grid"
            regional_data.append(data)

        # 2. Compute 24-hour diurnal profile for selected region
        diurnal_curve = []
        for h in range(24):
            intensity, renewable_pct = carbon_provider.calculate_hourly_intensity(region, h)
            # Off-peak hours (11 PM to 6 AM) have lower spot pricing multiplier
            if 0 <= h <= 6:
                cost_multiplier = 0.72 # Off-peak discount
            elif 13 <= h <= 18:
                cost_multiplier = 1.25 # Peak demand pricing
            else:
                cost_multiplier = 1.0

            time_str = datetime(2026, 1, 1, h, 0).strftime("%I:%M %p")
            diurnal_curve.append({
                "hour": h,
                "time_label": time_str,
                "intensity_gco2_kwh": intensity,
                "cost_multiplier": cost_multiplier,
                "renewable_pct": renewable_pct
            })

        # 3. Workload calculations (simulated enterprise baseline)
        today_workload_cost_inr = 28420.0
        today_emissions_kg = 184.2
        potential_carbon_reduction_pct = 18.6
        potential_cost_savings_pct = 12.4

        return {
            "current_grid": regional_data,
            "regional_comparison": regional_data,
            "today_workload_cost_inr": today_workload_cost_inr,
            "today_emissions_kg": today_emissions_kg,
            "optimization_potential_carbon_pct": potential_carbon_reduction_pct,
            "optimization_potential_cost_pct": potential_cost_savings_pct,
            "diurnal_curve": diurnal_curve
        }

    def estimate_workload_emissions(self, compute_hours: float, kw_per_unit: float, region_code: str, hour: int) -> float:
        """
        Estimates total gCO2 emitted for a workload:
        Emissions (gCO2) = Total kWh * Grid Intensity (gCO2/kWh)
        """
        intensity, _ = carbon_provider.calculate_hourly_intensity(region_code, hour)
        total_kwh = compute_hours * kw_per_unit
        return round(total_kwh * intensity, 1)

carbon_engine = CarbonEngine()
