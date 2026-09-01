# CarbonLens: AI-Powered Cloud Cost & Carbon Intelligence

> **Cloud FinOps & GreenOps Intelligence Copilot**  
> Autonomous Anomaly Detection, Machine-Learned Root-Cause Investigation, and Carbon-Aware Workload Scheduling for Modern Cloud Infrastructure.

---

## 🌟 Executive Summary & Problem Statement

Cloud engineering teams provision infrastructure in seconds, while billing visibility often lags hours or days behind real usage. Unchecked runaway autoscaling, recursive serverless loops, unindexed database query storms, and unutilized GPU clusters create catastrophic cost spikes and carbon waste before FinOps teams can react.

**CarbonLens** transcends passive dashboards by providing an active **AI FinOps + GreenOps Copilot** that:
1. **Ingests real-time cloud usage and billing telemetry** across EC2, Lambda, S3, RDS, EKS, and SageMaker.
2. **Detects cost and usage anomalies** via unsupervised Machine Learning (*Isolation Forest* + rolling statistical baselines).
3. **Pinpoints root causes** using structured AI reasoning (*What Happened, Why, Business Impact, and Step-by-Step Remediation*).
4. **Tracks grid marginal carbon intensity (gCO₂e/kWh)** across multi-cloud global regions (Mumbai, Hyderabad, Singapore, Frankfurt, N. Virginia).
5. **Optimizes flexible workloads** using a multi-objective solver balancing spot pricing, diurnal solar valleys, and SLA deadlines.
6. **Delivers interactive "What-If?" migration simulation** to forecast financial and carbon ROI before shifting jobs.

---

## 🏛️ System Architecture

```
                                 CARBONLENS ARCHITECTURE
                                 
      +-------------------------------------------------------------------------+
      |                           CarbonLens Web UI                             |
      |   React 18 + TypeScript + Vite + Tailwind CSS + Lucide + Recharts       |
      |   (Dual Currency: INR ₹ / USD $, Real-Time Event Stream, What-If Slider) |
      +------------------------------------+------------------------------------+
                                           | HTTP / REST & SSE Stream
                                           v
      +-------------------------------------------------------------------------+
      |                           FastAPI Backend                               |
      | +---------------------------------------------------------------------+ |
      | | REST Endpoints: /dashboard, /cost, /anomalies, /ai, /carbon,        | |
      | |                 /scheduler, /resources, /events, /reports, /settings| |
      | +---------------------------------------------------------------------+ |
      |                                    |                                    |
      | +----------------------------------v----------------------------------+ |
      | |                        Core Engine Services                         | |
      | |  - ML Anomaly Engine (Isolation Forest & Rolling Z-Score Detector)  | |
      | |  - AI Cost Investigator (OpenAI / Claude / FinOps Expert LLM)       | |
      | |  - Carbon Engine (Diurnal Solar Curves & Regional Grid Tracking)    | |
      | |  - Smart Scheduler (Multi-Objective Optimization Algorithm)         | |
      | |  - What-If Time-Shift Simulator (Dynamic Delta Calculator)          | |
      | |  - Simulation Pipeline (5 One-Click Hackathon Scenarios)            | |
      | |  - Report Engine (Executive Summaries & CSV Exports)                | |
      | +----------------------------------+----------------------------------+ |
      |                                    |                                    |
      | +----------------------------------v----------------------------------+ |
      | |                Persistence Layer: SQLAlchemy 2.0                    | |
      | |   (CloudResource, UsageEvent, BillingEvent, Anomaly, ScheduledJob)   | |
      | +---------------------------------------------------------------------+ |
      +-------------------------------------------------------------------------+
```

---

## 🚀 Key Features & Capabilities

### 1. 📊 Executive Cloud Intelligence Dashboard
- **6 Real-time KPIs**: Current Spend (₹/day, +/- % trend), Projected Monthly Cost, Active Anomalies count, Carbon Footprint (tCO₂e), Potential Monthly Savings, and GreenOps reduction potential.
- **Spend vs Baseline Trajectory**: Area chart visualizing actual usage against ML projected baselines.
- **Live Regional Carbon Pulse**: Instant grid health across ap-south-1 (Mumbai), ap-south-2 (Hyderabad), ap-southeast-1 (Singapore), eu-central-1 (Frankfurt), and us-east-1 (Virginia).

### 2. ⚡ Unsupervised ML Anomaly Detection
- **Isolation Forest + Rolling Z-Score Engine**: Evaluates metric feature vectors `[cost_rate, cpu_pct, request_count, error_rate, instance_count, retry_rate]` to classify severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Telemetry Correlation**: Distinguishes between legitimate user traffic spikes and anomalous runaway scaling.

### 3. 🧠 AI Cost Investigator (Root-Cause Engine)
- Structured AI diagnosis structured into:
  - **What Happened**: Clear 2-sentence summary with exact percentage surge.
  - **Why Did It Happen**: Correlated telemetry breakdown (e.g. 504 timeouts triggering unthrottled ASG expansion).
  - **Business Impact**: Projected daily/monthly financial loss and carbon impact.
  - **Recommended Action**: Step-by-step remediation guide.
  - **Remediation CLI Snippet**: 1-click copyable AWS CLI / Terraform command to immediately apply guardrails.
- **Provider Abstraction**: Live support for **OpenAI (GPT-4o)**, **Anthropic (Claude 3)**, and a built-in **Deterministic Local FinOps Engine** that runs offline with zero external API keys.

### 4. 🌿 Carbon Intelligence & Diurnal Curves
- 24-hour solar and off-peak wind grid intensity curve modeling (gCO₂e/kWh).
- Workload carbon accounting formula:  
  $$\text{Emissions} (\text{gCO}_2) = \text{Compute Units} \times \text{kW/unit} \times \text{Duration (hr)} \times \text{Grid Intensity} (\text{gCO}_2/\text{kWh})$$

### 5. ⏱️ Smart Carbon-Aware Scheduler
- Autonomous multi-objective optimization solver minimizing:
  $$\text{Score} = (w_{\text{cost}} \cdot \text{NormCost}) + (w_{\text{carbon}} \cdot \text{NormCarbon}) + \text{DeadlinePenalty}$$
- Automatically maps delay-tolerant batch, ETL, and AI training workloads to the cleanest, cheapest grid execution window.

### 6. 🎛️ Interactive "What-If?" Time-Shift Simulator
- Dual interactive time sliders allowing engineers to test moving workloads from e.g. 3:00 PM to 3:00 AM.
- Live animated recalculation of cost delta, emissions delta, schedule delay, and annualized savings.

### 7. 📑 Automated Reports & CSV Exports
- One-click executive Markdown preview and real CSV downloads for:
  - Raw Billing Events
  - Cloud Inventory Registry
  - Anomaly & Incident Logs
  - Optimization Recommendations

---

## 🎬 Hackathon Live Demo Scenarios

The top navigation features a 1-click scenario launcher for live presentations:

| # | Scenario Name | Triggered Behavior |
|---|---|---|
| **1** | **Runaway Autoscaling** | Simulates EC2 instance expansion (8 → 31 nodes) due to retry storm; triggers ML detector (+284% surge) & AI remediation. |
| **2** | **Retry Loop Storm** | Simulates recursive S3-to-Lambda invocation storm (142k invocations/min); generates concurrency throttle alert. |
| **3** | **Idle GPU Resource** | Identifies unutilized H100 GPU cluster (ml.p4de) burning ₹840/hr post-training. |
| **4** | **Carbon Batch Shift** | Optimizes AI fine-tuning job: shifts window from 3:00 PM to 03:00 AM saving ₹320 (17.4%) and cutting 26.2% carbon. |
| **5** | **Multi-Region Comparison** | Audits workloads against Frankfurt and N. Virginia grids with up to 42% lower marginal emissions. |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti.
- **Backend**: Python FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2.
- **Machine Learning**: scikit-learn (*Isolation Forest*), NumPy, Pandas.
- **AI Engine**: OpenAI API, Anthropic Claude API, Local Deterministic FinOps Provider.
- **Database**: SQLite (WAL Mode) with abstracted ORM ready for PostgreSQL.

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run backend API server (runs on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`** to access CarbonLens.

---

## 🧪 Running Automated Tests

Run the test suite validating ML anomaly detection, AI explanation, Scheduler optimization, and CSV export:

```bash
python -m unittest backend/tests/test_api.py
```

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Executive KPIs, spend trends, carbon pulse |
| `GET` | `/api/cost/timeseries` | Historical & projected cost time series |
| `GET` | `/api/cost/breakdown` | Multi-dimensional spend by service, env, region |
| `GET` | `/api/anomalies` | List ML-detected anomalies with filter |
| `POST` | `/api/anomalies/{id}/explain` | Run AI Cost Investigator root-cause analysis |
| `GET` | `/api/carbon/summary` | Regional carbon intensities and 24h diurnal curve |
| `POST` | `/api/scheduler/optimize` | Multi-objective workload scheduling optimizer |
| `POST` | `/api/scheduler/what-if` | Interactive time-shift migration calculator |
| `POST` | `/api/simulation/cost-spike` | Triggers live abnormal usage spike pipeline |
| `POST` | `/api/simulation/trigger-scenario` | Executes one of the 5 demo scenarios |
| `GET` | `/api/reports/export/csv` | Downloads real CSV export (billing, resources, anomalies) |
| `GET` | `/api/health` | System health check |

---

## 🌿 CarbonLens: Empowering Sustainable Cloud FinOps
Built with precision for enterprise scalability, financial transparency, and ecological stewardship.
