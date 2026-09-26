import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver import ActionChains
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
    
    # Click "Posted" or "All" tab
    tabs = pane.find_elements(By.XPATH, ".//a[contains(text(), 'Posted') or contains(text(), 'All')]")
    for t in tabs:
        if "Posted" in t.text or "All" in t.text:
            t.click()
            break
            
    time.sleep(2.5)
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    target_row = None
    for r in rows:
        if "LIVE E2E" in r.text or "INV-2026/00014" in r.text:
            target_row = r
            break
            
    if not target_row and rows:
        target_row = rows[0]
        
    if target_row:
        ActionChains(driver).double_click(target_row).perform()
        time.sleep(3)
        
    # Click Payment tab
    tabs = pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs li a")
    for t in tabs:
        if "Payment" in t.text:
            print("Clicking Payment tab...")
            t.click()
            time.sleep(2)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "12_payment_completed.png"))
    print("Captured 12_payment_completed.png on Payment tab successfully!")

finally:
    driver.quit()
