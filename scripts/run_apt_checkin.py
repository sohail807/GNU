import os
import sys
import time
sys.path.append(os.path.join(os.path.dirname(__file__)))
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    
    # 1. Click New (+) button
    time.sleep(2)
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # 2. In the new row, find the magnifying glass button for Patient
    # The patient cell has an input and a search button
    pat_cell = pane.find_element(By.CSS_SELECTOR, "input[name='patient']").find_element(By.XPATH, "..")
    search_icon_btn = pat_cell.find_element(By.TAG_NAME, "button")
    search_icon_btn.click()
    print("Clicked Patient search magnifying glass button.")
    time.sleep(2.5)
    
    # Modal should appear
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_apt_search_modal.png"))
    print("Saved debug_apt_search_modal.png")
    
    # In modal, search for LIVE E2E
    modals = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()]
    if modals:
        modal = modals[0]
        print("Found search modal:", modal.find_element(By.CLASS_NAME, "modal-title").text if modal.find_elements(By.CLASS_NAME, "modal-title") else "modal")
        # Find rows in modal table
        m_rows = modal.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"Modal rows: {len(m_rows)}")
        clicked_patient = False
        for mr in m_rows:
            if "LIVE E2E" in mr.text:
                mr.click()
                clicked_patient = True
                print("Clicked patient row in modal:", mr.text)
                break
        if clicked_patient:
            # Click Select / OK button in modal
            select_btn = modal.find_element(By.XPATH, ".//button[contains(text(), 'Select') or contains(text(), 'OK') or contains(@class, 'btn-primary')]")
            select_btn.click()
            print("Selected patient in modal.")
            time.sleep(2)
            
    # 3. In Health Prof, select Dr. DEMO Physician 01
    hp_cell = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']").find_element(By.XPATH, "..")
    hp_search_btn = hp_cell.find_element(By.TAG_NAME, "button")
    hp_search_btn.click()
    time.sleep(2)
    
    modals = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()]
    if modals:
        modal = modals[0]
        m_rows = modal.find_elements(By.CSS_SELECTOR, "table tbody tr")
        for mr in m_rows:
            if "Physician 01" in mr.text:
                mr.click()
                print("Clicked physician row in modal:", mr.text)
                break
        select_btn = modal.find_element(By.XPATH, ".//button[contains(text(), 'Select') or contains(text(), 'OK') or contains(@class, 'btn-primary')]")
        select_btn.click()
        print("Selected physician in modal.")
        time.sleep(2)
        
    # 4. Save Appointment via Toolbar Save button
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    print("Clicked Toolbar Save button for Appointment.")
    time.sleep(3)
    
    # 5. Capture 04_appointment_created.png
    apt_screen = os.path.join(OUT_DIR, "04_appointment_created.png")
    driver.save_screenshot(apt_screen)
    print(f"Captured: {apt_screen}")
    
    # 6. Click CHECK IN button on the appointment row
    checkin_btn = pane.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN')]")
    checkin_btn.click()
    print("Clicked CHECK IN button on Appointment.")
    time.sleep(3)
    
    # 7. Capture 05_patient_checked_in.png
    checkin_screen = os.path.join(OUT_DIR, "05_patient_checked_in.png")
    driver.save_screenshot(checkin_screen)
    print(f"Captured: {checkin_screen}")
    
finally:
    driver.quit()
