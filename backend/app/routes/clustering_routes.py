"""
Clustering API Routes:
Geographic clustering using KMeans and DBSCAN with haversine distance.
"""
from flask import Blueprint, request, jsonify
from app.ml.clustering_service import clustering_service

clustering_bp = Blueprint("clustering", __name__, url_prefix="/api")

@clustering_bp.route("/cluster-locations", methods=["POST", "GET"])
def cluster_locations():
    if request.method == "POST":
        data = request.get_json() or {}
        algorithm = data.get("algorithm", "kmeans").lower()
        country = data.get("country")

        if algorithm == "dbscan":
            eps_km = float(data.get("eps_km", 80.0))
            min_samples = int(data.get("min_samples", 4))
            result = clustering_service.cluster_dbscan(eps_km=eps_km, min_samples=min_samples, country_filter=country)
        else:
            k = int(data.get("k", 8))
            result = clustering_service.cluster_kmeans(n_clusters=k, country_filter=country)

        return jsonify(result), 200

    else:
        # GET default returns KMeans (k=8)
        algo = request.args.get("algorithm", "kmeans").lower()
        country = request.args.get("country")
        if algo == "dbscan":
            eps_km = float(request.args.get("eps_km", 80.0))
            min_samples = int(request.args.get("min_samples", 4))
            result = clustering_service.cluster_dbscan(eps_km=eps_km, min_samples=min_samples, country_filter=country)
        else:
            k = int(request.args.get("k", 8))
            result = clustering_service.cluster_kmeans(n_clusters=k, country_filter=country)

        return jsonify(result), 200
