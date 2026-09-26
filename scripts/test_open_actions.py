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
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    
    def open_menu_action(query_text, screenshot_file):
        print(f"\n--- Searching for '{query_text}' ---")
        search_entry.clear()
        search_entry.send_keys(query_text)
        time.sleep(1.5)
        # Find the dropdown items
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li")
        print(f"Dropdown items count: {len(items)}")
        for it in items:
            print("  Item text:", it.text)
            if query_text.lower() in it.text.lower() or "health" in it.text.lower():
                print(f"Clicking: {it.text}")
                it.click()
                break
        time.sleep(4)
        driver.save_screenshot(screenshot_file)
        print(f"Saved {screenshot_file}")

    open_menu_action("Patients", "screenshots/03_patients_view.png")
    open_menu_action("Appointments", "screenshots/04_appointments_view.png")
    open_menu_action("Invoices", "screenshots/05_invoices_view.png")
    
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
