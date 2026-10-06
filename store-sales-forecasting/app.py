"""
STATX unified server.

Prefer full ML mode (Darts/LightGBM). If those deps are missing, fall back to
demo mode so the UI + API still run on Python 3.13 / first-time setups.
"""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional
import json
import math
import hashlib
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR.parent / "PAS-CP"
RESULTS_PATH = ROOT_DIR / "artifacts" / "results.json"

# Try full ML stack
ML_AVAILABLE = False
ML_IMPORT_ERROR = None
PredictionPipeline = None
PredictionPipelineConfig = None
joblib = None
ast = None

try:
    import ast as _ast
    import joblib as _joblib
    from src.pipelines.prediction_pipeline import (
        PredictionPipeline as _PP,
        PredictionPipelineConfig as _PPC,
    )

    ast = _ast
    joblib = _joblib
    PredictionPipeline = _PP
    PredictionPipelineConfig = _PPC
    ML_AVAILABLE = True
except Exception as exc:  # noqa: BLE001 - intentional soft fallback
    ML_IMPORT_ERROR = str(exc)
    ML_AVAILABLE = False

FORCE_DEMO = os.getenv("STATX_DEMO", "").lower() in {"1", "true", "yes"}
DEMO_MODE = FORCE_DEMO or (not ML_AVAILABLE)

# Favorita-style defaults for demo mode
DEMO_STORES = list(range(1, 11))
DEMO_FAMILIES = [
    "AUTOMOTIVE",
    "BABY CARE",
    "BEAUTY",
    "BEVERAGES",
    "BREAD/BAKERY",
    "CLEANING",
    "DAIRY",
    "DELI",
    "EGGS",
    "FROZEN FOODS",
    "GROCERY I",
    "GROCERY II",
    "HOME CARE",
    "MEATS",
    "PERSONAL CARE",
    "POULTRY",
    "PREPARED FOODS",
    "PRODUCE",
    "SEAFOOD",
]

app = FastAPI(
    title="STATX Store Sales Forecasting",
    description="Unified STATX frontend + sales forecast API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ForecastRequest(BaseModel):
    store_nbr: int = Field(..., ge=1, description="Store number")
    family: str = Field(..., description="Product family / department name")
    horizon: int = Field(15, ge=1, le=30, description="Forecast horizon in days")
    onpromotion: Optional[List[int]] = Field(
        None, description="Items on promotion per day (length >= horizon)"
    )
    is_holiday: Optional[List[int]] = Field(
        None, description="Holiday flags 0/1 per day (length >= horizon)"
    )


def _default_covariates(horizon: int, promo_level: int = 0, holiday: int = 0):
    return [promo_level] * horizon, [holiday] * horizon


def _seed(store_nbr: int, family: str) -> int:
    digest = hashlib.md5(f"{store_nbr}|{family}".encode()).hexdigest()
    return int(digest[:8], 16)


def _demo_series(store_nbr: int, family: str, horizon: int, onpromotion, is_holiday):
    base = 80 + (_seed(store_nbr, family) % 400)
    history = []
    for i in range(30):
        val = base + 25 * math.sin(i / 4.0) + (i % 7) * 3
        history.append(round(max(0.0, val), 2))

    forecasts = []
    last = history[-1]
    for i in range(horizon):
        promo_boost = 1.0 + (onpromotion[i] * 0.015)
        holiday_boost = 1.12 if is_holiday[i] else 1.0
        val = last + 18 * math.sin((30 + i) / 4.0) + (i % 5) * 2
        val = val * promo_boost * holiday_boost
        forecasts.append(round(max(0.0, val), 2))
        last = val * 0.2 + last * 0.8
    return history, forecasts


def _demo_options():
    pairs = [{"store_nbr": s, "family": f} for s in DEMO_STORES for f in DEMO_FAMILIES]
    return {
        "stores": DEMO_STORES,
        "families": DEMO_FAMILIES,
        "pairs": pairs,
        "count": len(pairs),
        "mode": "demo",
    }


def _ml_options():
    config = PredictionPipelineConfig()
    covariates = joblib.load(config.covariates_path)
    stores = set()
    families = set()
    pairs = []
    for key in covariates.keys():
        store_nbr, family = ast.literal_eval(key)
        stores.add(int(store_nbr))
        families.add(str(family))
        pairs.append({"store_nbr": int(store_nbr), "family": str(family)})
    return {
        "stores": sorted(stores),
        "families": sorted(families),
        "pairs": pairs,
        "count": len(pairs),
        "mode": "ml",
    }


def _pack_response(store_nbr, family, horizon, history, forecasts):
    hist_labels = [f"H-{len(history) - i}" for i in range(len(history))]
    forecast_labels = [f"D+{i + 1}" for i in range(len(forecasts))]
    return {
        "store_nbr": store_nbr,
        "family": family,
        "horizon": horizon,
        "forecasts": forecasts,
        "history": history,
        "labels": {"history": hist_labels, "forecast": forecast_labels},
        "total_forecast_units": round(sum(forecasts), 2),
        "avg_daily_units": round(sum(forecasts) / max(len(forecasts), 1), 2),
        "mode": "demo" if DEMO_MODE else "ml",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "statx-forecast-api",
        "mode": "demo" if DEMO_MODE else "ml",
        "ml_available": ML_AVAILABLE,
        "ml_error": ML_IMPORT_ERROR,
    }


@app.get("/api/metrics")
async def metrics():
    model_name = "Demo simulator" if DEMO_MODE else "LightGBM (Darts)"
    if not RESULTS_PATH.exists():
        return {
            "nmse": 0.03967,
            "nmae": 0.10960,
            "model": model_name,
            "horizon_days": 15,
            "mode": "demo" if DEMO_MODE else "ml",
        }
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return {
        "nmse": round(raw.get("Mean Squared Error (on normalised data)", 0), 5),
        "nmae": round(raw.get("Mean Absolute Error (on normalised data)", 0), 5),
        "model": model_name,
        "horizon_days": 15,
        "raw": raw,
        "mode": "demo" if DEMO_MODE else "ml",
    }


@app.get("/api/options")
async def options():
    if DEMO_MODE:
        return _demo_options()
    try:
        return _ml_options()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to load series options: {exc}") from exc


@app.post("/api/forecast")
async def forecast(params: ForecastRequest):
    horizon = params.horizon
    onpromotion = params.onpromotion
    is_holiday = params.is_holiday
    family = params.family.upper().strip()

    if onpromotion is None:
        onpromotion, _ = _default_covariates(horizon)
    if is_holiday is None:
        _, is_holiday = _default_covariates(horizon)

    if len(onpromotion) < horizon or len(is_holiday) < horizon:
        raise HTTPException(
            status_code=400,
            detail="onpromotion and is_holiday must each have at least `horizon` values",
        )

    onpromotion = onpromotion[:horizon]
    is_holiday = is_holiday[:horizon]

    if DEMO_MODE:
        history, forecasts = _demo_series(
            params.store_nbr, family, horizon, onpromotion, is_holiday
        )
        return _pack_response(params.store_nbr, family, horizon, history, forecasts)

    pipeline = PredictionPipeline()
    try:
        result = pipeline.produce_forecasts(
            store_nbr=params.store_nbr,
            family=family,
            horizon=horizon,
            onpromotion=onpromotion,
            is_holiday=is_holiday,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)

    config = PredictionPipelineConfig()
    timeseries_data = joblib.load(config.timeseries_data_path)
    series_name = str((params.store_nbr, family))
    history = []
    if series_name in timeseries_data:
        history = [
            round(float(x), 2)
            for x in timeseries_data[series_name].pd_series().tail(30).tolist()
        ]

    return _pack_response(params.store_nbr, family, horizon, history, result)


@app.post("/predict")
async def forecast_alias(params: ForecastRequest):
    return await forecast(params)


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:

    @app.get("/")
    async def missing_frontend():
        return {
            "message": "API is running. Place the PAS-CP frontend next to this folder to serve the UI.",
            "docs": "/docs",
            "health": "/api/health",
            "mode": "demo" if DEMO_MODE else "ml",
        }
