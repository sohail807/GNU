import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

os.makedirs("screenshots", exist_ok=True)

driver = webdriver.Chrome(options=chrome_options)
try:
    print("Navigating to http://34.7.237.8/ ...")
    driver.get("http://34.7.237.8/")
    time.sleep(3)
    
    driver.save_screenshot("screenshots/01_login_dialog.png")
    print("Saved screenshots/01_login_dialog.png")
    
    # Check page title and content
    print("Page Title:", driver.title)
    
    # Try to find login fields
    # Tryton SAO login fields:
    # Look for inputs
    inputs = driver.find_elements(By.TAG_NAME, "input")
    print(f"Found {len(inputs)} inputs:")
    for inp in inputs:
        print("  input:", inp.get_attribute("name"), inp.get_attribute("type"), inp.get_attribute("id"), inp.get_attribute("class"))
        
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
