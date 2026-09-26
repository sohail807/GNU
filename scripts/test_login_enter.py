import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

opts = Options()
opts.add_argument('--headless=new')
opts.add_argument('--window-size=1600,1000')
driver = webdriver.Chrome(options=opts)
try:
    print("Testing Enter key on password field...")
    driver.get('http://34.7.237.8/')
    time.sleep(2)
    
    login_inp = driver.find_element(By.NAME, 'login')
    login_inp.clear()
    login_inp.send_keys('admin')
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = driver.find_element(By.CSS_SELECTOR, '.ask-dialog input[type="password"], input[name="password"]')
    pwd_inp.send_keys('Admin12345!')
    time.sleep(1)
    
    # Send Enter key instead of clicking OK
    print("Sending Keys.ENTER on password field...")
    pwd_inp.send_keys(Keys.ENTER)
    time.sleep(3)
    
    driver.save_screenshot('reports/login_debug_enter_key.png')
    
    # Did it log in?
    search = driver.find_elements(By.ID, 'global-search-entry')
    if search and search[0].is_displayed():
        print('ENTER KEY SUCCESS: Logged in!')
    else:
        print('ENTER KEY FAILED or still showing dialog.')
        modals = driver.find_elements(By.CSS_SELECTOR, '.ask-dialog')
        for m in modals:
            if m.is_displayed():
                print('Modal text still displayed:\n', repr(m.text))
finally:
    driver.quit()
