import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_nurse1", "Nurse2026!")
    time.sleep(2)
    
    # 1. Open Patients
    open_menu(driver, "Patients")
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # Locate LIVE E2E TEST PATIENT
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Patients rows ({len(rows)}):")
    target_row = None
    for r in rows:
        if "LIVE E2E" in r.text:
            target_row = r
            print("Found patient row:", r.text.replace("\n", " | "))
            break
            
    if target_row:
        # Double click to open patient form
        from selenium.webdriver.common.action_chains import ActionChains
        ActionChains(driver).double_click(target_row).perform()
        time.sleep(3)
        
        # Check toolbar Relate / Actions menu
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_nurse_patient_form.png"))
        print("Saved debug_nurse_patient_form.png")
        
        # Inspect Relate menu (Open related records)
        relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
        relate_btn.click()
        time.sleep(1.5)
        
        relate_items = driver.find_elements(By.CSS_SELECTOR, ".dropdown-menu li a")
        print(f"Related records options ({len(relate_items)}):")
        for ri in relate_items:
            if ri.is_displayed():
                print("  relate:", ri.text)
                
finally:
    driver.quit()
