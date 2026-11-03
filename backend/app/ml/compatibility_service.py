"""
EV Compatibility Service:
Evaluates EV model compatibility against station charging power (kW).
Returns compatible and incompatible vehicles, distribution, and battery analytics.
"""
from app.models.models import EVModel

class CompatibilityService:
    @staticmethod
    def check_compatibility(station_power_kw: float, vehicle_type_filter: str = None) -> dict:
        try:
            power_val = float(station_power_kw)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid station power value: {station_power_kw}")

        if power_val <= 0:
            raise ValueError("Station power must be greater than 0 kW.")

        query = EVModel.query
        if vehicle_type_filter and vehicle_type_filter.lower() != "all":
            query = query.filter(EVModel.vehicle_type.ilike(f"%{vehicle_type_filter}%"))
            
        all_models = query.order_by(EVModel.max_charging_power_kw.asc()).all()
        if not all_models:
            return {
                "station_power_kw": power_val,
                "total_models": 0,
                "compatible_count": 0,
                "incompatible_count": 0,
                "compatibility_rate_percent": 0.0,
                "compatible_models": [],
                "incompatible_models": [],
                "technical_advisory": "No EV models in database."
            }

        compatible = []
        incompatible = []

        for m in all_models:
            model_dict = m.to_dict()
            # Compatibility rule: EV model max charging power <= station power
            if m.max_charging_power_kw <= power_val:
                # Calculate estimated 10-80% charge time in minutes based on 70% capacity delta
                energy_needed = m.battery_capacity_kwh * 0.70
                # Practical charging speed operates at ~80% of peak under optimal conditions
                effective_speed = min(power_val, m.max_charging_power_kw) * 0.82
                charge_time_min = round((energy_needed / effective_speed) * 60, 1)
                model_dict["estimated_10_80_mins"] = charge_time_min
                compatible.append(model_dict)
            else:
                deficit = round(m.max_charging_power_kw - power_val, 1)
                model_dict["power_deficit_kw"] = deficit
                incompatible.append(model_dict)

        total_cnt = len(all_models)
        comp_cnt = len(compatible)
        rate = round((comp_cnt / total_cnt) * 100, 1)

        advisory = (
            f"Compatibility indicates this station provides sufficient maximum peak power (>= {power_val} kW) "
            "for the vehicle's onboard intake limits. Actual charging throughput and session time are governed "
            "by the vehicle's battery management system (BMS) charging curve, ambient battery temperature, "
            "current state-of-charge (SoC), and connector protocol (CCS1, CCS2, NACS, or CHAdeMO)."
        )

        return {
            "station_power_kw": power_val,
            "total_models": total_cnt,
            "compatible_count": comp_cnt,
            "incompatible_count": len(incompatible),
            "compatibility_rate_percent": rate,
            "compatible_models": compatible,
            "incompatible_models": incompatible,
            "technical_advisory": advisory
        }

    @staticmethod
    def get_all_ev_models():
        models = EVModel.query.order_by(EVModel.manufacturer.asc(), EVModel.model.asc()).all()
        return [m.to_dict() for m in models]

compatibility_service = CompatibilityService()
