import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

OUT_DIR = os.path.join("reports", "live_browser_test")
BASE_URL = "http://34.7.237.8/"

opts = Options()
opts.add_argument("--window-size=1600,1000")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=opts)

try:
    print("Capturing 20_final_transaction.png in visible browser...")
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)
    
    # Login as demo_dr1
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys("demo_dr1")
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys("Doctor2026!")
    time.sleep(1)
    
    ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
    if ok_btns:
        driver.execute_script("arguments[0].click();", ok_btns[0])
    else:
        pwd_inp.send_keys(Keys.ENTER)
    time.sleep(3)
    
    search_entry = wait.until(EC.element_to_be_clickable((By.ID, "global-search-entry")))
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Patients")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Patients / Patients" in it.text or it.text == "Health / Patients / Patients":
            it.click()
            break
    time.sleep(4)
    
    pane = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")))
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    print(f"Found {len(rows)} patient rows.")
    for r in rows:
        if "LIVE E2E" in r.text or "KQI816APL" in r.text:
            print("Double clicking patient record:", r.text)
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    patient_pane = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")))
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(2)
    
    out20 = os.path.join(OUT_DIR, "20_final_transaction.png")
    driver.save_screenshot(out20)
    size = os.path.getsize(out20)
    print(f"SUCCESS: Captured {out20} ({size:,} bytes)")

finally:
    driver.quit()
