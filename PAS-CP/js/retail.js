document.addEventListener('DOMContentLoaded', () => {
    if (typeof retailData === 'undefined') return;

    const colors = window.getChartColors();

    // 1. Sales Chart
    const ctxSales = document.getElementById('salesChart');
    if (ctxSales) {
        new Chart(ctxSales, {
            type: 'bar',
            data: {
                labels: retailData.timeseries.labels,
                datasets: [{
                    label: 'Monthly Sales Index',
                    data: retailData.timeseries.sales,
                    backgroundColor: retailData.timeseries.sales.map(val => 
                        val > 200 ? colors.secondary : colors.primary
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.grid }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 2. Festival Impact List
    const festivalList = document.getElementById('festivalList');
    if (festivalList) {
        // Sort by impact descending
        const sorted = [...retailData.festivals].sort((a,b) => b.impact - a.impact);
        
        sorted.forEach(fest => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            
            const barWidth = Math.max(10, fest.impact * 2);
            
            item.innerHTML = `
                <div style="width: 120px; font-weight: 500;">${fest.name}</div>
                <div style="flex: 1; margin: 0 1rem; background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${barWidth}%; background: var(--accent); height: 100%; transition: width 1s ease-out;"></div>
                </div>
                <div style="width: 60px; text-align: right; color: var(--positive); font-weight: 600;">+${fest.impact}%</div>
            `;
            festivalList.appendChild(item);
        });
    }

    // 3. Elasticity Scatter Plot
    const ctxElasticity = document.getElementById('elasticityChart');
    if (ctxElasticity) {
        new Chart(ctxElasticity, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Price vs Demand',
                        data: retailData.priceDemand.map(d => ({x: d.price, y: d.demand})),
                        backgroundColor: colors.primary,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Price (₹)' },
                        grid: { color: colors.grid }
                    },
                    y: {
                        title: { display: true, text: 'Demand (Units)' },
                        grid: { color: colors.grid }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});
