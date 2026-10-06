document.addEventListener('DOMContentLoaded', () => {
    const colors = window.getChartColors ? window.getChartColors() : {
        primary: '#00f0ff',
        grid: 'rgba(255,255,255,0.08)',
    };

    const statusEl = document.getElementById('simApiStatus');
    const simStore = document.getElementById('simStore');
    const simProduct = document.getElementById('simProduct');
    const simHorizon = document.getElementById('simHorizon');
    const simPromo = document.getElementById('simPromo');
    const simDiscount = document.getElementById('simDiscount');
    const simFestival = document.getElementById('simFestival');
    const simPromoVal = document.getElementById('simPromoVal');
    const simDiscountVal = document.getElementById('simDiscountVal');
    const baseDemandEl = document.getElementById('baseDemand');
    const predDemand = document.getElementById('predDemand');
    const predChange = document.getElementById('predChange');
    const runBtn = document.getElementById('simRunBtn');

    const ctxSim = document.getElementById('simChart');
    let simChart;
    let optionsCache = null;
    let baselineTotal = null;
    let debounceTimer = null;

    function setStatus(text, ok) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.style.color = ok === false ? 'var(--negative)' : ok ? 'var(--positive)' : 'var(--text-secondary)';
    }

    function initChart() {
        if (!ctxSim) return;
        simChart = new Chart(ctxSim, {
            type: 'bar',
            data: {
                labels: ['Baseline', 'Simulated'],
                datasets: [{
                    label: 'Total forecast units',
                    data: [0, 0],
                    backgroundColor: [colors.grid, colors.primary],
                    borderRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: colors.grid } },
                    x: { grid: { display: false } },
                },
                plugins: { legend: { display: false } },
            },
        });
    }

    function setDemandText(el, value) {
        el.innerHTML = `${Math.round(value)} <span style="font-size: 1rem; font-weight: 400; color: var(--text-secondary);">units</span>`;
    }

    function effectivePromoLevel() {
        const promo = Number(simPromo.value) || 0;
        const discount = Number(simDiscount.value) || 0;
        // Discount increases effective on-promotion intensity for the model
        return Math.round(promo + discount * 0.4);
    }

    async function fetchScenario(promoLevel, holiday) {
        const horizon = Number(simHorizon.value);
        return window.StatxAPI.forecast({
            store_nbr: Number(simStore.value),
            family: simProduct.value,
            horizon,
            onpromotion: window.StatxAPI.buildPromoVector(horizon, promoLevel),
            is_holiday: window.StatxAPI.buildHolidayVector(horizon, holiday),
        });
    }

    async function updateSimulation() {
        if (!window.StatxAPI || !simStore.value || !simProduct.value) return;

        runBtn.disabled = true;
        runBtn.textContent = 'Simulating…';
        setStatus('Running live scenario…');

        try {
            const holiday = simFestival.value === '1';
            const simulated = await fetchScenario(effectivePromoLevel(), holiday);

            // Refresh baseline when store/family/horizon changes or first run
            if (baselineTotal === null) {
                const baseline = await fetchScenario(0, false);
                baselineTotal = baseline.total_forecast_units;
                setDemandText(baseDemandEl, baselineTotal);
            }

            const simTotal = simulated.total_forecast_units;
            setDemandText(predDemand, simTotal);

            const changePct = baselineTotal
                ? ((simTotal - baselineTotal) / baselineTotal) * 100
                : 0;

            if (changePct > 0.05) {
                predChange.innerText = `+${changePct.toFixed(1)}%`;
                predChange.style.color = 'var(--positive)';
            } else if (changePct < -0.05) {
                predChange.innerText = `${changePct.toFixed(1)}%`;
                predChange.style.color = 'var(--negative)';
            } else {
                predChange.innerText = '0.0%';
                predChange.style.color = 'var(--text-secondary)';
            }

            if (simChart) {
                simChart.data.datasets[0].data = [baselineTotal, simTotal];
                simChart.update();
            }

            setStatus(
                `Scenario ready · Store ${simulated.store_nbr} · ${simulated.family}`,
                true
            );
        } catch (err) {
            setStatus(err.message || 'Simulation failed', false);
        } finally {
            runBtn.disabled = false;
            runBtn.textContent = 'Run Scenario';
        }
    }

    function scheduleUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateSimulation, 350);
    }

    function filterFamiliesForStore() {
        if (!optionsCache) return;
        const store = Number(simStore.value);
        const families = optionsCache.pairs
            .filter((p) => p.store_nbr === store)
            .map((p) => p.family)
            .sort();
        const current = simProduct.value;
        simProduct.innerHTML = families
            .map((f) => `<option value="${f}">${f}</option>`)
            .join('');
        if (families.includes(current)) simProduct.value = current;
        baselineTotal = null;
    }

    initChart();

    simPromo.addEventListener('input', () => {
        simPromoVal.innerText = simPromo.value;
        scheduleUpdate();
    });
    simDiscount.addEventListener('input', () => {
        simDiscountVal.innerText = `${simDiscount.value}%`;
        scheduleUpdate();
    });
    simFestival.addEventListener('change', scheduleUpdate);
    simHorizon.addEventListener('change', () => {
        baselineTotal = null;
        scheduleUpdate();
    });
    simStore.addEventListener('change', () => {
        filterFamiliesForStore();
        scheduleUpdate();
    });
    simProduct.addEventListener('change', () => {
        baselineTotal = null;
        scheduleUpdate();
    });
    runBtn.addEventListener('click', updateSimulation);

    (async function init() {
        if (!window.StatxAPI) {
            setStatus('Open via http://127.0.0.1:8000 for live simulation.', false);
            return;
        }
        try {
            const [health, options] = await Promise.all([
                window.StatxAPI.health(),
                window.StatxAPI.options(),
            ]);
            if (health.status !== 'ok') throw new Error('API unhealthy');
            optionsCache = options;
            simStore.innerHTML = options.stores
                .map((s) => `<option value="${s}">Store ${s}</option>`)
                .join('');
            if (options.stores.includes(1)) simStore.value = '1';
            filterFamiliesForStore();
            if (options.families.includes('GROCERY I')) simProduct.value = 'GROCERY I';
            setStatus(`API connected · ${options.count} series available`, true);
            await updateSimulation();
        } catch (err) {
            setStatus(
                `${err.message || 'API unavailable'}. Start the unified server from the project root.`,
                false
            );
        }
    })();
});
