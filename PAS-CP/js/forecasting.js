document.addEventListener('DOMContentLoaded', () => {
    const colors = window.getChartColors ? window.getChartColors() : {
        primary: '#00f0ff',
        secondary: '#7000ff',
        grid: 'rgba(255,255,255,0.08)',
        text: '#a0a5b5',
    };

    const statusEl = document.getElementById('apiStatus');
    const storeSelector = document.getElementById('storeSelector');
    const familySelector = document.getElementById('familySelector');
    const horizonSelector = document.getElementById('horizonSelector');
    const promoInput = document.getElementById('promoInput');
    const holidaySelector = document.getElementById('holidaySelector');
    const runBtn = document.getElementById('runForecastBtn');
    const ctxForecast = document.getElementById('forecastChart');

    let forecastChart = null;
    let optionsCache = null;

    function setStatus(text, ok) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.style.color = ok === false ? 'var(--negative)' : ok ? 'var(--positive)' : 'var(--text-secondary)';
    }

    function buildChart(history, forecasts, histLabels, forecastLabels) {
        if (!ctxForecast) return;

        const labels = [...histLabels, ...forecastLabels];
        const actual = [...history, ...Array(forecasts.length).fill(null)];
        const bridge = history.length ? history[history.length - 1] : null;
        const predicted = [
            ...Array(Math.max(history.length - 1, 0)).fill(null),
            bridge,
            ...forecasts,
        ];

        const data = {
            labels,
            datasets: [
                {
                    label: 'Actual',
                    data: actual,
                    borderColor: colors.primary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.35,
                    spanGaps: false,
                },
                {
                    label: 'Forecast',
                    data: predicted,
                    borderColor: colors.secondary,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.35,
                    spanGaps: false,
                },
            ],
        };

        if (forecastChart) {
            forecastChart.data = data;
            forecastChart.update();
            return;
        }

        forecastChart = new Chart(ctxForecast, {
            type: 'line',
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { color: colors.grid } },
                    y: { grid: { color: colors.grid } },
                },
                plugins: { legend: { display: false } },
            },
        });
    }

    function fillSelectors(options) {
        optionsCache = options;
        storeSelector.innerHTML = options.stores
            .map((s) => `<option value="${s}">Store ${s}</option>`)
            .join('');
        familySelector.innerHTML = options.families
            .map((f) => `<option value="${f}">${f}</option>`)
            .join('');

        if (options.stores.includes(1)) storeSelector.value = '1';
        if (options.families.includes('GROCERY I')) familySelector.value = 'GROCERY I';
        else if (options.families.includes('BEVERAGES')) familySelector.value = 'BEVERAGES';
    }

    function filterFamiliesForStore() {
        if (!optionsCache) return;
        const store = Number(storeSelector.value);
        const families = optionsCache.pairs
            .filter((p) => p.store_nbr === store)
            .map((p) => p.family)
            .sort();
        const current = familySelector.value;
        familySelector.innerHTML = families
            .map((f) => `<option value="${f}">${f}</option>`)
            .join('');
        if (families.includes(current)) familySelector.value = current;
    }

    async function runLiveForecast() {
        if (!window.StatxAPI) {
            setStatus('API client missing. Open the app via the FastAPI server.', false);
            return;
        }

        runBtn.disabled = true;
        runBtn.textContent = 'Forecasting…';
        setStatus('Running live LightGBM forecast…');

        const horizon = Number(horizonSelector.value);
        const promo = Number(promoInput.value) || 0;
        const holiday = holidaySelector.value === '1';

        try {
            const result = await window.StatxAPI.forecast({
                store_nbr: Number(storeSelector.value),
                family: familySelector.value,
                horizon,
                onpromotion: window.StatxAPI.buildPromoVector(horizon, promo),
                is_holiday: window.StatxAPI.buildHolidayVector(horizon, holiday),
            });

            document.getElementById('valMAPE').innerText = result.avg_daily_units;
            document.getElementById('valR2').innerText = result.total_forecast_units;

            buildChart(
                result.history || [],
                result.forecasts || [],
                (result.labels && result.labels.history) || [],
                (result.labels && result.labels.forecast) || []
            );
            setStatus(
                `Live forecast ready · Store ${result.store_nbr} · ${result.family} · ${result.horizon}d`,
                true
            );
        } catch (err) {
            setStatus(err.message || 'Forecast failed', false);
        } finally {
            runBtn.disabled = false;
            runBtn.textContent = 'Run Live Forecast';
        }
    }

    // Demo benchmark selector (static comparison data)
    const selector = document.getElementById('modelSelector');
    if (selector && typeof forecastsData !== 'undefined') {
        selector.addEventListener('change', (e) => {
            const modelData = forecastsData.comparison.find((m) => m.model === e.target.value);
            if (!modelData) return;
            // Keep live metric cards for API; only flash comparison in status
            setStatus(`Benchmark reference · ${modelData.model}: MAE ${modelData.mae}, R² ${modelData.r2}`);
        });
    }

    // Decomposition charts (educational / visual)
    function createDecompChart(ctxId, data, color, title) {
        const ctx = document.getElementById(ctxId);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 60 }, (_, i) => i),
                datasets: [{
                    data,
                    borderColor: color,
                    borderWidth: 1.5,
                    pointRadius: 0,
                    tension: 0.4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: title, position: 'left', color: colors.text },
                },
                scales: {
                    x: { display: false },
                    y: { display: false },
                },
            },
        });
    }

    const len = 60;
    const tData = Array.from({ length: len }, (_, i) => i * 0.5);
    const sData = Array.from({ length: len }, (_, i) => Math.sin(i * 0.5) * 10);
    const rData = Array.from({ length: len }, () => (Math.random() - 0.5) * 5);
    const oData = Array.from({ length: len }, (_, i) => tData[i] + sData[i] + rData[i]);
    createDecompChart('decompObserved', oData, colors.primary, 'Observed');
    createDecompChart('decompTrend', tData, '#ffffff', 'Trend');
    createDecompChart('decompSeasonal', sData, colors.secondary, 'Seasonal');
    createDecompChart('decompResidual', rData, '#ff3d00', 'Residual');

    // Bootstrap API
    (async function init() {
        if (!window.StatxAPI) {
            setStatus('Open via http://127.0.0.1:8000 (unified server) for live forecasts.', false);
            if (typeof forecastsData !== 'undefined') {
                const ts = forecastsData.timeseries;
                buildChart(ts.actual, ts.predicted.slice(30), ts.labels.slice(0, 30), ts.labels.slice(30));
            }
            return;
        }

        try {
            const [health, metrics, options] = await Promise.all([
                window.StatxAPI.health(),
                window.StatxAPI.metrics(),
                window.StatxAPI.options(),
            ]);
            if (health.status !== 'ok') throw new Error('API unhealthy');

            document.getElementById('valMAE').innerText = metrics.nmse;
            document.getElementById('valRMSE').innerText = metrics.nmae;
            fillSelectors(options);
            filterFamiliesForStore();
            storeSelector.addEventListener('change', filterFamiliesForStore);
            runBtn.addEventListener('click', runLiveForecast);
            setStatus(`API connected · ${metrics.model} · ${options.count} series`, true);
            await runLiveForecast();
        } catch (err) {
            setStatus(
                `${err.message || 'API unavailable'}. Start the unified server from the project root.`,
                false
            );
            if (typeof forecastsData !== 'undefined') {
                const ts = forecastsData.timeseries;
                buildChart(ts.actual, ts.predicted.slice(30), ts.labels.slice(0, 30), ts.labels.slice(30));
            }
        }
    })();
});
