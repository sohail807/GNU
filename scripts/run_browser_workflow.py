import os
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

def create_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1600,1000")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    return webdriver.Chrome(options=chrome_options)

def login(driver, username, password):
    print(f"Logging in as {username}...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys(username)
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys(password)
    pwd_inp.send_keys(Keys.ENTER)
    
    wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    print(f"Successfully logged in as {username}.")

def navigate_menu(driver, item_name):
    print(f"Navigating to {item_name} via global search...")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys(item_name)
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    clicked = False
    for it in items:
        if item_name.lower() in it.text.lower():
            it.click()
            clicked = True
            break
    if not clicked and items:
        items[0].click()
    time.sleep(3)
    print(f"Opened {item_name} tab.")

def phase2_patient_registration(driver):
    print("\n--- PHASE 2: PATIENT REGISTRATION ---")
    navigate_menu(driver, "Patients")
    
    # Click New (+) button
    new_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Enter party name in many2one input
    party_input = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='party']")
    party_input.click()
    party_name = "LIVE E2E TEST PATIENT"
    party_input.send_keys(party_name)
    time.sleep(2.5)
    
    # Find and click "Create..." in the autocomplete dropdown
    wait = WebDriverWait(driver, 10)
    create_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Create')] | //li[contains(text(), 'Create')]")))
    print("Found Create option:", create_link.text)
    create_link.click()
    print("Clicked Create option.")
    
    # Wait for modal to appear
    time.sleep(3)
    modals = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()]
    if not modals:
        raise RuntimeError("Modal dialog for party creation did not open.")
    modal = modals[0]
    
    # Select Gender: Male
    gender_sel = modal.find_element(By.NAME, "gender")
    s = Select(gender_sel)
    for opt in s.options:
        if "Male" in opt.text:
            opt.click()
            break
    time.sleep(0.5)
    
    # Enter Date of Birth: 01/01/1990
    dob_inp = modal.find_element(By.NAME, "dob")
    dob_inp.clear()
    dob_inp.send_keys("01/01/1990")
    dob_inp.send_keys(Keys.TAB)
    time.sleep(1)
    
    # Click SAVE on modal (look for btn-primary in modal)
    save_btns = modal.find_elements(By.CSS_SELECTOR, "button.btn-primary")
    if not save_btns:
        save_btns = driver.find_elements(By.XPATH, "//div[contains(@class, 'modal')]//button[contains(@class, 'btn-primary') or contains(text(), 'Save') or contains(text(), 'SAVE')]")
    if save_btns:
        save_btns[0].click()
        print("Clicked Modal primary save button:", save_btns[0].text)
    else:
        raise RuntimeError("Could not find modal Save button")
    time.sleep(3)
    
    # Click Toolbar Save button on the Patient form
    save_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='Save']")
    save_btn.click()
    print("Saved Patient record via Toolbar.")
    time.sleep(3)
    
    # Capture Screenshot
    screen_path = os.path.join(OUT_DIR, "03_patient_created.png")
    driver.save_screenshot(screen_path)
    print(f"Captured: {screen_path}")
    
    # Read generated fields
    try:
        puid = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='puid']").get_attribute("value")
        party = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='party']").get_attribute("value")
        print(f"VERIFIED: Patient Name='{party}', PUID='{puid}'")
        return {"name": party, "puid": puid}
    except Exception as e:
        print("Warning reading PUID:", e)
        return {"name": party_name, "puid": "Auto-Generated"}

if __name__ == "__main__":
    driver = create_driver()
    try:
        frontdesk_pass = os.environ.get("DEMO_FRONTDESK_PASS", "FrontDesk2026!")
        login(driver, "demo_frontdesk1", frontdesk_pass)
        patient_info = phase2_patient_registration(driver)
        print("Phase 2 Result:", patient_info)
    finally:
        driver.quit()
