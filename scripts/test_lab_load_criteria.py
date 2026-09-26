import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_lab1", "Lab2026!")
    time.sleep(2)
    
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Lab Results")
    time.sleep(1.5)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    
    pane = get_active_pane(driver)
    
    # Click New
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Select Patient
    patient_inp = pane.find_element(By.NAME, "patient")
    patient_inp.click()
    patient_inp.clear()
    patient_inp.send_keys("LIVE E2E")
    time.sleep(2)
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("LIVE" in ddl.text or "PATIENT" in ddl.text):
            print("Clicking patient dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Select Test Type
    test_inp = pane.find_element(By.NAME, "test")
    test_inp.click()
    test_inp.clear()
    test_inp.send_keys("COMPLETE BLOOD")
    time.sleep(2)
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("COMPLETE" in ddl.text or "BLOOD" in ddl.text or "CBC" in ddl.text):
            print("Clicking test dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Select Requestor (Health Prof)
    hp_inp = pane.find_element(By.NAME, "requestor")
    hp_inp.click()
    hp_inp.clear()
    hp_inp.send_keys("DEMO")
    time.sleep(2)
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("Physician" in ddl.text):
            print("Clicking requestor dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Click LOAD ANALYTES CRITERIA button
    load_btn = pane.find_element(By.CSS_SELECTOR, "button[name='complete_criteareas']")
    print("Clicking LOAD ANALYTES CRITERIA...")
    load_btn.click()
    time.sleep(2)
    
    # Click OK on modal
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal text:", m.text[:100])
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok'], button.btn-default")
            for b in ok_btns:
                if b.text.strip().upper() == "OK":
                    print("Found OK button, clicking...")
                    driver.execute_script("arguments[0].click();", b)
                    break
            time.sleep(2)
            break
            
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_lab_criteria_loaded.png"))
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Table now has {len(rows)} rows.")
    for idx, r in enumerate(rows):
        print(f"Row {idx}: {r.text}")

finally:
    driver.quit()
