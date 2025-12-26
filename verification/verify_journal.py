from playwright.sync_api import sync_playwright

def verify_journaling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to home
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Navigate to Journal (assuming #feed-pet-button or manually)
        # Since I can't find feed button easily, I'll execute JS to load screen 'command'
        # But `renderer.loadScreen` is internal.
        # I can try finding the nav button if it existed, or just "click" the feed button if visible.
        # Let's inspect home.html content for feed button.
        # It's likely hidden or I missed it.
        # But wait, app.js listens for #feed-pet-button.

        # HACK: Inject JS to trigger loadScreen
        # page.evaluate("window.pixelPetApp.renderer.loadScreen('command', (s) => window.pixelPetApp.onScreenLoaded(s))")
        # This requires window.pixelPetApp to be exposed. I did expose it in my app.js update!

        page.evaluate("window.pixelPetApp.navigateToJournal()")
        page.wait_for_timeout(500)

        # Check Mood Tiles visible
        page.screenshot(path='verification/journal_screen.png')
        print("Journal screen screenshot captured.")

        # Click a mood button (e.g. SAD - 2nd button)
        sad_btn = page.locator('.mood-selector-button[data-mood="SAD"]')
        sad_btn.click()
        page.wait_for_timeout(300)

        # Screenshot with SAD border
        page.screenshot(path='verification/journal_sad.png')
        print("Journal SAD border screenshot captured.")

        browser.close()

if __name__ == "__main__":
    verify_journaling()
