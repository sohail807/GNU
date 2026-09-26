import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("PHASE 5: Nursing Triage Workflow")
    print("Step 1: Logging in as Nurse demo_nurse1...")
    login(driver, "demo_nurse1", "Nurse2026!")
    
    print("Step 2: Navigating to Patients...")
    open_menu(driver, "Patients")
    time.sleep(2.5)
    
    print("Step 3: Opening LIVE E2E TEST PATIENT record...")
    pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    print("Step 4: Opening related Evaluations...")
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    relate_btn.click()
    time.sleep(1.5)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]").click()
    time.sleep(3)
    
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    print("Step 5: Clicking New evaluation...")
    [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
    time.sleep(2.5)
    
    print("Step 6: Switching to Clinical tab...")
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    for st in sub_tabs:
        if "clinical" in st.text.lower():
            st.click()
            time.sleep(1.5)
            break
            
    print("Step 7: Entering Vital Signs...")
    vitals = {
        "systolic": "120",
        "diastolic": "80",
        "bpm": "76",
        "temperature": "37.0",
        "respiratory_rate": "16",
        "osat": "98",
        "weight": "75",
        "height": "175",
    }
    for fld, val in vitals.items():
        found = top_pane.find_elements(By.CSS_SELECTOR, f"input[name='{fld}']")
        for f in found:
            if f.is_displayed():
                f.clear()
                f.send_keys(val)
                print(f"  Entered {fld}: {val}")
                break
                
    time.sleep(2)
    
    print("Step 8: Clicking Toolbar Save button...")
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(4)
    
    # Check for any alerts
    banners = driver.find_elements(By.CSS_SELECTOR, ".alert-danger, .alert-warning")
    for b in banners:
        if b.is_displayed():
            print("ALERT BANNER:", b.text)
            
    info_banners = driver.find_elements(By.CSS_SELECTOR, ".alert-info, .alert-success")
    for b in info_banners:
        if b.is_displayed():
            print("STATUS BANNER:", b.text)
            
    # Verify saved record in browser UI
    eval_id = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        if (cur && cur.screen && cur.screen.current_record) {
            return cur.screen.current_record.id;
        }
        return -1;
    ''')
    print(f"Saved Evaluation ID: {eval_id}")
    
    screenshot_path = os.path.join(OUT_DIR, "06_nursing_triage.png")
    driver.save_screenshot(screenshot_path)
    print(f"Captured screenshot: {screenshot_path}")
    
    assert eval_id > 0, "Evaluation record failed to save (id <= 0)"
    print("PHASE 5 NURSING TRIAGE COMPLETED AND VERIFIED 100% SUCCESSFULLY!")

finally:
    driver.quit()
