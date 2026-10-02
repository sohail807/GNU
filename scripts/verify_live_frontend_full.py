import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--window-size=1600,1000')

driver = webdriver.Chrome(options=opts)
try:
    print("1. Navigating to http://34.7.237.8/login...")
    driver.get("http://34.7.237.8/login")
    time.sleep(3)
    print("Page Title:", driver.title)
    
    u_inp = driver.find_element(By.ID, "staff-username")
    u_inp.clear()
    u_inp.send_keys("demo_frontdesk1")
    
    p_inp = driver.find_element(By.ID, "secure-password")
    p_inp.clear()
    p_inp.send_keys("FrontDesk2026!")
        
    time.sleep(1)
    print("   Clicking Sign In...")
    submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit.click()
    time.sleep(5)
    print("   Current URL after login:", driver.current_url)
    
    # Check for error overlays
    overlays = driver.find_elements(By.CSS_SELECTOR, "nextjs-portal, [data-nextjs-dialog-overlay]")
    print("   Error overlays count:", len(overlays))
    
    # Check for patient rows
    rows = driver.find_elements(By.CSS_SELECTOR, "tr, [data-row-id]")
    print("   Table rows rendered:", len(rows))
    
    # Dismiss modal by clicking 'Skip Tour'
    skip = driver.find_elements(By.XPATH, "//button[contains(., 'Skip Tour')]")
    if skip:
        skip[0].click()
        time.sleep(1)
        
    driver.save_screenshot("reports/live_browser_frontdesk_clean_server.png")
    print("   Clean screenshot saved to reports/live_browser_frontdesk_clean_server.png")
finally:
    driver.quit()
