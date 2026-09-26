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
    time.sleep(3)
    
    # Let's open Prescriptions via global search or tree
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Found {len(items)} search items:")
    for it in items:
        print(" -", it.text)
    
    if items:
        items[0].click()
        time.sleep(3)
        pane = get_active_pane(driver)
        print("Active pane opened for Prescriptions.")
        
        # Take screenshot of prescriptions list
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescriptions_list.png"))
        
        # Click New
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(3)
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_form.png"))
        print("Opened New Prescription Form.")
        
        # Print form inputs
        inputs = pane.find_elements(By.CSS_SELECTOR, "input, select, textarea, button")
        print(f"Total elements in pane: {len(inputs)}")
        for inp in inputs:
            n = inp.get_attribute("name")
            t = inp.get_attribute("type")
            tag = inp.tag_name
            vis = inp.is_displayed()
            title = inp.get_attribute("title")
            if n or title:
                print(f"Elem tag={tag} name={n} type={t} title={title} vis={vis}")
finally:
    driver.quit()
