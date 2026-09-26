import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    
    # Open Prescriptions
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    
    pane = get_active_pane(driver)
    
    # Click New (+) on top toolbar
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Select Patient via Typeahead dropdown
    patient_inp = pane.find_element(By.NAME, "patient")
    patient_inp.click()
    patient_inp.clear()
    patient_inp.send_keys("LIVE E2E")
    time.sleep(2.5)
    
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("LIVE" in ddl.text or "PATIENT" in ddl.text):
            print("Clicking patient dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Check Safety Verified checkbox (prescription_warning_ack)
    ack_cb = pane.find_element(By.NAME, "prescription_warning_ack")
    if not ack_cb.is_selected():
        ack_cb.click()
        print("Checked Safety Verified (prescription_warning_ack).")
    time.sleep(1)
    
    # Click New on line toolbar
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    line_new_btns[1].click()
    time.sleep(2)
    
    row = pane.find_element(By.CSS_SELECTOR, "tbody tr")
    
    # Medicament autocomplete
    med_inp = row.find_element(By.NAME, "medicament")
    med_inp.click()
    med_inp.clear()
    med_inp.send_keys("Amoxicillin")
    time.sleep(2)
    
    # Click dropdown item for Amoxicillin
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and "Amoxicillin" in ddl.text:
            print("Clicking medicament dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Fill Notes
    notes_area = pane.find_element(By.NAME, "notes")
    notes_area.click()
    notes_area.clear()
    notes_area.send_keys("Amoxicillin 500mg: Take 1 capsule three times daily for 5 days with water after meals.")
    time.sleep(1)
    
    # Save
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    time.sleep(3)
    
    # Check for any warning/error dialogs and click OK
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed after save:", m.text[:100])
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok'], button.btn-default")
            if ok_btns:
                driver.execute_script("arguments[0].click();", ok_btns[0])
                print("Dismissed modal after save.")
                time.sleep(2)
                break
                
    time.sleep(2)
    
    # Click CREATE button
    create_btn = pane.find_element(By.CSS_SELECTOR, "button[name='create_prescription']")
    print("Clicking CREATE button...")
    driver.execute_script("arguments[0].click();", create_btn)
    time.sleep(2)
    
    # Confirm modal if any
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed after CREATE:", m.text[:100])
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok']")
            if ok_btns:
                driver.execute_script("arguments[0].click();", ok_btns[0])
                print("Clicked OK on confirmation modal.")
                time.sleep(2)
                break
                
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "08_prescription.png"))
    print("Captured 08_prescription.png successfully!")
    
    # Print state
    state_sel = pane.find_element(By.NAME, "state")
    print("Final Prescription State:", state_sel.get_attribute("value"))
    
except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rx_error_final2.png"))
finally:
    driver.quit()
