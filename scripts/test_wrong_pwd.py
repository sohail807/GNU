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
    driver.get('http://34.7.237.8/')
    time.sleep(2)
    login_inp = driver.find_element(By.NAME, 'login')
    login_inp.clear()
    login_inp.send_keys('admin')
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = driver.find_element(By.CSS_SELECTOR, '.ask-dialog input[type="password"]')
    pwd_inp.send_keys('wrongpassword')
    time.sleep(1)
    
    ok_btn = driver.find_element(By.CSS_SELECTOR, '.ask-dialog button.btn-primary')
    ok_btn.click()
    time.sleep(3)
    
    # What does the dialog say now?
    modals = driver.find_elements(By.CSS_SELECTOR, '.ask-dialog, .modal')
    for m in modals:
        if m.is_displayed():
            print('Modal after wrong password:\n', repr(m.text))
            
    driver.save_screenshot('reports/login_debug_wrong_pwd.png')
finally:
    driver.quit()
