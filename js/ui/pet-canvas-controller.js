// ============================================================================
// PET CANVAS CONTROLLER
// Manages 3-layer canvas rendering with sprite animations
// ============================================================================

export class SpriteSheet {
    constructor(image, frameWidth, frameHeight, topRows, bottomRows) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.topRows = topRows;      // Idle animation rows
        this.bottomRows = bottomRows; // Feeding animation rows
    }

    getIdleFrame(frameIndex) {
        // Simple grid calculation
        const cols = Math.floor(this.image.width / this.frameWidth);
        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols); // Should be 0 for idle if topRows=1
        return {
            x: col * this.frameWidth,
            y: row * this.frameHeight,
            width: this.frameWidth,
            height: this.frameHeight
        };
    }

    getFeedingFrame(frameIndex) {
        const cols = Math.floor(this.image.width / this.frameWidth);
        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols) + this.topRows;
        return {
            x: col * this.frameWidth,
            y: row * this.frameHeight,
            width: this.frameWidth,
            height: this.frameHeight
        };
    }
}

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

        this.sprites = {
            fox1: null,
            fox2: null,
            fox3: null,
            hatsGrid: null
        };

        this.spritesheets = {
            fox1: null,
            fox2: null,
            fox3: null
        };

        this.currentPetColor = 1; // 1, 2, or 3
        this.currentHat = 0; // 0-8 (0 = no hat)
        this.animationState = 'idle'; // 'idle' | 'feeding'
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.frameDelay = 150; // ms per frame
        this.animationLoopId = null;

        // Spritesheet config (High Resolution from Asset Analysis)
        this.frameWidth = 632;
        this.frameHeight = 848;
        this.idleFrameCount = 4;
        this.feedingFrameCount = 4;
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

        // Set pixel-perfect rendering (though assets are high res, we keep this for retro feel if scaling down)
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

            // Load fox spritesheets (Correct Paths)
            this.sprites.fox1 = await loadImage('/public/sprites/fox_1_spritesheet.png');
            this.sprites.fox2 = await loadImage('/public/sprites/fox_2_spritesheet.png');
            this.sprites.fox3 = await loadImage('/public/sprites/fox_3_spritesheet.png');

            // Load hats grid
            this.sprites.hatsGrid = await loadImage('/public/sprites/hats_grid.png');

            // Create spritesheet instances with CORRECT dimensions (632x848)
            this.spritesheets.fox1 = new SpriteSheet(this.sprites.fox1, this.frameWidth, this.frameHeight, 1, 1);
            this.spritesheets.fox2 = new SpriteSheet(this.sprites.fox2, this.frameWidth, this.frameHeight, 1, 1);
            this.spritesheets.fox3 = new SpriteSheet(this.sprites.fox3, this.frameWidth, this.frameHeight, 1, 1);

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

    drawPetFrame() {
        const ctx = this.contexts.pet;
        const canvas = this.canvases.pet;

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get current spritesheet
        const spritesheet = this.spritesheets[`fox${this.currentPetColor}`];
        if (!spritesheet) return;

        // Get frame coordinates
        let frame;
        if (this.animationState === 'idle') {
            frame = spritesheet.getIdleFrame(this.currentFrame % this.idleFrameCount);
        } else {
            frame = spritesheet.getFeedingFrame(this.currentFrame % this.feedingFrameCount);
        }

        // SCALING LOGIC
        // Scale to fit canvas (maintaining aspect ratio) with 80% coverage
        const scale = Math.min(canvas.width / frame.width, canvas.height / frame.height) * 0.8;
        const drawW = frame.width * scale;
        const drawH = frame.height * scale;

        // Center position
        const x = (canvas.width - drawW) / 2;
        const y = (canvas.height - drawH) / 2;

        // Draw sprite
        ctx.drawImage(
            spritesheet.image,
            frame.x, frame.y, frame.width, frame.height,
            x, y, drawW, drawH
        );
    }

    drawHat() {
        const ctx = this.contexts.accessory;
        const canvas = this.canvases.accessory;

        // Clear previous
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.currentHat === 0) return; // No hat
        if (!this.sprites.hatsGrid) return;

        // Calculate hat position in 3x3 grid
        // Assuming hats are also high res approx 2048x2048 total?
        // Subagent used 2048/3 = ~682px per hat
        const hatSize = this.sprites.hatsGrid.width / 3;

        const hatIndex = this.currentHat - 1; // 0-8 grid index
        const col = hatIndex % 3;
        const row = Math.floor(hatIndex / 3);

        const sourceX = col * hatSize;
        const sourceY = row * hatSize;

        // SCALING LOGIC matching pet
        const scale = Math.min(canvas.width / this.frameWidth, canvas.height / this.frameHeight) * 0.8;
        const drawSize = hatSize * scale * 0.6; // Scale hat relative to pet (tuned factor)

        const x = (canvas.width - drawSize) / 2;

        // Offset Y logic from subagent patch
        const y = (canvas.height - this.frameHeight * scale) / 2 + (100 * scale);

        ctx.drawImage(
            this.sprites.hatsGrid,
            sourceX, sourceY, hatSize, hatSize,
            x, y, drawSize, drawSize
        );
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
        if (direction === 'next') {
            this.currentHat = (this.currentHat + 1) % 9;
        } else {
            this.currentHat = (this.currentHat - 1 + 9) % 9;
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
