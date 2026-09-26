import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    time.sleep(2)
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    pane.find_element(By.CSS_SELECTOR, "button[title='New']").click()
    time.sleep(2)
    
    # Click search icon
    inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    parent = inp.find_element(By.XPATH, "..")
    search_icon = parent.find_element(By.CSS_SELECTOR, "img[title='Search a record']")
    search_icon.click()
    print("Clicked Search a record icon.")
    time.sleep(2.5)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_patient_search_modal.png"))
    print("Saved debug_patient_search_modal.png")
    
    # Inspect modal
    modals = [m for m in driver.find_elements(By.CLASS_NAME, "modal") if m.is_displayed()]
    print(f"Modals count: {len(modals)}")
    if modals:
        m = modals[0]
        print("Modal text snippet:", m.text[:300])
        rows = m.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"Modal table rows: {len(rows)}")
        for r in rows:
            print("  m-row:", r.text)
finally:
    driver.quit()
