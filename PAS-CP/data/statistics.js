// Mock data for statistics
const statisticsData = {
    hypothesisTests: [
        { name: "t-test", pValue: 0.042, stat: 2.15, decision: "REJECT H₀" },
        { name: "z-test", pValue: 0.0021, stat: 3.08, decision: "REJECT H₀" },
        { name: "ANOVA", pValue: 0.15, stat: 1.89, decision: "FAIL TO REJECT H₀" },
        { name: "Chi-square", pValue: 0.012, stat: 14.2, decision: "REJECT H₀" }
    ]
};
window.statisticsData = statisticsData;
