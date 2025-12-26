from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the home page
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Take a screenshot of the home page (Pet Canvas)
        page.screenshot(path='verification/home_screen.png')
        print("Home screen screenshot captured.")

        # Navigate to Archive Grid
        page.get_by_role("button", name="Archive").click()
        page.wait_for_timeout(500)
        page.screenshot(path='verification/archive_grid.png')
        print("Archive Grid screenshot captured.")

        # Toggle List View
        page.locator("#view-toggle").click()
        page.wait_for_timeout(500)
        page.screenshot(path='verification/archive_list.png')
        print("Archive List screenshot captured.")

        # Navigate to Closet
        page.get_by_role("button", name="Closet").click()
        page.wait_for_timeout(1000) # Wait for canvas to init
        page.screenshot(path='verification/closet_screen.png')
        print("Closet screenshot captured.")

        # Navigate to Command (Journal)
        # We need to go home first usually, but the nav is persistent.
        # But Command is accessed via 'Feed' button?
        # Actually there is no Feed button visible in nav, it's usually on Home screen?
        # Let's check Home screen for buttons.
        page.get_by_role("button", name="Home").click()
        page.wait_for_timeout(500)
        # We don't have a visible feed button in the App Shell HTML provided,
        # but js/app.js listens for #feed-pet-button.
        # Let's see if it exists in Home HTML.
        # I'll try to find it.
        try:
             # Wait, the Feed button might be part of the loaded home.html content.
             # Let's try to locate it.
             # If not found, I'll skip Command screen screenshot via UI interaction.
             page.screenshot(path='verification/home_again.png')
        except:
             pass

        browser.close()

if __name__ == "__main__":
    verify_frontend()
