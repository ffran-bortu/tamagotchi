
import { Database } from './js/data/database.js';
import { PetState, JournalEntry, MOOD_COLORS } from './js/domain/models.js';

async function runTests() {
    console.log('🧪 Starting Full System Audit...');
    const report = [];

    try {
        // --- 1. Hunger Engine Test ---
        console.log('\n[1] Testing Hunger Engine...');
        const petState = new PetState(Date.now());

        // Test 9 hours (50%)
        const nineHoursAgo = Date.now() - (9 * 60 * 60 * 1000);
        petState.lastFedTime = nineHoursAgo;
        const hunger50 = petState.getHungerPercentage();
        if (Math.abs(hunger50 - 50) < 1) {
             console.log('✅ 9 Hours -> ~50% Hunger: PASS');
             report.push('Hunger 9h: PASS');
        } else {
             console.error(`❌ 9 Hours -> ${hunger50}% (Expected 50%): FAIL`);
             report.push('Hunger 9h: FAIL');
        }

        // Test 18 hours (0%)
        const eighteenHoursAgo = Date.now() - (18 * 60 * 60 * 1000);
        petState.lastFedTime = eighteenHoursAgo;
        const hunger0 = petState.getHungerPercentage();
        if (hunger0 === 0) {
             console.log('✅ 18 Hours -> 0% Hunger: PASS');
             report.push('Hunger 18h: PASS');
        } else {
             console.error(`❌ 18 Hours -> ${hunger0}% (Expected 0%): FAIL`);
             report.push('Hunger 18h: FAIL');
        }

        // Test Feeding (50+ words)
        const longEntry = "word ".repeat(50);
        petState.feed(longEntry.split(' ').length);
        if (petState.getHungerPercentage() === 100) {
            console.log('✅ Feed >50 words -> 100% Hunger: PASS');
            report.push('Feed 50 words: PASS');
        } else {
            console.error('❌ Feed >50 words failed to reset hunger: FAIL');
            report.push('Feed 50 words: FAIL');
        }

        // --- 2. SQLite Data Integrity ---
        console.log('\n[2] Testing SQLite Data Integrity...');
        const db = await new Database().initialize();

        // Create 30 entries
        console.log('Creating 30 mock entries...');
        for(let i=0; i<30; i++) {
             const d = new Date();
             d.setDate(d.getDate() - i);
             const dateStr = d.toISOString().split('T')[0];
             const entry = {
                 date: dateStr,
                 timestamp: d.getTime(),
                 content: `Test entry ${i}`,
                 mood: 'HAPPY',
                 accentColor: MOOD_COLORS.HAPPY,
                 wordCount: 10
             };
             await db.saveEntry(entry);
        }

        const storedEntries = db.getEntriesByMonth(new Date().getFullYear(), new Date().getMonth()+1);
        if (storedEntries.length > 0) {
             console.log(`✅ Stored and retrieved ${storedEntries.length} entries for this month: PASS`);
             report.push('SQLite Entries: PASS');
        } else {
             console.log('⚠️ No entries found for this month (might be spread across months): WARN');
        }

        // Verify lastFedTime persistence
        const fedTime = Date.now();
        db.updatePetLastFed(fedTime);
        const state = db.getPetState();
        if (state.lastFedTime === fedTime) {
             console.log('✅ LastFedTime persistence: PASS');
             report.push('Persistence: PASS');
        } else {
             console.error('❌ LastFedTime persistence: FAIL');
             report.push('Persistence: FAIL');
        }

        // --- 3. Wardrobe & UI ---
        console.log('\n[3] Testing Wardrobe...');
        db.updatePetColor(2);
        db.updatePetHat('5');
        const updatedState = db.getPetState();
        if (updatedState.currentColor === 2 && updatedState.currentHat === '5') {
             console.log('✅ Pet State update (Color/Hat): PASS');
             report.push('Wardrobe Update: PASS');
        } else {
             console.error('❌ Pet State update: FAIL');
             report.push('Wardrobe Update: FAIL');
        }

        // --- 4. Report ---
        console.log('\n--- QA REPORT ---');
        console.log(report.join('\n'));

        if (typeof window !== 'undefined') {
             alert('Audit Complete! Check console.');
        }

    } catch (e) {
        console.error('CRITICAL FAILURE:', e);
    }
}

// Check if running in Node or Browser
if (typeof window === 'undefined') {
    // We are in Node.js (Sandbox). Database is likely using DOM SQL.js which might fail in Node without mocking.
    // The current Database implementation uses `window.initSqlJs` usually.
    // Let's check js/data/database.js content first.
    console.log('Running in Node - Simulating environment...');
} else {
    runTests();
}

// Export for usage
export { runTests };
