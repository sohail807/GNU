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
    
    # Check invalid fields via get_current()
    debug_info = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        if (!cur) return {error: "no current tab"};
        var rec = cur.screen.current_record;
        if (!rec) return {error: "no current record", tab_name: cur.name};
        
        var fld = rec.model.fields['discharge_reason'];
        return {
            tab_name: cur.name,
            rec_id: rec.id,
            state: rec.field_get('state'),
            discharge_reason_val: rec.field_get('discharge_reason'),
            discharge_reason_eval: fld.get_eval(rec),
            discharge_reason_empty: fld._is_empty(rec),
            discharge_reason_check_req: fld.check_required(rec),
            discharge_reason_state_attrs: fld.get_state_attrs(rec),
            invalid_fields: rec.invalid_fields()
        };
    ''')
    print("DEBUG BEFORE SAVE:")
    import pprint
    pprint.pprint(debug_info)
    
    # Click Save
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(3)
    
    debug_after = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        var rec = cur ? cur.screen.current_record : null;
        if (!rec) return {error: "no record"};
        var fld = rec.model.fields['discharge_reason'];
        return {
            rec_id: rec.id,
            invalid_fields: rec.invalid_fields(),
            discharge_reason_check_req: fld.check_required(rec),
            discharge_reason_state_attrs: fld.get_state_attrs(rec),
            discharge_reason_val: rec.field_get('discharge_reason')
        };
    ''')
    print("DEBUG AFTER SAVE:")
    pprint.pprint(debug_after)

finally:
    driver.quit()
