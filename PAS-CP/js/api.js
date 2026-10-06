/**
 * Shared client for the STATX / store-sales-forecasting API.
 * When UI is served by FastAPI, relative /api works.
 * Override with window.STATX_API_BASE if needed.
 */
(function () {
    const DEFAULT_BASE = window.STATX_API_BASE || '';

    async function request(path, options = {}) {
        const res = await fetch(`${DEFAULT_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
        let body = null;
        try {
            body = await res.json();
        } catch (_) {
            body = null;
        }
        if (!res.ok) {
            const detail = body && (body.detail || body.message);
            throw new Error(typeof detail === 'string' ? detail : `API error ${res.status}`);
        }
        return body;
    }

    window.StatxAPI = {
        health: () => request('/api/health'),
        metrics: () => request('/api/metrics'),
        options: () => request('/api/options'),
        forecast: (payload) =>
            request('/api/forecast', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        buildPromoVector(horizon, promoCount) {
            const n = Math.max(0, Math.round(Number(promoCount) || 0));
            return Array.from({ length: horizon }, () => n);
        },
        buildHolidayVector(horizon, isHoliday) {
            const flag = isHoliday ? 1 : 0;
            return Array.from({ length: horizon }, () => flag);
        },
    };
})();
