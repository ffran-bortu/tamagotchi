export class EntryViewController {
    constructor(db) {
        this.db = db;
        this.currentEntry = null;
    }

    initialize(entry) {
        console.log('EntryViewController.initialize() called with entry:', entry);
        this.currentEntry = entry;
        this.render();
        this.setupButtons();
    }

    render() {
        if (!this.currentEntry) {
            console.error('No entry to display');
            return;
        }

        // Format date and time
        const dateObj = new Date(this.currentEntry.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }).toUpperCase();
        const timeStr = dateObj.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        }).toUpperCase();

        // Update date/time
        const dateElement = document.getElementById('entry-date');
        const timeElement = document.getElementById('entry-time');
        if (dateElement) dateElement.textContent = dateStr;
        if (timeElement) timeElement.textContent = timeStr;

        // Update feeling/mood
        const feelingElement = document.getElementById('entry-feeling');
        if (feelingElement) {
            feelingElement.textContent = `FEELING: ${this.currentEntry.mood || 'NEUTRAL'}`;
            // Apply mood color
            const moodColors = {
                'HAPPY': '#F0E68C',
                'SAD': '#5F9EA0',
                'ANXIOUS': '#9370DB',
                'NEUTRAL': '#8FBC8F',
                'EXCITED': '#F08080'
            };
            feelingElement.style.color = moodColors[this.currentEntry.mood] || moodColors.NEUTRAL;
        }

        // Update content
        const contentElement = document.getElementById('entry-content');
        if (contentElement) {
            contentElement.textContent = this.currentEntry.content || 'No content available.';
        }

        // Update pet display (simple colored box for now, could be enhanced with canvas)
        const petDisplay = document.getElementById('entry-pet-display');
        if (petDisplay && this.currentEntry.accentColor) {
            const petBox = petDisplay.querySelector('div');
            if (petBox) {
                petBox.style.backgroundColor = this.currentEntry.accentColor;
            }
        }
    }

    setupButtons() {
        // Close button
        const closeBtn = document.getElementById('close-entry-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                if (window.pixelPetApp && typeof window.pixelPetApp.renderer.loadScreen === 'function') {
                    window.pixelPetApp.renderer.loadScreen('archive-grid', (screenName) => {
                        window.pixelPetApp.onScreenLoaded(screenName);
                    });
                }
            });
        }

        // Edit button
        const editBtn = document.getElementById('edit-entry-button');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                console.log('Edit button clicked');
                // For now, just show alert - can implement edit functionality later
                alert('Edit functionality coming soon!');
            });
        }
    }
}

