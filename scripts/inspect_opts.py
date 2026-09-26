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
    
    opts = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        var ws = cur.screen.current_view.widgets;
        var st_opts = [];
        var dr_opts = [];
        if (ws['state'] && ws['state'][0]) {
            var s = ws['state'][0].select[0];
            for (var i=0; i<s.options.length; i++) {
                st_opts.push({i: i, val: s.options[i].value, text: s.options[i].text});
            }
        }
        if (ws['discharge_reason'] && ws['discharge_reason'][0]) {
            var s2 = ws['discharge_reason'][0].select[0];
            for (var i=0; i<s2.options.length; i++) {
                dr_opts.push({i: i, val: s2.options[i].value, text: s2.options[i].text});
            }
        }
        return {st_opts: st_opts, dr_opts: dr_opts};
    ''')
    import pprint
    pprint.pprint(opts)
finally:
    driver.quit()
