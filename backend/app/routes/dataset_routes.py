"""
Dataset Management Routes:
CSV upload, validation, previews, listing, downloads, and deletion.
"""
import os
from flask import Blueprint, request, jsonify, send_file
from app.services.dataset_service import dataset_service
from app.models.models import db, DatasetRecord

dataset_bp = Blueprint("dataset", __name__, url_prefix="/api/datasets")

@dataset_bp.route("/upload", methods=["POST"])
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file part in upload request."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    custom_name = request.form.get("name")
    try:
        result = dataset_service.process_csv_upload(file, custom_name)
        return jsonify({
            "message": "Dataset uploaded, cleaned, and ingested successfully.",
            "data": result
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Upload processing error: {str(e)}"}), 500

@dataset_bp.route("", methods=["GET"])
def get_datasets():
    datasets = dataset_service.get_datasets_list()
    return jsonify({"datasets": datasets}), 200

@dataset_bp.route("/preview", methods=["GET"])
def preview():
    dataset_id = request.args.get("dataset_id")
    if not dataset_id:
        # Return first available or active dataset
        rec = DatasetRecord.query.first()
        if not rec:
            return jsonify({"error": "No datasets found."}), 404
        dataset_id = rec.id

    data = dataset_service.get_dataset_preview(int(dataset_id))
    if not data:
        return jsonify({"error": "Dataset preview unavailable."}), 404
    return jsonify(data), 200

@dataset_bp.route("/<int:dataset_id>", methods=["DELETE"])
def delete_dataset(dataset_id):
    rec = DatasetRecord.query.get(dataset_id)
    if not rec:
        return jsonify({"error": "Dataset not found."}), 404

    try:
        if os.path.exists(rec.file_path):
            os.remove(rec.file_path)
    except Exception:
        pass

    db.session.delete(rec)
    db.session.commit()
    return jsonify({"message": f"Dataset {dataset_id} deleted successfully."}), 200

@dataset_bp.route("/<int:dataset_id>/download", methods=["GET"])
def download_dataset(dataset_id):
    rec = DatasetRecord.query.get(dataset_id)
    if not rec or not os.path.exists(rec.file_path):
        return jsonify({"error": "Dataset file not found on disk."}), 404

    return send_file(
        rec.file_path,
        as_attachment=True,
        download_name=f"cleaned_{rec.filename}"
    )
