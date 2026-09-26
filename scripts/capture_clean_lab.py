import time
import os
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_lab1", "Lab2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Lab Results")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    pane = get_active_pane(driver)
    
    # Double-click the first row to open it
    from selenium.webdriver import ActionChains
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    if rows:
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(3)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "09_laboratory.png"))
    print("Saved 09_laboratory.png cleanly!")
finally:
    driver.quit()
