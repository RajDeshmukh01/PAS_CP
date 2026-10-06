document.addEventListener('DOMContentLoaded', () => {
    const colors = window.getChartColors();

    // Probability Distribution Lab
    const distType = document.getElementById('distType');
    const meanInput = document.getElementById('meanInput');
    const stdInput = document.getElementById('stdInput');
    const meanVal = document.getElementById('meanVal');
    const stdVal = document.getElementById('stdVal');
    
    const ctxProb = document.getElementById('probChart');
    let probChart;

    function renderProbChart() {
        if (!ctxProb) return;
        
        const m = parseFloat(meanInput.value);
        const s = parseFloat(stdInput.value);
        const type = distType.value;
        
        const labels = [];
        const data = [];
        
        if (type === 'normal') {
            for (let i = -10; i <= 10; i += 0.5) {
                labels.push(i.toFixed(1));
                const exponent = Math.exp(-Math.pow(i - m, 2) / (2 * Math.pow(s, 2)));
                const pdf = (1 / (s * Math.sqrt(2 * Math.PI))) * exponent;
                data.push(pdf);
            }
        } else if (type === 'exponential') {
            // lambda = 1 / mean
            const lambda = m <= 0 ? 0.1 : 1/m; 
            for (let i = 0; i <= 10; i += 0.5) {
                labels.push(i.toFixed(1));
                const pdf = lambda * Math.exp(-lambda * i);
                data.push(pdf);
            }
        } // add others if needed as dummy data
        
        if (!probChart) {
            probChart = new Chart(ctxProb, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Probability Density',
                        data: data,
                        borderColor: colors.primary,
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: colors.grid } }
                    }
                }
            });
        } else {
            probChart.data.labels = labels;
            probChart.data.datasets[0].data = data;
            probChart.update();
        }
    }

    if (distType && meanInput && stdInput) {
        distType.addEventListener('change', renderProbChart);
        meanInput.addEventListener('input', (e) => {
            meanVal.innerText = e.target.value;
            renderProbChart();
        });
        stdInput.addEventListener('input', (e) => {
            stdVal.innerText = e.target.value;
            renderProbChart();
        });
        renderProbChart();
    }

    // Hypothesis Testing Lab
    const runBtn = document.getElementById('runTestBtn');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            const type = document.getElementById('testType').value;
            const alpha = parseFloat(document.getElementById('alphaLvl').value);
            
            // get mock data
            let res = statisticsData.hypothesisTests.find(t => t.name === type);
            if (!res) res = statisticsData.hypothesisTests[0]; // fallback
            
            // Animate values
            const pValEl = document.getElementById('resPVal');
            const statEl = document.getElementById('resStat');
            const decEl = document.getElementById('resDecision');
            
            statEl.innerText = "Calculating...";
            pValEl.innerText = "--";
            decEl.innerText = "--";
            
            setTimeout(() => {
                statEl.innerText = res.stat;
                pValEl.innerText = res.pValue;
                
                if (res.pValue < alpha) {
                    decEl.innerText = "REJECT H₀";
                    decEl.style.color = "var(--negative)";
                } else {
                    decEl.innerText = "FAIL TO REJECT";
                    decEl.style.color = "var(--text-primary)";
                }
            }, 800);
        });
    }

});
