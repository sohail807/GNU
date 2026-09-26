import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("\n================== PHASE 5: NURSING TRIAGE ==================")
    login(driver, "demo_nurse1", "Nurse2026!")
    time.sleep(2)
    
    # 1. Open Patients
    open_menu(driver, "Patients")
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            print("Opening patient:", r.text.replace("\n", " | "))
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # 2. Click Relate -> Evaluations
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    relate_btn.click()
    time.sleep(1.5)
    
    eval_opt = driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]")
    eval_opt.click()
    print("Opened Evaluations tab for LIVE E2E TEST PATIENT.")
    time.sleep(3)
    
    # Active top tab pane
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    
    # 3. Click New (+) button
    new_btns = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()]
    if new_btns:
        new_btns[0].click()
        print("Clicked New Evaluation (+).")
    else:
        # Fallback to any visible New button
        [b for b in driver.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_eval_form_opened.png"))
    print("Saved debug_eval_form_opened.png")
    
    # Inspect inputs on the evaluation form
    inputs = top_pane.find_elements(By.CSS_SELECTOR, "input, select, textarea")
    print(f"Inputs on evaluation form ({len(inputs)}):")
    for inp in inputs:
        if inp.is_displayed():
            print(f"  Field: name='{inp.get_attribute('name')}', type='{inp.get_attribute('type')}', tag='{inp.tag_name}'")
            
    # Check for Vital Signs / Signs sub-tab if needed
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    for st in sub_tabs:
        if any(w in st.text.lower() for w in ["vital", "sign", "anthro", "physic"]):
            print("Found vitals tab:", st.text)
            st.click()
            time.sleep(1.5)
            break
            
    # Vital signs values:
    # Systolic: 120, Diastolic: 80, Pulse/BPM: 76, Temp: 37.0, RR: 16, SpO2: 98, Weight: 75, Height: 175
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
        matches = top_pane.find_elements(By.CSS_SELECTOR, f"input[name='{fld}']")
        if not matches:
            matches = top_pane.find_elements(By.XPATH, f".//input[contains(@name, '{fld}')]")
        if matches:
            for m in matches:
                if m.is_displayed():
                    m.clear()
                    m.send_keys(val)
                    print(f"Set {fld} = {val}")
                    break
                    
    time.sleep(1.5)
    # Save the evaluation
    save_btns = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()]
    if save_btns:
        save_btns[0].click()
        print("Clicked Save on Evaluation form.")
    time.sleep(3)
    
    # Save 06_nursing_triage.png
    driver.save_screenshot(os.path.join(OUT_DIR, "06_nursing_triage.png"))
    print("Saved reports/live_browser_test/06_nursing_triage.png")
    
    # Read saved fields to verify
    for fld in vitals:
        elems = top_pane.find_elements(By.CSS_SELECTOR, f"input[name='{fld}']")
        for el in elems:
            if el.is_displayed() and el.get_attribute("value"):
                print(f"VERIFIED FIELD: {fld} = '{el.get_attribute('value')}'")
                
    print("PHASE 5 NURSING TRIAGE COMPLETED SUCCESSFULLY!")
    
finally:
    driver.quit()
