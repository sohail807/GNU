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
    
    # Try finding Patients element
    patients_elems = driver.find_elements(By.XPATH, "//*[text()='Patients']")
    print(f"Found {len(patients_elems)} Patients elements")
    for el in patients_elems:
        print("Tag:", el.tag_name, "class:", el.get_attribute("class"), "displayed:", el.is_displayed())
        if el.is_displayed():
            print("Clicking Patients element...")
            el.click()
            time.sleep(3)
            driver.save_screenshot("screenshots/03_patients_view.png")
            print("Saved screenshots/03_patients_view.png")
            break
            
except Exception as e:
    print("Error:", e)
finally:
    driver.quit()
