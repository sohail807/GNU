import sys, time, os
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu, OUT_DIR
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

driver = create_driver()
try:
    login(driver, 'demo_nurse1', 'Nurse2026!')
    open_menu(driver, 'Patients')
    time.sleep(2.5)
    pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    for r in pane.find_elements(By.CSS_SELECTOR, 'table tbody tr'):
        if 'LIVE E2E' in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2)
    pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']").click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]").click()
    time.sleep(2.5)
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
    time.sleep(2.5)
    
    # Switch to Clinical tab
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    for st in sub_tabs:
        if "clinical" in st.text.lower():
            st.click()
            time.sleep(1.5)
            break
            
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
                
    time.sleep(1.5)
    
    # Select index 1 ('in_progress' and 'home') on both widgets and call set_value
    test_res = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        var ws = cur.screen.current_view.widgets;
        var rec = cur.screen.current_record;
        
        if (ws['state'] && ws['state'][0]) {
            ws['state'][0].select[0].selectedIndex = 1;
            ws['state'][0].set_value();
        }
        if (ws['discharge_reason'] && ws['discharge_reason'][0]) {
            ws['discharge_reason'][0].select[0].selectedIndex = 1;
            ws['discharge_reason'][0].set_value();
        }
        return {
            st: rec.field_get('state'),
            dr: rec.field_get('discharge_reason'),
            invalid: rec.invalid_fields()
        };
    ''')
    import pprint
    print("Pre-save check:")
    pprint.pprint(test_res)
    
    # Click Save
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(3)
    
    # Check banners
    banners = driver.find_elements(By.CSS_SELECTOR, '.alert-danger, .alert-warning, .alert-info, .alert-success')
    for b in banners:
        if b.is_displayed():
            print("BANNER AFTER SAVE:", b.text)
            
    after_info = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        var rec = cur.screen.current_record;
        return {
            id: rec.id,
            state: rec.field_get('state'),
            discharge: rec.field_get('discharge_reason'),
            systolic: rec.field_get('systolic'),
            diastolic: rec.field_get('diastolic'),
            invalid: rec.invalid_fields()
        };
    ''')
    print("AFTER SAVE EVALUATION RECORD:")
    pprint.pprint(after_info)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "06_nursing_triage.png"))
    print("Saved reports/live_browser_test/06_nursing_triage.png")

finally:
    driver.quit()
