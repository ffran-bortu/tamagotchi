// ============================================================================
// APPLICATION - Main Entry Point (Refactored)
// ============================================================================

import { Database } from './data/database.js';
import { PetState, JournalEntry, MOOD_COLORS } from './domain/models.js';
import { ScreenRenderer, CommandScreenController } from './ui/renderer.js';
import { ArchiveGridController } from './ui/archive-controller.js';
import { PastReflectionsController } from './ui/past-reflections-controller.js';
import { PetCanvasController } from './ui/pet-canvas-controller.js';
import { ClosetController } from './ui/closet-controller.js';
import { EntryViewController } from './ui/entry-view-controller.js';

class PixelPetApp {
    constructor() {
        this.db = null;
        this.petState = null;
        this.renderer = null;
        this.commandController = new CommandScreenController();
        this.updateInterval = null;
        this.entryViewController = null;
    }

    async initialize() {
        try {
            this.db = await new Database().initialize();
            const dbPetState = this.db.getPetState();
            this.petState = new PetState(
                dbPetState.lastFedTime,
                dbPetState.currentHat,
                dbPetState.unlockedAccessories,
                dbPetState.currentColor,
                dbPetState.name
            );

            this.archiveController = new ArchiveGridController(this.db);
            this.reflectionsController = new PastReflectionsController(this.db);
            this.petCanvas = new PetCanvasController(this.db);
            this.closetController = new ClosetController(this.db, () => {
                this.renderer.loadScreen('home', (screenName) => this.onScreenLoaded(screenName));
            });

            this.setupUI();
            await this.renderer.loadScreen('home', (screenName) => {
                this.onScreenLoaded(screenName);
            });
            this.startHungerUpdateLoop();

            // Listen for View Entry Request
            document.addEventListener('view-journal-entry', (e) => {
                console.log('📖 view-journal-entry event received:', e.detail);
                this.loadEntryForReading(e.detail);
            });

            console.log('✅ Pixel Pet App initialized');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    }

    setupUI() {
        const contentElement = document.getElementById('content');
        const petStageElement = document.getElementById('pet-stage-persistent');
        this.renderer = new ScreenRenderer(contentElement, petStageElement);

        const nav = document.querySelector('nav');
        nav.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.dataset.screen) {
                this.renderer.loadScreen(button.dataset.screen, (screenName) => {
                    this.onScreenLoaded(screenName);
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#feed-pet-button')) this.navigateToJournal();
            if (e.target.closest('#save-entry-button')) this.saveJournalEntry();
        });
    }

    onScreenLoaded(screenName) {
        if (screenName === 'home') {
            this.updatePetDisplay();
            this.updateClock();
            this.updateBattery(); // Init battery
            if (this.petCanvas) this.petCanvas.initialize();

            const nameInput = document.getElementById('pet-name-input');
            if (nameInput) {
                const freshState = this.db.getPetState();
                if (freshState) this.petState.name = freshState.name;
                nameInput.value = this.petState.name;
                nameInput.addEventListener('change', (e) => {
                    const newName = e.target.value.trim().toUpperCase() || 'MY PET';
                    this.petState.name = newName;
                    this.db.updatePetName(newName);
                    e.target.value = newName;
                    e.target.blur();
                });
            }
        } else {
            if (this.petCanvas) this.petCanvas.stopAnimations();
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
            if (clockElement) clockElement.textContent = `${displayHours}:${displayMinutes} ${ampm}`;
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    async updateBattery() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const updateBat = () => {
                    const level = Math.round(battery.level * 100);
                    const batText = document.querySelector('.text-retro-sage.tracking-widest'); // The percentage text
                    // We need a better selector for battery text
                    const batteryContainer = document.querySelector('span.material-symbols-outlined[style="font-size: 32px;"]').parentElement.parentElement;
                    // This is brittle. Let's find by content or traverse.
                    // The HTML is:
                    // <div class="flex items-center gap-1">
                    //   <span class="text-xs font-bold tracking-widest text-retro-sage">80%</span>
                    //   <span class="material-symbols-outlined ...">battery_5_bar</span>
                    // </div>

                    // Let's use document.querySelector to find the <span> with text-retro-sage inside the header
                    const header = document.querySelector('.border-b-4.border-\\[\\#3a3a3a\\]');
                    if(header) {
                        const levelSpan = header.querySelector('span.text-retro-sage.text-xs');
                        const iconSpan = header.querySelector('.material-symbols-outlined');

                        if(levelSpan) levelSpan.textContent = `${level}%`;
                        if(iconSpan) {
                            // Map level to icon
                            if(level > 90) iconSpan.textContent = 'battery_full';
                            else if(level > 80) iconSpan.textContent = 'battery_6_bar';
                            else if(level > 60) iconSpan.textContent = 'battery_5_bar';
                            else if(level > 40) iconSpan.textContent = 'battery_4_bar';
                            else if(level > 20) iconSpan.textContent = 'battery_3_bar';
                            else iconSpan.textContent = 'battery_alert';
                        }
                    }
                };

                updateBat();
                battery.addEventListener('levelchange', updateBat);
            } catch (e) {
                console.log('Battery status not supported');
            }
        }
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

    loadEntryForReading(entry) {
        console.log('loadEntryForReading called with:', entry);
        this.renderer.loadScreen('entry-view', (screenName) => {
            // Initialize the entry view controller
            if (!this.entryViewController) {
                this.entryViewController = new EntryViewController(this.db);
            }
            this.entryViewController.initialize(entry);
        });
    }

    async saveJournalEntry() {
        const content = this.commandController.getValue();
        if (!content.trim()) {
            // Show a subtle message instead of alert
            const textarea = document.getElementById('journal-textarea');
            if (textarea) {
                textarea.placeholder = 'Please write something first...';
                textarea.classList.add('animate-pulse');
                setTimeout(() => {
                    textarea.placeholder = 'ENTER STATUS...';
                    textarea.classList.remove('animate-pulse');
                }, 1500);
            }
            return;
        }

        const selectedButton = document.querySelector('.mood-selector-button.selected');
        const selectedMood = selectedButton ? selectedButton.dataset.mood : 'NEUTRAL';
        const entry = new JournalEntry(content, selectedMood);
        const newLastFedTime = this.petState.feed(entry.wordCount);

        this.db.saveEntry(entry.toDbFormat());
        this.db.updatePetLastFed(newLastFedTime);
        this.petState.lastFedTime = newLastFedTime;

        const mealType = entry.isFullMeal() ? 'Full Meal' : 'Snack';
        
        // Show feeding overlay with animation
        await this.showFeedingAnimation(mealType, entry.wordCount);

        this.commandController.clear();
        this.renderer.loadScreen('home', (screenName) => {
            this.onScreenLoaded(screenName);
        });
    }

    async showFeedingAnimation(mealType, wordCount) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('feeding-overlay');
            const message = document.getElementById('feeding-message');
            
            if (!overlay) {
                resolve();
                return;
            }

            // Show overlay
            overlay.classList.remove('hidden');
            if (message) {
                message.textContent = `FEEDING... ${wordCount} WORDS`;
            }

            // Create a temporary pet canvas controller for the overlay
            // Parameters: (db, canvasId, canvasPrefix)
            const feedingPetCanvas = new PetCanvasController(this.db, null, 'feeding');
            
            // Initialize and wait for it to complete before starting animation
            feedingPetCanvas.initialize().then(() => {
                console.log('Feeding animation initialized, starting animation...');
                
                // Set animation state to feeding BEFORE starting loop
                feedingPetCanvas.playFeedingAnimation();
                console.log('Animation state set to feeding, currentFrame:', feedingPetCanvas.currentFrame);
                
                // Draw initial frame immediately
                feedingPetCanvas.drawAll();
                console.log('Initial frame drawn');
                
                // Start the animation loop
                feedingPetCanvas.startAnimationLoop();
                console.log('Animation loop started');
            }).catch(err => {
                console.error('Failed to initialize feeding animation:', err);
                // Still resolve after timeout even if init fails
            });

            // Hide overlay after animation completes (eating animation is about 2 seconds)
            setTimeout(() => {
                overlay.classList.add('hidden');
                feedingPetCanvas.stopAnimations();
                resolve();
            }, 2500); // 2.5 seconds to show the full eating animation
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.pixelPetApp = new PixelPetApp();
    await window.pixelPetApp.initialize();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('✅ ServiceWorker registered:', registration.scope);
        }, err => {
            console.log('❌ ServiceWorker registration failed:', err);
        });
    });
}
