// ============================================================================
// UI LAYER - Closet Controller
// Handles the output logic for the pet customization screen
// ============================================================================

export class ClosetController {
    constructor(db, onOutfitSaved) {
        this.db = db;
        this.onOutfitSaved = onOutfitSaved;
        this.selectedColor = 1;
        this.selectedHat = '';
        this.selectedBackground = 1;
        this.colorSelector = null;
        this.hatSelector = null;
        this.backgroundSelector = null;
    }

    async initialize() {
        this.colorSelector = document.getElementById('color-selector');
        this.hatSelector = document.getElementById('hat-selector');
        this.backgroundSelector = document.getElementById('background-selector');
        const saveButton = document.getElementById('save-outfit-button');
        const backButton = document.getElementById('closet-back-button');

        if (!this.colorSelector || !this.hatSelector || !this.backgroundSelector || !saveButton) {
            console.error('Closet UI elements not found.');
            return;
        }

        const petState = this.db.getPetState();
        this.selectedColor = petState.currentColor || 1;
        this.selectedHat = petState.currentHat || '';
        this.selectedBackground = petState.currentBackground || 1;

        this.colorSelector.addEventListener('click', (e) => this.handleColorSelection(e));
        this.hatSelector.addEventListener('click', (e) => this.handleHatSelection(e));
        this.backgroundSelector.addEventListener('click', (e) => this.handleBackgroundSelection(e));
        saveButton.addEventListener('click', () => this.saveOutfit());
        
        if (backButton) {
            backButton.addEventListener('click', () => this.goBack());
        }

        this.updateSelectionUI();
        
        // Ensure scrollable area has proper height
        this.setupScrolling();
        
        // Initialize preview controller
        await this.initializePreview();
    }

    setupScrolling() {
        // Use absolute positioning approach
        const scrollableContainer = document.getElementById('closet-scrollable');
        const topSection = document.getElementById('closet-top-section');
        const outerContainer = scrollableContainer?.parentElement;
        
        if (!scrollableContainer || !topSection || !outerContainer) return;

        const updateLayout = () => {
            const content = document.getElementById('content');
            if (content && outerContainer) {
                // Set outer container to fill content
                outerContainer.style.height = `${content.clientHeight}px`;
                
                // Calculate top section height
                const topHeight = topSection.offsetHeight;
                
                // Position scrollable container below top section
                scrollableContainer.style.top = `${topHeight}px`;
                scrollableContainer.style.height = `${content.clientHeight - topHeight}px`;
            }
        };

        // Initial calculation with multiple attempts
        const tryUpdate = () => {
            updateLayout();
            requestAnimationFrame(() => {
                updateLayout();
                setTimeout(updateLayout, 50);
                setTimeout(updateLayout, 200);
            });
        };
        
        tryUpdate();

        // Handle window resize
        const resizeHandler = () => {
            updateLayout();
        };
        window.addEventListener('resize', resizeHandler);
        
        // Store cleanup function
        this._resizeHandler = resizeHandler;
    }

    async initializePreview() {
        // Clean up existing controller if any
        if (this.previewController) {
            this.previewController.stopAnimations();
            this.previewController = null;
        }
        
        await this.renderPreview();
    }

    handleColorSelection(e) {
        const button = e.target.closest('button[data-color]');
        if (!button) return;

        this.selectedColor = parseInt(button.dataset.color, 10);
        this.updateSelectionUI();
        this.renderPreview();
    }

    handleHatSelection(e) {
        const button = e.target.closest('button[data-hat]');
        if (!button) return;

        const hatId = button.dataset.hat;

        // "PLUS when clicking the currently selected hat it deselects"
        if (this.selectedHat === hatId) {
            this.selectedHat = '';
        } else {
            this.selectedHat = hatId;
        }

        this.updateSelectionUI();
        this.renderPreview();
    }

    handleBackgroundSelection(e) {
        const button = e.target.closest('button[data-background]');
        if (!button) return;

        this.selectedBackground = parseInt(button.dataset.background, 10);
        this.updateSelectionUI();
        this.renderPreview();
    }

    updateSelectionUI() {
        this.colorSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = parseInt(btn.dataset.color, 10) === this.selectedColor;
            btn.classList.toggle('border-white', isSelected);
            btn.classList.toggle('shadow-retro-strong', isSelected);
            btn.classList.toggle('border-black', !isSelected);
            btn.classList.toggle('scale-110', isSelected); // Visual feedback
        });

        this.backgroundSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = parseInt(btn.dataset.background, 10) === this.selectedBackground;
            btn.classList.toggle('border-white', isSelected);
            btn.classList.toggle('shadow-retro-strong', isSelected);
            btn.classList.toggle('border-black', !isSelected);
            btn.classList.toggle('scale-110', isSelected); // Visual feedback
        });

        this.hatSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = btn.dataset.hat === this.selectedHat;
            btn.classList.toggle('border-white', isSelected);
            btn.classList.toggle('bg-retro-gray', isSelected);
            btn.classList.toggle('bg-surface-dark', !isSelected);
            btn.classList.toggle('border-black', !isSelected);
        });
    }

    async renderPreview() {
        // Reuse PetCanvasController for preview with 3-layer structure
        const { PetCanvasController } = await import('./pet-canvas-controller.js');
        
        // Check if canvases exist
        const bgCanvas = document.getElementById('closet-bg-canvas');
        const spriteCanvas = document.getElementById('closet-sprite-canvas');
        const accessoryCanvas = document.getElementById('closet-accessory-canvas');
        
        if (!bgCanvas || !spriteCanvas || !accessoryCanvas) {
            console.error('Closet canvas elements not found');
            return;
        }

        // Create controller with closet canvas prefix (no single canvas mode)
        // Use 'closet' prefix to find closet-*-canvas elements
        if (!this.previewController) {
            this.previewController = new PetCanvasController(this.db, null, 'closet');
            await this.previewController.initialize(false);
        }

        // Update the preview controller's state
        this.previewController.currentBackground = this.selectedBackground;
        
        // Draw the selected state
        this.previewController.drawPet(this.selectedColor, this.selectedHat);
        this.previewController.drawBackground();
    }

    cleanup() {
        // Stop animations when leaving the closet screen
        if (this.previewController) {
            this.previewController.stopAnimations();
        }
        // Remove resize listener
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
    }

    saveOutfit() {
        this.db.updatePetColor(this.selectedColor);
        this.db.updatePetHat(this.selectedHat);
        this.db.updatePetBackground(this.selectedBackground);
        alert('✅ Outfit Saved!');
        if (this.onOutfitSaved) this.onOutfitSaved();
    }

    goBack() {
        // Navigate back to home screen
        if (window.pixelPetApp && window.pixelPetApp.renderer) {
            window.pixelPetApp.renderer.loadScreen('home', (screenName) => {
                if (window.pixelPetApp.onScreenLoaded) {
                    window.pixelPetApp.onScreenLoaded(screenName);
                }
            });
        }
    }
}
