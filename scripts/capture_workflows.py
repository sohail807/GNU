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
    
    time.sleep(3)
    
    def open_action(search_term, expected_text, screenshot_name):
        print(f"Opening '{search_term}'...")
        search = driver.find_element(By.ID, "global-search-entry")
        search.clear()
        search.send_keys(search_term)
        time.sleep(1)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        clicked = False
        for item in items:
            if expected_text.lower() in item.text.lower():
                print(f"Clicking dropdown item: '{item.text}'")
                item.click()
                clicked = True
                break
        if not clicked and items:
            print(f"Clicking first dropdown item: '{items[0].text}'")
            items[0].click()
            
        time.sleep(3)
        driver.save_screenshot(f"screenshots/{screenshot_name}.png")
        print(f"Saved screenshots/{screenshot_name}.png")

    open_action("Patients", "Health / Patients", "03_patients_list")
    open_action("Appointments", "Appointments", "04_appointments_list")
    open_action("Invoices", "Invoices", "05_invoices_list")
    open_action("General Ledger", "General Ledger", "06_general_ledger")
    
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
