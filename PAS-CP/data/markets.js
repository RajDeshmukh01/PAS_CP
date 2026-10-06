// mock data for markets
const marketsData = {
    stocks: ["Reliance Industries", "TCS", "Infosys", "HDFC Bank", "ICICI Bank", "ITC"],
    correlation: [
        [1.00, 0.61, 0.55, 0.42, 0.45, 0.30],
        [0.61, 1.00, 0.82, 0.35, 0.38, 0.25],
        [0.55, 0.82, 1.00, 0.31, 0.33, 0.20],
        [0.42, 0.35, 0.31, 1.00, 0.85, 0.40],
        [0.45, 0.38, 0.33, 0.85, 1.00, 0.42],
        [0.30, 0.25, 0.20, 0.40, 0.42, 1.00]
    ],
    riskReturn: [
        { name: "RELIANCE", risk: 0.18, return: 0.15 },
        { name: "TCS", risk: 0.14, return: 0.12 },
        { name: "INFY", risk: 0.16, return: 0.13 },
        { name: "HDFC", risk: 0.12, return: 0.10 },
        { name: "ICICI", risk: 0.22, return: 0.18 },
        { name: "ITC", risk: 0.10, return: 0.08 }
    ],
    timeseries: {
        labels: Array.from({length: 30}, (_, i) => `Day ${i+1}`),
        prices: Array.from({length: 30}, () => 2000 + Math.random() * 500),
        volume: Array.from({length: 30}, () => Math.floor(10000 + Math.random() * 50000))
    }
};

window.marketsData = marketsData;
