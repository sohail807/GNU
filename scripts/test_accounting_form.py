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
    search_entry.send_keys("Account Moves")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Account Moves" in it.text:
            it.click()
            break
            
    time.sleep(3)
    pane = get_active_pane(driver)
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} moves.")
    
    # Let's find row with Move 48 (Cash / Payment) or Move 47 (Revenue / Invoice)
    target_row = None
    for r in rows:
        if "INV-2026/00014" in r.text and "Revenue" in r.text:
            target_row = r
            break
            
    if target_row:
        cells = target_row.find_elements(By.TAG_NAME, "td")
        print(f"Found target row with {len(cells)} cells. Clicking cell 1 (Journal)...")
        # Click cell 0 or 1 to select row
        cells[1].click()
        time.sleep(1)
        
        # Click switch view button on pane toolbar
        switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Switch view'], button.switch-view")
        print("Clicking switch view button...")
        switch_btn.click()
        time.sleep(3)
        
        driver.save_screenshot(os.path.join(OUT_DIR, "debug_move47_form.png"))
        print("Saved debug_move47_form.png")
        
        # Also switch back to list view and check Move 48 (Payment move)
        switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Switch view'], button.switch-view")
        switch_btn.click()
        time.sleep(2)
        
        rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
        for r in rows:
            if "INV-2026/00014" in r.text and "Cash" in r.text:
                cells = r.find_elements(By.TAG_NAME, "td")
                cells[1].click()
                time.sleep(1)
                switch_btn.click()
                time.sleep(3)
                driver.save_screenshot(os.path.join(OUT_DIR, "debug_move48_cash_form.png"))
                print("Saved debug_move48_cash_form.png")
                break

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_move_err.png"))
finally:
    driver.quit()
