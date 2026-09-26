import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # Locate all Check In buttons
    checkin_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='Check In']")
    print(f"Found {len(checkin_btns)} Check In buttons")
    
    # The first row is our newly created appointment for LIVE E2E TEST PATIENT
    if checkin_btns:
        print("Clicking Check In button for LIVE E2E TEST PATIENT...")
        checkin_btns[0].click()
        time.sleep(3)
        
    # Check for confirmation dialog or message
    time.sleep(2)
    
    # Click "Checked in" filter tab to view the checked in appointments
    checked_in_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'Checked in') or contains(text(), 'Checked In')] | .//li[contains(., 'Checked in')]")
    checked_in_tab.click()
    print("Clicked 'Checked in' filter tab.")
    time.sleep(3)
    
    # Save 05_patient_checked_in.png
    checkin_screen = os.path.join(OUT_DIR, "05_patient_checked_in.png")
    driver.save_screenshot(checkin_screen)
    print(f"Captured: {checkin_screen}")
    
    # Verify LIVE E2E TEST PATIENT is in the checked in list
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Checked in rows ({len(rows)}):")
    for r in rows:
        print("  checked-in row:", r.text.replace("\n", " | "))
        
finally:
    driver.quit()
