import httpx
import math
from typing import Dict, Any, List
from datetime import datetime
from app.config import settings

class CarbonProvider:
    """
    Provider abstraction for regional grid carbon intensities (gCO2eq/kWh).
    Supports live API queries (e.g. CO2Signal / ElectricityMaps) with realistic fallback curves.
    """

    # Regional baseline intensities (gCO2/kWh) and typical renewable mixes
    REGIONAL_CONFIGS = {
        "ap-south-1": {
            "name": "Mumbai / India",
            "country": "IN",
            "base_intensity": 710.0,
            "solar_peak_reduction": 180.0,
            "renewable_base": 22.0,
            "renewable_peak": 44.0,
            "grid_source": "Coal Dominant + Solar Mix"
        },
        "ap-south-2": {
            "name": "Hyderabad / India",
            "country": "IN",
            "base_intensity": 680.0,
            "solar_peak_reduction": 170.0,
            "renewable_base": 25.0,
            "renewable_peak": 48.0,
            "grid_source": "Thermal + Solar & Wind"
        },
        "ap-southeast-1": {
            "name": "Singapore",
            "country": "SG",
            "base_intensity": 395.0,
            "solar_peak_reduction": 45.0,
            "renewable_base": 8.0,
            "renewable_peak": 16.0,
            "grid_source": "Natural Gas Dominant"
        },
        "eu-central-1": {
            "name": "Frankfurt / Germany",
            "country": "DE",
            "base_intensity": 310.0,
            "solar_peak_reduction": 160.0,
            "renewable_base": 48.0,
            "renewable_peak": 72.0,
            "grid_source": "Wind + Solar + Biomass"
        },
        "us-east-1": {
            "name": "N. Virginia / USA",
            "country": "US",
            "base_intensity": 340.0,
            "solar_peak_reduction": 90.0,
            "renewable_base": 30.0,
            "renewable_peak": 55.0,
            "grid_source": "Nuclear + Gas + Solar"
        }
    }

    async def get_regional_intensity(self, region_code: str) -> Dict[str, Any]:
        config = self.REGIONAL_CONFIGS.get(region_code, self.REGIONAL_CONFIGS["ap-south-1"])
        
        # If live API enabled and key provided
        if settings.CARBON_PROVIDER == "live" and settings.CARBON_API_KEY:
            try:
                # Live query example
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        f"https://api.co2signal.com/v1/latest?countryCode={config['country']}",
                        headers={"auth-token": settings.CARBON_API_KEY}
                    )
                    if resp.status_code == 200:
                        data = resp.json().get("data", {})
                        return {
                            "region_code": region_code,
                            "region_name": config["name"],
                            "carbon_intensity_gco2_kwh": round(data.get("carbonIntensity", config["base_intensity"]), 1),
                            "renewable_pct": round(data.get("fossilFuelPercentage", 100 - config["renewable_base"]), 1),
                            "grid_source": config["grid_source"],
                            "is_simulated": False
                        }
            except Exception as e:
                print(f"[CarbonProvider] Live carbon fetch failed: {e}. Falling back to simulation curve.")

        # Compute diurnal curve based on current hour
        current_hour = datetime.utcnow().hour + 5.5 # Convert to IST (UTC+5:30) approx
        hour_val = int(current_hour) % 24
        
        intensity, renewable_pct = self.calculate_hourly_intensity(region_code, hour_val)
        
        return {
            "region_code": region_code,
            "region_name": config["name"],
            "carbon_intensity_gco2_kwh": intensity,
            "renewable_pct": renewable_pct,
            "grid_source": config["grid_source"],
            "is_simulated": True
        }

    def calculate_hourly_intensity(self, region_code: str, hour: int) -> tuple[float, float]:
        config = self.REGIONAL_CONFIGS.get(region_code, self.REGIONAL_CONFIGS["ap-south-1"])
        base = config["base_intensity"]
        reduction_max = config["solar_peak_reduction"]
        
        # Solar peak typically between 10:00 AM (10) and 4:00 PM (16)
        # Night wind/low-demand valley around 1:00 AM - 5:00 AM
        if 9 <= hour <= 16:
            # Solar peak curve (bell curve around 12:30 PM)
            solar_factor = math.sin((hour - 9) / 7.0 * math.pi)
            intensity = base - (reduction_max * solar_factor)
            renewable = config["renewable_base"] + ((config["renewable_peak"] - config["renewable_base"]) * solar_factor)
        elif 1 <= hour <= 5:
            # Low demand night valley (moderate reduction from night baseload wind/hydro)
            night_factor = math.sin((hour - 1) / 4.0 * math.pi) * 0.4
            intensity = base - (reduction_max * 0.45 * night_factor)
            renewable = config["renewable_base"] + (10.0 * night_factor)
        else:
            # Peak evening coal/gas ramp (6 PM - 10 PM)
            evening_peak_factor = math.sin((hour - 17) / 6.0 * math.pi) if 17 <= hour <= 23 else 0.1
            intensity = base + (30.0 * evening_peak_factor)
            renewable = max(5.0, config["renewable_base"] - (5.0 * evening_peak_factor))

        return round(max(50.0, intensity), 1), round(min(98.0, renewable), 1)

carbon_provider = CarbonProvider()
