import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_nurse1", "Nurse2026!")
    open_menu(driver, "Patients")
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # Click Relate -> Evaluations
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    relate_btn.click()
    time.sleep(1.5)
    
    eval_opt = driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]")
    eval_opt.click()
    time.sleep(3)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_nurse_eval_screen.png"))
    print("Saved debug_nurse_eval_screen.png")
    
    # Print all open tabs
    tabs = driver.find_elements(By.CSS_SELECTOR, "ul.nav-tabs li")
    print(f"Open tabs ({len(tabs)}):")
    for t in tabs:
        print("  tab:", t.text, "class:", t.get_attribute("class"))
        
    # Check all active panes and their buttons
    panes = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active")
    print(f"Active panes ({len(panes)}):")
    for idx, p in enumerate(panes):
        print(f"Pane {idx}: id={p.get_attribute('id')}")
        btns = p.find_elements(By.TAG_NAME, "button")
        for b in btns:
            if b.is_displayed():
                print("   btn:", repr(b.text), repr(b.get_attribute("title")))
finally:
    driver.quit()
