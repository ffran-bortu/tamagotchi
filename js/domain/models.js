// ============================================================================
// DOMAIN LAYER - Pet State & Hunger Logic
// Business logic for pet care mechanics (18-hour hunger timer)
// ============================================================================

export const MOOD_COLORS = {
    HAPPY: '#F0E68C',      // Muted Gold (from AGENTS.md)
    SAD: '#5F9EA0',        // Muted Indigo
    ANXIOUS: '#9370DB',    // Muted Violet
    NEUTRAL: '#8FBC8F',    // Muted Sage
    EXCITED: '#F08080'     // Muted Coral
};

export const HUNGER_STATES = {
    THRIVING: { threshold: 80, label: 'Thriving' },
    CONTENT: { threshold: 50, label: 'Content' },
    HALF_WILTED: { threshold: 20, label: 'Half-Wilted' },
    WITHERING: { threshold: 0, label: 'Withering' },
    STARVING: { threshold: -1, label: 'Starving' }
};

export class PetState {
    constructor(lastFedTime, currentHat = '', unlockedAccessories = [], currentColor = 1, name = 'MY PET') {
        this.lastFedTime = lastFedTime;
        this.currentHat = currentHat;
        this.unlockedAccessories = unlockedAccessories; // Array of unlocked item IDs
        this.currentColor = currentColor;
        this.name = name;
    }

    getHungerPercentage() {
        const HUNGER_DURATION = 18 * 60 * 60 * 1000; // 18 hours in ms
        const elapsedTime = Date.now() - this.lastFedTime;
        return Math.max(0, 100 - (elapsedTime / HUNGER_DURATION) * 100);
    }

    getHungerState() {
        const percentage = this.getHungerPercentage();

        if (percentage >= HUNGER_STATES.THRIVING.threshold) {
            return HUNGER_STATES.THRIVING;
        } else if (percentage >= HUNGER_STATES.CONTENT.threshold) {
            return HUNGER_STATES.CONTENT;
        } else if (percentage >= HUNGER_STATES.HALF_WILTED.threshold) {
            return HUNGER_STATES.HALF_WILTED;
        } else if (percentage > 0) {
            return HUNGER_STATES.WITHERING;
        } else {
            return HUNGER_STATES.STARVING;
        }
    }

    isHungry() {
        return this.getHungerPercentage() < 20;
    }

    isStarving() {
        return this.getHungerPercentage() === 0;
    }

    feed(wordCount) {
        // Full meal (50+ words) = 100% hunger
        // Partial meal (<50 words) = 50% hunger
        const HUNGER_DURATION = 18 * 60 * 60 * 1000;
        const now = Date.now();

        if (wordCount >= 50) {
            this.lastFedTime = now;
        } else {
            const halfDuration = HUNGER_DURATION / 2;
            this.lastFedTime = now - halfDuration;
        }

        return this.lastFedTime;
    }
}

export class JournalEntry {
    constructor(content, mood) {
        this.timestamp = Date.now();
        this.date = new Date(this.timestamp).toISOString().split('T')[0];
        this.content = content;
        this.mood = mood;
        this.accentColor = MOOD_COLORS[mood] || MOOD_COLORS.NEUTRAL;
        this.wordCount = this._calculateWordCount(content);
    }

    _calculateWordCount(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    isFullMeal() {
        return this.wordCount >= 50;
    }

    toDbFormat() {
        return {
            date: this.date,
            timestamp: this.timestamp,
            content: this.content,
            mood: this.mood,
            accentColor: this.accentColor,
            wordCount: this.wordCount
        };
    }
}

export class Accessory {
    constructor(id, name, unlockCondition) {
        this.id = id;
        this.name = name;
        this.unlockCondition = unlockCondition; // e.g., { type: 'streak', days: 7 }
    }

    isUnlocked(unlockedList) {
        return unlockedList.includes(this.id);
    }
}

// Predefined accessories catalog
export const ACCESSORIES_CATALOG = [
    new Accessory('hat_wizard', 'Wizard Hat', { type: 'streak', days: 7 }),
    new Accessory('hat_crown', 'Crown', { type: 'streak', days: 14 }),
    new Accessory('hat_halo', 'Halo', { type: 'streak', days: 30 }),
    new Accessory('glasses_cool', 'Cool Shades', { type: 'total_entries', count: 20 }),
    new Accessory('bow_tie', 'Bow Tie', { type: 'total_entries', count: 50 })
];
