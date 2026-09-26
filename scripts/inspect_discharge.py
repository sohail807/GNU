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
    
    rows = top_pane.find_elements(By.CSS_SELECTOR, 'table tbody tr')
    if rows:
        print('Found evaluation rows:', len(rows))
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(2)
    
    matches = top_pane.find_elements(By.XPATH, ".//*[contains(text(), 'Discharge')]")
    for m in matches:
        print("Match tag:", m.tag_name, "text:", repr(m.text), "HTML:", m.get_attribute("outerHTML")[:200])
        try:
            parent = m.find_element(By.XPATH, "..")
            print("  Parent HTML:", parent.get_attribute("outerHTML")[:300])
        except:
            pass

    # Also list all inputs and selects in top_pane
    print("\nAll selects:")
    for s in top_pane.find_elements(By.TAG_NAME, "select"):
        print("  select:", s.get_attribute("name"), s.get_attribute("class"), "displayed:", s.is_displayed(), "outer:", s.get_attribute("outerHTML")[:150])

    print("\nAll buttons:")
    for b in top_pane.find_elements(By.TAG_NAME, "button"):
        if b.text or b.get_attribute("title"):
            print("  btn text:", repr(b.text), "title:", repr(b.get_attribute("title")), "name:", repr(b.get_attribute("name")), "class:", b.get_attribute("class"))

finally:
    driver.quit()
