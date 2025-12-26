// ============================================================================
// ARCHIVE GRID CONTROLLER
// Wires up mood calendar with database entries
// ============================================================================

import { Database } from '../data/database.js';
import { MOOD_COLORS } from '../domain/models.js';

export class ArchiveGridController {
    constructor(db) {
        this.db = db;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1; // 1-indexed
    }

    async initialize() {
        this.renderCalendar();
    }

    async renderCalendar() {
        const entries = this.db.getEntriesByMonth(this.currentYear, this.currentMonth);

        // Create a map of date → mood color
        const entryMap = {};
        entries.forEach(entry => {
            entryMap[entry.date] = entry.accentColor;
        });

        // Get calendar grid element
        const grid = document.querySelector('.grid.grid-cols-7');
        if (!grid) return;

        // Calculate first day of month and total days
        const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Clear existing cells (keep header row)
        const headerRow = grid.querySelector('.grid.grid-cols-7');
        grid.innerHTML = '';

        // Re-add header
        grid.innerHTML = `
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">S</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">M</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">T</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">W</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">T</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">F</div>
            <div class="text-[0.6rem] font-bold text-neutral-500 font-retro">S</div>
        `;

        // Add empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            grid.innerHTML += '<div class="aspect-square"></div>';
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const moodColor = entryMap[dateStr];

            if (moodColor) {
                // Filled cell with mood color
                grid.innerHTML += `
                    <div class="relative w-full aspect-square shadow-chip-3d border-b-4 border-r-4 border-black/30 hover:brightness-110 active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 transition-all cursor-pointer group" 
                         style="background-color: ${moodColor};">
                        <span class="absolute bottom-1 right-1 text-[0.5rem] font-retro text-black/40">${day}</span>
                        <div class="absolute top-1 left-1 w-2 h-0.5 bg-white/30"></div>
                        <div class="absolute top-2 left-1 w-1 h-0.5 bg-white/30"></div>
                    </div>
                `;
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

        document.querySelector('.flex.justify-between.text-\\[0\\.6rem\\]').innerHTML = `
            <span>Filled: ${String(filledCount).padStart(2, '0')}</span>
            <span>Empty: ${String(emptyCount).padStart(2, '0')}</span>
        `;

        const progressBar = document.querySelector('.h-4.w-full.bg-retro-border div');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        // Update month/year header
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        document.querySelector('h2.text-retro-accent').innerHTML = `
            ${monthNames[this.currentMonth - 1]} <span class="text-white">${this.currentYear}</span>
        `;
    }
}
