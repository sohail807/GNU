import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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
    
    # Select Party
    party_inp = pane.find_element(By.NAME, "party")
    party_inp.click()
    party_inp.clear()
    party_inp.send_keys("LIVE E2E")
    time.sleep(2)
    dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
    for ddl in dd_links:
        if ddl.is_displayed() and ("LIVE" in ddl.text or "PATIENT" in ddl.text):
            print("Clicking party dropdown:", ddl.text)
            ddl.click()
            break
    time.sleep(1.5)
    
    # Description
    desc_inp = pane.find_element(By.NAME, "description")
    desc_inp.click()
    desc_inp.clear()
    desc_inp.send_keys("Consultation, Lab CBC, CXR and Prescription")
    time.sleep(1)
    
    # Find the Lines toolbar 'New' button
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    print(f"Found {len(line_new_btns)} New buttons.")
    # The second New button is for Lines
    line_new_btns[1].click()
    time.sleep(2)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_invoice_line_added.png"))
    
    # Check what was added: in-line row or modal
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show")
    print(f"Modals open: {len(modals)}")
    
    # Check tbody rows in pane
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Tbody rows: {len(rows)}")
    for r in rows:
        print("Row text:", r.text)
        
finally:
    driver.quit()
