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
    
    # In evaluations list, if there's a record, open it, else click New
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    rows = top_pane.find_elements(By.CSS_SELECTOR, 'table tbody tr')
    if rows:
        print("Opening evaluation row 0...")
        ActionChains(driver).double_click(rows[0]).perform()
    else:
        print("Clicking New button...")
        [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='New']") if b.is_displayed()][0].click()
    time.sleep(2.5)
    
    # Now find the discharge button and surrounding elements
    btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'DISCHARGE') or contains(text(), 'Discharge')]")
    print(f"Found {len(btns)} discharge buttons:")
    for b in btns:
        print("Discharge button:", b.get_attribute("outerHTML"))
        parent = b.find_element(By.XPATH, "../..")
        print("Parent 2 levels up:", parent.get_attribute("outerHTML")[:500])

    # Find elements with 'discharge_reason' in any attribute
    els = driver.find_elements(By.XPATH, "//*[contains(@name, 'discharge') or contains(@id, 'discharge') or contains(@class, 'discharge')]")
    print(f"Found {len(els)} discharge elements:")
    for el in els:
        print("  el:", el.tag_name, el.get_attribute("name"), el.get_attribute("id"), el.get_attribute("class"), el.get_attribute("outerHTML")[:200])

finally:
    driver.quit()
