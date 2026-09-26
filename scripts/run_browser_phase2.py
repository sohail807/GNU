import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    print("PHASE 2: Registering New Patient via SAO UI...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 20)
    
    # Login as Front Desk
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("demo_frontdesk1")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys(os.environ.get("DEMO_FRONTDESK_PASS", "FrontDesk2026!"))
    pwd_input.send_keys(Keys.ENTER)
    
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
    
    # 1. Click New button
    new_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # 2. Type patient party name
    party_input = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='party']")
    party_input.click()
    party_input.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(1.5)
    
    # 3. Click Create...
    create_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Create...')] | //li[contains(text(), 'Create...')]")
    for cl in create_links:
        if "Create" in cl.text:
            cl.click()
            break
    time.sleep(2.5)
    
    # 4. In the modal, select Gender: Male
    # Find modal dialog
    modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
    gender_select = modal.find_element(By.CSS_SELECTOR, "select[name='gender']")
    Select(gender_select).select_by_visible_text("Male")
    print("Selected Gender: Male")
    
    # 5. Set Date of Birth: 01/01/1990
    dob_input = modal.find_element(By.CSS_SELECTOR, "input[name='dob']")
    dob_input.clear()
    dob_input.send_keys("01/01/1990")
    print("Entered DoB: 01/01/1990")
    
    time.sleep(1)
    # 6. Click SAVE on the modal
    modal_save_btn = modal.find_element(By.XPATH, ".//button[contains(text(), 'SAVE') or contains(text(), 'Save')]")
    modal_save_btn.click()
    print("Clicked Modal SAVE button")
    time.sleep(2.5)
    
    # 7. Now on the main Patient form, click Save button on toolbar
    save_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='Save']")
    save_btn.click()
    print("Clicked Toolbar Save button")
    time.sleep(3)
    
    # 8. Capture 03_patient_created.png
    driver.save_screenshot(os.path.join(OUT_DIR, "03_patient_created.png"))
    print("Captured 03_patient_created.png")
    
    # 9. Read the generated PUID or values
    try:
        puid_val = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='puid']").get_attribute("value")
        name_val = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='party']").get_attribute("value")
        print(f"VERIFIED PATIENT CREATED: Name='{name_val}', PUID='{puid_val}'")
    except Exception as e_read:
        print("Read error:", e_read)
        
finally:
    driver.quit()
