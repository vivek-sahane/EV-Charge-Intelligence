"""
Geographic Clustering Service for EV Charging Stations:
- KMeans clustering on station coordinates with cluster centroid & statistics computation.
- DBSCAN clustering using haversine metric on coordinates converted to radians.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from app.models.models import ChargingStation

EARTH_RADIUS_KM = 6371.0088

class ClusteringService:
    @staticmethod
    def get_station_data(country_filter: str = None):
        """Fetches station data from the database."""
        query = ChargingStation.query
        if country_filter and country_filter.lower() != "all":
            query = query.filter(ChargingStation.country.ilike(f"%{country_filter}%"))
        stations = query.all()
        return stations

    @staticmethod
    def cluster_kmeans(n_clusters: int = 8, country_filter: str = None):
        """
        Applies KMeans clustering to EV charging stations.
        Returns cluster assignments, centroids, and cluster metadata.
        """
        stations = ClusteringService.get_station_data(country_filter)
        if not stations:
            return {
                "algorithm": "kmeans",
                "total_stations": 0,
                "clusters": [],
                "stations": []
            }

        n_samples = len(stations)
        k = max(1, min(int(n_clusters), n_samples))

        coords = np.array([[s.latitude, s.longitude] for s in stations])
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
        centroids = kmeans.cluster_centers_

        # Collect cluster statistics
        cluster_stats = {}
        for i in range(k):
            cluster_stats[i] = {
                "cluster_id": i,
                "centroid_lat": round(float(centroids[i][0]), 6),
                "centroid_lng": round(float(centroids[i][1]), 6),
                "station_count": 0,
                "total_ports": 0,
                "avg_power_kw": 0.0,
                "avg_demand_score": 0.0,
                "top_cities": set()
            }

        station_results = []
        for s, label in zip(stations, labels):
            c_id = int(label)
            cluster_stats[c_id]["station_count"] += 1
            cluster_stats[c_id]["total_ports"] += s.port_count
            cluster_stats[c_id]["avg_power_kw"] += s.charging_power_kw
            cluster_stats[c_id]["avg_demand_score"] += s.demand_score
            cluster_stats[c_id]["top_cities"].add(s.city)

            station_results.append({
                "id": s.id,
                "station_id": s.station_id,
                "name": s.station_name,
                "country": s.country,
                "city": s.city,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "power_kw": s.charging_power_kw,
                "demand_score": s.demand_score,
                "cluster_id": c_id
            })

        # Calculate averages for each cluster
        formatted_clusters = []
        for c_id, stats in cluster_stats.items():
            count = max(1, stats["station_count"])
            stats["avg_power_kw"] = round(stats["avg_power_kw"] / count, 1)
            stats["avg_demand_score"] = round(stats["avg_demand_score"] / count, 1)
            stats["top_cities"] = list(stats["top_cities"])[:5]
            formatted_clusters.append(stats)

        return {
            "algorithm": "kmeans",
            "k": k,
            "total_stations": n_samples,
            "clusters": formatted_clusters,
            "stations": station_results
        }

    @staticmethod
    def cluster_dbscan(eps_km: float = 80.0, min_samples: int = 4, country_filter: str = None):
        """
        Applies DBSCAN clustering using haversine metric on radian coordinates.
        Identifies dense charging hotspots and separates noise points (-1).
        """
        stations = ClusteringService.get_station_data(country_filter)
        if not stations:
            return {
                "algorithm": "dbscan",
                "total_stations": 0,
                "hotspots": [],
                "noise_count": 0,
                "stations": []
            }

        # Convert coordinates to radians: [lat, lon] -> radians
        coords = np.array([[s.latitude, s.longitude] for s in stations])
        coords_rad = np.radians(coords)

        # Convert epsilon in kilometers to radians
        eps_rad = float(eps_km) / EARTH_RADIUS_KM
        min_pts = max(2, int(min_samples))

        db = DBSCAN(eps=eps_rad, min_samples=min_pts, metric="haversine")
        labels = db.fit_predict(coords_rad)

        unique_labels = set(labels)
        n_clusters = len(unique_labels - {-1})
        noise_count = int(np.sum(labels == -1))

        hotspots_dict = {}
        for c_id in unique_labels:
            if c_id == -1:
                continue
            hotspots_dict[int(c_id)] = {
                "cluster_id": int(c_id),
                "station_count": 0,
                "total_ports": 0,
                "avg_power_kw": 0.0,
                "avg_demand_score": 0.0,
                "lats": [],
                "lngs": [],
                "cities": set(),
                "countries": set()
            }

        station_results = []
        for s, label in zip(stations, labels):
            c_id = int(label)
            is_noise = (c_id == -1)

            if not is_noise:
                hotspots_dict[c_id]["station_count"] += 1
                hotspots_dict[c_id]["total_ports"] += s.port_count
                hotspots_dict[c_id]["avg_power_kw"] += s.charging_power_kw
                hotspots_dict[c_id]["avg_demand_score"] += s.demand_score
                hotspots_dict[c_id]["lats"].append(s.latitude)
                hotspots_dict[c_id]["lngs"].append(s.longitude)
                hotspots_dict[c_id]["cities"].add(s.city)
                hotspots_dict[c_id]["countries"].add(s.country)

            station_results.append({
                "id": s.id,
                "station_id": s.station_id,
                "name": s.station_name,
                "country": s.country,
                "city": s.city,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "power_kw": s.charging_power_kw,
                "demand_score": s.demand_score,
                "cluster_id": c_id,
                "is_hotspot": not is_noise,
                "is_noise": is_noise
            })

        formatted_hotspots = []
        for c_id, stats in hotspots_dict.items():
            count = max(1, stats["station_count"])
            stats["avg_power_kw"] = round(stats["avg_power_kw"] / count, 1)
            stats["avg_demand_score"] = round(stats["avg_demand_score"] / count, 1)
            stats["centroid_lat"] = round(float(np.mean(stats["lats"])), 6)
            stats["centroid_lng"] = round(float(np.mean(stats["lngs"])), 6)
            stats["cities"] = list(stats["cities"])
            stats["countries"] = list(stats["countries"])
            del stats["lats"]
            del stats["lngs"]
            formatted_hotspots.append(stats)

        # Sort hotspots by station count descending
        formatted_hotspots.sort(key=lambda x: x["station_count"], reverse=True)

        return {
            "algorithm": "dbscan",
            "eps_km": float(eps_km),
            "min_samples": min_pts,
            "total_stations": len(stations),
            "hotspots_count": n_clusters,
            "noise_count": noise_count,
            "hotspots": formatted_hotspots,
            "stations": station_results
        }

clustering_service = ClusteringService()
