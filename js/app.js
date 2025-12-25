document.addEventListener('DOMContentLoaded', async () => {
    const content = document.getElementById('content');
    const HUNGER_DURATION = 18 * 60 * 60 * 1000; // 18 hours in milliseconds

    let db;

    const initDb = async () => {
        try {
            const SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            const dbPromise = new Promise((resolve, reject) => {
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
                        if (data) {
                            resolve(new SQL.Database(data));
                        } else {
                            // If the database doesn't exist, create a new one
                            resolve(new SQL.Database());
                        }
                    };

                    getRequest.onerror = (event) => {
                        reject('Error getting database from IndexedDB');
                    };
                };

                request.onerror = (event) => {
                    reject('Error opening IndexedDB');
                };
            });

            db = await dbPromise;

            // Create table if it doesn't exist
            db.run("CREATE TABLE IF NOT EXISTS pet (id INTEGER PRIMARY KEY, last_fed_time INTEGER);");

            // Check if there's an existing pet
            const result = db.exec("SELECT last_fed_time FROM pet WHERE id = 1;");
            if (result.length === 0) {
                // No pet found, create one
                const now = Date.now();
                db.run("INSERT INTO pet (id, last_fed_time) VALUES (1, ?);", [now]);
                saveDb();
            }
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    };

    const saveDb = () => {
        try {
            const data = db.export();
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
    };

    const getLastFedTime = () => {
        try {
            const result = db.exec("SELECT last_fed_time FROM pet WHERE id = 1;");
            if (result.length > 0) {
                return result[0].values[0][0];
            }
        } catch (error) {
            console.error('Error getting last fed time:', error);
        }
        return Date.now(); // Default to now if there's an error
    };

    const setLastFedTime = (time) => {
        try {
            db.run("UPDATE pet SET last_fed_time = ? WHERE id = 1;", [time]);
            saveDb();
        } catch (error) {
            console.error('Error setting last fed time:', error);
        }
    };

    const initializeCommandScreen = () => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;

        const cursorContainer = document.querySelector('.cursor-blink')?.parentElement;
        if (!cursorContainer) return;

        const cursorText = cursorContainer.querySelector('span:first-child');
        const cursorBlock = cursorContainer.querySelector('.cursor-blink');

        if (!cursorText || !cursorBlock) return;

        textarea.addEventListener('input', (e) => {
            cursorText.textContent = e.target.value;
        });

        textarea.addEventListener('blur', () => {
             cursorBlock.style.opacity = '0.5';
             cursorBlock.classList.remove('cursor-blink');
        });

        textarea.addEventListener('focus', () => {
             cursorBlock.style.opacity = '1';
             cursorBlock.classList.add('cursor-blink');
        });
    };

    const loadScreen = async (screenName) => {
        try {
            const response = await fetch(`public/${screenName}.html`);
            if (response.ok) {
                const screenContent = await response.text();
                content.innerHTML = screenContent;
                if (screenName === 'home') {
                    updateHungerDisplay();
                } else if (screenName === 'command') {
                    initializeCommandScreen();
                }
            } else {
                content.innerHTML = '<p>Screen not found.</p>';
            }
        } catch (error) {
            console.error('Error loading screen:', error);
            content.innerHTML = '<p>Error loading screen.</p>';
        }
    };

    const updateHungerDisplay = () => {
        const lastFedTime = getLastFedTime();
        const elapsedTime = Date.now() - lastFedTime;
        const hungerPercentage = Math.max(0, 100 - (elapsedTime / HUNGER_DURATION) * 100);

        const hungerText = document.getElementById('hunger-percentage');
        const hungerBars = document.querySelectorAll('.flex-1.bg-retro-vine-green, .flex-1.bg-retro-vine-brown');
        const statusText = document.querySelector('.text-[#666]');

        if (hungerText) {
            hungerText.textContent = `${Math.round(hungerPercentage)}%`;
        }

        if (statusText) {
            if (hungerPercentage > 80) {
                statusText.textContent = "Status: Thriving";
            } else if (hungerPercentage > 50) {
                statusText.textContent = "Status: Content";
            } else if (hungerPercentage > 20) {
                statusText.textContent = "Status: Half-Wilted";
            } else {
                statusText.textContent = "Status: Withering";
            }
        }

        if (hungerBars.length > 0) {
            const greenBars = Math.round(hungerPercentage / 10);
            hungerBars.forEach((bar, index) => {
                if (index < greenBars) {
                    bar.classList.add('bg-retro-vine-green');
                    bar.classList.remove('bg-retro-vine-brown', 'opacity-60');
                } else {
                    bar.classList.add('bg-retro-vine-brown', 'opacity-60');
                    bar.classList.remove('bg-retro-vine-green');
                }
            });
        }
    };

    const feedPet = () => {
        const now = Date.now();
        setLastFedTime(now);
        updateHungerDisplay();
    };

    content.addEventListener('click', (e) => {
        if (e.target.closest('#feed-pet-button')) {
            feedPet();
        }
    });

    const nav = document.querySelector('nav');
    nav.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.dataset.screen) {
            loadScreen(button.dataset.screen);
        }
    });

    await initDb();

    // Update hunger every second
    setInterval(updateHungerDisplay, 1000);

    // Load home screen by default
    loadScreen('home');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}