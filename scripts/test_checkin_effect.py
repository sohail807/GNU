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
    
    # Click the first one
    if checkin_btns:
        print("Clicking Check In button for row 1...")
        checkin_btns[0].click()
        time.sleep(2)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_after_checkin_clicked.png"))
    print("Saved debug_after_checkin_clicked.png")
    
    # Check if any modal or dialog is open
    modals = driver.find_elements(By.CLASS_NAME, "modal")
    for m in modals:
        if m.is_displayed():
            print("Modal open:", m.text)
            # If there's an OK or Confirm button in modal:
            for b in m.find_elements(By.TAG_NAME, "button"):
                print("  modal button:", b.text)
                
    time.sleep(2)
    # Check all filter tabs: All, Confirmed, Checked in
    tabs = pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs li, .nav-tabs a")
    for t in tabs:
        print("Tab:", t.text)
        
    # Click "All" tab to see all appointments
    all_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'All')]")
    all_tab.click()
    time.sleep(2)
    driver.save_screenshot(os.path.join(OUT_DIR, "05_patient_checked_in.png"))
    print("Saved 05_patient_checked_in.png under All tab")
    
finally:
    driver.quit()
