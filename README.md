# STATX — Unified Sales Intelligence Platform

STATX frontend (`PAS-CP`) and the LightGBM forecast API (`store-sales-forecasting`) run as **one project**.

One FastAPI process serves:
- the STATX UI (static HTML/CSS/JS)
- live forecast endpoints under `/api/*`

## Project layout

```
PAS_CP/
├── PAS-CP/                      # STATX UI
├── store-sales-forecasting/     # FastAPI + models + artifacts
├── README.md                    # this file
├── run.ps1                      # Windows start script
└── docker-compose.yml           # recommended if Python ≠ 3.10–3.11
```

## Requirements

| Path | Recommendation |
|------|----------------|
| **Python** | **3.10 or 3.11** (Dockerfile uses 3.11.5). Python 3.13 often fails with pinned `darts` / `numpy`. |
| **Docker** | Optional but easiest on Windows with Python 3.13 |
| Artifacts | Already present under `store-sales-forecasting/artifacts/*.joblib` |

## Quick start (local)

```powershell
cd "C:\Users\Raj Deshmukh\OneDrive\Desktop\PAS_CP"
.\run.ps1
```

Or manually:

```powershell
cd store-sales-forecasting
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Open:
- UI: http://127.0.0.1:8000/
- Forecasting (live): http://127.0.0.1:8000/forecasting.html
- Simulator (live): http://127.0.0.1:8000/simulator.html
- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

## Quick start (Docker)

First build downloads PyTorch/CUDA wheels (several GB) via Darts — expect 10–20+ minutes once.

```powershell
docker compose up --build
```

Then open http://127.0.0.1:8000/

## API used by the UI

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness |
| GET | `/api/metrics` | Model NMSE / NMAE |
| GET | `/api/options` | Valid store + family pairs |
| POST | `/api/forecast` | Live sales forecast |

Example body:

```json
{
  "store_nbr": 1,
  "family": "GROCERY I",
  "horizon": 15,
  "onpromotion": [0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "is_holiday": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}
```

`onpromotion` / `is_holiday` are optional; the API fills zeros when omitted.

## What was integrated

- Backend serves the `PAS-CP` folder as static files
- CORS enabled for local/dev
- Forecasting page calls `/api/forecast` and charts history + prediction
- Simulator maps promo / discount / holiday controls to model covariates
- Shared client: `PAS-CP/js/api.js`

## Train pipeline (optional)

Only needed to retrain models (not for running the UI/API):

1. Create `store-sales-forecasting/secrets.env` with `MONGODB_USERNAME` and `MONGODB_PASSWORD`
2. `pip install -r requirements.txt`
3. `python src/pipelines/train_pipeline.py`

## License

API package: MIT (see `store-sales-forecasting/LICENSE`).
