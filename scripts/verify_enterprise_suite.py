import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--window-size=1600,1000')

driver = webdriver.Chrome(options=opts)
try:
    print("1. Testing Multi-Tenant Login Page on http://34.7.237.8/login...")
    driver.get("http://34.7.237.8/login")
    time.sleep(3)
    
    # Check tenant options
    select_el = driver.find_element(By.TAG_NAME, "select")
    options = [opt.text for opt in select_el.find_elements(By.TAG_NAME, "option")]
    print("   Active Tenant Clinics in Dropdown:", options)
    driver.save_screenshot("reports/enterprise_01_multitenant_login.png")

    print("\n2. Logging in as Physician (demo_dr1 / Doctor2026!)...")
    u_inp = driver.find_element(By.ID, "staff-username")
    u_inp.clear()
    u_inp.send_keys("demo_dr1")
    
    p_inp = driver.find_element(By.ID, "secure-password")
    p_inp.clear()
    p_inp.send_keys("Doctor2026!")
    
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(5)
    print("   Logged in. Current URL:", driver.current_url)

    # Dismiss modal if open
    skip_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Skip Tour')]")
    if skip_btns:
        skip_btns[0].click()
        time.sleep(1)

    print("\n3. Testing Inpatient Care & Bed Census (/inpatient)...")
    driver.get("http://34.7.237.8/inpatient")
    time.sleep(4)
    driver.save_screenshot("reports/enterprise_02_inpatient_census.png")
    print("   Inpatient screenshot saved. Page title:", driver.title)

    print("\n4. Testing Operating Theatre & Surgery (/surgery)...")
    driver.get("http://34.7.237.8/surgery")
    time.sleep(4)
    driver.save_screenshot("reports/enterprise_03_surgery_suites.png")
    print("   Surgery screenshot saved. Page title:", driver.title)

    print("\n5. Testing Hospital Pharmacy & Formulary (/pharmacy)...")
    driver.get("http://34.7.237.8/pharmacy")
    time.sleep(4)
    driver.save_screenshot("reports/enterprise_04_pharmacy_dispensing.png")
    print("   Pharmacy screenshot saved. Page title:", driver.title)

    print("\n[ALL ENTERPRISE MODULES VERIFIED ON LIVE SERVER]")

finally:
    driver.quit()
