import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

OUT_DIR = os.path.join("reports", "live_browser_test")

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1600,1000")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=opts)
try:
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    # 1. Login
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys("demo_frontdesk1")
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2.5)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys("FrontDesk2026!")
    pwd_inp.send_keys(Keys.ENTER)
    
    # 2. Search Appointments
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
    
    # Click Switch view (<->) button to switch to form view
    switch_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title*='Switch']")
    switch_btn.click()
    time.sleep(2)
    
    # Click New (+) button in form view
    new_btn = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_apt_full_form.png"))
    print("Saved debug_apt_full_form.png")
    
    # Inspect inputs in full form view
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    inputs = pane.find_elements(By.CSS_SELECTOR, "input, select")
    print(f"Inputs in full form view ({len(inputs)}):")
    for inp in inputs:
        if inp.is_displayed():
            print(f"  name='{inp.get_attribute('name')}', type='{inp.get_attribute('type')}', tag='{inp.tag_name}'")
finally:
    driver.quit()
