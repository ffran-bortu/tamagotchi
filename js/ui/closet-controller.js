// ============================================================================
// UI LAYER - Closet Controller
// Handles the logic for the pet customization screen (the closet)
// ============================================================================

export class ClosetController {
    constructor(db, onOutfitSaved) {
        this.db = db;
        this.onOutfitSaved = onOutfitSaved; // Callback to execute after saving

        // Temporary state for user's selections in the closet
        this.selectedColor = 1;
        this.selectedHat = '';

        // To be populated by initialize()
        this.canvasController = null;
        this.colorSelector = null;
        this.hatSelector = null;
    }

    async initialize() {
        // Get DOM elements from the loaded closet.html
        this.colorSelector = document.getElementById('color-selector');
        this.hatSelector = document.getElementById('hat-selector');
        const saveButton = document.getElementById('save-outfit-button');

        if (!this.colorSelector || !this.hatSelector || !saveButton) {
            console.error('Closet UI elements not found.');
            return;
        }

        // Load current pet state to initialize the selection
        const petState = this.db.getPetState();
        this.selectedColor = petState.currentColor || 1;
        this.selectedHat = petState.currentHat || '';

        // Attach event listeners
        this.colorSelector.addEventListener('click', (e) => this.handleColorSelection(e));
        this.hatSelector.addEventListener('click', (e) => this.handleHatSelection(e));
        saveButton.addEventListener('click', () => this.saveOutfit());

        // Set initial UI state and render preview
        this.updateSelectionUI();
        this.renderPreview();
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

        // If the currently selected hat is clicked again, deselect it
        if (this.selectedHat === button.dataset.hat) {
            this.selectedHat = ''; // Set to no hat
        } else {
            this.selectedHat = button.dataset.hat;
        }

        this.updateSelectionUI();
        this.renderPreview();
    }

    updateSelectionUI() {
        // Update styles for color buttons
        this.colorSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = parseInt(btn.dataset.color, 10) === this.selectedColor;
            btn.classList.toggle('border-white', isSelected);
            btn.classList.toggle('shadow-retro-strong', isSelected);
            btn.classList.toggle('border-black', !isSelected);
        });

        // Update styles for hat buttons
        this.hatSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = btn.dataset.hat === this.selectedHat;
            btn.classList.toggle('border-white', isSelected);
            btn.classList.toggle('shadow-retro-strong', isSelected);
            btn.classList.toggle('border-black', !isSelected);
            btn.classList.toggle('bg-retro-gray', isSelected);
            btn.classList.toggle('bg-surface-dark', !isSelected);
        });
    }

    async renderPreview() {
        // Dynamically import the PetCanvasController to avoid circular dependencies
        // if it were ever to reference the main app.
        const { PetCanvasController } = await import('./pet-canvas-controller.js');

        const canvasElement = document.getElementById('closet-canvas');
        if (!canvasElement) return;

        // Create a temporary, on-the-fly canvas controller for the preview
        const previewController = new PetCanvasController(this.db, canvasElement.id);

        // We need to initialize it to load sprites, but prevent animation loop
        await previewController.initialize(false); // 'false' to prevent starting animation

        // Draw the pet with the currently selected appearance
        previewController.drawPet(this.selectedColor, this.selectedHat);
    }

    saveOutfit() {
        this.db.updatePetColor(this.selectedColor);
        this.db.updatePetHat(this.selectedHat);

        alert('✅ Outfit Saved!');

        // Use the callback to trigger navigation back to the home screen
        if (this.onOutfitSaved) {
            this.onOutfitSaved();
        }
    }
}
