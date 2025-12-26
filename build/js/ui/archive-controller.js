// ============================================================================
// ARCHIVE GRID CONTROLLER
// Wires up mood calendar with database entries & List View
// ============================================================================

import { Database } from '../data/database.js';
import { MOOD_COLORS } from '../domain/models.js';

export class ArchiveGridController {
    constructor(db) {
        this.db = db;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1; // 1-indexed
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.filterDate = null; // For filtering list view by date
    }

    async initialize() {
        console.log('ArchiveController.initialize() called, initial viewMode:', this.viewMode);
        this.setupHeader();
        this.setupToggle();
        this.render();
        console.log('ArchiveController.initialize() complete, final viewMode:', this.viewMode);
    }

    setupHeader() {
        // Setup Month Navigation
        const headerContainer = document.getElementById('archive-header-title');
        if (!headerContainer) return;

        // We need to inject the buttons into the header structure
        // The HTML has a placeholder for the title.
        // We will replace the inner HTML of the container div with nav buttons

        // Wait, the HTML structure in public/archive-grid.html has:
        // <div class="flex flex-col items-center justify-center"><h2 id="archive-header-title">...</h2></div>

        // We'll update the render method to update the text, but we need buttons.
        // Let's replace the whole block in render.

        // Actually, let's just create the event listeners once if we can, or re-create them.
        // Let's delegate or re-attach.
        const parent = headerContainer.parentElement;
        parent.innerHTML = `
            <div class="flex items-center gap-4 select-none">
                <button id="prev-month" class="text-retro-accent hover:text-white transition-colors">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 id="month-label" class="text-retro-accent text-sm md:text-base font-retro leading-tight tracking-widest text-center drop-shadow-md w-24">
                    --
                </h2>
                <button id="next-month" class="text-retro-accent hover:text-white transition-colors">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        `;

        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    }

    setupToggle() {
        const toggleBtn = document.getElementById('view-toggle');
        if (!toggleBtn) {
            console.warn('Toggle button not found');
            return;
        }

        toggleBtn.addEventListener('click', () => {
            console.log('Toggle clicked, current mode:', this.viewMode);
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
            console.log('Switching to mode:', this.viewMode);
            this.updateToggleUI();
            this.render();
        });
        
        // Initialize toggle UI to match current view mode
        this.updateToggleUI();
    }

    updateToggleUI() {
        console.log('updateToggleUI called, viewMode:', this.viewMode);
        const knob = document.getElementById('view-toggle-knob');
        const gridContainer = document.getElementById('grid-view-container');
        const listContainer = document.getElementById('list-view-container');
        const monthNav = document.getElementById('prev-month')?.parentElement; // The container of nav buttons

        if (!knob || !gridContainer || !listContainer) {
            console.error('Toggle UI elements not found:', { knob, gridContainer, listContainer });
            return;
        }

        if (this.viewMode === 'list') {
            // Knob to Left
            knob.style.right = 'auto';
            knob.style.left = '0';
            knob.classList.remove('bg-chip-teal');
            knob.classList.add('bg-retro-rose');

            gridContainer.classList.add('hidden');
            listContainer.classList.remove('hidden');

            // Hide Month Nav in List Mode (since list is all entries)
            if (monthNav) monthNav.classList.add('opacity-50', 'pointer-events-none');

        } else {
            // Knob to Right (Grid Mode)
            knob.style.left = 'auto';
            knob.style.right = '0';
            knob.classList.remove('bg-retro-rose');
            knob.classList.add('bg-chip-teal');

            gridContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');

            if (monthNav) monthNav.classList.remove('opacity-50', 'pointer-events-none');
        }
        console.log('Toggle UI updated, grid hidden:', gridContainer.classList.contains('hidden'), 'list hidden:', listContainer.classList.contains('hidden'));
    }

    changeMonth(delta) {
        if (this.viewMode === 'list') return; // Disable in list mode

        let newMonth = this.currentMonth + delta;
        let newYear = this.currentYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        this.currentMonth = newMonth;
        this.currentYear = newYear;
        this.renderCalendar();
    }

    render() {
        console.log('ArchiveController.render() called, viewMode:', this.viewMode);
        if (this.viewMode === 'grid') {
            this.renderCalendar();
        } else {
            this.renderList();
        }
    }

    renderCalendar() {
        console.log('renderCalendar() called');
        const entries = this.db.getEntriesByMonth(this.currentYear, this.currentMonth);
        console.log('Entries for month:', entries.length, entries);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        const monthLabel = document.getElementById('month-label');
        if (monthLabel) {
            monthLabel.innerHTML = `${monthNames[this.currentMonth - 1]} <span class="text-white">${this.currentYear}</span>`;
        }

        // Create a map of date → entries array (multiple entries per day)
        const entryMap = {};
        entries.forEach(entry => {
            if (!entryMap[entry.date]) {
                entryMap[entry.date] = [];
            }
            entryMap[entry.date].push(entry);
        });

        // Get calendar grid element
        const grid = document.getElementById('calendar-grid');
        console.log('Calendar grid element:', grid);
        if (!grid) {
            console.error('Calendar grid element not found!');
            return;
        }

        // Calculate first day of month and total days
        const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Headers
        grid.innerHTML = `
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">S</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">M</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">T</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">W</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">T</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">F</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">S</div>
        `;

        // Empty cells
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'aspect-square';
            grid.appendChild(emptyDiv);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entryMap[dateStr];

            if (dayEntries && dayEntries.length > 0) {
                // Filled cell - use first entry's color
                const firstEntry = dayEntries[0];
                console.log('Creating calendar cell for day', day, 'with', dayEntries.length, 'entries');
                const div = document.createElement('div');
                div.className = "relative w-full aspect-square shadow-chip-3d border-b-4 border-r-4 border-black/30 hover:brightness-110 active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 transition-all cursor-pointer group";
                div.style.backgroundColor = firstEntry.accentColor;
                div.innerHTML = `
                    <span class="absolute bottom-1 right-1 text-[0.5rem] font-retro text-black/40">${day}</span>
                    <div class="absolute top-1 left-1 w-2 h-0.5 bg-white/30"></div>
                    <div class="absolute top-2 left-1 w-1 h-0.5 bg-white/30"></div>
                    ${dayEntries.length > 1 ? `<span class="absolute top-1 right-1 text-[0.5rem] font-retro text-white/60">${dayEntries.length}</span>` : ''}
                `;
                
                // Add click handler - if single entry go to view, if multiple go to filtered list
                const clickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Calendar cell clicked for day', day, 'with', dayEntries.length, 'entries');
                    
                    if (dayEntries.length === 1) {
                        // Single entry - go directly to entry view
                        this.viewEntry(dayEntries[0]);
                    } else {
                        // Multiple entries - switch to list view filtered by this date
                        this.viewMode = 'list';
                        this.filterDate = dateStr;
                        this.updateToggleUI();
                        this.renderList();
                    }
                };
                
                div.addEventListener('click', clickHandler);
                grid.appendChild(div);
            } else {
                // Empty cell
                const emptyCell = document.createElement('div');
                emptyCell.className = 'relative w-full aspect-square bg-chip-empty border-2 border-neutral-700/50 empty-pattern flex items-center justify-center';
                emptyCell.innerHTML = `
                    <span class="absolute top-0.5 left-1 text-[0.5rem] font-retro text-neutral-600">${day}</span>
                    <span class="text-neutral-700 text-opacity-30 text-xs font-sans">×</span>
                `;
                grid.appendChild(emptyCell);
            }
        }

        // Update stats - count unique days, not total entries
        const filledCount = Object.keys(entryMap).length;
        const emptyCount = daysInMonth - filledCount;
        const percentage = Math.round((filledCount / daysInMonth) * 100);

        const statsFilled = document.getElementById('stats-filled');
        const statsEmpty = document.getElementById('stats-empty');
        const progressBar = document.getElementById('stats-bar');

        if (statsFilled) statsFilled.textContent = `Filled: ${String(filledCount).padStart(2, '0')}`;
        if (statsEmpty) statsEmpty.textContent = `Empty: ${String(emptyCount).padStart(2, '0')}`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
    }

    renderList() {
        console.log('renderList() called, filterDate:', this.filterDate);
        const listContainer = document.getElementById('list-view-container');
        console.log('List container element:', listContainer);
        if (!listContainer) {
            console.error('List container element not found!');
            return;
        }

        listContainer.innerHTML = '';

        // Use getAllEntries or filter by date
        let allEntries;
        if (this.filterDate) {
            // Filter by specific date
            allEntries = this.db.getAllEntries().filter(entry => entry.date === this.filterDate);
            console.log('Filtered entries for', this.filterDate, ':', allEntries.length);
        } else {
            // Show all entries
            allEntries = this.db.getAllEntries();
            console.log('All entries:', allEntries.length, allEntries);
        }

        if (allEntries.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-retro-gray font-pixel text-xs mt-8">NO ENTRIES FOUND</p>';
            return;
        }

        allEntries.forEach(entry => {
            const card = document.createElement('div');
            card.className = "bg-retro-panel border-l-4 border-retro-gray p-4 flex flex-col gap-2 shadow-sm active:bg-neutral-800 transition-colors cursor-pointer";
            card.style.borderLeftColor = entry.accentColor; // Color coded

            // Format Date
            const dateObj = new Date(entry.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-retro-light font-pixel text-[0.6rem] uppercase tracking-wider opacity-70">${dateStr}</span>
                    <span class="material-symbols-outlined text-retro-gray text-sm">more_horiz</span>
                </div>
                <p class="text-white font-display text-sm line-clamp-2 leading-relaxed opacity-90">${entry.content}</p>
            `;

            card.addEventListener('click', (e) => {
                console.log('🟢 LIST ITEM CLICKED!', entry);
                e.preventDefault();
                e.stopPropagation();
                console.log('List item clicked for entry:', entry);
                const entryToView = entry; // Capture entry in closure
                const controller = this; // Capture this context
                controller.viewEntry(entryToView);
            });
            listContainer.appendChild(card);
        });

        // Add end message without breaking event listeners
        const endMessage = document.createElement('p');
        endMessage.className = 'text-center text-retro-gray font-pixel text-xs mt-8 opacity-50';
        endMessage.textContent = 'END OF RECORDS';
        listContainer.appendChild(endMessage);
    }

    viewEntry(entry) {
        console.log('viewEntry called with:', entry);
        
        if (!entry) {
            console.error('No entry provided to viewEntry');
            return;
        }

        // Ensure entry has required fields
        if (!entry.content || !entry.date || !entry.mood) {
            console.error('Entry missing required fields:', entry);
            return;
        }

        // Always use the event dispatch method as it's more reliable
        console.log('Dispatching view-journal-entry event');
        const event = new CustomEvent('view-journal-entry', { 
            detail: entry,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
        
        // Also try direct call as backup
        if (window.pixelPetApp && typeof window.pixelPetApp.loadEntryForReading === 'function') {
            console.log('Also calling loadEntryForReading directly');
            try {
            window.pixelPetApp.loadEntryForReading(entry);
            } catch (error) {
                console.error('Error calling loadEntryForReading:', error);
            }
        }
    }
}
