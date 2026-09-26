import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver import ActionChains
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Patients")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if it.text == "Health / Patients / Patients" or "Patients / Patients" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    
    # Locate patient "LIVE E2E TEST PATIENT"
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} patients.")
    target_row = None
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text or "KQI816APL" in r.text:
            target_row = r
            print("Found target patient row:", r.text)
            break
            
    if target_row:
        cells = target_row.find_elements(By.TAG_NAME, "td")
        cells[1].click()
        time.sleep(1)
        # Switch to form view
        switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Switch']")
        switch_btn.click()
        time.sleep(3)
        print("Switched to Patient form view.")
        
    # Inspect "Open related records" dropdown button
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Open related records']")
    print("Found relate button! Clicking...")
    relate_btn.click()
    time.sleep(1.5)
    
    # Get dropdown menu items
    rel_menu = pane.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a, .dropdown.open ul.dropdown-menu li a")
    print(f"Found {len(rel_menu)} relate menu items:")
    for m in rel_menu:
        if m.text:
            print(f"  - {m.text}")
            
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_patient_relate_menu.png"))
    print("Saved debug_patient_relate_menu.png")

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_relate_err.png"))
finally:
    driver.quit()
