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
    print("Navigating to http://34.7.237.8/ ...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 20)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    time.sleep(3)
    
    # 1. Customer Invoices -> Click Posted
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    search_entry.clear()
    search_entry.send_keys("Customer Invoices")
    time.sleep(1.2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Customer Invoices" in it.text:
            it.click()
            break
    time.sleep(3)
    
    # Click on "Posted" tab/button in filter
    try:
        posted_btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Posted')]")
        for b in posted_btns:
            if b.is_displayed():
                b.click()
                print("Clicked 'Posted' filter tab")
                break
        time.sleep(2)
        driver.save_screenshot("screenshots/07_posted_invoices_list.png")
        print("Saved screenshots/07_posted_invoices_list.png")
        
        # Double click the first invoice to see line items and accounting moves
        rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
        if rows:
            ActionChains(driver).double_click(rows[0]).perform()
            time.sleep(3)
            driver.save_screenshot("screenshots/08_posted_invoice_detail.png")
            print("Saved screenshots/08_posted_invoice_detail.png")
    except Exception as e:
        print("Error on invoice detail:", e)
        
    # 2. Account Moves (General Ledger Entries)
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    search_entry.clear()
    search_entry.send_keys("Account Moves")
    time.sleep(1.2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Account Moves" in it.text:
            it.click()
            break
    time.sleep(3)
    # Double click first move
    try:
        rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
        if rows:
            ActionChains(driver).double_click(rows[0]).perform()
            time.sleep(3)
    except:
        pass
    driver.save_screenshot("screenshots/09_account_move_detail.png")
    print("Saved screenshots/09_account_move_detail.png")
    
    # 3. Clinical Evaluation Detail (SOAP & Diagnosis)
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    search_entry.clear()
    search_entry.send_keys("Evaluations")
    time.sleep(1.2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Evaluations" in it.text:
            it.click()
            break
    time.sleep(3)
    try:
        rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
        if rows:
            ActionChains(driver).double_click(rows[0]).perform()
            time.sleep(3)
    except:
        pass
    driver.save_screenshot("screenshots/12_evaluation_detail.png")
    print("Saved screenshots/12_evaluation_detail.png")

except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
