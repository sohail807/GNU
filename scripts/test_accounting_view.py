import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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
    print("Found search results for 'Account Moves':", [it.text for it in items])
    clicked = False
    for it in items:
        if "Account Moves" in it.text:
            it.click()
            clicked = True
            break
    if not clicked and items:
        items[0].click()
        
    time.sleep(3)
    pane = get_active_pane(driver)
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} account moves rows.")
    for idx, r in enumerate(rows[:10]):
        print(f"Row {idx}: {r.text}")
        
    # Check if there is an account move with description or origin INV-2026/00014
    target_row = None
    for r in rows:
        if "INV-2026/00014" in r.text:
            target_row = r
            print("Found target invoice move:", r.text)
            break
            
    if target_row:
        ActionChains(driver).double_click(target_row).perform()
        time.sleep(3)
        print("Double-clicked target move to open form view.")
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_account_moves.png"))
    print("Screenshot saved to debug_account_moves.png")

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_account_moves_err.png"))
finally:
    driver.quit()
