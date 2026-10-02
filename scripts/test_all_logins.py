import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

users = [
    ("Administrator", "admin", "Admin12345!"),
    ("Physician 01", "demo_dr1", "Doctor2026!"),
    ("Physician 02", "demo_dr2", "Doctor2026!"),
    ("Triage Nurse", "demo_nurse1", "Nurse2026!"),
    ("Receptionist", "demo_frontdesk1", "FrontDesk2026!"),
    ("Cashier", "demo_cashier1", "Cashier2026!"),
    ("Lab Tech", "demo_lab1", "Lab2026!"),
    ("Radiology Tech", "demo_rad1", "Rad2026!")
]

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--window-size=1600,1000')

results = []

for role, uname, pwd in users:
    driver = webdriver.Chrome(options=opts)
    try:
        driver.get('http://34.7.237.8/')
        time.sleep(2)
        
        login_inp = driver.find_element(By.NAME, 'login')
        login_inp.clear()
        login_inp.send_keys(uname)
        login_inp.send_keys(Keys.ENTER)
        time.sleep(2)
        
        pwd_inp = driver.find_element(By.CSS_SELECTOR, '.ask-dialog input[type="password"], input[name="password"]')
        pwd_inp.send_keys(pwd)
        time.sleep(1)
        
        ok_btn = driver.find_element(By.CSS_SELECTOR, '.ask-dialog button.btn-primary')
        ok_btn.click()
        time.sleep(3)
        
        # Check if login succeeded
        user_badge = driver.find_elements(By.CSS_SELECTOR, '.navbar-right, .user-name, #user-preferences')
        search = driver.find_elements(By.ID, 'global-search-entry')
        
        # Check if password dialog is still there
        pwd_still_there = driver.find_elements(By.CSS_SELECTOR, '.ask-dialog input[type="password"]')
        is_pwd_visible = any(p.is_displayed() for p in pwd_still_there)
        
        if is_pwd_visible:
            results.append((role, uname, pwd, "FAIL: Still asking password"))
        else:
            results.append((role, uname, pwd, "SUCCESS: Logged In"))
    except Exception as e:
        results.append((role, uname, pwd, f"ERROR: {str(e)[:60]}"))
    finally:
        driver.quit()

print("\n--- LOGIN TEST RESULTS ---")
for r in results:
    print(f"{r[0]:<20} | User: {r[1]:<16} | Pwd: {r[2]:<15} | Result: {r[3]}")
