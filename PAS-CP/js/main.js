// Initialize Lucide Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeBtn = document.getElementById('themeBtn');
    const htmlEl = document.documentElement;
    
    // Check local storage for theme
    const savedTheme = localStorage.getItem('statx-theme');
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
    
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('statx-theme', newTheme);
            updateThemeIcon(newTheme);
            
            // Re-render any charts if they exist
            if (typeof renderCharts === 'function') {
                renderCharts(newTheme);
            }
        });
    }
    
    function updateThemeIcon(theme) {
        if(!themeBtn) return;
        const icon = theme === 'dark' ? 'sun' : 'moon';
        themeBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
        lucide.createIcons();
    }

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if(navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Command Palette (Ctrl+K)
    const cmdPalette = document.getElementById('cmdPalette');
    const cmdInput = document.getElementById('cmdInput');
    const searchBtn = document.getElementById('searchBtn');
    
    const toggleCmdPalette = () => {
        if(!cmdPalette) return;
        cmdPalette.classList.toggle('active');
        if (cmdPalette.classList.contains('active') && cmdInput) {
            cmdInput.focus();
            cmdInput.value = '';
            populateCmdResults('');
        }
    };
    
    if(searchBtn) {
        searchBtn.addEventListener('click', toggleCmdPalette);
    }
    
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleCmdPalette();
        }
        
        if (e.key === 'Escape' && cmdPalette && cmdPalette.classList.contains('active')) {
            toggleCmdPalette();
        }
    });
    
    if(cmdPalette) {
        cmdPalette.addEventListener('click', (e) => {
            if (e.target === cmdPalette) {
                toggleCmdPalette();
            }
        });
    }

    // Dummy search data
    const searchData = [
        { title: 'Overview Dashboard', url: 'index.html', icon: 'home' },
        { title: 'Financial Markets', url: 'markets.html', icon: 'trending-up' },
        { title: 'Retail Analytics', url: 'retail.html', icon: 'shopping-bag' },
        { title: 'Statistics Hub', url: 'statistics.html', icon: 'sigma' },
        { title: 'Sampling Lab', url: 'sampling.html', icon: 'bar-chart' },
        { title: 'Forecasting Models', url: 'forecasting.html', icon: 'cpu' },
        { title: 'What-If Simulator', url: 'simulator.html', icon: 'sliders' }
    ];

    function populateCmdResults(query) {
        const resultsContainer = document.getElementById('cmdResults');
        if(!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        const lowerQuery = query.toLowerCase();
        
        const filtered = searchData.filter(item => 
            item.title.toLowerCase().includes(lowerQuery)
        );
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="cmd-result-item">No results found</div>';
            return;
        }
        
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cmd-result-item';
            div.innerHTML = `
                <i data-lucide="${item.icon}"></i>
                <span>${item.title}</span>
            `;
            div.addEventListener('click', () => {
                window.location.href = item.url;
            });
            resultsContainer.appendChild(div);
        });
        
        lucide.createIcons();
    }
    
    if(cmdInput) {
        cmdInput.addEventListener('input', (e) => {
            populateCmdResults(e.target.value);
        });
    }

    // Counter Animations
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseFloat(target.getAttribute('data-target'));
                animateCounter(target, endValue, 2000);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
    
    function animateCounter(element, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easeOut = progress * (2 - progress);
            
            let val = easeOut * end;
            
            if (end > 1000) {
                val = (val / 1000000).toFixed(1) + 'M';
            } else if (end % 1 !== 0) {
                val = val.toFixed(1);
            } else {
                val = Math.floor(val);
            }
            
            element.innerText = val;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                // Ensure final value is exact
                if (end > 1000) element.innerText = (end / 1000000).toFixed(1) + 'M';
                else element.innerText = end;
            }
        };
        window.requestAnimationFrame(step);
    }
});
