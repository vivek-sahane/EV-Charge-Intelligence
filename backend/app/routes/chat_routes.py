"""
Chatbot API Routes:
Conversational interface endpoint with function calling, session management, and history.
"""
import uuid
from flask import Blueprint, request, jsonify
from app.chatbot.assistant_service import assistant_service
from app.models.models import db, ChatSession, ChatMessage

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    session_id = data.get("session_id") or f"session_{uuid.uuid4().hex[:12]}"

    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    try:
        response = assistant_service.process_message(
            session_id=session_id,
            message=message
        )
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": f"Assistant error: {str(e)}"}), 500

@chat_bp.route("/history", methods=["GET"])
def history():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id parameter required."}), 400

    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()
    return jsonify({
        "session_id": session_id,
        "messages": [m.to_dict() for m in messages]
    }), 200

@chat_bp.route("/history", methods=["DELETE"])
def clear_history():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id parameter required."}), 400

    ChatMessage.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    return jsonify({"message": f"History for session {session_id} cleared."}), 200

@chat_bp.route("/sessions", methods=["GET"])
def sessions():
    all_sessions = ChatSession.query.order_by(ChatSession.updated_at.desc()).limit(20).all()
    return jsonify({"sessions": [s.to_dict() for s in all_sessions]}), 200
