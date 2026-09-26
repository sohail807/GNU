import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from lib_e2e import create_driver, login, get_active_pane

driver = create_driver()
try:
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    
    pane = get_active_pane(driver)
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Line toolbar new button
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    line_new_btns[1].click()
    time.sleep(2)
    
    # Find active element
    active = driver.switch_to.active_element
    print("Active element tag:", active.tag_name, "class:", active.get_attribute("class"), "name:", active.get_attribute("name"))
    
    # Try typing into active element
    active.send_keys("Amoxicillin")
    time.sleep(1.5)
    print("Typed Amoxicillin.")
    
    # Check if autocomplete dropdown appeared or tab
    active.send_keys(Keys.TAB)
    time.sleep(2)
    
    # Let's inspect the cells of the table
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} tbody rows.")
    for r in rows:
        print("Row text:", r.text)
        
finally:
    driver.quit()
