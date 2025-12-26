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
        this.colorSelector = null;
        this.hatSelector = null;
    }

    async initialize() {
        this.colorSelector = document.getElementById('color-selector');
        this.hatSelector = document.getElementById('hat-selector');
        const saveButton = document.getElementById('save-outfit-button');

        if (!this.colorSelector || !this.hatSelector || !saveButton) {
            console.error('Closet UI elements not found.');
            return;
        }

        const petState = this.db.getPetState();
        this.selectedColor = petState.currentColor || 1;
        this.selectedHat = petState.currentHat || '';

        this.colorSelector.addEventListener('click', (e) => this.handleColorSelection(e));
        this.hatSelector.addEventListener('click', (e) => this.handleHatSelection(e));
        saveButton.addEventListener('click', () => this.saveOutfit());

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

    updateSelectionUI() {
        this.colorSelector.querySelectorAll('button').forEach(btn => {
            const isSelected = parseInt(btn.dataset.color, 10) === this.selectedColor;
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
        // Reuse PetCanvasController for preview
        const { PetCanvasController } = await import('./pet-canvas-controller.js');
        const canvasElement = document.getElementById('closet-canvas');
        if (!canvasElement) return;

        // We re-instantiate lightly.
        // Note: initialize(false) prevents animation loop.
        const previewController = new PetCanvasController(this.db, canvasElement.id);
        await previewController.initialize(false);

        // Draw the selected state
        previewController.drawPet(this.selectedColor, this.selectedHat);
    }

    saveOutfit() {
        this.db.updatePetColor(this.selectedColor);
        this.db.updatePetHat(this.selectedHat);
        alert('✅ Outfit Saved!');
        if (this.onOutfitSaved) this.onOutfitSaved();
    }
}
