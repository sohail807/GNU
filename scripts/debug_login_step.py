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
    print("Navigating to http://34.7.237.8/ ...")
    driver.get('http://34.7.237.8/')
    time.sleep(2)
    
    login_inp = driver.find_element(By.NAME, 'login')
    login_inp.clear()
    login_inp.send_keys('admin')
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    # Target the password input in the modal
    pwd_inp = driver.find_element(By.CSS_SELECTOR, '.ask-dialog input[type="password"], input[name="password"]')
    print('Found password field:', pwd_inp.get_attribute('name'), pwd_inp.get_attribute('type'))
    pwd_inp.send_keys('Admin12345!')
    time.sleep(1)
    
    # Target the OK button specifically within .ask-dialog
    modal_ok = driver.find_element(By.CSS_SELECTOR, '.ask-dialog button.btn-primary')
    print('Found modal OK button:', modal_ok.text)
    modal_ok.click()
    
    time.sleep(4)
    driver.save_screenshot('reports/login_debug_post_ok.png')
    
    # Check what is currently visible
    print('Current URL:', driver.current_url)
    ask_dialogs = driver.find_elements(By.CSS_SELECTOR, '.ask-dialog')
    for d in ask_dialogs:
        if d.is_displayed():
            print('Still displayed ask-dialog text:\n', repr(d.text))
            
    # Check if main screen / menu / global search is visible
    search = driver.find_elements(By.ID, 'global-search-entry')
    if search and search[0].is_displayed():
        print('SUCCESS: Logged in! global-search-entry is displayed.')
    else:
        print('NOT LOGGED IN YET or dialog still open.')
        
    # Check all visible texts
    body = driver.find_element(By.TAG_NAME, 'body')
    print('Body text snippet:\n', repr(body.text[:300]))
finally:
    driver.quit()
