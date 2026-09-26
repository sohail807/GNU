import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = os.path.join("reports", "live_browser_test")

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1600,1000")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=opts)
try:
    print("Navigating to http://34.7.237.8/ ...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    # 1. Login
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys("demo_frontdesk1")
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2.5)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys("FrontDesk2026!")
    pwd_inp.send_keys(Keys.ENTER)
    
    # 2. Open Appointments
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    search_entry.send_keys("Appointments")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Appointments" in it.text:
            it.click()
            break
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # 3. Click New (+) button
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # 4. Find the patient cell in the active table row
    # In the editable row, look for the search button (magnifying glass) for patient
    search_btns = pane.find_elements(By.XPATH, ".//button[contains(@class, 'btn') and .//*[contains(@class, 'search') or contains(@class, 'glyphicon-search')]] | .//span[contains(@class, 'glyphicon-search')]/parent::button")
    print(f"Found {len(search_btns)} search buttons in row")
    
    # Alternatively, type into patient input and wait for typeahead
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys("LIVE E2E")
    time.sleep(2.5)
    
    # Take screenshot of typeahead dropdown
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_apt_typeahead.png"))
    print("Saved debug_apt_typeahead.png")
    
    # Check all dropdown elements
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    print(f"Total dropdown links: {len(dd_links)}")
    for ddl in dd_links:
        if ddl.is_displayed():
            print("  Visible dropdown item:", repr(ddl.text))
            if "LIVE" in ddl.text or "PATIENT" in ddl.text:
                ddl.click()
                print("Clicked patient dropdown item:", ddl.text)
                break
                
    time.sleep(1.5)
    # Check healthprof input
    hp_inp = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']")
    hp_inp.click()
    hp_inp.send_keys("DEMO")
    time.sleep(2.5)
    
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("Physician 01" in ddl.text or "Physician" in ddl.text):
            ddl.click()
            print("Clicked healthprof dropdown item:", ddl.text)
            break
            
    time.sleep(1.5)
    # Click Save button on toolbar
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "04_appointment_created.png"))
    print("Saved 04_appointment_created.png")
    
    # Now click CHECK IN
    checkin_btn = pane.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN') or contains(text(), 'Check In')]")
    checkin_btn.click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "05_patient_checked_in.png"))
    print("Saved 05_patient_checked_in.png")
    
finally:
    driver.quit()
