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
    
    # Click "Posted" tab
    tabs = pane.find_elements(By.XPATH, ".//a[contains(text(), 'Posted') or contains(text(), 'All')]")
    for t in tabs:
        if "Posted" in t.text:
            print("Clicking Posted tab...")
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
        
    # Find PAY button
    pay_btns = pane.find_elements(By.XPATH, ".//button[contains(text(), 'PAY') or contains(text(), 'Pay')] | .//button[@name='pay']")
    for pb in pay_btns:
        if pb.is_displayed():
            print("Clicking PAY button...")
            driver.execute_script("arguments[0].click();", pb)
            time.sleep(2.5)
            break
            
    # In the Pay Invoice modal
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed() and "Pay Invoice" in m.text:
            print("Found Pay Invoice modal.")
            pm_selects = m.find_elements(By.NAME, "payment_method")
            if pm_selects:
                pm_sel = pm_selects[0]
                # Select option containing Cash or val 1
                driver.execute_script("""
                    $(arguments[0]).val('1').trigger('change');
                """, pm_sel)
                time.sleep(1)
                print("Selected payment method Cash Payment (QAR).")
                
            # Click OK button
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok']")
            for b in ok_btns:
                if b.text.strip().upper() == "OK":
                    print("Clicking OK button on Pay modal...")
                    driver.execute_script("arguments[0].click();", b)
                    break
            time.sleep(3)
            break
            
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "12_payment_completed.png"))
    print("Captured 12_payment_completed.png successfully!")
    
    state_sel = pane.find_element(By.NAME, "state")
    print("Final Invoice State after payment:", state_sel.get_attribute("value"))

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_pay_err2.png"))
finally:
    driver.quit()
