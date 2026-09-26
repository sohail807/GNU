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
    
    # Click "All" tab
    all_tab = pane.find_element(By.XPATH, ".//a[normalize-space(text())='All' or contains(text(), 'All')]")
    print("Clicking All tab...")
    all_tab.click()
    time.sleep(2.5)
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} invoice rows in All tab.")
    
    target_row = None
    for r in rows:
        if "INV-2026/00014" in r.text or "LIVE E2E" in r.text:
            target_row = r
            print("Found target invoice in All tab!")
            break
            
    if target_row:
        print("Double clicking invoice row...")
        ActionChains(driver).double_click(target_row).perform()
        time.sleep(3)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "12_payment_completed.png"))
    print("Captured 12_payment_completed.png in form view successfully!")
    
    # Check invoice state
    state_sel = pane.find_element(By.NAME, "state")
    print("Invoice state in form:", state_sel.get_attribute("value"))

finally:
    driver.quit()
