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
    
    # Inspect buttons in toolbar
    btn_group = pane.find_element(By.CSS_SELECTOR, ".btn-toolbar, .navbar, .toolbar")
    buttons = pane.find_elements(By.CSS_SELECTOR, "button")
    for b in buttons:
        cls = b.get_attribute("class")
        title = b.get_attribute("title")
        txt = b.text
        if title or "switch" in cls or "icon" in cls:
            print(f"Button: class='{cls}', title='{title}', text='{txt}'")

    # Select row with Move 47
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    for r in rows:
        if "INV-2026/00014" in r.text and "Revenue" in r.text:
            cells = r.find_elements(By.TAG_NAME, "td")
            cells[1].click() # Select row
            time.sleep(1)
            break
            
    # The switch view button is the first button in the navigation group
    # Let's find button with title 'Switch view' or containing glyphicon-transfer or glyphicon-random or similar
    switch_btns = pane.find_elements(By.CSS_SELECTOR, "button")
    switch_btn = None
    for b in switch_btns:
        if b.find_elements(By.CSS_SELECTOR, ".glyphicon-transfer, .glyphicon-retweet, .glyphicon-resize-horizontal") or "switch" in (b.get_attribute("title") or "").lower():
            switch_btn = b
            break
    if not switch_btn:
        # It's next to the prev button before 2/29
        # In the screenshot, it's the button directly preceding the '<' button
        for idx, b in enumerate(switch_btns):
            if b.find_elements(By.CSS_SELECTOR, ".glyphicon-chevron-left"):
                switch_btn = switch_btns[idx - 1]
                break

    if switch_btn:
        print("Found switch view button! Clicking...")
        switch_btn.click()
        time.sleep(3)
        driver.save_screenshot(os.path.join(OUT_DIR, "13_accounting_verified.png"))
        print("Successfully saved 13_accounting_verified.png!")
        
        # Let's inspect the fields in the move form view
        print("Current move title:", pane.find_element(By.CSS_SELECTOR, "h4, .form-title, .title, a.dropdown-toggle").text)
        # Check lines
        lines_table = pane.find_element(By.CSS_SELECTOR, "table")
        print("Lines table found!")
    else:
        print("Could not locate switch view button.")

except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
