# LogX

### Universal Security Telemetry Pre-processing & Forensic Intelligence Platform

> **One trusted language for heterogeneous security telemetry — without losing the original evidence.**

LogX is a modular security telemetry pre-processing platform designed to solve a fundamental problem in modern security environments: **every security product generates logs differently**.

Firewalls, IDS/IPS, VPNs, network devices, applications, and security sensors produce heterogeneous telemetry in different formats and structures. LogX detects, parses, normalizes, validates, and makes this telemetry investigation-ready while maintaining original evidence, integrity, provenance, and field-level lineage.

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [Processing Pipeline](#processing-pipeline)
- [Architecture](#architecture)
- [Supported Formats](#supported-formats)
- [Supported Sources](#supported-sources)
- [Unknown Log Intelligence](#unknown-log-intelligence)
- [Replay and Forensics](#replay-and-forensics)
- [Platform Modules](#platform-modules)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [API](#api)
- [Testing](#testing)
- [Offline / Air-Gap Capability](#offline--air-gap-capability)
- [Demo Flow](#demo-flow)
- [Use Cases](#use-cases)
- [Roadmap](#roadmap)
- [Team](#team)
- [Links](#links)

---

## Problem

Modern security environments collect telemetry from firewalls, IDS/IPS, VPN gateways, DNS infrastructure, network sensors, applications, and security appliances.

The challenge is that these systems do not produce telemetry in a single standard format.

One source may produce JSON, another Syslog, another CEF, another Key-Value data, while vendor-specific products use their own fields and conventions.

This creates:

- Difficult log ingestion
- Inconsistent field names
- Complex normalization
- Loss of original context
- Difficult forensic investigation
- Unsupported or unknown log formats
- Weak traceability between raw and normalized data
- Parser maintenance and reprocessing challenges

Security teams need a reliable preprocessing layer between heterogeneous telemetry and downstream security systems.

---

## Solution

**LogX provides that preprocessing layer.**

LogX automatically:

1. Captures the original raw telemetry.
2. Generates a SHA-256 integrity hash.
3. Detects the telemetry format.
4. Identifies the probable source.
5. Selects the appropriate parser.
6. Extracts relevant fields.
7. Normalizes them into a common event structure.
8. Validates the resulting event.
9. Preserves provenance and field-level lineage.
10. Stores successful events.
11. Quarantines unsupported or invalid events.
12. Allows parser creation and historical replay.

> **Normalize the data, not the evidence.**

---

# Key Features

### Universal Log Processing
Process heterogeneous telemetry through a common pipeline.

### Automatic Format Detection
Detect supported formats before parsing.

### Source Detection
Identify source profiles such as FortiGate, Cisco ASA, Palo Alto, Suricata, and Zeek.

### Parser Registry
Register, version, test, select, and replay modular parsers.

### Normalization
Map vendor-specific fields into a common structure.

Example:

```text
srcip  → source.ip
dstip  → destination.ip
proto  → network.protocol
action → event.action
```

### Validation
Validate extracted events and safely quarantine invalid telemetry.

### Raw Evidence Preservation
Keep original telemetry alongside normalized data.

### SHA-256 Integrity
Generate a SHA-256 hash for raw telemetry and use it for integrity verification.

### Field-Level Lineage
Trace normalized fields back to their original raw fields and values.

### Quarantine
Preserve unknown, unsupported, or invalid telemetry instead of silently discarding it.

### Parser Intelligence
Analyze unknown telemetry, identify candidate fields, suggest mappings, and register reusable parsers after review.

### Historical Replay
Replay previously processed telemetry using selected parser versions and compare before/after results.

### Analytics
View event, source, format, action, parser, validation, quarantine, and timeline statistics.

### Forensic Workbench
Inspect normalized fields, raw evidence, SHA-256, parser metadata, processing chain, and lineage.

---

# Processing Pipeline

```text
INPUT
  ↓
RAW CAPTURE + SHA-256
  ↓
FORMAT DETECTOR
  ↓
SOURCE DETECTOR
  ↓
PARSER REGISTRY
  ↓
EXTRACTION
  ↓
NORMALIZATION
  ↓
VALIDATION
  ↓
ENRICHMENT
  ↓
PROVENANCE + LINEAGE
  ↓
SUCCESS → STORAGE / SEARCH / OUTPUT
  ↓
FAILURE → QUARANTINE
```

---

# Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                     LogX Frontend                        │
│ React + Vite + Tailwind + Framer Motion + Recharts      │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
├──────────────────────────────────────────────────────────┤
│ API Layer                                                 │
│    ↓                                                      │
│ LogX Pipeline                                              │
│    ↓                                                      │
│ Format Detector → Source Detector → Parser Registry      │
│    ↓                                                      │
│ Extraction → Normalization → Validation                  │
│    ↓                                                      │
│ Enrichment → Provenance → Lineage                         │
│    ↓                         ↓                            │
│ Event Storage             Quarantine                      │
│                              ↓                            │
│                         Parser Studio                     │
│                              ↓                            │
│                            Replay                          │
└──────────────────────────────────────────────────────────┘
```

---

# Supported Formats

| Format | Status |
|---|---|
| JSON | Supported |
| CSV | Supported |
| Syslog | Supported |
| CEF | Supported |
| LEEF | Supported |
| Key-Value | Supported |
| Zeek | Supported |

---

# Supported Sources

| Source | Parser |
|---|---|
| FortiGate | `fortigate.traffic` |
| Cisco ASA | `cisco.asa` |
| Palo Alto | `paloalto.traffic` |
| Suricata | `suricata.eve` |
| Zeek | `zeek.conn` |
| Generic JSON | `generic.json` |
| Generic CSV | `generic.csv` |
| Generic CEF | `generic.cef` |
| Generic LEEF | `generic.leef` |
| Syslog | `syslog` |

The parser registry is extensible for additional vendors and sources.

---

# Unknown Log Intelligence

Unknown telemetry is treated as a first-class workflow.

Example:

```text
timestamp=2026-09-29T10:30:00Z
mystery_field=alpha
device_code=ZX-9007
action=blocked
strange_value=42
```

Instead of dropping it:

```text
Unknown Log
     ↓
Quarantine
     ↓
Analyze Structure
     ↓
Suggest Fields / Mappings
     ↓
Human Review
     ↓
Register Parser
     ↓
Replay Historical Event
     ↓
Normalized Event
```

This allows LogX to evolve as new telemetry sources appear.

---

# Replay and Forensics

Replay allows historical raw telemetry to be processed again using a selected parser and version.

The system records:

- Original SHA-256
- Replayed SHA-256
- Parser ID
- Parser version
- Replay reason
- Replay status
- Integrity result
- Before/after comparison

This supports parser validation, regression testing, historical reprocessing, and forensic analysis without replacing the original evidence.

---

# Data Integrity & Lineage

For every processed event:

```text
Raw Data
   ↓
SHA-256
   ↓
Processing
   ↓
Normalized Event
```

Example lineage:

```text
Normalized Field:
destination.ip
        ↓
Original Field:
dstip
        ↓
Original Value:
8.8.8.8
        ↓
Raw Evidence
        ↓
SHA-256
```

---

# Platform Modules

| Module | Purpose |
|---|---|
| Command Center | Overall pipeline and system status |
| Live Ingest | Process incoming telemetry |
| Event Explorer | Search and inspect processed events |
| Forensic Workbench | Investigate raw and normalized evidence |
| Parser Studio | Analyze and create parsers |
| Quarantine | Review unknown/invalid telemetry |
| Replay Center | Replay and compare historical events |
| Analytics | Processing and telemetry statistics |
| Sources & Plugins | Supported source/parser capabilities |
| System / Air-Gap | Deployment and system information |

---

# Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide React
- Recharts

### Backend
- Python
- FastAPI
- Pydantic
- Uvicorn
- SQLAlchemy
- SQLite

### Core Processing
- Parser Registry
- Format Detection
- Source Detection
- Normalization
- Validation
- Provenance
- Field-Level Lineage
- SHA-256
- Quarantine
- Replay

### Testing & Deployment
- pytest
- Docker
- Docker Compose
- Nginx
- Git
- GitHub
- Vercel
- Render

---

# Project Structure

```text
LogX/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── core/
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── db.py
│   │   │   └── events.py
│   │   ├── parsers/
│   │   │   ├── base.py
│   │   │   ├── registry.py
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── pipeline.py
│   │   │   ├── quarantine.py
│   │   │   ├── replay.py
│   │   │   ├── lineage.py
│   │   │   └── ...
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Getting Started

## Prerequisites

- Python 3.12+
- Node.js 22+
- npm
- Git

Docker is recommended for the complete setup.

## Clone

```bash
git clone https://github.com/high-flyer007/LogX.git
cd LogX
```

## Run Backend

```cmd
cd backend
python -m venv .venv
.venv\Scriptsctivate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Health:

```text
http://127.0.0.1:8000/api/v1/health
```

## Run Frontend

Open another terminal:

```cmd
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Set the API base URL if required:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

# Docker Deployment

From the project root:

```cmd
docker compose up --build -d
```

Check:

```cmd
docker compose ps
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Stop:

```cmd
docker compose down
```

The local Docker deployment uses the `logx-data` volume for SQLite persistence.

---

# API

Base path:

```text
/api/v1
```

### Health

```http
GET /health
```

### Process Event

```http
POST /events/process
```

Example:

```json
{
  "raw_data": "date=2026-09-29 time=11:30:00 devname=FGT-LOGX srcip=10.10.10.5 dstip=8.8.8.8 action=deny proto=TCP"
}
```

### Events

```http
GET /events
GET /events/{event_id}
```

### Quarantine

```http
GET /quarantine
```

### Parsers

```http
GET /parsers
POST /parsers/analyze
POST /parsers/register
POST /parsers/test
```

### Replay

```http
POST /replay
POST /parsers/replay
GET /replay/history
```

### Analytics

```http
GET /analytics/summary
```

Interactive documentation is available at `/docs`.

---

# Testing

From `backend/`:

```cmd
pytest -q
```

The test suite covers:

- Pipeline processing
- API routes
- Storage
- Parser registry
- Golden parser fixtures
- Dynamic parser registration
- Quarantine
- Replay
- Replay comparison
- Normalization
- Lineage
- Format detection
- Source detection

The current development suite has been validated with **63 passing tests**.

> Test counts can change as development continues.

---

# Offline / Air-Gap Capability

The core LogX processing pipeline is designed to operate without mandatory external cloud or AI services.

Docker images can be exported:

```cmd
docker save -o logx-airgap-images.tar logx-backend:latest logx-frontend:latest
```

Import them into another Docker environment:

```cmd
docker load -i logx-airgap-images.tar
```

The application can then be started using the locally available images.

This provides an offline-capable deployment approach suitable for restricted environments. The core processing workflow does not depend on a runtime connection to external AI services.

---

# Demo Flow

A recommended SIH demonstration:

### 1. Command Center
Show pipeline health, event count, parser status, validation, and quarantine.

### 2. Known Log
Process a FortiGate event and show:

- Normalized source IP
- Destination IP
- Protocol
- Action
- Parser/version
- Raw evidence
- SHA-256

### 3. Field Lineage
Select `destination.ip` and trace it back to the original `dstip` field.

### 4. Unknown Log
Send an unsupported event and demonstrate:

```text
Unknown → Quarantine
```

### 5. Parser Studio
Analyze the unknown telemetry, create mappings, approve/register the parser, and process the event.

### 6. Replay Center
Replay the historical event and show:

- Original SHA
- Replayed SHA
- Integrity status
- Before/after comparison

### 7. Analytics
Show the overall telemetry and processing statistics.

---

# Use Cases

### Security Operations
Normalize logs from multiple security products before sending them to downstream systems.

### Digital Forensics
Preserve original telemetry while providing structured data for investigation.

### Threat Detection
Provide consistent fields for analytics and machine-learning pipelines.

### Security Data Lakes
Create structured, traceable telemetry before long-term storage.

### Restricted Environments
Process sensitive telemetry without requiring an external cloud dependency for the core pipeline.

### New Vendor Onboarding
Create and test parsers for new telemetry sources without redesigning the core pipeline.

---

# Roadmap

Potential future scale-up includes:

- PostgreSQL
- Redis Streams
- Apache Kafka
- OpenSearch
- MinIO / S3-compatible raw evidence storage
- ECS / OCSF mapping
- OpenTelemetry integration
- Threat intelligence enrichment
- MITRE ATT&CK mapping
- STIX/TAXII integration
- MISP integration
- GeoIP enrichment
- Local LLM-assisted parser generation
- RBAC
- OAuth/OIDC/JWT
- mTLS
- Vault
- Prometheus/Grafana
- Kubernetes deployment

These are roadmap items and are **not claimed as currently implemented**.

---

# Why LogX?

### Without LogX

```text
Firewall ──────┐
IDS ───────────┤
VPN ───────────┼──→ Multiple custom pipelines
Application ───┤
Network ───────┘
```

### With LogX

```text
Firewall ──────┐
IDS ───────────┤
VPN ───────────┼──→ LOGX → Common Trusted Events
Application ───┤
Network ───────┘
```

LogX provides a common preprocessing layer between heterogeneous security telemetry and downstream security systems.

---

# Team

## Team blipSix

**Project:** LogX  
**Smart India Hackathon:** 2026  
**Problem Statement:** 26156 — Universal Log Pre-processing Framework

---

# Links

- **GitHub:** https://github.com/high-flyer007/LogX
- **Live Frontend:** https://log-x-gamma.vercel.app
- **Backend API:** https://logx-backend.onrender.com
- **Swagger API Docs:** https://logx-backend.onrender.com/docs

---

# Final Message

> **LogX doesn’t just process logs — it makes security telemetry trustworthy, traceable, and actionable.**

Built by **Team blipSix**.
