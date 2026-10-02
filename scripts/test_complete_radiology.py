import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_rad1", "Rad2026!")
    time.sleep(2)
    
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Medical Imaging Requests")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Requests" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2.5)
    
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
    
    # Select Study
    study_inp = pane.find_element(By.NAME, "requested_test")
    study_inp.click()
    study_inp.clear()
    study_inp.send_keys("Chest")
    time.sleep(2)
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("Chest" in ddl.text or "X-Ray" in ddl.text or "CXR" in ddl.text):
            print("Clicking study dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Enter comment
    comment_area = pane.find_element(By.NAME, "comment")
    comment_area.click()
    comment_area.clear()
    comment_area.send_keys("PA Chest view. Lungs clear without focal consolidation. Heart size normal. Impression: Normal chest radiograph.")
    time.sleep(1)
    
    # Save
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    driver.execute_script("arguments[0].click();", save_btn)
    time.sleep(3)
    
    msgs = driver.find_elements(By.CSS_SELECTOR, ".user-message, .alert, .notification")
    for m in msgs:
        if m.is_displayed():
            print("Message banner after save:", m.text)
            
    # Click REQUEST button
    req_btn = pane.find_element(By.CSS_SELECTOR, "button[name='requested']")
    print("Clicking REQUEST button...")
    driver.execute_script("arguments[0].click();", req_btn)
    time.sleep(3)
    
    # Confirm modal if any
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed after request:", m.text[:100])
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok']")
            if ok_btns:
                driver.execute_script("arguments[0].click();", ok_btns[0])
                time.sleep(2)
                break
                
    time.sleep(2)
    
    # Check for GENERATE RESULTS button
    gen_btns = pane.find_elements(By.CSS_SELECTOR, "button[name='generate_results']")
    for gb in gen_btns:
        if gb.is_displayed():
            print("Clicking GENERATE RESULTS button...")
            driver.execute_script("arguments[0].click();", gb)
            time.sleep(3)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "10_radiology.png"))
    print("Captured 10_radiology.png successfully!")
    
    state_sel = pane.find_element(By.NAME, "state")
    print("Final Radiology State:", state_sel.get_attribute("value"))
    
except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rad_err.png"))
finally:
    driver.quit()
