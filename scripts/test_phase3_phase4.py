import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=chrome_options)
try:
    print("Navigating to Tryton SAO...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    # 1. Login
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys("demo_frontdesk1")
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.send_keys("FrontDesk2026!")
    pwd_inp.send_keys(Keys.ENTER)
    
    # 2. Open Appointments
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    search_entry.send_keys("Appointments")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Appointments" in it.text:
            it.click()
            break
    time.sleep(3)
    
    active_pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    
    # 3. Click New (+) button
    new_btn = active_pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2.5)
    
    # 4. Inspect fields on Appointment Form
    driver.save_screenshot("reports/live_browser_test/debug_new_appointment_form.png")
    print("Saved debug_new_appointment_form.png")
    
    inputs = active_pane.find_elements(By.CSS_SELECTOR, "input, select")
    print(f"Appointment form inputs ({len(inputs)}):")
    for inp in inputs:
        print("  field:", inp.get_attribute("name"), inp.get_attribute("type"), inp.tag_name)
        
finally:
    driver.quit()
