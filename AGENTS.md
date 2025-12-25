# AGENTS.MD: Pixel Pet Journal Logic & Rules

## 1. PROJECT IDENTITY
- **Name:** Pixel Pet Journal
- **Visual Style:** 8-bit Retro Game, Dark Pastel Palette (Background: #2D2D2D)
- **Architecture:** Local-first PWA. No external cloud backend.
- **Primary Storage:** SQLite (WASM) or IndexedDB for persistent local storage.

## 2. THE PET MAINTENANCE ENGINE (CRITICAL)
- **The Hunger Timer:** The pet has a `hungerLevel` (0 to 100).
- **Depletion Rate:** The pet loses its full hunger over 18 hours. 
- **Calculation:** `currentHunger = Max(0, 100 - ((currentTime - lastFedTime) / 18 hours * 100))`.
- **States:** - `isHungry = true` if `currentHunger < 20`.
  - `isStarving = true` if `currentHunger == 0`.
- **Visual Feedback:** The "Hunger Vine" UI component must reflect this value. If `isHungry`, trigger the "Sad/Weak" state for the pet stage.

## 3. THE JOURNALING & FEEDING MECHANIC
- **Feeding Rule:** The pet is "fed" ONLY when a journal entry is successfully saved.
- **Entry Requirement:** Entries must be at least 50 words to count as a "Full Meal" (resets hunger to 100). Entries under 50 words reset hunger to 50.
- **Timestamping:** Every save operation must update the `lastFedTime` in local storage.

## 4. MOOD MAPPING & DATA SCHEMA
- **Mood Color Constants:**
  - Happy: #F0E68C (Muted Gold)
  - Sad: #5F9EA0 (Muted Indigo)
  - Anxious: #9370DB (Muted Violet)
  - Neutral: #8FBC8F (Muted Sage)
  - Excited: #F08080 (Muted Coral)
- **Database Schema:**
  - `entries` table: `id`, `date` (ISO), `content` (Text), `mood` (String), `accentColor` (Hex).
  - `petState` table: `id`, `lastFedTime` (Timestamp), `currentHat` (String), `unlockedAccessories` (JSON).

## 5. UI & PERSISTENCE RULES
- **Layout:** The "Pet Stage" frame (center of Screen A) must be a persistent component. It does not re-render or move when navigating between the Home and Archive screens.
- **Archive Logic:** Archive must be sorted "Most Recent First." 
- **Calendar Logic:** Date cells in the grid must use the `accentColor` associated with that day's mood.
- **Pixel Perfection:** Use `image-rendering: pixelated;` for all 8-bit assets. All fonts must be monospaced or specific 8-bit pixel fonts.

## 6. SYSTEM BEHAVIOR
- **Offline First:** The app must function entirely without an internet connection.
- **Persistence:** The 18-hour timer must use the system clock. If the user closes the app and re-opens it 10 hours later, the hunger level must accurately reflect 10 hours of depletion.