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
    
    sel = driver.find_element(By.NAME, 'discharge_reason')
    print('Initial val:', repr(sel.get_attribute('value')))
    
    res = driver.execute_script('''
        var sel = arguments[0];
        var out = [];
        for (var i = 0; i < sel.options.length; i++) {
            out.push({i: i, val: sel.options[i].value, text: sel.options[i].text});
            if (sel.options[i].value.indexOf('home') !== -1) {
                sel.selectedIndex = i;
                $(sel).trigger('change');
            }
        }
        return out;
    ''', sel)
    print("Options list:", res)
    time.sleep(1)
    print('After select val:', repr(sel.get_attribute('value')), 'selectedIndex:', driver.execute_script('return arguments[0].selectedIndex;', sel))
    
    # Click Save
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(3)
    
    banners = driver.find_elements(By.CSS_SELECTOR, '.alert-danger, .alert-warning, .alert-info, .alert-success')
    for b in banners:
        if b.is_displayed():
            print('Banner after save:', b.text)
            
finally:
    driver.quit()
