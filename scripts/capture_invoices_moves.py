import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 25)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    
    # 1. Customer Invoices
    search_entry.clear()
    search_entry.send_keys("Customer Invoices")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Customer Invoices" in it.text:
            it.click()
            break
    time.sleep(4)
    
    # Click "Posted" badge or link
    tabs = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active ul.nav-tabs li a, .tab-pane.active a")
    for t in tabs:
        if "Posted" in t.text or "12" in t.text:
            print("Clicking tab:", t.text)
            t.click()
            time.sleep(2)
            break
            
    driver.save_screenshot("screenshots/07_posted_invoices.png")
    print("Saved 07_posted_invoices.png")
    
    # Double click first invoice row
    rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
    print(f"Found {len(rows)} invoice rows")
    if rows:
        ActionChains(driver).double_click(rows[0]).perform()
        time.sleep(3)
        driver.save_screenshot("screenshots/08_posted_invoice_lines.png")
        print("Saved 08_posted_invoice_lines.png")
        
    # 2. General Ledger / Entries
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    search_entry.clear()
    search_entry.send_keys("Account Moves")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Account Moves" in it.text or "Entries" in it.text:
            it.click()
            break
    time.sleep(4)
    driver.save_screenshot("screenshots/09_account_moves.png")
    print("Saved 09_account_moves.png")
    
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
