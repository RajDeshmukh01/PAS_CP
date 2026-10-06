// mock data for forecasts
const forecastsData = {
    models: ["Moving Average", "ARIMA", "Random Forest", "XGBoost", "LSTM", "CNN-LSTM"],
    comparison: [
        { model: "Moving Average", mae: 45.2, rmse: 52.1, mape: 8.4, r2: 0.65 },
        { model: "ARIMA", mae: 32.1, rmse: 38.5, mape: 6.2, r2: 0.78 },
        { model: "Random Forest", mae: 28.4, rmse: 33.2, mape: 5.1, r2: 0.85 },
        { model: "XGBoost", mae: 24.1, rmse: 29.8, mape: 4.2, r2: 0.89 },
        { model: "LSTM", mae: 18.5, rmse: 22.4, mape: 3.1, r2: 0.94 },
        { model: "CNN-LSTM", mae: 16.2, rmse: 19.8, mape: 2.8, r2: 0.96 }
    ],
    timeseries: {
        labels: Array.from({length: 40}, (_, i) => `T+${i}`),
        actual: Array.from({length: 30}, (_, i) => 1000 + Math.sin(i/3)*200 + i*10 + (Math.random()*50 - 25)),
        predicted: Array.from({length: 40}, (_, i) => 1000 + Math.sin(i/3)*200 + i*10),
        upperBound: Array.from({length: 40}, (_, i) => 1000 + Math.sin(i/3)*200 + i*10 + 80),
        lowerBound: Array.from({length: 40}, (_, i) => 1000 + Math.sin(i/3)*200 + i*10 - 80)
    }
};
window.forecastsData = forecastsData;
