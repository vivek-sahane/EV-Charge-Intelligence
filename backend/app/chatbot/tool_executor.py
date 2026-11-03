"""
Tool Executor:
Executes analytical tools requested by the AI Chatbot against backend services and database.
Validates parameters, prevents hallucinations, and returns structured data.
"""
import logging
from app.services.analytics_service import analytics_service
from app.services.dataset_service import dataset_service
from app.ml.model_service import model_service
from app.ml.clustering_service import clustering_service
from app.ml.compatibility_service import compatibility_service
from app.models.models import CountryGrowth

logger = logging.getLogger(__name__)

class ToolExecutor:
    @staticmethod
    def execute_tool(tool_name: str, args: dict) -> dict:
        """Dispatches tool execution with argument validation."""
        args = args or {}
        try:
            if tool_name == "get_global_statistics":
                return analytics_service.get_summary_metrics()

            elif tool_name == "get_country_statistics":
                country = args.get("country")
                if country and country.lower() not in ("all", "", "none"):
                    record = CountryGrowth.query.filter(CountryGrowth.country.ilike(f"%{country.strip()}%")).first()
                    if record:
                        return {"found": True, "country_statistics": record.to_dict()}
                    return {"found": False, "message": f"Country '{country}' not found in database."}
                else:
                    top_countries = CountryGrowth.query.order_by(CountryGrowth.station_count.desc()).limit(10).all()
                    return {"found": True, "top_countries": [c.to_dict() for c in top_countries]}

            elif tool_name == "compare_countries":
                c1 = args.get("country1", "")
                c2 = args.get("country2", "")
                if not c1 or not c2:
                    return {"error": "Both country1 and country2 parameters are required."}
                return analytics_service.compare_countries(c1, c2)

            elif tool_name == "predict_ev_demand":
                return model_service.predict_demand(args)

            elif tool_name == "predict_country_growth":
                return model_service.predict_growth(args)

            elif tool_name == "get_cluster_information":
                algo = str(args.get("algorithm", "kmeans")).lower()
                if algo == "kmeans":
                    k = int(args.get("k", 8))
                    res = clustering_service.cluster_kmeans(n_clusters=k)
                    # Omit full raw station list in tool response to keep tokens lean
                    return {
                        "algorithm": "kmeans",
                        "k": res["k"],
                        "total_stations": res["total_stations"],
                        "clusters": res["clusters"]
                    }
                else:
                    eps = float(args.get("eps_km", 80.0))
                    res = clustering_service.cluster_dbscan(eps_km=eps)
                    return {
                        "algorithm": "dbscan",
                        "eps_km": res["eps_km"],
                        "hotspots_count": res["hotspots_count"],
                        "noise_count": res["noise_count"],
                        "top_hotspots": res["hotspots"][:6]
                    }

            elif tool_name == "get_charging_hotspots":
                country = args.get("country")
                eps = float(args.get("eps_km", 80.0))
                res = clustering_service.cluster_dbscan(eps_km=eps, country_filter=country)
                return {
                    "total_stations_scanned": res["total_stations"],
                    "hotspots_identified": res["hotspots_count"],
                    "noise_isolated": res["noise_count"],
                    "top_hotspots": res["hotspots"][:8]
                }

            elif tool_name == "check_ev_compatibility":
                power_kw = float(args.get("power_kw", 150))
                res = compatibility_service.check_compatibility(power_kw)
                # Return summary and top models
                return {
                    "station_power_kw": res["station_power_kw"],
                    "compatible_count": res["compatible_count"],
                    "incompatible_count": res["incompatible_count"],
                    "compatibility_rate_percent": res["compatibility_rate_percent"],
                    "sample_compatible_models": [
                        f"{m['manufacturer']} {m['model']} ({m['max_charging_power_kw']} kW, {m['battery_capacity_kwh']} kWh)"
                        for m in res["compatible_models"][:12]
                    ],
                    "sample_incompatible_models": [
                        f"{m['manufacturer']} {m['model']} (needs {m['max_charging_power_kw']} kW)"
                        for m in res["incompatible_models"][:8]
                    ],
                    "technical_advisory": res["technical_advisory"]
                }

            elif tool_name == "get_model_performance":
                meta = model_service.get_metadata()
                model_name = args.get("model_name", "all")
                if model_name == "demand":
                    return {"demand_model": meta.get("models", {}).get("demand_prediction", {})}
                elif model_name == "growth":
                    return {"growth_model": meta.get("models", {}).get("country_growth_prediction", {})}
                return meta

            elif tool_name == "get_dataset_information":
                summary = analytics_service.get_summary_metrics()
                datasets = dataset_service.get_datasets_list()
                return {
                    "data_mode": summary["data_source_label"],
                    "is_synthetic": summary["is_synthetic"],
                    "total_stations": summary["total_charging_stations"],
                    "total_ports": summary["total_charging_ports"],
                    "datasets_registered": datasets
                }

            else:
                return {"error": f"Unknown tool: '{tool_name}'"}

        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}", exc_info=True)
            return {"error": f"Tool execution failed: {str(e)}"}

tool_executor = ToolExecutor()
