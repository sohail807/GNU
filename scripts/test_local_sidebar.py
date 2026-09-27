import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def main():
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    driver = webdriver.Chrome(options=options)
    try:
        driver.set_window_size(1440, 900)
        driver.get('http://localhost:3000/login')
        time.sleep(1)
        driver.execute_script("localStorage.setItem('ist_health_tour_completed', 'true');")
        user_input = driver.find_element(By.ID, 'login-username')
        user_input.clear()
        user_input.send_keys('demo_dr1')
        pass_input = driver.find_element(By.ID, 'login-password')
        pass_input.clear()
        pass_input.send_keys('Doctor2026!')
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        time.sleep(3)
        print('Localhost nurse current url:', driver.current_url)
        try:
            skip = driver.find_element(By.XPATH, "//button[contains(text(), 'Skip Tour')]")
            skip.click()
            time.sleep(0.5)
        except Exception:
            pass
        driver.save_screenshot('reports/localhost_nurse.png')
        aside = driver.find_element(By.TAG_NAME, 'aside')
        links = [a.text.replace('\n', ' ') for a in aside.find_elements(By.TAG_NAME, 'a')]
        print('Localhost nurse links:', links)
    except Exception as e:
        print('Error:', e)
    finally:
        driver.quit()

if __name__ == '__main__':
    main()
