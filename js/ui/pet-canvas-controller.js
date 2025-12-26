// ============================================================================
// PET CANVAS CONTROLLER
// Manages 3-layer canvas rendering with sprite animations
// ============================================================================

export class PetCanvasController {
    constructor(db, canvasId = null) {
        this.db = db;
        this.canvasId = canvasId; // To distinguish between main and closet canvas
        this.canvases = {
            background: null,
            pet: null
        };
        this.contexts = {
            background: null,
            pet: null
        };

        this.sprites = {
            fox1: { idle: [], eat: [] },
            fox2: { idle: [], eat: [] },
            fox3: { idle: [], eat: [] },
            hats: []
        };

        this.currentPetColor = 1; // 1, 2, or 3
        this.currentHat = 0; // 0-8 (0 = no hat)
        this.animationState = 'idle'; // 'idle' | 'feeding'
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.frameDelay = 150; // ms per frame
        this.animationLoopId = null;

        this.idleFrameCount = 4;
        this.feedingFrameCount = 3; // Max 3 for now
    }

    async initialize(startAnimation = true) {
        this.setupCanvases();
        await this.loadSprites();

        if (this.canvasId) {
            // This is a preview canvas (e.g., in the closet), don't start animations
            return;
        }

        await this.loadPetCustomization();
        this.drawBackground();
        this.redrawPet();
        if (startAnimation) {
            this.startAnimationLoop();
        }
        this.setupControls();
    }

    setupCanvases() {
        if (this.canvasId) {
            const canvas = document.getElementById(this.canvasId);
            if (!canvas) {
                console.error(`Canvas with id ${this.canvasId} not found.`);
                return;
            }
            this.canvases.pet = canvas;
            this.contexts.pet = canvas.getContext('2d');
            this.contexts.pet.imageSmoothingEnabled = false;
        } else {
            this.canvases.background = document.getElementById('pet-bg-canvas');
            this.canvases.pet = document.getElementById('pet-sprite-canvas');

            if (!this.canvases.background || !this.canvases.pet) {
                console.error('Main canvas elements not found');
                return;
            }

            this.contexts.background = this.canvases.background.getContext('2d');
            this.contexts.pet = this.canvases.pet.getContext('2d');
            this.contexts.accessory = this.canvases.accessory.getContext('2d');

            Object.values(this.contexts).forEach(ctx => {
                if (ctx) ctx.imageSmoothingEnabled = false;
            });
            this.resizeCanvases();
        }

        if (this.canvases.background) {
            this.contexts.background = this.canvases.background.getContext('2d');
            this.contexts.background.imageSmoothingEnabled = false;
        }
        if (this.canvases.pet) {
            this.contexts.pet = this.canvases.pet.getContext('2d');
            this.contexts.pet.imageSmoothingEnabled = false;
        }
        if (this.canvases.accessory) {
            this.contexts.accessory = this.canvases.accessory.getContext('2d');
            this.contexts.accessory.imageSmoothingEnabled = false;
        }

        Object.values(this.canvases).forEach(canvas => {
            if (canvas) canvas.style.imageRendering = 'pixelated';
        });

        if (this.canvases.background) {
            this.resizeCanvases();
        }
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

            const spritePromises = [];

            // Load fox sprites
            for (let i = 1; i <= 3; i++) {
                // Idle frames
                for (let j = 1; j <= 4; j++) {
                    spritePromises.push(loadImage(`/public/sprites/fox_${i}/idle/fox_${i}_idle_${j}.png`).then(img => this.sprites[`fox${i}`].idle.push(img)));
                }
                // Eat frames
                for (let j = 1; j <= 3; j++) {
                    spritePromises.push(loadImage(`/public/sprites/fox_${i}/eat/fox_${i}_eat_${j}.png`).then(img => this.sprites[`fox${i}`].eat.push(img)));
                }
            }

            // Load hats
            for (let i = 1; i <= 9; i++) {
                spritePromises.push(loadImage(`/public/sprites/hats/hat_${i}.png`).then(img => this.sprites.hats[i - 1] = img));
            }

            await Promise.all(spritePromises);
            console.log('✅ Sprites loaded successfully');
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

    drawPet(color, hat, frameIndex = 0, animation = 'idle') {
        const petColor = color || this.currentPetColor;
        const petHat = hat !== undefined ? hat : this.currentHat;

        const canvas = this.canvasId ? document.getElementById(this.canvasId) : this.canvases.pet;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw pet sprite
        const spriteSet = this.sprites[`fox${petColor}`][animation];
        const frame = spriteSet[frameIndex % spriteSet.length];
        if (!frame) return;

        const scale = Math.min(canvas.width / frame.width, canvas.height / frame.height) * 0.8;
        const drawW = frame.width * scale;
        const drawH = frame.height * scale;
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;
        ctx.drawImage(frame, x, y, drawW, drawH);

        // Draw hat
        if (petHat) {
            const hatImg = this.sprites.hats[parseInt(petHat, 10) - 1];
            if (!hatImg) return;
            const drawSize = hatImg.width * scale * 0.6;
            const hatX = (canvas.width - drawSize) / 2;
            const hatY = y + (100 * scale); // Adjust Y based on scaled pet position
            ctx.drawImage(hatImg, hatX, hatY, drawSize, drawSize);
        }
    }

    redrawPet() {
        // This is now handled by drawPet, but we need to call it for the main canvas
        this.drawPet();
    }

    startAnimationLoop() {
        const animate = (timestamp) => {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;

            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= this.frameDelay) {
                this.currentFrame++;

                // Check if feeding animation completed
                if (this.animationState === 'feeding' && this.currentFrame >= this.feedingFrameCount) {
                    this.animationState = 'idle';
                    this.currentFrame = 0;
                }

                this.drawPet(this.currentPetColor, this.currentHat, this.currentFrame, this.animationState);
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

    setupControls() {
        // Keyboard controls for the main screen, if any, could go here.
        // For now, it's empty as customization is handled in the closet.
    }
}
