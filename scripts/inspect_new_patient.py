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
    
    # In the active tab, find the '+' (New) button
    # Tryton SAO toolbar buttons
    buttons = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active .btn-toolbar button, .tab-pane.active button")
    print(f"Found {len(buttons)} buttons in tab:")
    for b in buttons:
        title = b.get_attribute("title")
        cls = b.get_attribute("class")
        aria = b.get_attribute("aria-label")
        txt = b.text.strip()
        print(f"  Button title='{title}', aria='{aria}', class='{cls}', text='{txt}'")
        if title == "New" or aria == "New" or "plus" in cls:
            print("Clicking NEW button...")
            b.click()
            break
            
    time.sleep(3)
    driver.save_screenshot("reports/live_browser_test/debug_new_patient_form.png")
    print("Saved debug_new_patient_form.png")
    
    # Inspect all inputs in the form
    inputs = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active input, .tab-pane.active select, .tab-pane.active textarea")
    print(f"Found {len(inputs)} form controls:")
    for inp in inputs:
        print(f"  Tag={inp.tag_name}, name={inp.get_attribute('name')}, id={inp.get_attribute('id')}, type={inp.get_attribute('type')}, class={inp.get_attribute('class')}")
        
finally:
    driver.quit()
