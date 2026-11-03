"""
Chatbot Tool Definitions:
OpenAI / JSON Schema function declarations for all 10 EV Intelligence analytical tools.
"""

CHATBOT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_global_statistics",
            "description": "Retrieves global EV infrastructure KPIs including total stations, total ports, average power, country count, average demand score, and fast-charging ratios.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_country_statistics",
            "description": "Retrieves EV infrastructure details for a specific country or returns top countries by station count.",
            "parameters": {
                "type": "object",
                "properties": {
                    "country": {
                        "type": "string",
                        "description": "Name of the country (e.g. 'Germany', 'United States', 'Norway', 'China', 'India'). Omit or pass 'all' for top countries."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_countries",
            "description": "Compares EV infrastructure, station density, port count, fast charging share, and future growth indices between two countries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "country1": {
                        "type": "string",
                        "description": "First country name (e.g., 'Germany')"
                    },
                    "country2": {
                        "type": "string",
                        "description": "Second country name (e.g., 'India')"
                    }
                },
                "required": ["country1", "country2"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "predict_ev_demand",
            "description": "Uses the trained GradientBoostingRegressor to predict the EV demand score (0-100) based on infrastructure metrics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "station_count": {"type": "number", "description": "Number of charging stations"},
                    "port_count": {"type": "number", "description": "Total charging ports"},
                    "fast_station_share": {"type": "number", "description": "Ratio of fast stations (0.0 to 1.0)"},
                    "fast_port_share": {"type": "number", "description": "Ratio of fast ports (0.0 to 1.0)"},
                    "median_power_kw": {"type": "number", "description": "Median charging power in kW"}
                },
                "required": ["station_count", "port_count", "fast_station_share", "fast_port_share", "median_power_kw"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "predict_country_growth",
            "description": "Uses the trained GradientBoostingRegressor to predict the country future growth index (0-100).",
            "parameters": {
                "type": "object",
                "properties": {
                    "station_count": {"type": "number", "description": "Current station count in country"},
                    "port_count": {"type": "number", "description": "Current port count in country"},
                    "fast_station_share": {"type": "number", "description": "Ratio of fast stations (0.0 to 1.0)"},
                    "median_power_kw": {"type": "number", "description": "Median charging power in kW"}
                },
                "required": ["station_count", "port_count", "fast_station_share", "median_power_kw"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_cluster_information",
            "description": "Retrieves geographic clustering details using KMeans (centroids, distributions) or DBSCAN.",
            "parameters": {
                "type": "object",
                "properties": {
                    "algorithm": {
                        "type": "string",
                        "enum": ["kmeans", "dbscan"],
                        "description": "Clustering algorithm to evaluate ('kmeans' or 'dbscan')"
                    },
                    "k": {
                        "type": "integer",
                        "description": "Number of clusters for KMeans (default: 8)"
                    }
                },
                "required": ["algorithm"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_charging_hotspots",
            "description": "Identifies high-density charging station hotspots and noise anomalies using DBSCAN with haversine distance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "country": {
                        "type": "string",
                        "description": "Optional country filter (e.g., 'Germany', 'Europe', or 'all')"
                    },
                    "eps_km": {
                        "type": "number",
                        "description": "Maximum distance radius in kilometers for DBSCAN neighborhood (default 80.0 km)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_ev_compatibility",
            "description": "Evaluates which electric vehicle models can charge at a specified station power output (kW). Rule: max_charging_power_kw <= station_power_kw.",
            "parameters": {
                "type": "object",
                "properties": {
                    "power_kw": {
                        "type": "number",
                        "description": "Station charging power in kW (e.g. 50, 150, 250, 350)"
                    }
                },
                "required": ["power_kw"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_model_performance",
            "description": "Retrieves training evaluation metrics (R² score, MAE, RMSE, feature importances) for the ML models.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model_name": {
                        "type": "string",
                        "enum": ["demand", "growth", "all"],
                        "description": "Which model to inspect ('demand', 'growth', or 'all')"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_dataset_information",
            "description": "Retrieves metadata regarding active datasets, row counts, and whether synthetic demo data or real uploaded data is active.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]
