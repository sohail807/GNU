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
                # trigger change / blur by sending TAB
                from selenium.webdriver.common.keys import Keys
                f.send_keys(Keys.TAB)
                print(f"Set {fld} = {val}")
                break
                
    time.sleep(1.5)
    
    # Check invalid_fields BEFORE save
    inv = driver.execute_script('''
        for (var i = 0; i < Sao.Tab.tabs.length; i++) {
            var t = Sao.Tab.tabs[i];
            if (t && t.screen && t.screen.current_record) {
                return t.screen.current_record.invalid_fields();
            }
        }
        return "no record";
    ''')
    print("Invalid fields before save:", inv)
    
    # Click Save
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(3)
    
    # Check banners
    banners = driver.find_elements(By.CSS_SELECTOR, '.alert')
    for b in banners:
        if b.is_displayed():
            print("ALERT BANNER:", b.text)
            
    # Check if record saved (rec.id > 0)
    rec_id = driver.execute_script('''
        for (var i = 0; i < Sao.Tab.tabs.length; i++) {
            var t = Sao.Tab.tabs[i];
            if (t && t.screen && t.screen.current_record) {
                return t.screen.current_record.id;
            }
        }
        return -999;
    ''')
    print("Record ID after save:", rec_id)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "06_nursing_triage.png"))
    print("Screenshot saved to reports/live_browser_test/06_nursing_triage.png")

finally:
    driver.quit()
