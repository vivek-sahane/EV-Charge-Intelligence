import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    if os.getenv("FLASK_ENV") == "production" and (not SECRET_KEY or not JWT_SECRET_KEY):
        raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be set in production.")
    SECRET_KEY = SECRET_KEY or secrets.token_urlsafe(32)
    JWT_SECRET_KEY = JWT_SECRET_KEY or secrets.token_urlsafe(32)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Database Configuration: PostgreSQL support with fallback to SQLite for local development
    DATABASE_URL = os.getenv("DATABASE_URL")
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or f"sqlite:///{os.path.join(BASE_DIR, 'ev_charge.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads directory
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max
    ALLOWED_EXTENSIONS = {"csv"}

    # ML Models path
    MODEL_DIR = os.path.join(BASE_DIR, "models")
    SAMPLE_DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "datasets", "sample")

    # AI Chatbot settings
    AI_PROVIDER = os.getenv("AI_PROVIDER", "auto")  # 'gemini', 'openai', 'ollama', 'auto'
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    AI_MODEL = os.getenv("AI_MODEL", "gemini-1.5-flash")

    # Rate limiting / timeouts
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
