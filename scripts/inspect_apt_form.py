import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # 1. Click "All" tab
    all_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'All')]")
    all_tab.click()
    time.sleep(2.5)
    
    # 2. Click on LIVE E2E TEST PATIENT row
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E TEST PATIENT" in r.text:
            print("Clicking LIVE E2E TEST PATIENT row...")
            r.click()
            break
    time.sleep(1.5)
    
    # 3. Switch to form view (<->)
    switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='Switch']")
    switch_btn.click()
    time.sleep(2.5)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_apt_form_selected.png"))
    print("Saved debug_apt_form_selected.png")
    
    # Inspect all buttons and state field
    buttons = pane.find_elements(By.TAG_NAME, "button")
    print(f"Buttons on appointment form ({len(buttons)}):")
    for b in buttons:
        if b.is_displayed():
            print("  btn:", repr(b.text), repr(b.get_attribute("title")), repr(b.get_attribute("class")))
            
    # Check gear / action menu
    gear_btns = pane.find_elements(By.CSS_SELECTOR, "button[title*='Action'], button[title*='action'], .glyphicon-cog")
    print(f"Gear action buttons: {len(gear_btns)}")
    
finally:
    driver.quit()
