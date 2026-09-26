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
    for it in items:
        if "Customer Invoices" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2.5)
    
    # Click Health tab
    tabs = pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs li a")
    for t in tabs:
        print("Tab:", t.text)
        if "Health" in t.text:
            t.click()
            time.sleep(2)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_invoice_health_tab.png"))
    print("Clicked Health tab.")
    
finally:
    driver.quit()
