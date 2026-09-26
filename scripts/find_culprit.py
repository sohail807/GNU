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
        var st_w = view.widgets['state'];
        var dr_w = view.widgets['discharge_reason'];
        
        // Log all widgets in view
        var widget_names = Object.keys(view.widgets);
        
        // Test calling set_value on each widget manually to see WHICH ONE changes discharge_reason or state!
        var rec = cur.screen.current_record;
        var initial_dr = rec.field_get('discharge_reason');
        var initial_st = rec.field_get('state');
        
        var culprit = [];
        for (var name in view.widgets) {
            for (var i = 0; i < view.widgets[name].length; i++) {
                var w = view.widgets[name][i];
                var before_dr = rec.field_get('discharge_reason');
                var before_st = rec.field_get('state');
                w.set_value(rec, rec.model.fields[name]);
                var after_dr = rec.field_get('discharge_reason');
                var after_st = rec.field_get('state');
                if (before_dr !== after_dr || before_st !== after_st) {
                    culprit.push({
                        widget_name: name,
                        i: i,
                        before_dr: before_dr, after_dr: after_dr,
                        before_st: before_st, after_st: after_st,
                        select_val: w.select ? w.select.val() : 'no select'
                    });
                }
            }
        }
        return {
            initial_dr: initial_dr,
            initial_st: initial_st,
            culprit: culprit
        };
    ''')
    import pprint
    pprint.pprint(res)

finally:
    driver.quit()
