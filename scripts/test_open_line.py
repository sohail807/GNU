import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    
    # Open Prescriptions
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    
    pane = get_active_pane(driver)
    
    # Click New (+) on top toolbar
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Select Patient
    patient_inp = pane.find_element(By.NAME, "patient")
    patient_inp.click()
    patient_inp.clear()
    patient_inp.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(1)
    patient_inp.send_keys(Keys.TAB)
    time.sleep(1.5)
    
    # Click New on line toolbar
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    line_new_btns[1].click()
    time.sleep(2)
    
    # Click Open on line toolbar
    open_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='Open']")
    print(f"Total Open buttons: {len(open_btns)}")
    if open_btns:
        open_btns[0].click()
        time.sleep(2)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_line_form.png"))
    
    # Check modals
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed! text:", m.text[:150])
            for inp in m.find_elements(By.CSS_SELECTOR, "input, select, button"):
                if inp.is_displayed():
                    print("  Input:", inp.get_attribute("name"), inp.get_attribute("title"), inp.tag_name)
                    
finally:
    driver.quit()
