"""
Analytics Service:
Calculates live aggregation metrics, country breakdowns, distribution charts,
and side-by-side country comparisons from active database records.
"""
from sqlalchemy import func
from app.models.models import db, ChargingStation, CountryGrowth, EVModel

class AnalyticsService:
    @staticmethod
    def get_summary_metrics():
        """Calculates global top-level KPI metrics from active database tables."""
        total_stations = db.session.query(func.count(ChargingStation.id)).scalar() or 0
        total_ports = db.session.query(func.sum(ChargingStation.port_count)).scalar() or 0
        avg_power = db.session.query(func.avg(ChargingStation.charging_power_kw)).scalar() or 0.0
        countries_covered = db.session.query(func.count(func.distinct(ChargingStation.country))).scalar() or 0
        avg_demand = db.session.query(func.avg(ChargingStation.demand_score)).scalar() or 0.0
        
        # Fast charging stations (stations with charging_power_kw >= 50 kW or fast_station_share >= 0.5)
        fast_stations = db.session.query(func.count(ChargingStation.id))\
            .filter((ChargingStation.charging_power_kw >= 50.0) | (ChargingStation.fast_station_share >= 0.5))\
            .scalar() or 0

        # Check if database records are synthetic demo data
        synthetic_count = db.session.query(func.count(ChargingStation.id))\
            .filter(ChargingStation.is_synthetic == True).scalar() or 0
        is_synthetic = (synthetic_count > 0 and synthetic_count == total_stations) if total_stations > 0 else True

        return {
            "total_charging_stations": int(total_stations),
            "total_charging_ports": int(total_ports),
            "average_charging_power_kw": round(float(avg_power), 1),
            "countries_covered": int(countries_covered),
            "average_demand_score": round(float(avg_demand), 2),
            "fast_charging_stations": int(fast_stations),
            "fast_charging_ratio_percent": round((fast_stations / max(1, total_stations)) * 100, 1),
            "is_synthetic": is_synthetic,
            "data_source_label": "Synthetic Demonstration Data" if is_synthetic else "Verified Live Uploaded Data"
        }

    @staticmethod
    def get_countries_summary():
        """Returns all country growth and infrastructure records sorted by station count."""
        countries = CountryGrowth.query.order_by(CountryGrowth.station_count.desc()).all()
        return [c.to_dict() for c in countries]

    @staticmethod
    def get_charts_data():
        """Generates structured chart series for the Overview Dashboard."""
        # 1. Top countries by station count & ports
        countries = CountryGrowth.query.order_by(CountryGrowth.station_count.desc()).limit(12).all()
        infrastructure_by_country = [
            {
                "country": c.country,
                "stations": c.station_count,
                "ports": c.port_count,
                "fast_share": round(c.fast_station_share * 100, 1),
                "growth_index": c.future_growth_index
            }
            for c in countries
        ]

        # 2. Fast vs Slow charging distribution (pie/donut)
        all_stations = ChargingStation.query.all()
        ultrafast_count = 0  # >= 150 kW
        fast_count = 0       # 50 - 149 kW
        standard_count = 0   # < 50 kW

        for s in all_stations:
            if s.charging_power_kw >= 150:
                ultrafast_count += 1
            elif s.charging_power_kw >= 50:
                fast_count += 1
            else:
                standard_count += 1

        power_distribution = [
            {"name": "Ultra-Fast (≥ 150 kW)", "value": ultrafast_count, "color": "#00f2fe"},
            {"name": "Fast DC (50-149 kW)", "value": fast_count, "color": "#3b82f6"},
            {"name": "Standard AC (< 50 kW)", "value": standard_count, "color": "#8b5cf6"}
        ]

        # 3. Demand score histogram buckets
        demand_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        for s in all_stations:
            score = s.demand_score
            if score <= 20:
                demand_buckets["0-20"] += 1
            elif score <= 40:
                demand_buckets["21-40"] += 1
            elif score <= 60:
                demand_buckets["41-60"] += 1
            elif score <= 80:
                demand_buckets["61-80"] += 1
            else:
                demand_buckets["81-100"] += 1

        demand_distribution = [
            {"range": k, "count": v} for k, v in demand_buckets.items()
        ]

        # 4. Top growth countries
        growth_countries = CountryGrowth.query.order_by(CountryGrowth.future_growth_index.desc()).limit(10).all()
        top_growth = [
            {
                "country": c.country,
                "growth_index": c.future_growth_index,
                "stations": c.station_count,
                "median_power": c.median_power_kw
            }
            for c in growth_countries
        ]

        # 5. EV Models by Vehicle Type
        ev_types = db.session.query(EVModel.vehicle_type, func.count(EVModel.id)).group_by(EVModel.vehicle_type).all()
        ev_type_distribution = [
            {"type": v[0], "count": v[1]} for v in ev_types
        ]

        return {
            "infrastructure_by_country": infrastructure_by_country,
            "power_distribution": power_distribution,
            "demand_distribution": demand_distribution,
            "top_growth_countries": top_growth,
            "ev_type_distribution": ev_type_distribution
        }

    @staticmethod
    def compare_countries(country1_name: str, country2_name: str):
        """Compares two countries side by side on infrastructure and growth."""
        c1 = CountryGrowth.query.filter(CountryGrowth.country.ilike(f"%{country1_name.strip()}%")).first()
        c2 = CountryGrowth.query.filter(CountryGrowth.country.ilike(f"%{country2_name.strip()}%")).first()

        if not c1 or not c2:
            available = [c.country for c in CountryGrowth.query.limit(10).all()]
            return {
                "error": f"One or both countries not found: '{country1_name}', '{country2_name}'. Available examples: {available}"
            }

        c1_dict = c1.to_dict()
        c2_dict = c2.to_dict()

        # Compute relative comparisons
        stn_winner = c1.country if c1.station_count >= c2.station_count else c2.country
        port_winner = c1.country if c1.port_count >= c2.port_count else c2.country
        growth_winner = c1.country if c1.future_growth_index >= c2.future_growth_index else c2.country
        power_winner = c1.country if c1.median_power_kw >= c2.median_power_kw else c2.country

        insight = (
            f"{c1.country} operates {c1.station_count:,} stations ({c1.port_count:,} ports) with a future growth index of {c1.future_growth_index}, "
            f"while {c2.country} operates {c2.station_count:,} stations ({c2.port_count:,} ports) with a growth index of {c2.future_growth_index}. "
            f"Overall, {stn_winner} leads in station deployment, and {growth_winner} holds higher future growth index."
        )

        return {
            "country1": c1_dict,
            "country2": c2_dict,
            "comparison": {
                "station_count_leader": stn_winner,
                "port_count_leader": port_winner,
                "future_growth_leader": growth_winner,
                "median_power_leader": power_winner
            },
            "insight": insight
        }

analytics_service = AnalyticsService()
