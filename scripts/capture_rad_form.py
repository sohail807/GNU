import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver import ActionChains
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_rad1", "Rad2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Medical Imaging Results")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Results" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    if rows:
        print("Double clicking row 0...")
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(3)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "10_radiology.png"))
    print("Saved 10_radiology.png form view cleanly!")
finally:
    driver.quit()
