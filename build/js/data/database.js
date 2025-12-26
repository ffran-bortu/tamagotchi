// ============================================================================
// DATA LAYER - Database Module
// Handles all SQLite WASM operations and persistence
// ============================================================================

export class Database {
    constructor() {
        this.db = null;
        this.SQL = null;
    }

    async initialize() {
        try {
            // Load SQL.js WASM
            this.SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            // Load or create database from IndexedDB
            const savedDb = await this._loadFromIndexedDB();
            this.db = savedDb || new this.SQL.Database();

            // Create tables if they don't exist
            this._createTables();

            // Initialize default data if needed
            this._initializeDefaults();

            // Run migrations
            this._migrate();

            return this;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    _migrate() {
        try {
            this.db.run("ALTER TABLE pet ADD COLUMN name TEXT DEFAULT 'MY PET';");
        } catch (e) {
            // Column likely exists or error adding it
        }
        try {
            this.db.run("ALTER TABLE pet ADD COLUMN current_background INTEGER DEFAULT 1;");
        } catch (e) {
            // Column likely exists or error adding it
        }
    }

    _createTables() {
        // Pet state table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS pet (
                id INTEGER PRIMARY KEY,
                last_fed_time INTEGER NOT NULL,
                current_hat TEXT,
                current_color INTEGER DEFAULT 1,
                current_background INTEGER DEFAULT 1,
                unlocked_accessories TEXT,
                name TEXT DEFAULT 'MY PET'
            );
        `);

        // Journal entries table  
        this.db.run(`
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                content TEXT NOT NULL,
                mood TEXT NOT NULL,
                accent_color TEXT NOT NULL,
                word_count INTEGER NOT NULL
            );
        `);

        // Create index on date for faster calendar queries
        this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_entries_date 
            ON entries(date);
        `);
    }

    _initializeDefaults() {
        const result = this.db.exec("SELECT id FROM pet WHERE id = 1;");
        if (result.length === 0) {
            const now = Date.now();
            this.db.run(
                "INSERT INTO pet (id, last_fed_time, current_hat, unlocked_accessories, name) VALUES (1, ?, '', '[]', 'MY PET');",
                [now]
            );
            this.save();
        }
    }

    async _loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("pet_database", 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['files'], 'readonly');
                const store = transaction.objectStore('files');
                const getRequest = store.get('database.sqlite');

                getRequest.onsuccess = (event) => {
                    const data = event.target.result;
                    resolve(data ? new this.SQL.Database(data) : null);
                };

                getRequest.onerror = () => reject('Error loading from IndexedDB');
            };

            request.onerror = () => reject('Error opening IndexedDB');
        });
    }

    save() {
        try {
            const data = this.db.export();
            const request = indexedDB.open("pet_database", 1);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                store.put(data, 'database.sqlite');
            };
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    // Pet state operations
    getPetState() {
        const result = this.db.exec(
            "SELECT last_fed_time, current_hat, current_color, current_background, unlocked_accessories, name FROM pet WHERE id = 1;"
        );

        if (result.length > 0) {
            const [lastFedTime, currentHat, currentColor, currentBackground, accessoriesJson, name] = result[0].values[0];
            return {
                lastFedTime: lastFedTime,
                currentHat: currentHat || '',
                currentColor: currentColor || 1,
                currentBackground: currentBackground || 1,
                unlockedAccessories: JSON.parse(accessoriesJson || '[]'),
                name: name || 'MY PET'
            };
        }
        return null;
    }

    updatePetLastFed(timestamp) {
        this.db.run("UPDATE pet SET last_fed_time = ? WHERE id = 1;", [timestamp]);
        this.save();
    }

    updatePetName(name) {
        this.db.run("UPDATE pet SET name = ? WHERE id = 1;", [name]);
        this.save();
    }

    updatePetHat(hatId) {
        this.db.run("UPDATE pet SET current_hat = ? WHERE id = 1;", [hatId]);
        this.save();
    }

    updatePetColor(colorIndex) {
        this.db.run("UPDATE pet SET current_color = ? WHERE id = 1;", [colorIndex]);
        this.save();
    }

    updatePetBackground(backgroundIndex) {
        this.db.run("UPDATE pet SET current_background = ? WHERE id = 1;", [backgroundIndex]);
        this.save();
    }

    unlockAccessory(accessoryId) {
        const state = this.getPetState();
        const accessories = state.unlockedAccessories;

        if (!accessories.includes(accessoryId)) {
            accessories.push(accessoryId);
            this.db.run(
                "UPDATE pet SET unlocked_accessories = ? WHERE id = 1;",
                [JSON.stringify(accessories)]
            );
            this.save();
        }
    }

    // Journal entry operations
    saveEntry(entry) {
        this.db.run(`
            INSERT INTO entries (date, timestamp, content, mood, accent_color, word_count)
            VALUES (?, ?, ?, ?, ?, ?);
        `, [
            entry.date,
            entry.timestamp,
            entry.content,
            entry.mood,
            entry.accentColor,
            entry.wordCount
        ]);
        this.save();
    }

    getAllEntries() {
        const result = this.db.exec(`
            SELECT id, date, timestamp, content, mood, accent_color, word_count
            FROM entries
            ORDER BY timestamp DESC;
        `);

        if (result.length === 0) return [];

        return result[0].values.map(row => ({
            id: row[0],
            date: row[1],
            timestamp: row[2],
            content: row[3],
            mood: row[4],
            accentColor: row[5],
            wordCount: row[6]
        }));
    }

    getEntriesByMonth(year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        const result = this.db.exec(`
            SELECT id, date, timestamp, content, mood, accent_color, word_count
            FROM entries
            WHERE date BETWEEN ? AND ?
            ORDER BY date ASC;
        `, [startDate, endDate]);

        if (result.length === 0) return [];

        return result[0].values.map(row => ({
            id: row[0],
            date: row[1],
            timestamp: row[2],
            content: row[3],
            mood: row[4],
            accentColor: row[5],
            wordCount: row[6]
        }));
    }
}
