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
    
    # inspect all inputs and all modals
    inputs = driver.find_elements(By.TAG_NAME, "input")
    for i in inputs:
        print("INPUT:", {
            "name": i.get_attribute("name"),
            "id": i.get_attribute("id"),
            "type": i.get_attribute("type"),
            "class": i.get_attribute("class"),
            "displayed": i.is_displayed(),
            "enabled": i.is_enabled()
        })
        
    modals = driver.find_elements(By.CLASS_NAME, "modal")
    for m in modals:
        print("MODAL:", m.get_attribute("class"), "displayed:", m.is_displayed())
        # print innerHTML of visible modal
        if m.is_displayed():
            print("Visible modal HTML:\n", m.get_attribute("outerHTML"))

finally:
    driver.quit()
