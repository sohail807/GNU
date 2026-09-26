import time
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane

driver = create_driver()
try:
    login(driver, "demo_lab1", "Lab2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Lab Results")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2)
    pane = get_active_pane(driver)
    
    # Open the existing record TEST036 or New
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print("Found rows:", len(rows))
    if rows:
        rows[0].click()
        time.sleep(1)
        # Open record
        open_rec = pane.find_element(By.CSS_SELECTOR, "button[title='Switch']")
        # Or double click row
        from selenium.webdriver import ActionChains
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(2)
        
    print("Inspecting buttons in active pane/modal:")
    for b in driver.find_elements(By.CSS_SELECTOR, "button"):
        if b.is_displayed() and (b.text or b.get_attribute("title")):
            print(f"Button text='{b.text}' title='{b.get_attribute('title')}' class='{b.get_attribute('class')}'")
finally:
    driver.quit()
