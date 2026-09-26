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
    
    # 1. Click "All" tab to see all rows including State column
    all_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'All')]")
    all_tab.click()
    time.sleep(2.5)
    
    # 2. Find row with LIVE E2E TEST PATIENT
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Total rows in All: {len(rows)}")
    clicked = False
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            print("Found target row:", r.text.replace("\n", " | "))
            btn = r.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN') or contains(@title, 'Check In')]")
            btn.click()
            print("Clicked CHECK IN button for LIVE E2E TEST PATIENT!")
            clicked = True
            break
            
    time.sleep(3)
    
    # 3. Check for any popup/modal or refresh
    driver.save_screenshot(os.path.join(OUT_DIR, "05_patient_checked_in.png"))
    print("Saved 05_patient_checked_in.png")
    
    # 4. Check resulting state
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            print("Row after checkin:", r.text.replace("\n", " | "))
            
finally:
    driver.quit()
