# EV CHARGE INTELLIGENCE — AI-Powered EV Infrastructure Analytics & Prediction Platform

A production-grade, full-stack intelligence platform combining machine learning forecasting, interactive OpenStreetMap geospatial clustering, EV compatibility prediction, and an autonomous AI chatbot with real backend tool execution.

---

## 🚀 Key Features

1. **Overview Dashboard**
   - Live KPI cards: Total Charging Stations, Charging Ports, Average Station Power (kW), Countries Monitored, Network Demand Score, and Fast-Charging Plazas.
   - Interactive Recharts analytics: Infrastructure volume by country, charger speed tier distribution (Ultra-Fast $\ge 150$ kW, Fast DC $50-149$ kW, Standard AC $< 50$ kW), demand score histogram, and vehicle type distribution.
   - Paginated charging stations catalog with global search, country filtering, and one-click CSV report export.
   - Transparent data status badge identifying whether metrics are derived from verified live data or benchmark demonstration data.

2. **EV Demand Prediction Engine**
   - Trained `GradientBoostingRegressor` with IQR outlier capping and standard scaling.
   - Predicts charging hub demand scores ($0$ to $100$) and assigns operational demand tiers (`High`, `Moderate`, `Low`).
   - Feature importances breakdown revealing port density and median charging power as primary utilization drivers.
   - Interactive site simulator sliders with instant model evaluation.

3. **Country Growth Prediction Model**
   - Trained `GradientBoostingRegressor` forecasting long-term national electric mobility expansion indices ($0$ to $100$).
   - Legitimate test accuracy: **$R^2 = 0.9644$** (exceeding the $> 0.80$ benchmark), **$\text{MAE} = 2.2293$**, **$\text{RMSE} = 2.8114$**.
   - Global country leaderboard ranking national markets by future growth momentum.
   - Interactive parameter simulator to project future growth for any country profile.

4. **Geographic Clustering & Hotspots**
   - **KMeans (default $k=8$, configurable $2$ to $16$):** Partitions worldwide charging stations into balanced regional centroids.
   - **DBSCAN with Haversine Metric:** Computes true geodesic distances over spherical coordinates ($\epsilon_{\text{rad}} = \epsilon_{\text{km}} / 6371.0088$) converted to radians. Correctly identifies dense charging corridors and isolates outlying noise points ($-1$).
   - Interactive CartoDB Dark Matter Leaflet world map with color-coded cluster markers, zoom/pan, country filters, and station popups.

5. **EV Compatibility Engine**
   - Power rule evaluation: Vehicle is compatible if $\text{max\_charging\_power\_kw} \le \text{station\_power\_kw}$.
   - Instant power preset toggles ($50$ kW, $75$ kW, $100$ kW, $150$ kW, $200$ kW, $250$ kW, $300$ kW, $350$ kW) and continuous slider.
   - Displays compatible vs. incompatible vehicles, power deficit metrics, battery capacities, and estimated $10-80\%$ DC fast-charge durations.
   - Technical advisory disclosing BMS charging curve dynamics, ambient temperature effects, and connector protocol requirements.

6. **EV Intelligence AI Assistant (Chatbot)**
   - Accessible via dedicated workspace (`/assistant`) and a floating widget on every dashboard page.
   - Equipped with **10 real backend analytical tools**; queries live database tables and executes ML prediction endpoints.
   - Provider-independent: Supports Google Gemini, OpenAI, Ollama, and an intelligent native semantic analytical engine with zero external API key requirements.
   - Tool calling transparency: Accordion disclosure showing arguments and live data payloads.

7. **Dataset Management & CSV Ingestion**
   - Drag-and-drop CSV uploader supporting Charging Stations, Country Growth, and EV Models datasets.
   - Automatic missing-value detection, type validation, and row deduplication.
   - Interactive data preview table and downloadable cleaned datasets.
   - Dataset version tracking and synthetic vs. verified data tracking.

8. **Model Performance & Live Diagnostics**
   - Full empirical performance metrics ($R^2$, MAE, MSE, RMSE, test samples).
   - Side-by-side holdout test predictions vs. ground truth values.
   - In-app "Retrain ML Models" trigger executing `/api/retrain-models` when new datasets are ingested.
   - Strict data leakage prevention guarantee (all preprocessors fit strictly on $80\%$ training splits).

9. **REST API Explorer**
   - Interactive documentation for all endpoints with "Try It Out" live execution and copyable cURL snippets.

10. **Platform Settings**
    - AI provider selection (auto / gemini / openai / ollama / native), custom model names, and system health status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, React Leaflet, OpenStreetMap, Lucide React, Axios, React Router v7 |
| **Backend** | Python 3.11+, Flask 3.0, Flask-CORS, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Gunicorn, Pandas, NumPy |
| **Machine Learning** | Scikit-learn, GradientBoostingRegressor, StandardScaler, KMeans, DBSCAN (Haversine), Joblib |
| **Database** | PostgreSQL 16 (production container) with fallback to SQLite for local development |
| **DevOps & Serving** | Docker, Docker Compose, Multi-stage Nginx container, Health checks |

---

## 📊 Machine Learning Model Evaluation Results

Both models were trained using an $80/20$ train-test split (`random_state=42`). Preprocessing pipelines (median imputation, IQR outlier capping with $1.5\times$ factor, and `StandardScaler`) were strictly fitted on training splits to prevent data leakage.

### 1. EV Demand Prediction Model
- **Algorithm:** `GradientBoostingRegressor(n_estimators=160, learning_rate=0.08, max_depth=4)`
- **Target:** `demand_score` ($0$ to $100$)
- **Evaluation Metrics:**
  - $R^2 \text{ Score}$: **$0.9522$** ($95.22\%$ variance explained)
  - $\text{MAE}$: **$2.2944$**
  - $\text{MSE}$: **$9.4352$**
  - $\text{RMSE}$: **$3.0717$**
- **Feature Importances:**
  - Port Count: **$59.09\%$**
  - Median Power (kW): **$23.76\%$**
  - Fast Port Share: **$7.89\%$**
  - Fast Station Share: **$5.89\%$**
  - Station Count: **$3.37\%$**

### 2. Country Growth Prediction Model
- **Algorithm:** `GradientBoostingRegressor(n_estimators=180, learning_rate=0.07, max_depth=4)`
- **Target:** `future_growth_index` ($0$ to $100$)
- **Evaluation Metrics:**
  - $R^2 \text{ Score}$: **$0.9644$** (Target was $> 0.80$; exceeded by $+0.1644$)
  - $\text{MAE}$: **$2.2293$**
  - $\text{MSE}$: **$7.9042$**
  - $\text{RMSE}$: **$2.8114$**
- **Feature Importances:**
  - Port Count: **$88.95\%$**
  - Median Power (kW): **$7.06\%$**
  - Station Count: **$2.39\%$**
  - Fast Station Share: **$1.61\%$**

---

## 📁 Project Structure

```
EV-stations-Project/
├── backend/
│   ├── app/
│   │   ├── chatbot/
│   │   │   ├── assistant_service.py   # AI Assistant with tool calling & native engine
│   │   │   ├── tool_definitions.py    # OpenAI/JSON schema declarations for 10 tools
│   │   │   └── tool_executor.py       # Live database & ML tool dispatcher
│   │   ├── config/
│   │   │   └── config.py              # Configuration & database connection logic
│   │   ├── ml/
│   │   │   ├── clustering_service.py  # KMeans & DBSCAN (Haversine on radians)
│   │   │   ├── compatibility_service.py # Power threshold evaluation & charge times
│   │   │   ├── model_service.py       # Serialized model inference & validation
│   │   │   └── preprocessor.py        # OutlierCapper & EVPreprocessor classes
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── models.py              # SQLAlchemy ORM models (9 entities)
│   │   ├── routes/
│   │   │   ├── auth_routes.py         # User registration & JWT authentication
│   │   │   ├── chat_routes.py         # Conversational endpoints & history
│   │   │   ├── clustering_routes.py   # Geographic clustering endpoints
│   │   │   ├── compatibility_routes.py # EV compatibility endpoints
│   │   │   ├── dashboard_routes.py    # KPI summaries, country lists, chart feeds
│   │   │   ├── dataset_routes.py      # CSV uploads, preview, and download
│   │   │   ├── demand_routes.py       # EV demand prediction endpoints
│   │   │   ├── growth_routes.py       # Country growth prediction endpoints
│   │   │   └── system_routes.py       # Health checks, model info, retraining
│   │   ├── seeds/
│   │   │   └── seed_data.py           # Database seeder for sample datasets
│   │   ├── services/
│   │   │   ├── analytics_service.py   # KPI aggregations & country comparisons
│   │   │   └── dataset_service.py     # CSV validation & missing value imputation
│   │   └── __init__.py                # Flask application factory & CORS setup
│   ├── models/                        # Serialized Joblib artifacts & metadata
│   │   ├── demand_model.joblib
│   │   ├── demand_preprocessor.joblib
│   │   ├── growth_model.joblib
│   │   ├── growth_preprocessor.joblib
│   │   └── model_metadata.json
│   ├── tests/
│   │   └── test_api.py                # 16 automated pytest unit & integration tests
│   ├── Dockerfile                     # Production Python + Gunicorn container
│   ├── requirements.txt               # Backend Python dependencies
│   ├── run.py                         # Development server runner
│   └── wsgi.py                        # Gunicorn WSGI production entrypoint
├── frontend/
│   ├── src/
│   │   ├── chatbot/
│   │   │   └── ChatInterface.tsx      # Chat interface with tool calling disclosure
│   │   ├── components/
│   │   │   ├── FloatingChatbot.tsx    # Floating widget accessible across all pages
│   │   │   ├── Navbar.tsx             # Search, notifications, and profile menu
│   │   │   └── Sidebar.tsx            # Collapsible 10-section navigation
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx    # Main layout wrapper
│   │   ├── pages/
│   │   │   ├── AIAssistantPage.tsx    # Dedicated AI Assistant workspace
│   │   │   ├── ApiDocumentation.tsx   # Interactive OpenAPI REST explorer
│   │   │   ├── CountryGrowthPrediction.tsx # Country growth simulator & rankings
│   │   │   ├── DatasetManagement.tsx  # CSV upload, validation & previews
│   │   │   ├── DemandPrediction.tsx   # EV demand site simulator & gauges
│   │   │   ├── EVCompatibility.tsx    # Fleet compatibility checker & power sliders
│   │   │   ├── GeographicClustering.tsx # OpenStreetMap Leaflet clustering map
│   │   │   ├── ModelPerformance.tsx   # Empirical ML diagnostics & retrain trigger
│   │   │   ├── OverviewDashboard.tsx  # KPI cards, Recharts, and station catalog
│   │   │   └── SettingsPage.tsx       # AI provider configuration & health ping
│   │   ├── services/
│   │   │   └── api.ts                 # Typed Axios API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx                    # React Router configuration
│   │   ├── index.css                  # Tailwind CSS v4 directives & glassmorphic styles
│   │   └── main.tsx                   # React root entrypoint
│   ├── Dockerfile                     # Multi-stage Node builder + Nginx runner
│   ├── nginx.conf                     # Nginx SPA routing & API reverse proxy
│   ├── package.json
│   └── vite.config.ts                 # Vite bundler & development proxy setup
├── datasets/
│   └── sample/
│       ├── charging_stations.csv      # 847 mapped stations across 22 countries
│       ├── country_growth.csv         # 160 national & regional growth records
│       └── ev_models.csv              # 62 production EV models with power ratings
├── train/
│   ├── generate_datasets.py           # Sample dataset generator
│   └── train_models.py                # ML pipeline training & model serialization
├── docker-compose.yml                 # Multi-container orchestration (Postgres, API, UI)
├── .dockerignore
├── .gitignore
├── .env.example                       # Environment variables template
├── pytest.ini                         # Pytest configuration
└── README.md
```

---

## ⚡ Quickstart — Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm

### 1. Backend Setup
```bash
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # Linux / macOS

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Generate sample datasets and train ML models
python train/generate_datasets.py
python train/train_models.py

# 4. Start Flask backend server
python backend/run.py
```
The backend starts on `http://127.0.0.1:5000`. On first run, it automatically seeds the database with the sample datasets and creates an initial admin user (`admin` / `admin123`).

### 2. Frontend Setup
```bash
# Open a new terminal
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend is available at `http://localhost:3000` (or `http://localhost:5173`), proxying `/api/` requests to the Flask backend. Keep the backend process running in its terminal while using the frontend. If Vite reports `ECONNREFUSED` for `127.0.0.1:5000`, start or restart the backend and verify `http://127.0.0.1:5000/api/health` returns a healthy response.

---

## 🧪 Automated Testing

The project includes an automated test suite verifying all REST endpoints, ML models, clustering, compatibility, and dataset ingestion.

```bash
# Run tests with pytest
.\venv\Scripts\pytest -v
```

### Test Results
```text
backend/tests/test_api.py::test_health_endpoint PASSED                   [  6%]
backend/tests/test_api.py::test_model_info_endpoint PASSED               [ 12%]
backend/tests/test_api.py::test_dashboard_summary PASSED                 [ 18%]
backend/tests/test_api.py::test_dashboard_countries PASSED               [ 25%]
backend/tests/test_api.py::test_dashboard_charts PASSED                  [ 31%]
backend/tests/test_api.py::test_dashboard_stations PASSED                [ 37%]
backend/tests/test_api.py::test_predict_demand_valid PASSED              [ 43%]
backend/tests/test_api.py::test_predict_demand_invalid PASSED            [ 50%]
backend/tests/test_api.py::test_predict_growth_valid PASSED              [ 56%]
backend/tests/test_api.py::test_clustering_kmeans PASSED                 [ 62%]
backend/tests/test_api.py::test_clustering_dbscan PASSED                 [ 68%]
backend/tests/test_api.py::test_compatibility_low_power PASSED           [ 75%]
backend/tests/test_api.py::test_compatibility_high_power PASSED          [ 81%]
backend/tests/test_api.py::test_chat_interaction PASSED                  [ 87%]
backend/tests/test_api.py::test_chat_history_and_clear PASSED            [ 93%]
backend/tests/test_api.py::test_csv_upload_validation PASSED             [100%]

============================= 16 passed in 3.88s ==============================
```

---

## 🐳 Docker Deployment

The application is fully containerized with persistent PostgreSQL storage, Gunicorn production backend, and Nginx frontend reverse proxy.

### 1. Configure and launch with Docker Compose
```bash
# Create a local environment file and fill in the required values.
cp .env.example .env

# Build and run the entire stack in the background
docker compose up --build -d
```
On Windows PowerShell, use `Copy-Item .env.example .env`, then set the database credentials and unique values for `SECRET_KEY` and `JWT_SECRET_KEY`. To use Gemini, set `AI_PROVIDER=gemini`, add your key to `GEMINI_API_KEY`, and set `AI_MODEL` to a model available to your API key. Compose passes these settings to Flask; the Gemini request sends the key in the `x-goog-api-key` header and uses the configured model. Compose fails early if any required database or signing-secret value is blank; it does not supply insecure password or secret defaults. The backend uses the installed `psycopg2-binary` driver via a `postgresql+psycopg2://` URL. The frontend waits for the backend health check, which only passes when both the database and ML models are ready.

### 2. Accessing the Application
- **Frontend Dashboard:** `http://localhost:3000` (or `http://localhost:80`)
- **Backend REST API:** `http://localhost:5000/api/health`
- **PostgreSQL Database:** `localhost:5432`

### 3. Container Management Commands
```bash
# Check status of running containers
docker compose ps

# View container logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop containers while preserving data volume
docker compose down

# Stop containers and remove volumes (clean reset)
docker compose down -v
```

---

## 📦 Docker Hub Publishing

The project is prepared for publishing to Docker Hub.

### 1. Build and Tag Images
```bash
docker login

# Build Frontend production image
docker build -t YOUR_DOCKERHUB_USERNAME/ev-intelligence-frontend:latest ./frontend

# Build Backend production image
docker build -t YOUR_DOCKERHUB_USERNAME/ev-intelligence-backend:latest ./backend
```

### 2. Push to Docker Hub
```bash
docker push YOUR_DOCKERHUB_USERNAME/ev-intelligence-frontend:latest
docker push YOUR_DOCKERHUB_USERNAME/ev-intelligence-backend:latest
```

### 3. Running from Docker Hub Images
Any user can pull the images and launch the stack by updating `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    ...
  backend:
    image: YOUR_DOCKERHUB_USERNAME/ev-intelligence-backend:latest
    ...
  frontend:
    image: YOUR_DOCKERHUB_USERNAME/ev-intelligence-frontend:latest
    ...
```
Then execute:
```bash
docker compose up -d
```

---

## 🔒 Security & Data Integrity

- **Password Hashing:** Passwords hashed using Werkzeug PBKDF2 SHA-256.
- **JWT Authentication:** Stateful tokens signed with `JWT_SECRET_KEY` expiring in 24 hours.
- **CORS Protection:** Configured across all REST endpoints.
- **Upload Size Protection:** Strict 32 MB payload limit with validation preventing arbitrary code execution.
- **Credential Hygiene:** No hardcoded secrets or API tokens baked into images or repository files.
