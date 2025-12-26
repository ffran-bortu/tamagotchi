// ============================================================================
// PET CANVAS CONTROLLER
// Manages 3-layer canvas rendering with sprite animations
// Updated for normalized scaling and background support
// ============================================================================

export class PetCanvasController {
    constructor(db, canvasId = null) {
        this.db = db;
        this.canvasId = canvasId; // If provided, runs in single-canvas "preview" mode
        this.singleCanvasMode = !!canvasId;

        this.canvases = {
            background: null,
            pet: null,
            accessory: null
        };
        this.contexts = {
            background: null,
            pet: null,
            accessory: null
        };

        // Resize Observer
        this.resizeObserver = null;

        // New Sprite Structure
        this.sprites = {
            foxes: {
                1: { idle: [], eat: [], minW: 0, minH: 0 },
                2: { idle: [], eat: [], minW: 0, minH: 0 },
                3: { idle: [], eat: [], minW: 0, minH: 0 }
            },
            hats: [], // Index 0 is null (no hat), 1-9 are images
            backgrounds: []
        };

        this.currentPetColor = 1; // 1, 2, or 3
        this.currentHat = 0; // 0-9 (0 = no hat)
        this.animationState = 'idle'; // 'idle' | 'feeding' | 'waiting'
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.frameDelay = 150; // ms per frame
        this.animationLoopId = null;

        // Animation Config
        this.idleCycleDelay = 7000; // 7 seconds wait between idle animations
        this.lastIdleCycleTime = 0;
    }

    async initialize(startAnimation = true) {
        this.setupCanvases();
        await this.loadSprites();
        await this.loadPetCustomization();

        // Initial Draw
        this.drawAll();

        if (startAnimation) {
            this.startAnimationLoop();
            this.setupControls();
        }
    }

    setupCanvases() {
        if (this.singleCanvasMode) {
            // Preview Mode: Use one canvas for everything
            const canvas = document.getElementById(this.canvasId);
            if (!canvas) {
                console.error('Preview canvas not found:', this.canvasId);
                return;
            }

            this.canvases.pet = canvas;
            this.canvases.accessory = canvas;
            this.canvases.background = canvas;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            canvas.style.imageRendering = 'pixelated';

            this.contexts.pet = ctx;
            this.contexts.accessory = ctx;
            this.contexts.background = ctx;

            return;
        }

        // Standard Mode: 3 layers
        this.canvases.background = document.getElementById('pet-bg-canvas');
        this.canvases.pet = document.getElementById('pet-sprite-canvas');
        this.canvases.accessory = document.getElementById('pet-accessory-canvas');

        if (!this.canvases.background || !this.canvases.pet || !this.canvases.accessory) {
            console.error('Canvas elements not found');
            return;
        }

        // Get contexts
        this.contexts.background = this.canvases.background.getContext('2d');
        this.contexts.pet = this.canvases.pet.getContext('2d');
        this.contexts.accessory = this.canvases.accessory.getContext('2d');

        // Set pixel-perfect rendering
        Object.values(this.contexts).forEach(ctx => {
            ctx.imageSmoothingEnabled = false;
        });

        Object.values(this.canvases).forEach(canvas => {
            canvas.style.imageRendering = 'pixelated';
        });

        // Setup ResizeObserver
        if (this.resizeObserver) this.resizeObserver.disconnect();

        if (!this.singleCanvasMode) {
            const container = this.canvases.background.parentElement;
            this.resizeObserver = new ResizeObserver(() => {
                this.resizeCanvases();
                this.drawAll();
            });
            this.resizeObserver.observe(container);
        }

        // Initial size
        this.resizeCanvases();
    }

    resizeCanvases() {
        if (this.singleCanvasMode) return; // Preview size handled by CSS/HTML

        const container = this.canvases.background.parentElement;
        // Ensure square aspect ratio based on smallest dimension
        const size = Math.min(container.clientWidth, container.clientHeight);

        Object.values(this.canvases).forEach(canvas => {
            if (canvas.width !== size || canvas.height !== size) {
                canvas.width = size;
                canvas.height = size;
            }
        });
    }

    async loadSprites() {
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        try {
            // Show loading
            if (this.contexts.pet && this.canvases.pet) {
                 this.contexts.pet.fillStyle = '#1a1a1a';
                 this.contexts.pet.fillRect(0, 0, this.canvases.pet.width, this.canvases.pet.height);
            }

            // Load Foxes (1-3)
            for (let i = 1; i <= 3; i++) {
                const foxData = this.sprites.foxes[i];
                let minW = Infinity, minH = Infinity;

                // Load Idle Frames (1-4)
                for (let j = 1; j <= 4; j++) {
                    const src = `public/sprites/fox_${i}/idle/fox_${i}_idle_${j}.png`;
                    try {
                        const img = await loadImage(src);
                        foxData.idle.push(img);
                        if (img.width < minW) minW = img.width;
                        if (img.height < minH) minH = img.height;
                    } catch (e) {
                        console.warn(`Skipping missing sprite: ${src}`);
                    }
                }

                // Load Eat Frames (1-3)
                for (let j = 1; j <= 3; j++) {
                    const src = `public/sprites/fox_${i}/eat/fox_${i}_eat_${j}.png`;
                    try {
                        const img = await loadImage(src);
                        foxData.eat.push(img);
                        // We include eating frames in min calculation to ensure consistent scale
                        if (img.width < minW) minW = img.width;
                        if (img.height < minH) minH = img.height;
                    } catch (e) {
                        console.warn(`Skipping missing sprite: ${src}`);
                    }
                }

                foxData.minW = minW === Infinity ? 64 : minW;
                foxData.minH = minH === Infinity ? 64 : minH;
            }

            // Load Hats (1-9)
            this.sprites.hats.push(null);
            for (let i = 1; i <= 9; i++) {
                const src = `public/sprites/hats/hat_${i}.png`;
                try {
                    const img = await loadImage(src);
                    this.sprites.hats.push(img);
                } catch (e) {
                    console.warn(`Skipping missing sprite: ${src}`);
                    this.sprites.hats.push(null);
                }
            }

            // Load Backgrounds (1-4)
            for (let i = 1; i <= 4; i++) {
                const src = `public/sprites/backgrounds/background_${i}.png`;
                try {
                    const img = await loadImage(src);
                    this.sprites.backgrounds.push(img);
                } catch (e) {
                    console.warn(`Skipping missing background: ${src}`);
                }
            }

            console.log('✅ Sprites loaded successfully');
        } catch (error) {
            console.error('❌ Error loading sprites:', error);
        }
    }

    async loadPetCustomization() {
        const petState = this.db.getPetState();
        this.currentHat = parseInt(petState.currentHat) || 0;
        this.currentPetColor = petState.currentColor || 1;
    }

    drawAll() {
        if (this.singleCanvasMode) {
             // In single canvas mode, we must draw in order: BG -> Pet -> Hat
             const ctx = this.contexts.pet;
             ctx.clearRect(0, 0, this.canvases.pet.width, this.canvases.pet.height);

             this.drawBackground();
             this.drawPetFrame(); // Draws pet and calls drawHat internally if separated? No, separate layers normally.
             // In single mode, drawPetFrame handles the pet.
             this.drawHat();
        } else {
            this.drawBackground();
            this.drawPetFrame();
            this.drawHat();
        }
    }

    drawPet(color, hat) {
        this.currentPetColor = parseInt(color) || 1;
        this.currentHat = hat === '' ? 0 : (parseInt(hat) || 0);
        this.drawAll();
    }

    drawBackground() {
        const ctx = this.contexts.background;
        const canvas = this.canvases.background;

        // Use background corresponding to pet color/theme or default to 1
        // Mapping: Fox 1 -> BG 1, Fox 2 -> BG 2, Fox 3 -> BG 3
        const bgIndex = Math.min(this.currentPetColor - 1, this.sprites.backgrounds.length - 1);
        const bgImg = this.sprites.backgrounds[bgIndex] || this.sprites.backgrounds[0];

        if (bgImg) {
            // Draw image covering canvas
             // We want to cover the canvas without distorting aspect ratio too much
             // or just stretch it if it's pixel art background
             ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback gradient
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width / 2
            );
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    drawPetFrame() {
        const ctx = this.contexts.pet;
        const canvas = this.canvases.pet;

        if (!this.singleCanvasMode) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const foxData = this.sprites.foxes[this.currentPetColor];
        if (!foxData) return;

        let frames;
        if (this.animationState === 'idle' || this.animationState === 'waiting') {
            frames = foxData.idle;
        } else {
            frames = foxData.eat;
        }

        if (!frames || frames.length === 0) return;

        // For 'waiting', we stick to the first idle frame
        const frameIndex = this.animationState === 'waiting' ? 0 : (this.currentFrame % frames.length);
        const img = frames[frameIndex];

        if (!img) return;

        // NORMALIZE SCALING:
        // Use minW/minH to determine the 'content box' scale
        // This ensures trimmed frames (min) fill the target area, and untrimmed frames (large) are scaled down equally.
        // Target: 85% of canvas
        const targetScale = Math.min(canvas.width / foxData.minW, canvas.height / foxData.minH) * 0.85;

        const drawW = img.width * targetScale;
        const drawH = img.height * targetScale;

        // Center alignment
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;

        ctx.drawImage(img, x, y, drawW, drawH);
    }

    drawHat() {
        const ctx = this.contexts.accessory;
        const canvas = this.canvases.accessory;

        if (!this.singleCanvasMode) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (this.currentHat === 0) return;

        const hatImg = this.sprites.hats[this.currentHat];
        if (!hatImg) return;

        const foxData = this.sprites.foxes[this.currentPetColor];
        // Use same scale logic as pet to maintain relative size
        const targetScale = Math.min(canvas.width / foxData.minW, canvas.height / foxData.minH) * 0.85;

        // Increase hat size slightly as requested ("hats are tiny")
        // Previous was 0.6, bumping to 0.8 relative to fox scale
        // But if fox scale is consistent, we can just tune this.
        // Let's try 1.0 (matching pixel scale of fox) if resolution is similar.
        // If hats are high-res, 1.0 might be huge.
        // Based on user feedback "tiny", I'll bump significantly.
        const hatScale = targetScale * 1.0;

        const drawW = hatImg.width * hatScale;
        const drawH = hatImg.height * hatScale;

        // Position: Centered horizontally, Top of pet vertically
        // Offset Calculation:
        // We need to know where the top of the pet is.
        // Since we center the pet, the top of the bounding box is (canvas.height - petHeight)/2.
        // BUT, if the pet frame is untrimmed (huge), the top of the IMAGE is way above the visible pet.
        // This is tricky.
        // We will assume the hat should be placed relative to the visual center.
        // User suggested "Top of head".
        // Let's try a fixed offset from center.
        // Move UP from center by some factor of canvas height.
        const offsetUp = canvas.height * 0.25; // 25% up from center

        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height / 2) - offsetUp - (drawH / 2);

        ctx.drawImage(hatImg, x, y, drawW, drawH);
    }

    startAnimationLoop() {
        const animate = (timestamp) => {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;

            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= this.frameDelay) {
                this.lastFrameTime = timestamp;

                if (this.animationState === 'feeding') {
                    this.currentFrame++;
                    if (this.currentFrame >= this.sprites.foxes[this.currentPetColor].eat.length) {
                        this.animationState = 'idle';
                        this.currentFrame = 0;
                        this.lastIdleCycleTime = timestamp;
                    }
                } else if (this.animationState === 'idle') {
                    this.currentFrame++;
                    const idleLength = this.sprites.foxes[this.currentPetColor].idle.length;

                    if (this.currentFrame >= idleLength) {
                        // Completed one idle cycle
                        this.animationState = 'waiting';
                        this.currentFrame = 0;
                        this.lastIdleCycleTime = timestamp;
                    }
                } else if (this.animationState === 'waiting') {
                    // Check if wait is over
                    if (timestamp - this.lastIdleCycleTime > this.idleCycleDelay) {
                        this.animationState = 'idle';
                        this.currentFrame = 0;
                    }
                }

                if (!this.singleCanvasMode) {
                     this.drawPetFrame(); // Only redraw pet in multi-canvas mode
                     // Hat and BG are static unless changed
                } else {
                    this.drawAll(); // Redraw everything in single canvas
                }
            }

            this.animationLoopId = requestAnimationFrame(animate);
        };

        this.animationLoopId = requestAnimationFrame(animate);
    }

    stopAnimations() {
        if (this.animationLoopId) {
            cancelAnimationFrame(this.animationLoopId);
            this.animationLoopId = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    playFeedingAnimation() {
        this.animationState = 'feeding';
        this.currentFrame = 0;
    }

    cycleHat(direction) {
        if (direction === 'next') {
            this.currentHat = (this.currentHat + 1) % 10;
        } else {
            this.currentHat = (this.currentHat - 1 + 10) % 10;
        }
        this.db.updatePetHat(this.currentHat.toString());
        this.drawHat(); // In single mode, this might need drawAll
        if(this.singleCanvasMode) this.drawAll();
    }

    cycleColor(direction) {
        if (direction === 'next') {
            this.currentPetColor = (this.currentPetColor % 3) + 1;
        } else {
            this.currentPetColor = ((this.currentPetColor - 2 + 3) % 3) + 1;
        }
        this.db.updatePetColor(this.currentPetColor);

        // Update BG if needed
        if(!this.singleCanvasMode) this.drawBackground();

        this.drawPetFrame();
        if(this.singleCanvasMode) this.drawAll();
    }

    setupControls() {
        // ... (Keep existing controls logic)
    }
}
