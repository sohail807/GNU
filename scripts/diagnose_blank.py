import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1600,1050")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    
    driver = webdriver.Chrome(options=opts)
    try:
        url = "http://34.7.237.8/"
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(3)
        
        print(f"Final URL: {driver.current_url}")
        print(f"Title: {driver.title}")
        
        # Save screenshot
        os.makedirs("screenshots/diagnose", exist_ok=True)
        screenshot_path = os.path.abspath("screenshots/diagnose/live_server_screen.png")
        driver.save_screenshot(screenshot_path)
        print(f"Saved screenshot: {screenshot_path}")
        
        # Browser logs
        print("\n--- BROWSER CONSOLE LOGS ---")
        logs = driver.get_log("browser")
        for log in logs:
            print(f"[{log.get('level')}] {log.get('message')}")
        if not logs:
            print("No console logs captured.")
            
        # Check body innerHTML length and preview
        body = driver.find_element(By.TAG_NAME, "body")
        print(f"\nBody innerHTML length: {len(body.get_attribute('innerHTML'))}")
        print("Body text content:\n" + body.text[:500])
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
