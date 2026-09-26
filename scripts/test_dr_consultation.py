import sys, time, os
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu, OUT_DIR
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

driver = create_driver()
try:
    login(driver, 'demo_dr1', 'Doctor2026!')
    open_menu(driver, 'Patients')
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    for r in pane.find_elements(By.CSS_SELECTOR, 'table tbody tr'):
        if 'LIVE E2E' in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']").click()
    time.sleep(1.5)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]").click()
    time.sleep(3)
    
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    
    eval_rows = top_pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    if eval_rows:
        print(f"Found {len(eval_rows)} evaluation rows. Double clicking first row...")
        ActionChains(driver).double_click(eval_rows[0]).perform()
        time.sleep(2.5)
        
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    print(f"Found {len(sub_tabs)} sub tabs:")
    for st in sub_tabs:
        st_text = st.text.strip()
        st.click()
        time.sleep(1)
        inputs = [inp.get_attribute("name") for inp in top_pane.find_elements(By.TAG_NAME, "input") if inp.is_displayed()]
        textareas = [ta.get_attribute("name") for ta in top_pane.find_elements(By.TAG_NAME, "textarea") if ta.is_displayed()]
        print(f"Tab '{st_text}': inputs={inputs}, textareas={textareas}")

finally:
    driver.quit()
