// ============================================================================
// UI LAYER - Screen Renderer & Navigation
// Manages screen loading and persistent UI components
// ============================================================================

import { MOOD_COLORS } from '../domain/models.js';

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
        if (cursorContainer) {
            this.cursorText = cursorContainer.querySelector('span:first-child');
            this.cursorBlock = cursorContainer.querySelector('.cursor-blink');
        }

        // Textarea cursor simulation
        this.textarea.addEventListener('input', (e) => {
            if (this.cursorText) this.cursorText.textContent = e.target.value;
        });

        this.textarea.addEventListener('blur', () => {
            if (this.cursorBlock) {
                this.cursorBlock.style.opacity = '0.5';
                this.cursorBlock.classList.remove('cursor-blink');
            }
        });

        this.textarea.addEventListener('focus', () => {
            if (this.cursorBlock) {
                this.cursorBlock.style.opacity = '1';
                this.cursorBlock.classList.add('cursor-blink');
            }
        });

        // Mood Selection & Border Logic
        this.setupMoodSelection();
    }

    setupMoodSelection() {
        const moodButtons = document.querySelectorAll('.mood-selector-button');
        const inputContainer = document.getElementById('prompt-container');

        moodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if(btn.disabled) return; // Ignore if read-only

                // Toggle Selected
                moodButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Update Border Color
                const mood = btn.dataset.mood; // HAPPY, SAD, etc.
                const color = MOOD_COLORS[mood] || MOOD_COLORS.NEUTRAL;

                if (inputContainer) {
                    inputContainer.style.borderColor = color;
                    // Add transition for smooth effect
                    inputContainer.style.transition = 'border-color 0.3s ease';
                }
            });
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
        // Reset border
        const inputContainer = document.getElementById('prompt-container');
        if(inputContainer) inputContainer.style.borderColor = ''; // Revert to default class

        // Reset mood selection
        const moodButtons = document.querySelectorAll('.mood-selector-button');
        moodButtons.forEach(b => b.classList.remove('selected'));
        // Select neutral by default? Or none.
        const neutralBtn = document.querySelector('.mood-selector-button[data-mood="NEUTRAL"]');
        if(neutralBtn) neutralBtn.classList.add('selected');
    }
}
