document.addEventListener('DOMContentLoaded', () => {
    if (typeof marketsData === 'undefined') return;

    const colors = window.getChartColors();

    // 1. Main Time Series Chart
    const ctxMarket = document.getElementById('marketChart');
    if (ctxMarket) {
        new Chart(ctxMarket, {
            type: 'line',
            data: {
                labels: marketsData.timeseries.labels,
                datasets: [
                    {
                        label: 'Price',
                        data: marketsData.timeseries.prices,
                        borderColor: colors.primary,
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Volume',
                        type: 'bar',
                        data: marketsData.timeseries.volume,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        grid: { color: colors.grid }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: colors.grid }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    // 2. Correlation Matrix Heatmap
    const heatmapContainer = document.getElementById('heatmapContainer');
    const heatmapTooltip = document.getElementById('heatmapTooltip');
    
    if (heatmapContainer) {
        const stocks = marketsData.stocks;
        const matrix = marketsData.correlation;
        
        matrix.forEach((row, i) => {
            row.forEach((val, j) => {
                const cell = document.createElement('div');
                // Calculate color intensity based on correlation (val is between 0 and 1)
                const intensity = Math.floor(val * 255);
                // We map to a cyan scale
                cell.style.backgroundColor = `rgba(0, 240, 255, ${val * 0.8})`;
                cell.style.aspectRatio = "1/1";
                cell.style.borderRadius = "4px";
                cell.style.display = "flex";
                cell.style.alignItems = "center";
                cell.style.justifyContent = "center";
                cell.style.fontSize = "0.7rem";
                cell.style.color = val > 0.5 ? "#000" : "#fff";
                cell.style.cursor = "pointer";
                cell.style.transition = "transform 0.2s";
                
                cell.innerText = val.toFixed(2);
                
                cell.addEventListener('mouseenter', () => {
                    cell.style.transform = "scale(1.1)";
                    let relationship = "Weak";
                    if(val > 0.7) relationship = "Strong Positive";
                    else if(val > 0.4) relationship = "Moderately Strong Positive";
                    
                    if(i === j) relationship = "Identical (Self)";
                    
                    heatmapTooltip.innerHTML = `
                        <strong style="color:var(--text-primary)">${stocks[i]} ↔ ${stocks[j]}</strong><br>
                        Correlation: <span style="color:var(--accent)">${val.toFixed(2)}</span><br>
                        ${relationship} Relationship
                    `;
                });
                
                cell.addEventListener('mouseleave', () => {
                    cell.style.transform = "scale(1)";
                });
                
                heatmapContainer.appendChild(cell);
            });
        });
    }

    // 3. Risk vs Return Scatter Plot
    const ctxRisk = document.getElementById('riskReturnChart');
    if (ctxRisk) {
        new Chart(ctxRisk, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Stocks',
                    data: marketsData.riskReturn.map(s => ({x: s.risk, y: s.return, stock: s.name})),
                    backgroundColor: colors.secondary,
                    borderColor: colors.primary,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Risk (Standard Deviation)' },
                        grid: { color: colors.grid }
                    },
                    y: {
                        title: { display: true, text: 'Expected Return' },
                        grid: { color: colors.grid }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const d = ctx.raw;
                                return `${d.stock}: Return ${(d.y*100).toFixed(1)}%, Risk ${(d.x*100).toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
});
