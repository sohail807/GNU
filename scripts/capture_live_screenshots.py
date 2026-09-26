import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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
    wait = WebDriverWait(driver, 15)
    
    # Wait for login input
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    print("Submitted username 'admin'")
    
    time.sleep(2)
    # Now find password input
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    print("Submitted password 'Admin12345!'")
    
    # Wait for main application UI
    time.sleep(5)
    driver.save_screenshot("screenshots/02_main_dashboard.png")
    print("Saved screenshots/02_main_dashboard.png")
    
    # Check page content / menus
    print("Current URL:", driver.current_url)
    
except Exception as e:
    print("Error:", e)
    driver.save_screenshot("screenshots/error_state.png")
finally:
    driver.quit()
