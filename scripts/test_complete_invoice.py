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
    desc_inp.send_keys("Consultation, CBC, CXR and Medication")
    time.sleep(1)
    
    # Click New on Lines toolbar
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    line_new_btns[1].click()
    time.sleep(2)
    
    # Modal for line
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed() and "Lines" in m.text:
            print("Found Lines modal.")
            # Select Product
            prod_inp = m.find_element(By.NAME, "product")
            prod_inp.click()
            prod_inp.clear()
            prod_inp.send_keys("Medical evaluation")
            time.sleep(2)
            
            dd_links = driver.find_elements(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a | //ul[contains(@class, 'dropdown-menu')]//li")
            for ddl in dd_links:
                if ddl.is_displayed() and "Medical" in ddl.text:
                    print("Clicking product dropdown:", ddl.text)
                    ddl.click()
                    break
            time.sleep(1.5)
            
            # Set Quantity = 1 via script
            for q_inp in m.find_elements(By.CSS_SELECTOR, "input[name='quantity']"):
                driver.execute_script("""
                    arguments[0].value = '1';
                    $(arguments[0]).val('1').trigger('change').trigger('input');
                """, q_inp)
                
            # Set Unit Price = 150 via script
            for p_inp in m.find_elements(By.CSS_SELECTOR, "input[name='unit_price']"):
                driver.execute_script("""
                    arguments[0].value = '150';
                    $(arguments[0]).val('150').trigger('change').trigger('input');
                """, p_inp)
            time.sleep(1)
            
            # Click ADD button
            add_btns = m.find_elements(By.XPATH, ".//button[text()='ADD' or text()='Add' or contains(text(), 'ADD')]")
            for ab in add_btns:
                if "NEW" not in ab.text.upper():
                    print("Clicking ADD button:", ab.text)
                    driver.execute_script("arguments[0].click();", ab)
                    break
            time.sleep(2.5)
            break
            
    time.sleep(2)
    # Save Invoice
    save_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Save']")
    driver.execute_script("arguments[0].click();", save_btn)
    time.sleep(3)
    
    msgs = driver.find_elements(By.CSS_SELECTOR, ".user-message, .alert, .notification")
    for m in msgs:
        if m.is_displayed():
            print("Message banner after save:", m.text)
            
    # Click POST button
    post_btn = pane.find_element(By.CSS_SELECTOR, "button[name='post']")
    print("Clicking POST button...")
    driver.execute_script("arguments[0].click();", post_btn)
    time.sleep(3)
    
    # Confirm modal if any
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show, div.modal")
    for m in modals:
        if m.is_displayed():
            print("Confirmation modal after post:", m.text[:100])
            ok_btns = m.find_elements(By.CSS_SELECTOR, "button.btn-primary, button[data-bb-handler='ok']")
            if ok_btns:
                driver.execute_script("arguments[0].click();", ok_btns[0])
                time.sleep(2)
                break
                
    time.sleep(3)
    driver.save_screenshot(os.path.join(OUT_DIR, "11_invoice_posted.png"))
    print("Captured 11_invoice_posted.png successfully!")
    
    state_sel = pane.find_element(By.NAME, "state")
    print("Final Invoice State:", state_sel.get_attribute("value"))
    
except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_invoice_err2.png"))
finally:
    driver.quit()
