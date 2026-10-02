import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    print("PHASE 1: Navigating to http://34.7.237.8/ ...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 20)
    
    # Wait for login modal
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    time.sleep(1)
    
    # 01_login.png
    driver.save_screenshot(os.path.join(OUT_DIR, "01_login.png"))
    print("Captured 01_login.png")
    
    # Log in as Front Desk
    username = os.environ.get("DEMO_FRONTDESK_USER", "demo_frontdesk1")
    password = os.environ.get("DEMO_FRONTDESK_PASS")
    
    login_input.clear()
    login_input.send_keys(username)
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys(password)
    pwd_input.send_keys(Keys.ENTER)
    
    # Wait for dashboard
    wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(3)
    
    # 02_dashboard.png
    driver.save_screenshot(os.path.join(OUT_DIR, "02_dashboard.png"))
    print("Captured 02_dashboard.png")
    print("Logged in successfully as:", username)
    
finally:
    driver.quit()
