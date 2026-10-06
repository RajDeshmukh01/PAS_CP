document.addEventListener('DOMContentLoaded', () => {
    // GSAP Registration
    gsap.registerPlugin(ScrollTrigger);

    // Initial animations
    const initAnimations = () => {
        const tl = gsap.timeline();
        
        tl.to('.loader-container', {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                document.getElementById('loader').style.display = 'none';
            }
        })
        .from('.status-indicator', {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.2")
        .from('.hero-title', {
            y: 40,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, "-=0.6")
        .from('.hero-subtitle', {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.6")
        .from('.hero-buttons .btn', {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.4")
        .from('.stat-card', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.2")
        .from('.glass-panel', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.6");
    };

    // Hero Canvas Animation Setup
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) {
        initAnimations();
        return; // Skip canvas if not on homepage
    }
    
    const context = canvas.getContext('2d');
    
    const frameCount = 300; // We have 300 jpg frames
    const currentFrame = index => (
        `./GSAP Animation Video/frame_${(index + 1).toString().padStart(3, '0')}.jpg`
    );

    const images = [];
    const airpods = {
        frame: 0
    };

    // Responsive Canvas
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render();
    };

    // Preloader Logic
    let loadedCount = 0;
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');

    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
        
        img.onload = () => {
            loadedCount++;
            
            if (progressFill) {
                progressFill.style.width = `${(loadedCount / frameCount) * 100}%`;
            }
            
            if (loadingText) {
                loadingText.innerText = `LOADING CORE ENGINE (${Math.round((loadedCount / frameCount) * 100)}%)`;
            }
            
            if (loadedCount === 1) {
                // Draw first frame immediately
                resizeCanvas();
            }
            
            if (loadedCount === frameCount) {
                // All frames loaded
                if (loadingText) loadingText.innerText = "SYSTEM READY";
                setTimeout(initAnimations, 500);
                setupScrollTrigger();
            }
        };
        
        img.onerror = () => {
            console.warn(`Failed to load frame ${i}. Assuming fewer frames.`);
            loadedCount++;
            if (loadedCount === frameCount) {
                setTimeout(initAnimations, 500);
                setupScrollTrigger();
            }
        }
    }

    window.addEventListener('resize', resizeCanvas);

    function render() {
        if (!images[airpods.frame]) return;
        const img = images[airpods.frame];
        if (img.complete && img.naturalWidth !== 0) {
            // Calculate aspect ratio
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);
            
            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(
                img, 
                0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
            );
        }
    }

    function setupScrollTrigger() {
        gsap.to(airpods, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: "#hero",
                pin: true,
                start: "top top",
                end: "+=2000",
                scrub: 1, // Smooth scrubbing
                onUpdate: () => render()
            }
        });
    }

    // Call render once to be sure
    render();
});
