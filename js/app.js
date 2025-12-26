// ============================================================================
// APPLICATION - Main Entry Point (Refactored with Clean Architecture)
// Coordinates between UI, Domain, and Data layers
// ============================================================================

import { Database } from './data/database.js';
import { PetState, JournalEntry, MOOD_COLORS } from './domain/models.js';
import { ScreenRenderer, CommandScreenController } from './ui/renderer.js';
import { ArchiveGridController } from './ui/archive-controller.js';
import { PastReflectionsController } from './ui/past-reflections-controller.js';
import { PetCanvasController } from './ui/pet-canvas-controller.js';
import { ClosetController } from './ui/closet-controller.js';

class PixelPetApp {
    constructor() {
        this.db = null;
        this.petState = null;
        this.renderer = null;
        this.commandController = new CommandScreenController();
        this.updateInterval = null;
    }

    async initialize() {
        try {
            // Initialize database
            this.db = await new Database().initialize();

            // Load pet state
            const dbPetState = this.db.getPetState();
            this.petState = new PetState(
                dbPetState.lastFedTime,
                dbPetState.currentHat,
                dbPetState.unlockedAccessories,
                dbPetState.currentColor,
                dbPetState.name
            );

            // Initialize screen controllers
            this.archiveController = new ArchiveGridController(this.db);
            this.reflectionsController = new PastReflectionsController(this.db);
            this.petCanvas = new PetCanvasController(this.db);
            this.closetController = new ClosetController(this.db, () => {
                this.renderer.loadScreen('home', (screenName) => this.onScreenLoaded(screenName));
            });

            // Setup UI
            this.setupUI();

            // Load home screen
            await this.renderer.loadScreen('home', (screenName) => {
                this.onScreenLoaded(screenName);
            });

            // Start hunger update loop
            this.startHungerUpdateLoop();

            console.log('✅ Pixel Pet App initialized with Clean Architecture');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    setupUI() {
        const contentElement = document.getElementById('content');
        const petStageElement = document.getElementById('pet-stage-persistent');

        this.renderer = new ScreenRenderer(contentElement, petStageElement);

        // Setup navigation
        const nav = document.querySelector('nav');
        nav.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.dataset.screen) {
                this.renderer.loadScreen(button.dataset.screen, (screenName) => {
                    this.onScreenLoaded(screenName);
                });
            }
        });

        // Setup global event delegation for feed button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#feed-pet-button')) {
                this.navigateToJournal();
            }

            if (e.target.closest('#save-entry-button')) {
                this.saveJournalEntry();
            }
        });
    }

    onScreenLoaded(screenName) {
        if (screenName === 'home') {
            this.updatePetDisplay();
            this.updateClock(); // Start clock updates
            // Initialize pet canvas (includes animation start)
            if (this.petCanvas) {
                this.petCanvas.initialize();
            }

            // Setup Name Input
            const nameInput = document.getElementById('pet-name-input');
            if (nameInput) {
                // Refresh state from DB to ensure fresh name
                const freshState = this.db.getPetState();
                if (freshState) this.petState.name = freshState.name;

                nameInput.value = this.petState.name;

                nameInput.addEventListener('change', (e) => {
                    const newName = e.target.value.trim().toUpperCase() || 'MY PET';
                    this.petState.name = newName;
                    this.db.updatePetName(newName);
                    e.target.value = newName; // Normalize display
                    e.target.blur(); // Remove focus
                });
            }
        } else {
            // Stop pet animations when not on home screen
            if (this.petCanvas) {
                this.petCanvas.stopAnimations();
            }
        }

        if (screenName === 'command') {
            this.commandController.initialize();
        } else if (screenName === 'archive-grid') {
            this.archiveController.initialize();
        } else if (screenName === 'past-reflections') {
            this.reflectionsController.initialize();
        } else if (screenName === 'closet') {
            this.closetController.initialize();
        }
    }

    startHungerUpdateLoop() {
        // Update every second for real-time hunger display
        // Always update since pet stage is now persistent in app shell
        this.updateInterval = setInterval(() => {
            this.updatePetDisplay();
        }, 1000);
    }

    updateClock() {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');

            const clockElement = document.getElementById('current-time');
            if (clockElement) {
                clockElement.textContent = `${displayHours}:${displayMinutes} ${ampm}`;
            }
        };

        updateTime(); // Initial update
        setInterval(updateTime, 1000); // Update every second
    }

    updatePetDisplay() {
        const hungerPercentage = this.petState.getHungerPercentage();
        const hungerState = this.petState.getHungerState();

        this.renderer.updatePetStage(hungerPercentage, hungerState);
    }

    navigateToJournal() {
        this.renderer.loadScreen('command', (screenName) => {
            this.onScreenLoaded(screenName);
        });
    }

    getSelectedMood() {
        const selectedButton = document.querySelector('.mood-selector-button.selected');
        return selectedButton ? selectedButton.dataset.mood : 'CALM'; // Default to CALM
    }

    saveJournalEntry() {
        const content = this.commandController.getValue();

        if (!content.trim()) {
            alert('Please write something before saving!');
            return;
        }

        // Get selected mood (placeholder - needs mood selector UI)
        const selectedMood = this.getSelectedMood() || 'NEUTRAL';

        // Create journal entry
        const entry = new JournalEntry(content, selectedMood);

        // Feed the pet based on word count
        const newLastFedTime = this.petState.feed(entry.wordCount);

        // Save to database
        this.db.saveEntry(entry.toDbFormat());
        this.db.updatePetLastFed(newLastFedTime);

        // Update in-memory state
        this.petState.lastFedTime = newLastFedTime;

        // Show feedback
        const mealType = entry.isFullMeal() ? 'Full Meal' : 'Snack';
        alert(`✅ Entry saved! Pet fed: ${mealType} (${entry.wordCount} words)`);

        // Clear and return to home
        this.commandController.clear();
        this.renderer.loadScreen('home', (screenName) => {
            this.onScreenLoaded(screenName);
        });
    }

    // Duplicate getSelectedMood removed
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PixelPetApp();
    await app.initialize();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('✅ ServiceWorker registered:', registration.scope);
        }, err => {
            console.log('❌ ServiceWorker registration failed:', err);
        });
    });
}