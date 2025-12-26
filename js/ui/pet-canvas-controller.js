// ============================================================================
// PET CANVAS CONTROLLER
// Manages 3-layer canvas rendering with sprite animations
// Updated for new individual sprite asset structure
// ============================================================================

export class PetCanvasController {
    constructor(db) {
        this.db = db;
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

        // New Sprite Structure
        this.sprites = {
            foxes: {
                1: { idle: [], eat: [] },
                2: { idle: [], eat: [] },
                3: { idle: [], eat: [] }
            },
            hats: [] // Index 0 is null (no hat), 1-9 are images
        };

        this.currentPetColor = 1; // 1, 2, or 3
        this.currentHat = 0; // 0-9 (0 = no hat)
        this.animationState = 'idle'; // 'idle' | 'feeding'
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.frameDelay = 150; // ms per frame
        this.animationLoopId = null;

        // Animation Config
        this.idleFrameCount = 4;
        this.feedingFrameCount = 3;
    }

    async initialize() {
        this.setupCanvases();
        await this.loadSprites();
        await this.loadPetCustomization();
        this.drawBackground();
        this.drawHat();
        this.startAnimationLoop();
        this.setupControls();
    }

    setupCanvases() {
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

        // Size canvases
        this.resizeCanvases();
    }

    resizeCanvases() {
        const container = this.canvases.background.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);

        Object.values(this.canvases).forEach(canvas => {
            canvas.width = size;
            canvas.height = size;
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
            // Show loading indicator
            const petCanvas = this.canvases.pet;
            const ctx = this.contexts.pet;
            if (petCanvas && ctx) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, petCanvas.width, petCanvas.height);
                ctx.fillStyle = '#9370DB';
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Loading sprites...', petCanvas.width / 2, petCanvas.height / 2);
            }

            // Load Foxes (1-3)
            for (let i = 1; i <= 3; i++) {
                // Load Idle Frames (1-4)
                for (let j = 1; j <= 4; j++) {
                    const src = `/public/sprites/fox_${i}/idle/fox_${i}_idle_${j}.png`;
                    try {
                        const img = await loadImage(src);
                        this.sprites.foxes[i].idle.push(img);
                    } catch (e) {
                        console.warn(`Skipping missing sprite: ${src}`);
                    }
                }

                // Load Eat Frames (1-3)
                for (let j = 1; j <= 3; j++) {
                    const src = `/public/sprites/fox_${i}/eat/fox_${i}_eat_${j}.png`;
                    try {
                        const img = await loadImage(src);
                        this.sprites.foxes[i].eat.push(img);
                    } catch (e) {
                        console.warn(`Skipping missing sprite: ${src}`);
                    }
                }
            }

            // Load Hats (1-9)
            // Index 0 reserved for 'no hat'
            this.sprites.hats.push(null);
            for (let i = 1; i <= 9; i++) {
                const src = `/public/sprites/hats/hat_${i}.png`;
                try {
                    const img = await loadImage(src);
                    this.sprites.hats.push(img);
                } catch (e) {
                    console.warn(`Skipping missing sprite: ${src}`);
                    this.sprites.hats.push(null); // Keep index alignment
                }
            }

            console.log('✅ Sprites loaded successfully (New Structure)');
        } catch (error) {
            console.error('❌ Error loading sprites:', error);

            // Show error message
            const petCanvas = this.canvases.pet;
            const ctx = this.contexts.pet;
            if (petCanvas && ctx) {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, petCanvas.width, petCanvas.height);
                ctx.fillStyle = '#F08080';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Failed to load sprites', petCanvas.width / 2, petCanvas.height / 2 - 10);
                ctx.fillText('Check console', petCanvas.width / 2, petCanvas.height / 2 + 10);
            }
        }
    }

    async loadPetCustomization() {
        const petState = this.db.getPetState();
        this.currentHat = parseInt(petState.currentHat) || 0;
        this.currentPetColor = petState.currentColor || 1;
    }

    drawBackground() {
        const ctx = this.contexts.background;
        const canvas = this.canvases.background;

        // Dark gradient background
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#0a0a0a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawPetFrame() {
        const ctx = this.contexts.pet;
        const canvas = this.canvases.pet;

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get correct frame list based on state
        const foxData = this.sprites.foxes[this.currentPetColor];
        if (!foxData) return;

        let frames;
        if (this.animationState === 'idle') {
            frames = foxData.idle;
        } else { // feeding
            frames = foxData.eat;
        }

        if (!frames || frames.length === 0) return;

        // Get current image index
        // Use modulo to cyclesafely
        const frameIndex = this.currentFrame % frames.length;
        const img = frames[frameIndex];

        if (!img) return;

        // SCALING LOGIC
        // Scale to fit canvas (maintaining aspect ratio) with 80% coverage
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        // Center position
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;

        // Draw image
        ctx.drawImage(img, x, y, drawW, drawH);
    }

    drawHat() {
        const ctx = this.contexts.accessory;
        const canvas = this.canvases.accessory;

        // Clear previous
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.currentHat === 0) return; // No hat

        const hatImg = this.sprites.hats[this.currentHat];
        if (!hatImg) return;

        // SCALING LOGIC
        // We need the pet dimensions to position the hat correctly relative to the pet
        // We assume the pet scaling logic from drawPetFrame:
        // Use fox1 idle frame 0 as reference for scaling
        const refFox = this.sprites.foxes[1].idle[0];
        if (!refFox) return;

        const scale = Math.min(canvas.width / refFox.width, canvas.height / refFox.height) * 0.8;

        // Hat Scaling:
        // Assuming the hat image should check dimensions relative to fox.
        // If hats are roughly same resolution as fox head, we might need a specific scale factor.
        // Previous logic used 0.6 factor. We'll stick with that for now.
        const hatScale = scale * 0.6;

        const drawSizeW = hatImg.width * hatScale; // Use aspect ratio of hat
        const drawSizeH = hatImg.height * hatScale;

        const x = (canvas.width - drawSizeW) / 2;

        // Offset Y: Position on top of head
        // Depending on the new assets, the "top of head" might vary.
        // Previous offset was calculated based on fox height.
        // Let's try to position it slightly above center-top of the fox.
        const petDrawH = refFox.height * scale;
        const petY = (canvas.height - petDrawH) / 2;

        // Position hat: Start at petY, move up by some percentage of hat height
        // Adjust this offset based on visual testing
        const y = petY - (drawSizeH * 0.2);

        ctx.drawImage(hatImg, x, y, drawSizeW, drawSizeH);
    }

    startAnimationLoop() {
        const animate = (timestamp) => {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;

            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= this.frameDelay) {
                this.currentFrame++;

                // Check if feeding animation completed
                if (this.animationState === 'feeding' && this.currentFrame >= this.sprites.foxes[this.currentPetColor].eat.length) {
                    this.animationState = 'idle';
                    this.currentFrame = 0;
                }

                this.drawPetFrame();
                this.lastFrameTime = timestamp;
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
    }

    playFeedingAnimation() {
        this.animationState = 'feeding';
        this.currentFrame = 0;
    }

    cycleHat(direction) {
        // 10 options now (0-9)
        if (direction === 'next') {
            this.currentHat = (this.currentHat + 1) % 10;
        } else {
            this.currentHat = (this.currentHat - 1 + 10) % 10;
        }

        // Save to database
        this.db.updatePetHat(this.currentHat.toString());

        // Redraw hat layer
        this.drawHat();
    }

    cycleColor(direction) {
        if (direction === 'next') {
            this.currentPetColor = (this.currentPetColor % 3) + 1; // 1 → 2 → 3 → 1
        } else {
            this.currentPetColor = ((this.currentPetColor - 2 + 3) % 3) + 1; // 1 → 3 → 2 → 1
        }

        // Save to database
        this.db.updatePetColor(this.currentPetColor);

        // Force redraw of current pet frame with new color
        this.drawPetFrame();
    }

    setupControls() {
        const prevHatBtn = document.getElementById('prev-hat');
        const nextHatBtn = document.getElementById('next-hat');
        const prevColorBtn = document.getElementById('prev-color');
        const nextColorBtn = document.getElementById('next-color');

        if (prevHatBtn) {
            prevHatBtn.addEventListener('click', () => this.cycleHat('prev'));
        }

        if (nextHatBtn) {
            nextHatBtn.addEventListener('click', () => this.cycleHat('next'));
        }

        if (prevColorBtn) {
            prevColorBtn.addEventListener('click', () => this.cycleColor('prev'));
        }

        if (nextColorBtn) {
            nextColorBtn.addEventListener('click', () => this.cycleColor('next'));
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.cycleHat('prev');
            if (e.key === 'ArrowRight') this.cycleHat('next');
            if (e.key === 'ArrowUp') this.cycleColor('next');
            if (e.key === 'ArrowDown') this.cycleColor('prev');
        });
    }
}
