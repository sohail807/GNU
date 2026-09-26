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
    
    # Find all inputs in the table row
    row = pane.find_element(By.CSS_SELECTOR, "tbody tr")
    inputs = row.find_elements(By.CSS_SELECTOR, "input, select")
    print(f"Row has {len(inputs)} inputs:")
    for inp in inputs:
        print("  - name:", inp.get_attribute("name"), "type:", inp.get_attribute("type"), "val:", inp.get_attribute("value"))
        
    # Find medicament input
    med_inp = row.find_element(By.NAME, "medicament")
    med_inp.click()
    med_inp.clear()
    med_inp.send_keys("Amoxicillin")
    time.sleep(1)
    med_inp.send_keys(Keys.TAB)
    time.sleep(1.5)
    print("Entered Amoxicillin in medicament input.")
    
    # Find quantity / units
    qty_inp = row.find_element(By.NAME, "quantity")
    qty_inp.click()
    qty_inp.clear()
    qty_inp.send_keys("15")
    time.sleep(0.5)
    
    # Find dose
    try:
        dose_inp = row.find_element(By.NAME, "dose")
        dose_inp.click()
        dose_inp.clear()
        dose_inp.send_keys("500")
        time.sleep(0.5)
    except Exception as e:
        print("Dose inp error:", e)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_row_filled.png"))
    
    # Click outside row to commit edit (e.g. click notes)
    notes_area = pane.find_element(By.NAME, "notes")
    notes_area.click()
    notes_area.send_keys("Take 1 capsule 3 times daily with water after meals.")
    time.sleep(1.5)
    
    # Click Save
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_saved.png"))
    print("Clicked Save.")
    
    # Check messages / banners
    msgs = driver.find_elements(By.CSS_SELECTOR, ".user-message, .alert, .notification")
    for m in msgs:
        if m.is_displayed():
            print("Message banner:", m.text)

except Exception as e:
    print("Exception:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_err.png"))
finally:
    driver.quit()
