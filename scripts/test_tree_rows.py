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
    wait = WebDriverWait(driver, 15)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    time.sleep(1.5)
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    time.sleep(4)
    
    # Inspect tbody rows in #menu
    rows = driver.find_elements(By.CSS_SELECTOR, "#menu table.tree tbody tr")
    print(f"Found {len(rows)} menu rows in table.tree tbody:")
    for i, r in enumerate(rows):
        txt = r.text.strip().replace("\n", " | ")
        print(f"Row {i}: {txt}")
        
    # Also test typing in global-search-entry
    search = driver.find_element(By.ID, "global-search-entry")
    search.send_keys("Patients")
    time.sleep(1.5)
    search_dropdown = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li")
    print(f"Search results for 'Patients': {len(search_dropdown)}")
    for li in search_dropdown:
        print("  Dropdown item:", li.text)
        
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
