// ============================================================================
// PET CANVAS CONTROLLER
// Manages 3-layer canvas rendering with sprite animations
// Updated for normalized scaling and background support
// ============================================================================

export class PetCanvasController {
    constructor(db, canvasId = null, canvasPrefix = 'pet') {
        this.db = db;
        this.canvasId = canvasId; // If provided, runs in single-canvas "preview" mode
        this.canvasPrefix = canvasPrefix; // Prefix for canvas IDs (default: 'pet', can be 'closet')
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
        this.currentBackground = 1; // 1-4
        this.animationState = 'idle'; // 'idle' | 'feeding' | 'waiting'
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.frameDelay = 150; // ms per frame
        this.animationLoopId = null;
        this.feedingLoopCount = 0; // Track how many times feeding animation has looped
        this.feedingTargetLoops = 2; // Number of times to loop feeding animation

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

        // Standard Mode: 3 layers (or 2 for feeding overlay without background)
        this.canvases.background = document.getElementById(`${this.canvasPrefix}-bg-canvas`);
        this.canvases.pet = document.getElementById(`${this.canvasPrefix}-sprite-canvas`);
        this.canvases.accessory = document.getElementById(`${this.canvasPrefix}-accessory-canvas`);

        if (!this.canvases.pet || !this.canvases.accessory) {
            console.error('Pet or accessory canvas not found with prefix:', this.canvasPrefix);
            return;
        }

        // Background is optional (e.g., feeding overlay doesn't have one)
        if (!this.canvases.background && this.canvasPrefix !== 'feeding') {
            console.error('Background canvas not found with prefix:', this.canvasPrefix);
            return;
        }

        // Get contexts
        if (this.canvases.background) {
            this.contexts.background = this.canvases.background.getContext('2d');
            this.contexts.background.imageSmoothingEnabled = false;
            this.canvases.background.style.imageRendering = 'pixelated';
        }
        
        this.contexts.pet = this.canvases.pet.getContext('2d');
        this.contexts.accessory = this.canvases.accessory.getContext('2d');

        // Set pixel-perfect rendering
        this.contexts.pet.imageSmoothingEnabled = false;
        this.contexts.accessory.imageSmoothingEnabled = false;
        
        this.canvases.pet.style.imageRendering = 'pixelated';
        this.canvases.accessory.style.imageRendering = 'pixelated';

        // Setup ResizeObserver
        if (this.resizeObserver) this.resizeObserver.disconnect();

        if (!this.singleCanvasMode) {
            // Use pet canvas parent (works for both with and without background)
            const container = this.canvases.pet.parentElement;
            if (container) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.resizeCanvases();
                    this.drawAll();
                });
                this.resizeObserver.observe(container);
            }
        }

        // Initial size
        this.resizeCanvases();
    }

    resizeCanvases() {
        if (this.singleCanvasMode) return; // Preview size handled by CSS/HTML

        // Use pet canvas parent (works for both with and without background)
        const container = this.canvases.pet.parentElement;
        if (!container) return;
        // Ensure square aspect ratio based on smallest dimension
        const size = Math.min(container.clientWidth, container.clientHeight);

        // Only resize canvases that exist (skip null background for feeding overlay)
        Object.values(this.canvases).forEach(canvas => {
            if (!canvas) return; // Skip null canvases
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
        this.currentBackground = petState.currentBackground || 1;
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

    drawBackground(backgroundIndex = null) {
        // Skip if no background canvas (e.g., feeding overlay)
        if (!this.canvases.background || !this.contexts.background) return;
        
        const ctx = this.contexts.background;
        const canvas = this.canvases.background;

        // Use provided background index, or current background, or default to 1
        const bgIndex = backgroundIndex !== null 
            ? Math.min(backgroundIndex - 1, this.sprites.backgrounds.length - 1)
            : Math.min(this.currentBackground - 1, this.sprites.backgrounds.length - 1);
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

        if (!ctx || !canvas) {
            console.error('drawPetFrame: Missing context or canvas', { ctx: !!ctx, canvas: !!canvas });
            return;
        }

        if (!this.singleCanvasMode) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        const foxData = this.sprites.foxes[this.currentPetColor];
        if (!foxData) return;

        let frames;
        if (this.animationState === 'idle' || this.animationState === 'waiting') {
            frames = foxData.idle;
        } else if (this.animationState === 'feeding' || this.animationState === 'feeding_complete') {
            frames = foxData.eat;
        } else {
            frames = foxData.eat; // Default to eat frames
        }

        if (!frames || frames.length === 0) return;

        // For 'waiting', we stick to the first idle frame
        // For 'feeding_complete', stay on the last frame
        let frameIndex;
        if (this.animationState === 'waiting') {
            frameIndex = 0;
        } else if (this.animationState === 'feeding_complete') {
            frameIndex = frames.length - 1; // Last frame of eating animation
        } else {
            frameIndex = this.currentFrame % frames.length;
        }
        const img = frames[frameIndex];

        if (!img) return;

        // NORMALIZE SCALING:
        // For feeding overlay, make pet bigger (80%), otherwise 60%
        const scalePercent = this.canvasPrefix === 'feeding' ? 0.80 : 0.60;
        const targetSize = Math.min(canvas.width, canvas.height) * scalePercent;
        const scale = targetSize / Math.max(img.width, img.height);
        
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        // Center alignment - position in exact center of canvas
        // Use Math.round to avoid sub-pixel rendering issues that can cause visual offset
        const x = Math.round((canvas.width - drawW) / 2);
        const y = Math.round((canvas.height - drawH) / 2);

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

        // Normalize hat sizing - scale to 25% of canvas size for consistency
        const targetSize = Math.min(canvas.width, canvas.height) * 0.25;
        const hatScale = targetSize / Math.max(hatImg.width, hatImg.height);

        const drawW = hatImg.width * hatScale;
        const drawH = hatImg.height * hatScale;

        // Calculate pet scale and position (same logic as drawPetFrame)
        const petCanvas = this.canvases.pet;
        const scalePercent = this.canvasPrefix === 'feeding' ? 0.80 : 0.60;
        const petTargetSize = Math.min(petCanvas.width, petCanvas.height) * scalePercent;
        
        // Get current pet frame to know its dimensions
        const frames = this.animationState === 'feeding' 
            ? this.sprites.foxes[this.currentPetColor].eat
            : this.sprites.foxes[this.currentPetColor].idle;
        const frameIndex = this.animationState === 'waiting' ? 0 : (this.currentFrame % frames.length);
        const currentPetImg = frames[frameIndex];
        
        if (currentPetImg) {
            // Calculate where the pet is actually drawn
            const petScale = petTargetSize / Math.max(currentPetImg.width, currentPetImg.height);
            const petDrawH = currentPetImg.height * petScale;
            const petY = (petCanvas.height - petDrawH) / 2;
            
            // Hat positioning: place on top of pet head
            // Pet head is approximately at 25% down from top of pet sprite
            const headOffsetPercent = 0.25;
            const hatY = petY + (petDrawH * headOffsetPercent) - (drawH * 0.8); // Slight overlap
            const hatX = (canvas.width - drawW) / 2;
            
            ctx.drawImage(hatImg, hatX, hatY, drawW, drawH);
        } else {
            // Fallback to fixed position if no pet frame available
            const hatX = (canvas.width - drawW) / 2;
            const hatY = canvas.height * 0.18;
            ctx.drawImage(hatImg, hatX, hatY, drawW, drawH);
        }
    }

    startAnimationLoop() {
        console.log('startAnimationLoop called, animationState:', this.animationState);
        
        // Draw initial frame immediately
        if (!this.singleCanvasMode) {
            this.drawPetFrame();
            this.drawHat();
            console.log('Initial frame drawn (multi-canvas mode)');
        } else {
            this.drawAll();
            console.log('Initial frame drawn (single-canvas mode)');
        }

        const animate = (timestamp) => {
            if (!this.lastFrameTime) {
                this.lastFrameTime = timestamp;
            }

            // Skip frame updates if feeding is complete (just keep drawing the last frame)
            if (this.animationState === 'feeding_complete') {
                // Still draw the frame, but don't update it
                if (!this.singleCanvasMode) {
                    this.drawPetFrame();
                    this.drawHat();
                } else {
                    this.drawAll();
                }
                this.animationLoopId = requestAnimationFrame(animate);
                return;
            }

            // Use slower frame delay for feeding animation (half speed = double delay)
            const currentFrameDelay = this.animationState === 'feeding' ? this.frameDelay * 2 : this.frameDelay;
            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= currentFrameDelay) {
                this.lastFrameTime = timestamp;

                if (this.animationState === 'feeding') {
                    this.currentFrame++;
                    const eatLength = this.sprites.foxes[this.currentPetColor]?.eat?.length || 0;
                    if (this.currentFrame >= eatLength) {
                        // Completed one loop of feeding animation
                        this.feedingLoopCount++;
                        this.currentFrame = 0; // Reset to start of animation
                        
                        if (this.feedingLoopCount >= this.feedingTargetLoops) {
                            // Completed all loops, keep on last frame (don't switch to idle)
                            this.animationState = 'feeding_complete';
                            // Keep currentFrame at last frame of eating animation
                            this.currentFrame = eatLength - 1;
                            console.log('Feeding animation completed', this.feedingTargetLoops, 'loops, staying on last frame');
                        } else {
                            // Continue looping
                            console.log('Feeding animation loop', this.feedingLoopCount, 'of', this.feedingTargetLoops);
                        }
                    } else {
                        console.log('Feeding frame:', this.currentFrame, 'of', eatLength, '(loop', this.feedingLoopCount + 1, ')');
                    }
                } else if (this.animationState === 'idle') {
                    this.currentFrame++;
                    const idleLength = this.sprites.foxes[this.currentPetColor]?.idle?.length || 0;

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

                // Redraw after frame update
                if (!this.singleCanvasMode) {
                    this.drawPetFrame();
                    this.drawHat();
                } else {
                    this.drawAll();
                }
            }

            this.animationLoopId = requestAnimationFrame(animate);
        };

        this.animationLoopId = requestAnimationFrame(animate);
        console.log('Animation loop started, loopId:', this.animationLoopId);
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
        console.log('playFeedingAnimation called, current state:', this.animationState);
        this.animationState = 'feeding';
        this.currentFrame = 0;
        this.feedingLoopCount = 0; // Reset loop counter
        this.lastFrameTime = 0; // Reset frame time to trigger immediate draw
        console.log('Animation state set to feeding, frame reset to 0, loop count reset');
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
