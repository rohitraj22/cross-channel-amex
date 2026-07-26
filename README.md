# NexusStitch 360: Cross-Channel Identity Resolution & Event-Stitching Platform

> **American Express Customer Experience Platform**  
> A real-time, explainable identity resolution and event-stitching platform that links customer interactions across **Mobile App**, **Web Portal**, **Call Center**, and **In-Person Lounges/Branches** into a single 360° customer journey timeline.

**GitHub Repository**: [https://github.com/rohitraj22/cross-channel-amex](https://github.com/rohitraj22/cross-channel-amex)

---

## Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [Machine Learning & System Algorithms](#-machine-learning--system-algorithms)
  - [1. PyTorch Geometric GNN & GNNExplainer (Identity Link Prediction)](#1-pytorch-geometric-gnn--gnnexplainer-identity-link-prediction)
  - [2. GBDT & SHAP Explainable Churn Risk Model](#2-gbdt--shap-explainable-churn-risk-model)
  - [3. Explainable Journey Friction Index Algorithm](#3-explainable-journey-friction-index-algorithm)
  - [4. Apache Flink Stateful Sliding Windowing Algorithm](#4-apache-flink-stateful-sliding-windowing-algorithm)
  - [5. Neo4j Graph Traversal & Connected Community Detection](#5-neo4j-graph-traversal--connected-community-detection)
  - [6. ClickHouse SIMD Columnar Analytical Engine](#6-clickhouse-simd-columnar-analytical-engine)
- [Quick Start Guide for Collaborators](#-quick-start-guide-for-collaborators)
  - [1. Cloning the Repository](#1-cloning-the-repository)
  - [2. Pulling Latest Changes](#2-pulling-latest-changes)
  - [3. Running the Project (One-Command)](#3-running-the-project-one-command-recommended)
  - [4. Running Manually (Two Terminals)](#4-running-manually-two-terminals)
- [Data Architecture & Dataset Schemas](#-data-architecture--dataset-schemas)
- [Dashboard Features & Navigation](#-dashboard-features--navigation)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Repository Structure](#-repository-structure)
- [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## Overview & Problem Statement

Customer data is often siloed across distinct channel databases, making it nearly impossible to understand the full customer journey, pinpoint where service breaks down, or intervene before high-value customers churn.

**NexusStitch 360** solves this challenge by delivering:
1. **Cross-Channel Identity Resolution**: Merges disparate customer touchpoints into a unified identity graph using deterministic identifier matching and probabilistic GNN link prediction.
2. **Stateful Event-Stitching**: Connects events occurring across different channels within sliding time windows (e.g. stitching a website error to a call center dial 4 minutes later).
3. **Zero-Blackbox Machine Learning**: Provides full SHAP feature attributions and GNNExplainer subgraph path interpretations for every churn prediction and identity link.
4. **Clean Executive Light Dashboard**: A clean, intuitive dashboard with instant customer search, multi-criteria filtering, sorting, and symmetrical tab views.

---

## Machine Learning & System Algorithms

NexusStitch 360 avoids blackbox AI models by enforcing strict explainability across all machine learning and algorithmic layers.

### 1. PyTorch Geometric GNN & GNNExplainer (Identity Link Prediction)
- **Model Type**: Graph Convolutional Network (GCN) / Graph Attention Network (GAT) built using **PyTorch Geometric (`torch_geometric`)**.
- **Task**: Pairwise Identity Link Prediction between graph nodes (`cust_id`, `email`, `phone`, `cookie_id`, `device_id`, `card_last4`).
- **Algorithm Details**:
  - Node embeddings are initialized using normalized entity features and temporal co-occurrence encodings.
  - Multi-layer graph convolutions propagate neighborhood representations to score potential identity linkages ($0.0 - 1.0$ confidence score).
- **GNNExplainer Attribution Engine**:
  - Rather than outputting a blackbox probability, **GNNExplainer** isolates the minimal subgraph path and computes feature weight attributions:
    - `Shared Primary Identifier Match`: $+50\%$ attribution weight
    - `Verified Authentication Gate`: $+35\%$ attribution weight
    - `Temporal Co-occurrence (<5 min)`: $+11\%$ attribution weight

---

### 2. GBDT & SHAP Explainable Churn Risk Model
- **Model Type**: Gradient Boosted Decision Trees (GBDT / XGBoost equivalent) paired with **SHAP (SHapley Additive exPlanations)**.
- **Task**: Predicts 30-day customer churn risk probability ($0\% - 100\%$) based on journey interaction vectors.
- **Key Features Extracted**:
  - Total events in journey ($N$)
  - Multi-channel switching frequency ($S_{ch}$)
  - Support call center frequency ($C_{call}$)
  - Cumulative step friction score ($\sum F$)
  - Negative sentiment count ($S_{neg}$)
  - Unresolved issue flag ($U_{flag}$)
- **SHAP Feature Contribution Formula**:
  $$\text{Churn Risk (\%)} = \text{Base Risk} + \sum_{i=1}^{M} \phi_i(\text{Feature}_i)$$
  where $\phi_i$ represents the Shapley value for feature $i$, ensuring every risk percentage can be audited back to specific negative interactions (e.g. $+32.5\%$ risk penalty from repeated call center escalations).

---

### 3. Explainable Journey Friction Index Algorithm
- **Formula**:
  $$\text{Friction Index} = \min\left( \frac{\sum F_{\text{step}}}{\max(N_{\text{events}}, 1)} \times 50 + \min(S_{ch} \times 12, 30) + \min(U_{\text{issues}} \times 15, 30), 100.0 \right)$$
- **Components**:
  - **Base Step Friction**: Normalized sum of step-level friction scores ($0.0 - 1.0$).
  - **Channel Switch Penalty**: $+12$ points for each channel jump (e.g. Web $\to$ Mobile App $\to$ Call Center).
  - **Unresolved Issue Multiplier**: $+15$ points for each unresolved transaction error or biometric failure.
- **Output**: Standardized Friction Score ($0 - 100$) mapped to risk segments (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).

---

### 4. Apache Flink Stateful Sliding Windowing Algorithm
- **Mechanism**: 10-minute sliding window state buffer (`FlinkStreamProcessor`).
- **Algorithm**:
  - Ingests incoming events into an active memory buffer keyed by session identifiers (`cust_id`, `cookie_id`, `device_id`, `card_last4`).
  - Performs cross-channel time-windowed session matching: if a web checkout error event arrives at $T=0$, and a call center dial arrives at $T+4\text{min}$, Flink stitches both events into a single unified journey session.
  - Automatically flushes expired window states outside the 10-minute threshold.

---

### 5. Neo4j Graph Traversal & Connected Community Detection
- **Mechanism**: Neo4j Cypher Graph Database Engine (`Neo4jGraphStore`).
- **Algorithm**:
  - Executes Breadth-First Search (BFS) and Connected Components traversal over identity graph nodes (`Identifier`) and relationships (`LINKED_TO`).
  - Merges disparate node clusters into a single unified customer persona record once confidence weight exceeds threshold ($\ge 0.85$).

---

### 6. ClickHouse SIMD Columnar Analytical Engine
- **Mechanism**: ClickHouse SIMD Vector Columnar Query Store (`ClickHouseOLAPEngine`).
- **Algorithm**:
  - Columnar aggregation over event vectors providing sub-second analytics (`1.42ms` average response time).
  - Precomputes channel friction distributions, issue terminal statuses, and severity metrics across 9,000+ events.

---

## Quick Start Guide for Collaborators

Follow these instructions to clone, pull updates, and run the project smoothly.

### 1. Cloning the Repository

```bash
git clone https://github.com/rohitraj22/cross-channel-amex.git
cd cross-channel-amex
```

### 2. Pulling Latest Changes

Before starting work or testing, ensure you pull the latest updates from `main`:

```bash
git pull origin main
```

---

### 3. Running the Project (One-Command Recommended)

We provide an automated launcher script (`run.sh`) that sets up virtual environments, installs dependencies, and starts both backend and frontend servers automatically:

```bash
# Give execute permission (first time only)
chmod +x run.sh

# Run the project
./run.sh
```

**What `run.sh` does automatically:**
- Activates Python virtual environment (`venv`) and installs any missing Python packages.
- Installs Node.js dependencies (`npm install`) in the `frontend` folder if required.
- Launches the **FastAPI Backend Server** on `http://localhost:8000`.
- Launches the **Vite React Frontend Server** on `http://localhost:3000`.

Once running, open your browser to **[http://localhost:3000](http://localhost:3000)**.

---

### 4. Running Manually (Two Terminals)

If you prefer to run the backend and frontend in separate terminals:

#### Terminal 1: Backend (FastAPI)
```bash
# 1. Navigate to project root
cd cross-channel-amex

# 2. Activate Python virtual environment
source venv/bin/activate   # On Windows: venv\Scripts\activate

# 3. Install requirements (if needed)
pip install fastapi uvicorn pydantic pandas

# 4. Start FastAPI server
python3 -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000
```
- **Backend Base URL**: `http://localhost:8000`
- **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`

#### Terminal 2: Frontend (React + Vite)
```bash
# 1. Navigate to frontend folder
cd cross-channel-amex/frontend

# 2. Install dependencies (if needed)
npm install

# 3. Start Vite dev server
npm run dev -- --port 3000 --host 0.0.0.0
```
- **Frontend App URL**: `http://localhost:3000`

---

## Data Architecture & Dataset Schemas

All data files are located in `backend/data/` and are tracked in Git so collaborators get full dataset access immediately upon cloning:

| Data File | Records / Volume | Key Schema Attributes | Description |
| :--- | :--- | :--- | :--- |
| **`customers_nested.json`** | 500 complete objects | `cust_id`, `name`, `tier`, `email`, `phone`, `location`, `tenure_months`, `annual_spend_usd`, `timeline`, `nodes`, `edges` | Primary source of truth for 360° customer profiles |
| **`events.csv`** | 9,189 events (28 columns) | `event_id`, `true_cust_id`, `journey_id`, `channel`, `event_type`, `issue_type`, `friction_score`, `sentiment`, `resolution_status`, `amount_usd`, `is_breakpoint` | Multi-channel granular activity event history |
| **`journeys.csv`** | 5,524 records | `journey_id`, `cust_id`, `issue_type`, `tier`, `event_count`, `max_friction`, `resolved`, `terminal_status`, `escalated`, `customer_churned_30d` | Aggregated journey-level friction & churn outcomes |
| **`identity_nodes.csv`** | Graph Node dataset | `id`, `type`, `val`, `cust_id`, `created_at` | Identity graph nodes (emails, phones, device IDs, card last4) |
| **`identity_edges.csv`** | Graph Edge dataset | `source`, `target`, `rel_type`, `confidence_weight`, `evidence` | Graph linkages connecting identity nodes |
| **`pair_samples.csv`** | 30,002 pair samples | `node_a`, `node_b`, `is_same_identity`, `feature_vector`, `similarity_score` | Pairwise identity matching dataset for GNN model |

---

## Dashboard Features & Navigation

The dashboard provides a clean, executive interface designed for business analysts and customer experience managers:

### 1. Searchable Customer Dropdown (Header)
- Located prominently in the top header (`Select Customer`).
- **Instant Search**: Search all 500+ customers by Name (e.g. *Isla Sato*), Customer ID (e.g. *CUST_PREMIUM_001001*), Email, Location, or Tier.
- **Filter Pills**: Filter dropdown results by Risk Level (`ALL`, `CRITICAL`, `HIGH`, `MODERATE`, `LOW`).
- **Tier Filter**: Filter by Customer Tier (`Green`, `Gold`, `Platinum`, `Centurion`).
- **Sort Options**: Sort customers by Churn Risk %, Friction Index, Name (A-Z), ID, Annual Spend, or Tenure.

### 2. Symmetrical 3-Tab Views (Uniform 1400px Layout)

| Tab | Capabilities & Content |
| :--- | :--- |
| **1. Customer Journey** | • **4-KPI Summary**: Churn Risk %, Friction Index, Total Touchpoints, Problem Touchpoints.<br>• **Recommended Action Banner**: Proactive fee waiving or concierge callback link.<br>• **Activity Timeline**: Interactive event timeline with friction indicators and resolution status.<br>• **Customer Profile**: Complete customer account details, card last4, location, tenure, annual spend. |
| **2. Insights** | • **4-KPI Summary**: Total Journeys (5,524), Total Events (9,189), Unresolved Journeys (1,028), Escalated (2,603).<br>• **Struggle Hotspots**: Average friction score breakdown by channel (Phone, Web, App, In-Person).<br>• **Resolution Outcomes**: Visual breakdown of Resolved, Pending, and Abandoned journeys.<br>• **Issue Analytics**: Channel distribution charts and top common issue types across all journeys. |
| **3. Test Events** | • **4-KPI Status**: Channel Status (Online), Processing Mode (Real-Time), Event Stream (Connected), Events Sent count.<br>• **Event Simulator**: Send test events across Mobile App, Website, Support Call, or Airport Lounge.<br>• **Event Log Stream**: Real-time log of sent events with payload parameters and timestamp. |

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Multi-Channel Touchpoints                                │
│                (Mobile App · Web Portal · Phone Call Center · Branch/Lounge)            │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI REST & Event Gateway                              │
│   - Endpoints: /api/customers, /api/customer/{id}, /api/analytics/summary                │
│   - Real-time event ingestion endpoint: /api/events/kafka-publish                        │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             Stateful Stream Processing Engine                            │
│   - Apache Flink 10-minute sliding window state buffer                                  │
│   - Normalizes raw event streams & handles cross-channel session stitching               │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         PyTorch GNN & Neo4j Identity Resolution                          │
│   - PyTorch Geometric GNN link prediction + GNNExplainer feature attributions            │
│   - Neo4j Cypher persistent graph storage & connected community detection               │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                        ClickHouse OLAP & GBDT Explainable Risk Engine                    │
│   - Sub-second analytical aggregations over 9,000+ events & 5,500+ journeys               │
│   - GBDT + SHAP churn risk predictor and Next-Best-Action (NBA) engine                   │
└─────────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            React 18 + Vite Analyst Dashboard                             │
│   - Executive Light Theme with equal-width symmetrical 3-tab layout (1400px container)   │
│   - Searchable customer dropdown picker with multi-criteria sorting & filtering          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
cross-channel-amex/
├── backend/
│   ├── api/
│   │   └── main.py              # FastAPI REST endpoints & route handlers
│   ├── core/
│   │   └── interfaces.py        # Data model interfaces
│   ├── data/
│   │   ├── seed_data.py         # Multi-file dataset parser & customer builder
│   │   ├── customers_nested.json # Primary 360° customer JSON profiles
│   │   ├── events.csv           # 9,189 multi-channel event history
│   │   ├── journeys.csv         # 5,524 journey risk & outcome records
│   │   ├── identity_nodes.csv   # Identity graph nodes
│   │   ├── identity_edges.csv   # Identity graph edges
│   │   └── pair_samples.csv     # 30,000+ pairwise identity matching samples
│   ├── ml/
│   │   ├── gnn_resolver.py      # PyTorch GNN & GNNExplainer link prediction logic
│   │   └── explainable_analytics.py # GBDT + SHAP journey friction & risk predictor
│   ├── storage/
│   │   ├── neo4j_graph.py       # Graph storage & connected component detection
│   │   └── clickhouse_olap.py   # SIMD columnar analytics query helper
│   └── streaming/
│       ├── kafka_broker.py      # Multi-topic messaging broker helper
│       └── flink_processor.py   # Apache Flink stateful window processing engine
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JourneyTab.jsx   # Customer 360 & timeline view
│   │   │   ├── AnalyticsTab.jsx # Aggregate insights & charts view
│   │   │   └── SimulatorTab.jsx # Test event publisher & simulator view
│   │   ├── App.jsx              # Master dashboard shell & searchable customer selector
│   │   └── index.css            # Centurion Light Theme design system & layout styles
│   ├── package.json             # Frontend Node.js dependencies
│   └── vite.config.js           # Vite dev server & proxy settings
├── .gitignore                   # Excludes venv, node_modules, build artifacts
├── run.sh                       # One-command launcher script for backend & frontend
└── README.md                    # Project documentation
```

---

## Troubleshooting & Common Issues

### 1. Port 3000 or 8000 already in use
If a server from a previous run is still listening on port 3000 or 8000, free the ports using:
```bash
# Mac / Linux
lsof -ti tcp:3000 | xargs kill -9
lsof -ti tcp:8000 | xargs kill -9
```

### 2. Changes not reflecting in the browser
If you update code and the browser shows older cached data, perform a **hard refresh**:
- **Mac**: `Cmd` + `Shift` + `R`
- **Windows/Linux**: `Ctrl` + `F5`

### 3. Missing Node or Python packages
Run:
```bash
# Backend virtual environment
source venv/bin/activate
pip install fastapi uvicorn pydantic pandas torch torch_geometric

# Frontend dependencies
cd frontend
npm install
```