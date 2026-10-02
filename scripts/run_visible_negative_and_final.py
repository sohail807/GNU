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
os.makedirs(OUT_DIR, exist_ok=True)
BASE_URL = "http://34.7.237.8/"

def create_visible_driver():
    opts = Options()
    opts.add_argument("--window-size=1600,1000")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    return webdriver.Chrome(options=opts)

def login(driver, username, password):
    print(f"Logging in as {username}...")
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)
    
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys(username)
    time.sleep(1)
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys(password)
    time.sleep(1)
    
    ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
    if ok_btns:
        driver.execute_script("arguments[0].click();", ok_btns[0])
    else:
        pwd_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    try:
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    except Exception:
        ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
        if ok_btns:
            driver.execute_script("arguments[0].click();", ok_btns[0])
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    print(f"Successfully logged in as {username}.")

def logout(driver):
    print("Logging out...")
    driver.delete_all_cookies()
    driver.get(BASE_URL)
    time.sleep(2)

driver = create_visible_driver()
try:
    print("=======================================================")
    print("EXECUTING VISIBLE BROWSER NEGATIVE RBAC & FINAL TESTS")
    print("=======================================================")
    
    # ---------------------------------------------------------
    # TEST 1: FRONT DESK RBAC BOUNDARY (No Clinical / Rx Access)
    # ---------------------------------------------------------
    print("\n--- TEST 1: FRONT DESK RBAC BOUNDARY ---")
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    rx_found = [it.text for it in items if "Prescription" in it.text]
    print(f"  Front Desk search for 'Prescriptions' yielded: {rx_found} (Expected: None)")
    
    # Capture 17_frontdesk_negative.png
    out17 = os.path.join(OUT_DIR, "17_frontdesk_negative.png")
    driver.save_screenshot(out17)
    print(f"  Captured {out17} ({os.path.getsize(out17):,} bytes)")
    logout(driver)

    # ---------------------------------------------------------
    # TEST 2: CASHIER RBAC BOUNDARY (No Clinical Access)
    # ---------------------------------------------------------
    print("\n--- TEST 2: CASHIER RBAC BOUNDARY ---")
    login(driver, "demo_cashier1", "Cashier2026!")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Evaluations")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    eval_found = [it.text for it in items if "Evaluation" in it.text]
    print(f"  Cashier search for 'Evaluations' yielded: {eval_found} (Expected: None)")
    
    # Capture 18_cashier_negative.png
    out18 = os.path.join(OUT_DIR, "18_cashier_negative.png")
    driver.save_screenshot(out18)
    print(f"  Captured {out18} ({os.path.getsize(out18):,} bytes)")
    logout(driver)

    # ---------------------------------------------------------
    # TEST 3: PHYSICIAN RBAC BOUNDARY (No Accounting Moves Admin)
    # ---------------------------------------------------------
    print("\n--- TEST 3: PHYSICIAN RBAC BOUNDARY ---")
    login(driver, "demo_dr1", "Doctor2026!")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Account Moves")
    time.sleep(2)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    moves_found = [it.text for it in items if "Account Moves" in it.text or "Move Lines" in it.text]
    print(f"  Physician search for 'Account Moves' yielded: {moves_found} (Expected: None)")
    
    # Capture 19_physician_negative.png
    out19 = os.path.join(OUT_DIR, "19_physician_negative.png")
    driver.save_screenshot(out19)
    print(f"  Captured {out19} ({os.path.getsize(out19):,} bytes)")

    # ---------------------------------------------------------
    # TEST 4: CONSOLIDATED FINAL TRANSACTION VIEW
    # ---------------------------------------------------------
    print("\n--- TEST 4: CONSOLIDATED FINAL TRANSACTION VIEW ---")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Patients")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    for it in items:
        if "Patients / Patients" in it.text or it.text == "Health / Patients / Patients":
            it.click()
            break
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text or "KQI816APL" in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    patient_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(2)
    
    # Capture 20_final_transaction.png
    out20 = os.path.join(OUT_DIR, "20_final_transaction.png")
    driver.save_screenshot(out20)
    print(f"  Captured {out20} ({os.path.getsize(out20):,} bytes)")
    
    print("\nVisible browser negative & final transaction tests completed successfully!")

finally:
    driver.quit()
