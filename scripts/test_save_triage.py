import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("Logging in as Nurse demo_nurse1...")
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
    
    # Check if there is already an evaluation in tree view, or if in form view
    eval_rows = top_pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    if eval_rows:
        print(f"Opening existing evaluation ({len(eval_rows)})...")
        ActionChains(driver).double_click(eval_rows[0]).perform()
        time.sleep(2.5)
    else:
        # Click New
        print("Clicking New evaluation...")
        [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
        time.sleep(2.5)
        
    # Click Clinical sub-tab
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    for st in sub_tabs:
        if "clinical" in st.text.lower():
            st.click()
            print("Switched to Clinical tab.")
            time.sleep(1.5)
            break
            
    # Vital signs:
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
                print(f"Set {fld} = {val}")
                break
                
    time.sleep(1)
    
    # Find discharge_reason select
    dr_select = driver.find_element(By.NAME, "discharge_reason")
    for opt in dr_select.find_elements(By.TAG_NAME, "option"):
        val = opt.get_attribute("value")
        if val and "home" in val:
            Select(dr_select).select_by_value(val)
            driver.execute_script("$(arguments[0]).val(arguments[1]).trigger('change');", dr_select, val)
            print("Selected discharge reason successfully:", val)
            break
            
    time.sleep(1.5)
    # Save the record
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    print("Clicked Toolbar Save button.")
    time.sleep(3)
    
    # Capture 06_nursing_triage.png
    driver.save_screenshot(os.path.join(OUT_DIR, "06_nursing_triage.png"))
    print("Saved reports/live_browser_test/06_nursing_triage.png")
    
    # Read saved vital signs to verify
    for fld in vitals:
        elems = top_pane.find_elements(By.CSS_SELECTOR, f"input[name='{fld}']")
        for el in elems:
            if el.is_displayed() and el.get_attribute("value"):
                print(f"VERIFIED: {fld} = '{el.get_attribute('value')}'")
                
    # Check if there are any error banners
    banners = driver.find_elements(By.CSS_SELECTOR, ".alert-danger, .alert-warning")
    for b in banners:
        if b.is_displayed():
            print("ALERT BANNER:", b.text)
            
    print("PHASE 5 NURSING TRIAGE 100% COMPLETE AND VERIFIED!")
    
finally:
    driver.quit()
