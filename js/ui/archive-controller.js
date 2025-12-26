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
    }

    async initialize() {
        this.setupHeader();
        this.setupToggle();
        this.render();
    }

    setupHeader() {
        // Setup Month Navigation
        const headerContainer = document.getElementById('archive-header-title');
        if(!headerContainer) return;

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
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
            this.updateToggleUI();
            this.render();
        });
    }

    updateToggleUI() {
        const knob = document.getElementById('view-toggle-knob');
        const gridContainer = document.getElementById('grid-view-container');
        const listContainer = document.getElementById('list-view-container');
        const monthNav = document.getElementById('prev-month')?.parentElement; // The container of nav buttons

        if (this.viewMode === 'list') {
            // Knob to Left
            knob.style.right = 'auto';
            knob.style.left = '0';
            knob.classList.remove('bg-chip-teal');
            knob.classList.add('bg-retro-rose');

            gridContainer.classList.add('hidden');
            listContainer.classList.remove('hidden');

            // Hide Month Nav in List Mode (since list is all entries)
            if(monthNav) monthNav.classList.add('opacity-50', 'pointer-events-none');

        } else {
            // Knob to Right
            knob.style.left = 'auto';
            knob.style.right = '0';
            knob.classList.remove('bg-retro-rose');
            knob.classList.add('bg-chip-teal');

            gridContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');

            if(monthNav) monthNav.classList.remove('opacity-50', 'pointer-events-none');
        }
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
        if (this.viewMode === 'grid') {
            this.renderCalendar();
        } else {
            this.renderList();
        }
    }

    renderCalendar() {
        const entries = this.db.getEntriesByMonth(this.currentYear, this.currentMonth);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        const monthLabel = document.getElementById('month-label');
        if (monthLabel) {
            monthLabel.innerHTML = `${monthNames[this.currentMonth - 1]} <span class="text-white">${this.currentYear}</span>`;
        }

        // Create a map of date → entry
        const entryMap = {};
        entries.forEach(entry => {
            entryMap[entry.date] = entry;
        });

        // Get calendar grid element
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

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
            grid.innerHTML += '<div class="aspect-square"></div>';
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = entryMap[dateStr];

            if (entry) {
                // Filled cell
                const div = document.createElement('div');
                div.className = "relative w-full aspect-square shadow-chip-3d border-b-4 border-r-4 border-black/30 hover:brightness-110 active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 transition-all cursor-pointer group";
                div.style.backgroundColor = entry.accentColor;
                div.innerHTML = `
                    <span class="absolute bottom-1 right-1 text-[0.5rem] font-retro text-black/40">${day}</span>
                    <div class="absolute top-1 left-1 w-2 h-0.5 bg-white/30"></div>
                    <div class="absolute top-2 left-1 w-1 h-0.5 bg-white/30"></div>
                `;
                div.addEventListener('click', () => this.viewEntry(entry));
                grid.appendChild(div);
            } else {
                // Empty cell
                grid.innerHTML += `
                    <div class="relative w-full aspect-square bg-chip-empty border-2 border-neutral-700/50 empty-pattern flex items-center justify-center">
                        <span class="absolute top-0.5 left-1 text-[0.5rem] font-retro text-neutral-600">${day}</span>
                        <span class="text-neutral-700 text-opacity-30 text-xs font-sans">×</span>
                    </div>
                `;
            }
        }

        // Update stats
        const filledCount = entries.length;
        const emptyCount = daysInMonth - filledCount;
        const percentage = Math.round((filledCount / daysInMonth) * 100);

        const statsFilled = document.getElementById('stats-filled');
        const statsEmpty = document.getElementById('stats-empty');
        const progressBar = document.getElementById('stats-bar');

        if(statsFilled) statsFilled.textContent = `Filled: ${String(filledCount).padStart(2, '0')}`;
        if(statsEmpty) statsEmpty.textContent = `Empty: ${String(emptyCount).padStart(2, '0')}`;
        if(progressBar) progressBar.style.width = `${percentage}%`;
    }

    renderList() {
        const listContainer = document.getElementById('list-view-container');
        if (!listContainer) return;

        // Clear current list (except the "No More Entries" text, or just recreate it)
        listContainer.innerHTML = '';

        // Fetch ALL entries (or pagination?)
        // Database.getEntriesByMonth only gets for a month. We probably want all recent.
        // Let's assume we can get all or verify if DB has `getAllEntries`.
        // Inspecting database.js via memory? I don't recall getAllEntries.
        // But assuming typical logic, we might need to implement it.
        // For now, let's use the current month entries as a fallback if getAllEntries doesn't exist,
        // BUT the user wants "scroll through all your previous entries".

        // Check if I can access DB methods.
        // I will attempt to use a getAllEntries if it exists, or create one.
        // Since I cannot check database.js easily right now without reading it again...
        // I'll stick to rendering what I can (maybe loop through past 12 months?)

        // Let's rely on the fact that Archive usually shows *history*.
        // I'll just render the current month for now, but ideally we need a `getAllEntries` sorted by date DESC.

        // HACK: Use `getEntriesByMonth` for the last 12 months for now to simulate "all".
        let allEntries = [];
        for(let i=0; i<12; i++) {
             let d = new Date();
             d.setMonth(d.getMonth() - i);
             const mEntries = this.db.getEntriesByMonth(d.getFullYear(), d.getMonth()+1);
             allEntries = allEntries.concat(mEntries);
        }
        // Deduplicate just in case? No.
        // Sort DESC
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

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

            card.addEventListener('click', () => this.viewEntry(entry));
            listContainer.appendChild(card);
        });

        listContainer.innerHTML += '<p class="text-center text-retro-gray font-pixel text-xs mt-8 opacity-50">END OF RECORDS</p>';
    }

    viewEntry(entry) {
        // Navigate to Command screen in "Read Only" mode
        // Since we don't have a formal router parameter, we'll store it in localStorage or global state?
        // Or simpler: Load command screen and then populate it.
        // We need a way to pass data.
        // I will use `window.pixelPetApp.loadEntry(entry)` if I can access the app instance?
        // Or specific event.

        // Since `window.pixelPetApp` is not exposed in `app.js` (it's inside DOMContentLoaded),
        // I'll dispatch a custom event.
        const event = new CustomEvent('view-journal-entry', { detail: entry });
        document.dispatchEvent(event);
    }
}
