// common chart utility setup
document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
    
    // Global chart setup based on theme
    window.getChartColors = () => {
        const style = getComputedStyle(document.documentElement);
        return {
            primary: style.getPropertyValue('--accent').trim() || '#00f0ff',
            secondary: style.getPropertyValue('--accent-secondary').trim() || '#7000ff',
            grid: style.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.1)',
            text: style.getPropertyValue('--text-secondary').trim() || '#a0a5b5'
        };
    };
});
