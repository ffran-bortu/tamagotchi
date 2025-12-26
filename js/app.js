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
        this.renderer.loadScreen('command', (screenName) => {
            // Populate data
            const textarea = document.querySelector('textarea');
            const saveBtn = document.getElementById('save-entry-button');
            const moodContainer = document.querySelector('.grid.grid-cols-5');
            const title = document.querySelector('h2.text-xs');

            if(textarea) {
                textarea.value = entry.content;
                textarea.readOnly = true;
                // Dispatch input event to update cursor text in CommandScreenController
                textarea.dispatchEvent(new Event('input'));
            }

            if(saveBtn) saveBtn.style.display = 'none'; // Hide save button

            if(title) {
                title.innerHTML = `<span class="text-retro-green">&gt;</span> ENTRY RECORD:<br/>${entry.date}`;
            }

            // Highlight mood
            if(moodContainer) {
                 const buttons = moodContainer.querySelectorAll('button');
                 buttons.forEach(b => {
                     if(b.dataset.mood === entry.mood) {
                         b.classList.add('selected');
                     } else {
                         b.classList.remove('selected');
                         b.style.opacity = '0.5';
                         b.disabled = true;
                     }
                 });
            }

            // Change border color to mood
            const inputContainer = document.querySelector('div.bg-black.border-4');
            if(inputContainer && entry.accentColor) {
                inputContainer.style.borderColor = entry.accentColor;
            }

            // Add "Back" button
            const main = document.querySelector('main');
            const backBtn = document.createElement('button');
            backBtn.className = "w-full h-12 bg-retro-panel border-4 border-retro-gray text-retro-light text-lg font-bold uppercase shadow-retro mt-4 active:translate-y-1 transition-all";
            backBtn.innerHTML = "BACK TO ARCHIVE";
            backBtn.onclick = () => {
                this.renderer.loadScreen('archive-grid', (s) => this.onScreenLoaded(s));
            };
            main.appendChild(backBtn);

        });
    }

    saveJournalEntry() {
        const content = this.commandController.getValue();
        if (!content.trim()) {
            alert('Please write something before saving!');
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
        alert(`✅ Entry saved! Pet fed: ${mealType} (${entry.wordCount} words)`);

        this.commandController.clear();
        this.renderer.loadScreen('home', (screenName) => {
            this.onScreenLoaded(screenName);
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
