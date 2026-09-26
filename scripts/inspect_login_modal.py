import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1600,1000")
driver = webdriver.Chrome(options=opts)
try:
    driver.get("http://34.7.237.8/")
    time.sleep(2)
    inp = driver.find_element(By.NAME, "login")
    inp.send_keys("demo_dr1")
    inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    # inspect modal
    modal = driver.find_element(By.CLASS_NAME, "modal-content")
    print("Modal HTML:")
    print(modal.get_attribute("outerHTML"))
finally:
    driver.quit()
