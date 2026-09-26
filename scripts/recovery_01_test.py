import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

opts = Options()
# Run with window size 1600x1000
opts.add_argument("--window-size=1600,1000")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")

print("Launching Chrome to open http://34.7.237.8/...")
driver = webdriver.Chrome(options=opts)
try:
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 25)
    
    # Wait for login input to appear
    login_inp = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    print("Detected login input field: name='login'")
    
    # Check page title and database selection
    title = driver.title
    print("Page title:", title)
    
    db_elem = driver.find_elements(By.NAME, "database")
    if db_elem:
        print("Database field value:", db_elem[0].get_attribute("value"))
        
    time.sleep(2)
    screenshot_path = os.path.join(OUT_DIR, "recovery_01_login_page.png")
    driver.save_screenshot(screenshot_path)
    print(f"Captured screenshot: {screenshot_path} (size: {os.path.getsize(screenshot_path):,} bytes)")

finally:
    driver.quit()
