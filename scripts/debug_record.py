import sys, time
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu
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
    
    info = driver.execute_script('''
        var rec = null;
        for (var i = 0; i < Sao.Tab.tabs.length; i++) {
            var t = Sao.Tab.tabs[i];
            if (t && t.screen && t.screen.current_record) {
                rec = t.screen.current_record;
            }
        }
        if (!rec) return {error: 'no record found'};
        var fld = rec.model.fields['discharge_reason'];
        return {
            rec_id: rec.id,
            discharge_reason_val: rec._values['discharge_reason'],
            discharge_reason_get: fld ? fld.get(rec) : null,
            state_val: rec._values['state'],
            state_attrs: fld ? fld.get_state_attrs(rec) : null,
            invalid_fields: rec.invalid_fields()
        };
    ''')
    print('Record debug info:', info)
finally:
    driver.quit()
