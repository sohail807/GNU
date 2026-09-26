import time
import os
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_rad1", "Rad2026!")
    time.sleep(2)
    
    # Check global search for Imaging
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Medical Imaging")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Found {len(items)} items for Medical Imaging:")
    for it in items:
        print(" -", it.text)
        
    # Let's open Medical Imaging Results
    target = None
    for it in items:
        if "Results" in it.text:
            target = it
            break
    if not target and items:
        target = items[0]
        
    target.click()
    time.sleep(3)
    pane = get_active_pane(driver)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rad_list.png"))
    
    # Click New
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_rad_form.png"))
    print("Opened New Medical Imaging Result Form.")
    
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
