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
    
    res = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        var view = cur.screen.current_view;
        var ws = view.widgets['discharge_reason'];
        var w_info = [];
        if (ws) {
            for (var i = 0; i < ws.length; i++) {
                w_info.push({
                    i: i,
                    val: ws[i].select.val(),
                    selectedIndex: ws[i].select[0].selectedIndex,
                    options_len: ws[i].select[0].options.length
                });
                // Set to 'home'
                ws[i].select.val(JSON.stringify('home'));
            }
        }
        cur.screen.current_record.field_set_client('discharge_reason', 'home');
        return {
            widgets_count: ws ? ws.length : 0,
            widgets: w_info,
            rec_discharge: cur.screen.current_record.field_get('discharge_reason')
        };
    ''')
    import pprint
    pprint.pprint(res)
    
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
        return {
            id: cur.screen.current_record.id,
            state: cur.screen.current_record.field_get('state'),
            discharge: cur.screen.current_record.field_get('discharge_reason'),
            invalid: cur.screen.current_record.invalid_fields()
        };
    ''')
    print("AFTER SAVE INFO:")
    pprint.pprint(after_info)

finally:
    driver.quit()
