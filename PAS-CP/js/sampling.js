document.addEventListener('DOMContentLoaded', () => {
    const colors = window.getChartColors();
    
    // UI Controls
    const sampleSizeInput = document.getElementById('sampleSize');
    const numSamplesInput = document.getElementById('numSamples');
    const nValue = document.getElementById('nValue');
    const sValue = document.getElementById('sValue');
    const generateBtn = document.getElementById('generateBtn');
    const datasetSelect = document.getElementById('datasetSelect');
    const confBtns = document.querySelectorAll('.conf-btn');
    
    let confidenceLevel = 95;

    sampleSizeInput.addEventListener('input', (e) => { nValue.innerText = e.target.value; });
    numSamplesInput.addEventListener('input', (e) => { sValue.innerText = e.target.value; });

    confBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            confBtns.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
            e.target.classList.remove('btn-secondary');
            e.target.classList.add('btn-primary');
            confidenceLevel = parseInt(e.target.getAttribute('data-val'));
            // Re-render confidence interval if chart exists
            if (currentChartData) updateMetrics();
        });
    });

    // Chart Setup
    const ctxHist = document.getElementById('histogramChart');
    let histogramChart;
    let currentChartData = null;

    function initChart() {
        if (!ctxHist) return;
        histogramChart = new Chart(ctxHist, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Frequency',
                        data: [],
                        backgroundColor: 'rgba(0, 240, 255, 0.5)',
                        borderColor: colors.primary,
                        borderWidth: 1,
                        barPercentage: 1.0,
                        categoryPercentage: 1.0
                    },
                    {
                        label: 'Normal Curve',
                        data: [],
                        type: 'line',
                        borderColor: colors.secondary,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: colors.grid }
                    }
                }
            }
        });
    }

    initChart();

    // Generators
    function generatePopulation(type) {
        const pop = [];
        const size = 10000;
        for(let i=0; i<size; i++) {
            if(type === 'normal') {
                // Box-Muller transform
                let u = 0, v = 0;
                while(u === 0) u = Math.random();
                while(v === 0) v = Math.random();
                let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                pop.push(num * 15 + 100); // mean 100, std 15
            } else if (type === 'uniform') {
                pop.push(Math.random() * 100 + 50); // 50 to 150
            } else if (type === 'exponential') {
                pop.push(-Math.log(Math.random()) * 50); // mean 50
            } else if (type === 'bimodal') {
                let u = 0, v = 0;
                while(u === 0) u = Math.random();
                while(v === 0) v = Math.random();
                let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                if (Math.random() > 0.5) {
                    pop.push(num * 10 + 50);
                } else {
                    pop.push(num * 15 + 150);
                }
            }
        }
        return pop;
    }

    function runSimulation() {
        const status = document.getElementById('simulationStatus');
        status.innerText = "Simulating...";
        
        setTimeout(() => {
            const popType = datasetSelect.value;
            const n = parseInt(sampleSizeInput.value);
            const numSamples = parseInt(numSamplesInput.value);
            
            const population = generatePopulation(popType);
            const popMeanVal = population.reduce((a,b)=>a+b, 0) / population.length;
            
            const sampleMeans = [];
            for (let i = 0; i < numSamples; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    const randIdx = Math.floor(Math.random() * population.length);
                    sum += population[randIdx];
                }
                sampleMeans.push(sum / n);
            }
            
            // Calculate histogram bins
            const min = Math.min(...sampleMeans);
            const max = Math.max(...sampleMeans);
            const numBins = 40;
            const binWidth = (max - min) / numBins;
            
            const bins = Array(numBins).fill(0);
            sampleMeans.forEach(val => {
                let binIdx = Math.floor((val - min) / binWidth);
                if (binIdx >= numBins) binIdx = numBins - 1;
                bins[binIdx]++;
            });
            
            const labels = Array.from({length: numBins}, (_, i) => (min + (i + 0.5) * binWidth).toFixed(1));
            
            const distMeanVal = sampleMeans.reduce((a,b)=>a+b, 0) / sampleMeans.length;
            const variance = sampleMeans.reduce((acc, val) => acc + Math.pow(val - distMeanVal, 2), 0) / sampleMeans.length;
            const stdErrVal = Math.sqrt(variance);

            // Normal curve overlay
            const normalCurve = labels.map(x => {
                const num = parseFloat(x);
                const exponent = Math.exp(-Math.pow(num - distMeanVal, 2) / (2 * Math.pow(stdErrVal, 2)));
                // scale to max bin height for visual overlay
                const maxBin = Math.max(...bins);
                return exponent * maxBin;
            });

            currentChartData = {
                popMeanVal,
                distMeanVal,
                stdErrVal,
                n
            };

            // Update Chart
            histogramChart.data.labels = labels;
            histogramChart.data.datasets[0].data = bins;
            histogramChart.data.datasets[1].data = normalCurve;
            histogramChart.update();

            updateMetrics();
            
            status.innerText = "Completed";
            
            // Run CLT animation
            runCLTAnimation();

        }, 100);
    }

    function updateMetrics() {
        if (!currentChartData) return;
        const { popMeanVal, distMeanVal, stdErrVal, n } = currentChartData;
        
        document.getElementById('popMean').innerText = popMeanVal.toFixed(2);
        document.getElementById('distMean').innerText = distMeanVal.toFixed(2);
        document.getElementById('stdErr').innerText = stdErrVal.toFixed(2);
        
        let zScore = 1.96; // 95%
        if (confidenceLevel === 90) zScore = 1.645;
        if (confidenceLevel === 99) zScore = 2.576;
        
        const marginOfError = zScore * stdErrVal;
        const lower = distMeanVal - marginOfError;
        const upper = distMeanVal + marginOfError;
        
        document.getElementById('confInt').innerText = `[${lower.toFixed(1)}, ${upper.toFixed(1)}]`;
    }

    if(generateBtn) {
        generateBtn.addEventListener('click', runSimulation);
    }

    // CLT Animation Logic (Canvas + GSAP)
    function runCLTAnimation() {
        const canvas = document.getElementById('cltCanvas');
        if (!canvas) return;
        
        // Setup high dpi canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        
        const width = rect.width;
        const height = rect.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const particles = [];
        const numParticles = 100;
        
        // Stage 1: Population
        for(let i = 0; i < numParticles; i++) {
            particles.push({
                x: 20 + Math.random() * 40,
                y: height/2 - 40 + Math.random() * 80,
                r: 2,
                color: colors.text,
                alpha: 1
            });
        }
        
        let reqId;
        function draw() {
            ctx.clearRect(0, 0, width, height);
            
            // Draw regions
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(0, 0, width/4, height);
            ctx.fillRect(width/2, 0, width/4, height);
            
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
                ctx.fill();
            });
            reqId = requestAnimationFrame(draw);
        }
        
        if(window.cltAnimReq) cancelAnimationFrame(window.cltAnimReq);
        window.cltAnimReq = requestAnimationFrame(draw);
        
        // GSAP Animation Sequence
        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => cancelAnimationFrame(reqId), 1000);
            }
        });
        
        // Move to Sample area
        tl.to(particles, {
            duration: 1,
            x: (i) => width/4 + 20 + (i%5) * 15,
            y: (i) => height/4 + Math.floor(i/5) * 10,
            color: colors.primary,
            stagger: 0.01,
            ease: "power2.inOut"
        });
        
        // Consolidate to Means
        const means = [];
        for(let i=0; i<20; i++) {
            means.push({
                x: width/2 + 40,
                y: height/4 + i * 10,
                r: 4,
                color: colors.secondary,
                alpha: 0
            });
        }
        
        tl.add(() => {
            particles.forEach(p => p.alpha = 0);
            means.forEach(m => { m.alpha = 1; particles.push(m); });
        }, "+=0.5");
        
        // Move to Distribution
        tl.to(means, {
            duration: 1,
            x: (i) => {
                // Bell curve shape roughly
                const distFromCenter = Math.abs(i - 10);
                return width * 0.85 + (Math.random() * (10 - distFromCenter) * 4);
            },
            y: (i) => height - 20 - (i * 8),
            stagger: 0.05,
            ease: "bounce.out"
        }, "+=0.2");
    }

    // Initialize with a default run
    setTimeout(runSimulation, 500);
});
