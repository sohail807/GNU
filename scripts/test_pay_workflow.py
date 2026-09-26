import time
import os
import sys
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
    
    # Click "Posted" tab
    tabs = pane.find_elements(By.XPATH, ".//a[contains(text(), 'Posted') or contains(text(), 'All')]")
    for t in tabs:
        if "Posted" in t.text:
            print("Clicking Posted tab...")
            t.click()
            break
            
    time.sleep(2.5)
    
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} invoice rows in Posted tab.")
    
    target_row = None
    for r in rows:
        t = r.text
        if "LIVE E2E" in t or "INV-2026/00014" in t:
            target_row = r
            print("Found target invoice row for LIVE E2E TEST PATIENT.")
            break
            
    if not target_row and rows:
        target_row = rows[0]
        
    if target_row:
        ActionChains(driver).double_click(target_row).perform()
        time.sleep(3)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_posted_invoice_view.png"))
    
    # Check PAY button or Pay action
    pay_btns = pane.find_elements(By.XPATH, ".//button[contains(text(), 'PAY') or contains(text(), 'Pay')] | .//button[@name='pay']")
    print(f"Found {len(pay_btns)} pay buttons.")
    for pb in pay_btns:
        if pb.is_displayed():
            print("Found displayed PAY button, clicking...")
            driver.execute_script("arguments[0].click();", pb)
            time.sleep(2.5)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_pay_wizard.png"))
    
    # Inspect open modals
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            txt = m.text[:200].encode('ascii', 'replace').decode('ascii')
            print("Modal displayed after PAY:", txt)
            for inp in m.find_elements(By.CSS_SELECTOR, "input, select, button"):
                if inp.is_displayed():
                    print("  Modal element:", inp.get_attribute("name"), inp.get_attribute("title"), inp.tag_name, inp.text.encode('ascii', 'replace').decode('ascii'))

finally:
    driver.quit()
