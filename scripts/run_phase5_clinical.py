import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("Navigating to Evaluation...")
    login(driver, "demo_nurse1", "Nurse2026!")
    open_menu(driver, "Patients")
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # Open related Evaluations
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    relate_btn.click()
    time.sleep(1.5)
    
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]").click()
    time.sleep(3)
    
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    
    # Check if existing evaluation is already listed or click New
    rows = top_pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Existing evaluations count: {len(rows)}")
    if rows:
        # Open the first evaluation
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(2)
    else:
        # Click New
        [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
        time.sleep(2.5)
        
    # Check tabs on evaluation: Main Info, Clinical, Mental, Info Dx...
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    print("Sub-tabs on evaluation form:")
    for st in sub_tabs:
        print("  tab:", st.text)
        if "clinical" in st.text.lower():
            st.click()
            print("Clicked Clinical tab!")
            time.sleep(2)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_eval_clinical_tab.png"))
    print("Saved debug_eval_clinical_tab.png")
    
    # Inspect inputs inside Clinical tab
    inputs = top_pane.find_elements(By.CSS_SELECTOR, "input, select")
    print(f"Inputs in Clinical tab ({len(inputs)}):")
    for inp in inputs:
        if inp.is_displayed():
            print(f"  Field: name='{inp.get_attribute('name')}', type='{inp.get_attribute('type')}'")
            
    # Fill Vital Signs:
    # Systolic: 120, Diastolic: 80, BPM: 76, Temp: 37.0, RR: 16, SpO2: 98, Weight: 75, Height: 175
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
                print(f"Entered {fld} = {val}")
                break
                
    time.sleep(1)
    # Check Discharge Reason dropdown if visible
    dr_selects = top_pane.find_elements(By.CSS_SELECTOR, "select[name='discharge_reason']")
    for drs in dr_selects:
        if drs.is_displayed():
            s = Select(drs)
            if len(s.options) > 1:
                s.select_by_index(1)
                print("Selected discharge reason:", s.first_selected_option.text)
                
    # Save the record
    save_btns = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()]
    if save_btns:
        save_btns[0].click()
        print("Clicked Save button.")
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "06_nursing_triage.png"))
    print("Saved 06_nursing_triage.png")
    
finally:
    driver.quit()
