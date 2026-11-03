"""
Dashboard API Routes:
Summary KPIs, Country data, Chart feeds, and Paginated Station records.
"""
from flask import Blueprint, request, jsonify
from app.services.analytics_service import analytics_service
from app.models.models import ChargingStation

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/summary", methods=["GET"])
def summary():
    data = analytics_service.get_summary_metrics()
    return jsonify(data), 200

@dashboard_bp.route("/countries", methods=["GET"])
def countries():
    data = analytics_service.get_countries_summary()
    return jsonify(data), 200

@dashboard_bp.route("/charts", methods=["GET"])
def charts():
    data = analytics_service.get_charts_data()
    return jsonify(data), 200

@dashboard_bp.route("/stations", methods=["GET"])
def stations():
    page = int(request.args.get("page", 1))
    per_page = min(100, int(request.args.get("per_page", 20)))
    country = request.args.get("country")
    search = request.args.get("search")

    query = ChargingStation.query
    if country and country.lower() != "all":
        query = query.filter(ChargingStation.country.ilike(f"%{country}%"))
    if search:
        query = query.filter(
            (ChargingStation.station_name.ilike(f"%{search}%")) |
            (ChargingStation.city.ilike(f"%{search}%")) |
            (ChargingStation.station_id.ilike(f"%{search}%"))
        )

    total = query.count()
    items = query.order_by(ChargingStation.id.asc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1,
        "stations": [s.to_dict() for s in items]
    }), 200
