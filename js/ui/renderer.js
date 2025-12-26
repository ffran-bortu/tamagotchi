// ============================================================================
// UI LAYER - Screen Renderer & Navigation
// Manages screen loading and persistent UI components
// ============================================================================

export class ScreenRenderer {
    constructor(contentElement, petStageElement) {
        this.content = contentElement;
        this.petStage = petStageElement;
        this.currentScreen = null;
    }

    async loadScreen(screenName, onLoadCallback) {
        try {
            const response = await fetch(`public/${screenName}.html`);
            if (!response.ok) {
                this.content.innerHTML = '<p>Screen not found.</p>';
                return;
            }

            const screenContent = await response.text();
            this.content.innerHTML = screenContent;
            this.currentScreen = screenName;

            // Show/hide persistent pet stage based on screen
            if (this.petStage) {
                if (screenName === 'home') {
                    this.petStage.classList.remove('hidden');
                } else {
                    this.petStage.classList.add('hidden');
                }
            }

            // Execute screen-specific initialization
            if (onLoadCallback) {
                onLoadCallback(screenName);
            }
        } catch (error) {
            console.error('Error loading screen:', error);
            this.content.innerHTML = '<p>Error loading screen.</p>';
        }
    }

    updatePetStage(hungerPercentage, hungerState) {
        if (!this.petStage) return;

        const hungerText = this.petStage.querySelector('#hunger-percentage');
        const statusText = this.petStage.querySelector('.status-text');
        const hungerBars = this.petStage.querySelectorAll('.hunger-bar');

        if (hungerText) {
            hungerText.textContent = `${Math.round(hungerPercentage)}%`;
        }

        if (statusText) {
            statusText.textContent = `Status: ${hungerState.label}`;
        }

        if (hungerBars && hungerBars.length > 0) {
            const greenBars = Math.round(hungerPercentage / 10);
            hungerBars.forEach((bar, index) => {
                if (index < greenBars) {
                    bar.classList.add('bg-retro-vine-green');
                    bar.classList.remove('bg-retro-vine-brown', 'opacity-60');
                } else {
                    bar.classList.add('bg-retro-vine-brown', 'opacity-60');
                    bar.classList.remove('bg-retro-vine-green');
                }
            });
        }
    }
}

export class CommandScreenController {
    constructor() {
        this.textarea = null;
        this.cursorText = null;
        this.cursorBlock = null;
    }

    initialize() {
        this.textarea = document.querySelector('textarea');
        if (!this.textarea) return;

        const cursorContainer = document.querySelector('.cursor-blink')?.parentElement;
        if (!cursorContainer) return;

        this.cursorText = cursorContainer.querySelector('span:first-child');
        this.cursorBlock = cursorContainer.querySelector('.cursor-blink');

        if (!this.cursorText || !this.cursorBlock) return;

        this.textarea.addEventListener('input', (e) => {
            this.cursorText.textContent = e.target.value;
        });

        this.textarea.addEventListener('blur', () => {
            this.cursorBlock.style.opacity = '0.5';
            this.cursorBlock.classList.remove('cursor-blink');
        });

        this.textarea.addEventListener('focus', () => {
            this.cursorBlock.style.opacity = '1';
            this.cursorBlock.classList.add('cursor-blink');
        });
    }

    getValue() {
        return this.textarea ? this.textarea.value : '';
    }

    clear() {
        if (this.textarea) {
            this.textarea.value = '';
            if (this.cursorText) {
                this.cursorText.textContent = '';
            }
        }
    }
}
