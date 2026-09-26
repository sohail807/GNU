import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # Click "All" tab
    all_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'All')]")
    all_tab.click()
    time.sleep(2.5)
    
    # Find row with LIVE E2E TEST PATIENT
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            print("Found target row:", r.text.replace("\n", " | "))
            btn = r.find_element(By.XPATH, ".//button[contains(text(), 'CHECK IN') or contains(@title, 'Check In')]")
            
            # Try javascript click and action chains click
            print("Triggering real user click on CHECK IN button...")
            ActionChains(driver).move_to_element(btn).click().perform()
            time.sleep(1)
            driver.execute_script("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));", btn)
            print("Dispatched click event.")
            break
            
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "05_patient_checked_in.png"))
    print("Saved 05_patient_checked_in.png")
    
    # Click reload toolbar button to refresh view
    reload_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='Reload']")
    reload_btn.click()
    time.sleep(2.5)
    
    # Check row text after reload
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            print("Row after reload:", r.text.replace("\n", " | "))
            
    # Also check "Checked in" filter tab
    checked_in_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'Checked in')]")
    checked_in_tab.click()
    time.sleep(2)
    driver.save_screenshot(os.path.join(OUT_DIR, "05_patient_checked_in_tab.png"))
    print("Saved 05_patient_checked_in_tab.png")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Checked in tab rows: {len(rows)}")
    for r in rows:
        print("  checked-in row:", r.text.replace("\n", " | "))
finally:
    driver.quit()
