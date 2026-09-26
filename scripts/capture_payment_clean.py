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
    
    # Click "All" or "Posted"
    tabs = pane.find_elements(By.XPATH, ".//a[contains(text(), 'All') or contains(text(), 'Posted')]")
    for t in tabs:
        if "All" in t.text or "Posted" in t.text:
            t.click()
            break
    time.sleep(2)
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    for r in rows:
        if "INV-2026/00014" in r.text or "LIVE E2E" in r.text:
            print("Found invoice row, clicking...")
            r.click()
            time.sleep(1)
            # Switch to form view
            switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Switch']")
            switch_btn.click()
            time.sleep(3)
            break
            
    # In invoice form, click Payment tab
    pane = get_active_pane(driver)
    tabs = pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs li a")
    for t in tabs:
        if "Payment" in t.text:
            print("Clicking Payment tab on invoice...")
            t.click()
            time.sleep(2)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "12_payment_completed.png"))
    print("Saved 12_payment_completed.png cleanly!")

finally:
    driver.quit()
