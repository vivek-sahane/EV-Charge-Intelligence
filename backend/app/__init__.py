"""
EV Charge Intelligence - Flask Application Factory
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from app.config.config import Config
from app.models.models import db
from app.seeds.seed_data import seed_database

# Blueprints
from app.routes.auth_routes import auth_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.demand_routes import demand_bp
from app.routes.growth_routes import growth_bp
from app.routes.clustering_routes import clustering_bp
from app.routes.compatibility_routes import compatibility_bp
from app.routes.dataset_routes import dataset_bp
from app.routes.chat_routes import chat_bp
from app.routes.system_routes import system_bp

jwt = JWTManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend clients
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(demand_bp)
    app.register_blueprint(growth_bp)
    app.register_blueprint(clustering_bp)
    app.register_blueprint(compatibility_bp)
    app.register_blueprint(dataset_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(system_bp)

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": "The requested API endpoint was not found."}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"error": "Payload Too Large", "message": "Uploaded file exceeds maximum size limit (32MB)."}), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal Server Error", "message": "An unexpected server error occurred."}), 500

    # Ensure tables exist and seed demo data if unpopulated
    with app.app_context():
        try:
            db.create_all()
            seed_database()
        except Exception as e:
            app.logger.warning(f"Database auto-seed check notice: {str(e)}")

    return app
