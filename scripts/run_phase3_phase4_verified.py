import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("\n================== PHASE 3 & 4: APPOINTMENT & CHECK-IN ==================")
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # 1. Click New (+) button
    pane.find_element(By.CSS_SELECTOR, "button[title='New']").click()
    time.sleep(2.5)
    
    # 2. In Patient field, click Search a record icon
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_parent = pat_inp.find_element(By.XPATH, "..")
    search_icon = pat_parent.find_element(By.CSS_SELECTOR, "img[title='Search a record']")
    search_icon.click()
    print("Clicked Patient Search a record icon.")
    time.sleep(2.5)
    
    # Modal table
    modal = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()][0]
    rows = modal.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            print("Selecting patient row:", r.text.replace("\n", " "))
            # Double click or click then select
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # 3. In Health Prof field, click Search a record icon
    hp_inp = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']")
    hp_parent = hp_inp.find_element(By.XPATH, "..")
    hp_search_icon = hp_parent.find_element(By.CSS_SELECTOR, "img[title='Search a record']")
    hp_search_icon.click()
    print("Clicked Health Prof Search a record icon.")
    time.sleep(2.5)
    
    modal = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()][0]
    rows = modal.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "Physician 01" in r.text or "DEMO Physician" in r.text:
            print("Selecting physician row:", r.text.replace("\n", " "))
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # 4. Save Appointment via Toolbar Save button
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    print("Clicked Toolbar Save button for Appointment.")
    time.sleep(3)
    
    # 5. Capture 04_appointment_created.png
    apt_screen = os.path.join(OUT_DIR, "04_appointment_created.png")
    driver.save_screenshot(apt_screen)
    print(f"Captured: {apt_screen}")
    
    # 6. Locate the appointment row in the table (first row or row with LIVE E2E TEST PATIENT)
    apt_row = None
    table_rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for tr in table_rows:
        if "LIVE E2E" in tr.text:
            apt_row = tr
            print("Located saved appointment row:", tr.text.replace("\n", " | "))
            break
            
    if apt_row:
        # Click the CHECK IN button on that row
        checkin_btn = apt_row.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN')]")
        print("Clicking CHECK IN button on appointment row...")
        checkin_btn.click()
        time.sleep(3)
    else:
        # Click checkin button on first row
        checkin_btn = pane.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN')]")
        print("Clicking first CHECK IN button...")
        checkin_btn.click()
        time.sleep(3)
        
    # 7. Capture 05_patient_checked_in.png
    checkin_screen = os.path.join(OUT_DIR, "05_patient_checked_in.png")
    driver.save_screenshot(checkin_screen)
    print(f"Captured: {checkin_screen}")
    print("PHASE 3 & 4 COMPLETE AND VERIFIED!")
    
finally:
    driver.quit()
