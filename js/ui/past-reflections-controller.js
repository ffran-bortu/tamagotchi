// ============================================================================
// PAST REFLECTIONS CONTROLLER
// Displays journal entries in chronological order with mood accents
// ============================================================================

import { Database } from '../data/database.js';

export class PastReflectionsController {
    constructor(db) {
        this.db = db;
    }

    async initialize() {
        this.renderEntries();
    }

    renderEntries() {
        const entries = this.db.getAllEntries(); // Already sorted DESC by timestamp

        const container = document.querySelector('.flex-1.overflow-y-auto');
        if (!container) return;

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full gap-4 p-8">
                    <span class="material-symbols-outlined text-neutral-600 text-6xl">description</span>
                    <p class="text-neutral-500 text-sm font-pixel uppercase text-center">
                        No entries yet.<br/>Start journaling to see reflections.
                    </p>
                </div>
            `;
            return;
        }

        // Build entry cards
        let html = '<div class="flex flex-col gap-3 p-4">';

        entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Truncate content to 150 characters
            const excerpt = entry.content.length > 150
                ? entry.content.substring(0, 150) + '...'
                : entry.content;

            html += `
                <div class="relative bg-entry-bg retro-card p-4 overflow-hidden">
                    <!-- Mood Accent Strip (Left Side) -->
                    <div class="absolute left-0 top-0 bottom-0 w-2" style="background-color: ${entry.accentColor};"></div>
                    
                    <!-- Content -->
                    <div class="ml-4">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <p class="text-retro-light text-xs font-bold uppercase tracking-wide">${dateStr}</p>
                                <p class="text-neutral-500 text-[10px] font-pixel">${timeStr}</p>
                            </div>
                            <div class="px-2 py-1 text-[10px] font-pixel uppercase tracking-widest" 
                                 style="background-color: ${entry.accentColor}20; border: 2px solid ${entry.accentColor}; color: ${entry.accentColor};">
                                ${entry.mood}
                            </div>
                        </div>
                        
                        <p class="text-neutral-300 text-sm leading-relaxed font-terminal lowercase">
                            ${excerpt}
                        </p>
                        
                        <div class="flex items-center gap-3 mt-3 text-[10px] text-neutral-600 font-pixel uppercase">
                            <span>Words: ${entry.wordCount}</span>
                            <span>•</span>
                            <span>${entry.wordCount >= 50 ? 'Full Meal' : 'Snack'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }
}
