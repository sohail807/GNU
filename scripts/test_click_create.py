import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 20)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("demo_frontdesk1")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys(os.environ.get("DEMO_FRONTDESK_PASS", "FrontDesk2026!"))
    pwd_input.send_keys(Keys.ENTER)
    
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    search_entry.send_keys("Patients")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Patients" in it.text:
            it.click()
            break
    time.sleep(3)
    
    # Click New button
    new_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Type party name
    party_input = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active input[name='party']")
    party_input.click()
    party_input.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(1.5)
    
    # Find Create... in dropdown
    create_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Create...')] | //li[contains(text(), 'Create...')]")
    print(f"Found {len(create_links)} create links")
    for cl in create_links:
        print("  Create link:", cl.text, cl.tag_name)
        if "Create" in cl.text:
            cl.click()
            print("Clicked Create...")
            break
            
    time.sleep(3)
    driver.save_screenshot("reports/live_browser_test/debug_create_clicked.png")
    print("Saved debug_create_clicked.png")
    
finally:
    driver.quit()
