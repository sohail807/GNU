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
    
    # Open the invoice INV-2026/00014 (or the first row in posted/all)
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} invoice rows in list.")
    if rows:
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(3)
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_invoice_opened_for_pay.png"))
    
    # Find PAY button
    pay_btns = pane.find_elements(By.CSS_SELECTOR, "button[name='pay']")
    print(f"Found {len(pay_btns)} pay buttons.")
    for pb in pay_btns:
        print("Pay button text:", pb.text, "vis:", pb.is_displayed())
        if pb.is_displayed():
            print("Clicking PAY button...")
            driver.execute_script("arguments[0].click();", pb)
            time.sleep(2)
            break
            
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_after_pay_clicked.png"))
    
    # Inspect open modals
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Modal displayed after PAY:", m.text[:200])
            for inp in m.find_elements(By.CSS_SELECTOR, "input, select, button"):
                if inp.is_displayed():
                    print("  Modal element:", inp.get_attribute("name"), inp.get_attribute("title"), inp.tag_name, inp.text)

finally:
    driver.quit()
