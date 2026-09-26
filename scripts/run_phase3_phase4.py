import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, open_menu, click_new, click_save, OUT_DIR

driver = create_driver()
try:
    # Login Front Desk
    frontdesk_pass = os.environ.get("DEMO_FRONTDESK_PASS", "FrontDesk2026!")
    login(driver, "demo_frontdesk1", frontdesk_pass)
    
    # Open Appointments
    open_menu(driver, "Appointments")
    
    # Click New Appointment
    click_new(driver)
    time.sleep(2)
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # Save screenshot of empty appointment form to inspect
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_apt_form.png"))
    print("Saved debug_apt_form.png")
    
    # Print all inputs in the form
    inputs = pane.find_elements(By.CSS_SELECTOR, "input, select")
    print(f"Appointment form inputs ({len(inputs)}):")
    for inp in inputs:
        print(f"  Field name='{inp.get_attribute('name')}', type='{inp.get_attribute('type')}', tag='{inp.tag_name}', displayed={inp.is_displayed()}")

    # 1. Fill Patient: LIVE E2E TEST PATIENT
    patient_input = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    patient_input.click()
    patient_input.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(2)
    # Select from dropdown
    dropdown_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for ddi in dropdown_items:
        if "LIVE E2E TEST PATIENT" in ddi.text:
            ddi.click()
            print("Selected patient from dropdown:", ddi.text)
            break
    time.sleep(1)
    
    # 2. Fill Health Professional: Dr. DEMO Physician 01
    hp_input = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']")
    hp_input.click()
    hp_input.send_keys("DEMO")
    time.sleep(2)
    dropdown_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for ddi in dropdown_items:
        if "Physician 01" in ddi.text or "Physician" in ddi.text:
            ddi.click()
            print("Selected healthprof from dropdown:", ddi.text)
            break
    time.sleep(1)
    
    # 3. Save Appointment
    click_save(driver)
    time.sleep(3)
    
    # Capture 04_appointment_created.png
    apt_screen = os.path.join(OUT_DIR, "04_appointment_created.png")
    driver.save_screenshot(apt_screen)
    print(f"Captured: {apt_screen}")
    
    # Read appointment ID / number and state
    try:
        apt_num = pane.find_element(By.CSS_SELECTOR, "input[name='name']").get_attribute("value")
        print("Appointment Number/ID:", apt_num)
    except Exception as e:
        print("Could not read appointment number:", e)
        
    try:
        state_val = pane.find_element(By.CSS_SELECTOR, "input[name='state'], select[name='state']").get_attribute("value")
        print("Initial Appointment State:", state_val)
    except Exception as e:
        print("Could not read appointment state:", e)
        
    # PHASE 4: CHECK-IN
    print("\n--- PHASE 4: CHECK-IN ---")
    # Find CHECK IN button on form or toolbar
    checkin_btn = None
    btns = pane.find_elements(By.XPATH, ".//button[contains(text(), 'CHECK IN') or contains(text(), 'Check In') or contains(@title, 'Check In')]")
    if btns:
        checkin_btn = btns[0]
    else:
        # Check toolbar or all buttons
        btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'CHECK IN') or contains(text(), 'Check In')]")
        if btns:
            checkin_btn = btns[0]
            
    if checkin_btn:
        print("Clicking CHECK IN button:", checkin_btn.text)
        checkin_btn.click()
        time.sleep(3)
        
        # Capture 05_patient_checked_in.png
        checkin_screen = os.path.join(OUT_DIR, "05_patient_checked_in.png")
        driver.save_screenshot(checkin_screen)
        print(f"Captured: {checkin_screen}")
        
        try:
            state_after = pane.find_element(By.CSS_SELECTOR, "input[name='state'], select[name='state']").get_attribute("value")
            print("Appointment State After Check-In:", state_after)
        except Exception:
            pass
    else:
        print("WARNING: CHECK IN button not found on form! Inspecting buttons...")
        for b in pane.find_elements(By.TAG_NAME, "button"):
            print("  btn:", b.text, b.get_attribute("title"))
            
finally:
    driver.quit()
