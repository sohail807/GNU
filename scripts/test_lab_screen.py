import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_lab1", "Lab2026!")
    time.sleep(3)
    
    # Check global search for Lab
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Lab Results")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Found {len(items)} items for Lab Results:")
    for it in items:
        print(" -", it.text)
        
    if items:
        items[0].click()
        time.sleep(3)
        pane = get_active_pane(driver)
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_lab_results_list.png"))
        
        # Click New
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(3)
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_lab_result_form.png"))
        print("Opened New Lab Result Form.")
        
        # Print form inputs
        inputs = pane.find_elements(By.CSS_SELECTOR, "input, select, textarea, button")
        for inp in inputs:
            n = inp.get_attribute("name")
            t = inp.get_attribute("type")
            title = inp.get_attribute("title")
            vis = inp.is_displayed()
            if n or title:
                print(f"  Tag={inp.tag_name} name={n} type={t} title={title} vis={vis}")
finally:
    driver.quit()
