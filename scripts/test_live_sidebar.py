import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

def test_roles_sidebar():
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    roles = [
        ('demo_frontdesk1', 'FrontDesk2026!', 'frontdesk'),
        ('demo_nurse1', 'Nurse2026!', 'nurse'),
        ('demo_dr1', 'Doctor2026!', 'doctor'),
        ('demo_cashier1', 'Cashier2026!', 'cashier'),
        ('demo_lab1', 'Lab2026!', 'lab'),
        ('demo_rad1', 'Rad2026!', 'radiology'),
    ]

    target_url = os.environ.get('FRONTEND_URL', 'http://34.7.237.8')
    os.makedirs('reports/sidebar_debug', exist_ok=True)

    for username, password, role_name in roles:
        driver = webdriver.Chrome(options=options)
        try:
            driver.set_window_size(1440, 900)
            driver.get(f"{target_url}/login")
            time.sleep(1.5)

            # Set localStorage to prevent tour modal
            driver.execute_script("localStorage.setItem('ist_health_tour_completed', 'true');")

            user_input = driver.find_element(By.ID, 'login-username')
            user_input.clear()
            user_input.send_keys(username)

            pass_input = driver.find_element(By.ID, 'login-password')
            pass_input.clear()
            pass_input.send_keys(password)

            submit_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            submit_btn.click()

            WebDriverWait(driver, 10).until(lambda d: '/login' not in d.current_url)
            time.sleep(2)

            # Dismiss any modal if open
            try:
                close_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Skip Tour') or contains(text(), 'Close')]")
                close_btn.click()
                time.sleep(1)
            except Exception:
                pass

            driver.save_screenshot(f'reports/sidebar_debug/{role_name}_sidebar.png')
            print(f"\n=================== ROLE: {role_name} ({username}) ===================")
            print('Current URL:', driver.current_url)

            aside = driver.find_element(By.TAG_NAME, 'aside')
            
            # Print user profile from sidebar
            try:
                profile_div = aside.find_element(By.CSS_SELECTOR, '.capitalize')
                print('Sidebar Profile Text:', profile_div.text)
            except Exception as e:
                print('Profile div error:', e)

            links = aside.find_elements(By.TAG_NAME, 'a')
            print(f'Active Visible Links ({len(links)}):')
            for l in links:
                t = l.text.replace('\n', ' | ')
                print(f'   - {t} -> {l.get_attribute("href")}')

            # Check if there are any non-link rows in navigation
            nav_container = aside.find_element(By.CSS_SELECTOR, '.space-y-4')
            all_text = nav_container.text.split('\n')
            print('Nav Container Text Lines:', all_text)

        finally:
            driver.quit()

if __name__ == '__main__':
    test_roles_sidebar()
