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
    load_btn.click()
    time.sleep(2)
    
    # Click OK on confirmation modal
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok'], button.btn-default")
            for b in ok_btns:
                if b.text.strip().upper() == "OK":
                    driver.execute_script("arguments[0].click();", b)
                    break
            time.sleep(2)
            break
            
    time.sleep(2)
    
    # Open HGB row
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    if rows:
        print("Selecting HGB row...")
        rows[0].click()
        time.sleep(1)
        
        open_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='Open']")
        if open_btns:
            print("Clicking Open button on table toolbar...")
            open_btns[0].click()
            time.sleep(2)
            
            # Find result input
            res_inps = driver.find_elements(By.CSS_SELECTOR, ".modal.in input[name='result'], div.modal input[name='result']")
            for inp in res_inps:
                print("Setting result value 14.1...")
                driver.execute_script("""
                    arguments[0].value = '14.1';
                    $(arguments[0]).val('14.1').trigger('change').trigger('input');
                """, inp)
            time.sleep(1)
            
            # Click APPLY CHANGES
            apply_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'APPLY CHANGES') or contains(text(), 'Apply Changes')]")
            for ab in apply_btns:
                if ab.is_displayed():
                    driver.execute_script("arguments[0].click();", ab)
                    break
            time.sleep(2.5)
            
    # Click Save on top toolbar
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    driver.execute_script("arguments[0].click();", save_btn)
    time.sleep(3)
    
    # Click DONE button
    done_btn = pane.find_element(By.CSS_SELECTOR, "button[name='generate_document']")
    print("Clicking DONE action button...")
    driver.execute_script("arguments[0].click();", done_btn)
    time.sleep(2.5)
    
    # Confirm "Are the results ready ?" modal
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed() and "ready" in m.text.lower():
            print("Found 'Are the results ready ?' modal, clicking OK...")
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok'], button.btn-default")
            for b in ok_btns:
                if b.text.strip().upper() == "OK":
                    driver.execute_script("arguments[0].click();", b)
                    break
            time.sleep(2)
            break
            
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "09_laboratory.png"))
    print("Captured 09_laboratory.png successfully!")
    
    state_sel = pane.find_element(By.NAME, "state")
    print("Final Lab State:", state_sel.get_attribute("value"))

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_lab_err5.png"))
finally:
    driver.quit()
