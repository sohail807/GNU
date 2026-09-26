import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 15)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    time.sleep(1.5)
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    time.sleep(4)
    
    # In Tryton SAO, the left menu is rendered in a tree
    # Let's inspect the elements
    links = driver.find_elements(By.TAG_NAME, "a")
    print(f"Total <a> tags: {len(links)}")
    for a in links:
        txt = a.text.strip()
        if txt and any(k in txt for k in ["Patient", "Appoint", "Prescription", "Financial", "Invoice", "Laboratory", "Imaging"]):
            print(f"<a> text: '{txt}', class: '{a.get_attribute('class')}', id: '{a.get_attribute('id')}'")
            
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
