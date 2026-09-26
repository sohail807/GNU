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
    
    # Select Patient
    patient_inp = pane.find_element(By.NAME, "patient")
    patient_inp.click()
    patient_inp.clear()
    patient_inp.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(1)
    patient_inp.send_keys(Keys.TAB)
    time.sleep(1.5)
    print("Patient selected.")
    
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
    time.sleep(1.5)
    
    # Click dropdown item
    dropdown_items = driver.find_elements(By.CSS_SELECTOR, "ul.ui-autocomplete li a, .dropdown-menu li a")
    for it in dropdown_items:
        if "Amoxicillin" in it.text:
            print("Clicking dropdown item:", it.text)
            driver.execute_script("arguments[0].click();", it)
            break
    time.sleep(2)
    
    # Notes
    notes_area = pane.find_element(By.NAME, "notes")
    notes_area.click()
    notes_area.clear()
    notes_area.send_keys("Take 1 capsule (500mg) every 8 hours with meals for 5 days.")
    time.sleep(1)
    
    # Save
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rx_saved_ok.png"))
    print("Saved prescription.")
    
    # Check messages / banners
    msgs = driver.find_elements(By.CSS_SELECTOR, ".user-message, .alert, .notification")
    for m in msgs:
        if m.is_displayed():
            print("Message banner:", m.text)
            
    # Click CREATE button
    create_btn = pane.find_element(By.CSS_SELECTOR, "button[name='create_prescription']")
    print("Clicking CREATE button...")
    create_btn.click()
    time.sleep(2)
    
    # Handle confirmation dialog
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed:", m.text[:100])
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
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rx_err3.png"))
finally:
    driver.quit()
