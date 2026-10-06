FROM python:3.11.5-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# API package (serve deps — skips DVC)
COPY store-sales-forecasting/requirements-serve.txt /app/store-sales-forecasting/requirements.txt
COPY store-sales-forecasting/setup.py /app/store-sales-forecasting/setup.py
COPY store-sales-forecasting/src /app/store-sales-forecasting/src
COPY store-sales-forecasting/app.py /app/store-sales-forecasting/app.py
COPY store-sales-forecasting/artifacts /app/store-sales-forecasting/artifacts

# Frontend (sibling of API — matches app.py FRONTEND_DIR)
COPY PAS-CP /app/PAS-CP

WORKDIR /app/store-sales-forecasting
RUN pip3 install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
