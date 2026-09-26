import os
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
chrome_options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=chrome_options)
try:
    print("Connecting to GNU Health...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    # 1. Login
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys("demo_frontdesk1")
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.send_keys("FrontDesk2026!")
    pwd_inp.send_keys(Keys.ENTER)
    
    # 2. Search Patients
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    search_entry.send_keys("Patients")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Patients" in it.text:
            it.click()
            break
    time.sleep(3)
    
    # 3. Locate patient row
    print("Searching for LIVE E2E TEST PATIENT...")
    rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
    patient_row = None
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            patient_row = r
            print("Found row:", r.text)
            break
            
    if patient_row:
        # Double click or click row
        patient_row.click()
        time.sleep(1)
        # Click Switch to form view button
        switch_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title*='Switch']")
        switch_btn.click()
        time.sleep(2)
    else:
        print("Row not immediately visible in table. Rows count:", len(rows))
        for r in rows:
            print("  Row:", r.text)
            
    screenshot_path = os.path.join(OUT_DIR, "03_patient_created.png")
    driver.save_screenshot(screenshot_path)
    print(f"Captured: {screenshot_path}")
    
    # Read form fields
    for inp in driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active input"):
        nm = inp.get_attribute("name")
        val = inp.get_attribute("value")
        if nm in ["party", "puid", "dob"] and val:
            print(f"  Field {nm} = '{val}'")
            
finally:
    driver.quit()
