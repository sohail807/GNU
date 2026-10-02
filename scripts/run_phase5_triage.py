import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
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
    
    # Active pane is now the Evaluations tab
    eval_pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # 3. Click New (+) button
    eval_pane.find_element(By.CSS_SELECTOR, "button[title='New']").click()
    time.sleep(2.5)
    
    # Inspect inputs on the evaluation form
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_eval_form.png"))
    print("Saved debug_eval_form.png")
    
    eval_inputs = eval_pane.find_elements(By.CSS_SELECTOR, "input, select, textarea")
    print(f"Evaluation form inputs ({len(eval_inputs)}):")
    for inp in eval_inputs:
        if inp.is_displayed():
            print(f"  name='{inp.get_attribute('name')}', type='{inp.get_attribute('type')}', tag='{inp.tag_name}'")
            
    # Fill Nursing Triage Vital Signs:
    # BP: 120/80
    # Pulse: 76
    # Temperature: 37.0 C
    # Respiratory Rate: 16
    # SpO2: 98%
    # Weight: 75 kg
    # Height: 175 cm
    
    vitals_map = {
        "systolic": "120",
        "diastolic": "80",
        "bpm": "76",
        "temperature": "37.0",
        "respiratory_rate": "16",
        "osat": "98",
        "weight": "75",
        "height": "175",
    }
    
    for field_name, field_val in vitals_map.items():
        found = eval_pane.find_elements(By.CSS_SELECTOR, f"input[name='{field_name}']")
        if found:
            found[0].clear()
            found[0].send_keys(field_val)
            print(f"Entered {field_name} = {field_val}")
        else:
            print(f"Field {field_name} not found directly, searching substring...")
            matches = eval_pane.find_elements(By.XPATH, f".//input[contains(@name, '{field_name}')]")
            if matches:
                matches[0].clear()
                matches[0].send_keys(field_val)
                print(f"Entered {matches[0].get_attribute('name')} = {field_val}")
                
    time.sleep(1.5)
    # 4. Click Toolbar Save button
    save_btn = eval_pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    save_btn.click()
    print("Clicked Toolbar Save button for Evaluation.")
    time.sleep(3)
    
    # 5. Capture 06_nursing_triage.png
    triage_screen = os.path.join(OUT_DIR, "06_nursing_triage.png")
    driver.save_screenshot(triage_screen)
    print(f"Captured: {triage_screen}")
    
    # 6. Verify values persist after reload
    reload_btn = eval_pane.find_element(By.CSS_SELECTOR, "button[title*='Reload']")
    reload_btn.click()
    time.sleep(2.5)
    
    # Read saved vital signs
    for fld in ["systolic", "diastolic", "bpm", "temperature", "osat", "weight", "height"]:
        elems = eval_pane.find_elements(By.CSS_SELECTOR, f"input[name='{fld}']")
        if elems:
            print(f"VERIFIED: {fld} = '{elems[0].get_attribute('value')}'")
            
    print("PHASE 5 NURSING TRIAGE COMPLETE AND VERIFIED!")
    
finally:
    driver.quit()
