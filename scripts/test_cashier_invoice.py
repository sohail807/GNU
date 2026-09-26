import time
import os
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_cashier1", "Cashier2026!")
    time.sleep(2)
    
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.send_keys("Customer Invoices")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Found {len(items)} items for Customer Invoices:")
    for it in items:
        print(" -", it.text)
        
    for it in items:
        if "Customer Invoices" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_cashier_invoices_list.png"))
    
    # Click New
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_cashier_new_invoice.png"))
    print("Opened New Customer Invoice form.")
    
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
