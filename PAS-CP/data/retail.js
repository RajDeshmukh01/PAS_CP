// mock data for retail
const retailData = {
    festivals: [
        { name: "Makar Sankranti", impact: 12.5 },
        { name: "Holi", impact: 18.7 },
        { name: "Eid", impact: 15.2 },
        { name: "Raksha Bandhan", impact: 22.1 },
        { name: "Navratri", impact: 28.5 },
        { name: "Dussehra", impact: 21.4 },
        { name: "Diwali", impact: 42.8 },
        { name: "Christmas", impact: 35.0 }
    ],
    priceDemand: Array.from({length: 50}, () => {
        const price = 50 + Math.random() * 200;
        // Negative correlation + noise
        const demand = 1000 - (price * 2) + (Math.random() * 200 - 100);
        return { price, demand };
    }),
    timeseries: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        sales: [120, 115, 140, 130, 150, 160, 155, 180, 210, 280, 320, 250] // Shows seasonality spike around Oct/Nov
    }
};
window.retailData = retailData;
