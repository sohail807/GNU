import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "http://127.0.0.1:13100"
OUT_DIR = "deck_screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

STAGES = [
    {"name": "01_frontdesk", "username": "demo_frontdesk1", "password": "FrontDesk2026!", "landing": "/frontdesk"},
    {"name": "02_nursing", "username": "demo_nurse1", "password": "Nurse2026!", "landing": "/nursing"},
    {"name": "03_physician", "username": "demo_dr1", "password": "Doctor2026!", "landing": "/physician"},
    {"name": "04_pharmacy", "username": "demo_dr1", "password": "Doctor2026!", "landing": "/pharmacy"},
    {"name": "05_laboratory", "username": "demo_lab1", "password": "Lab2026!", "landing": "/laboratory"},
    {"name": "06_billing", "username": "demo_cashier1", "password": "Cashier2026!", "landing": "/billing"},
    {"name": "07_admin", "username": "demo_admin1", "password": "DemoAdmin2026!", "landing": "/admin"},
]

options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1600,1000")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--force-device-scale-factor=1")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 20)

try:
    for stage in STAGES:
        print(f"--- {stage['name']} ---")
        driver.delete_all_cookies()
        driver.get(f"{BASE}/login")
        driver.execute_script("localStorage.setItem('ist_health_tour_completed', 'true');")
        time.sleep(1)

        username_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, 'input[placeholder="Your staff username"]')))
        username_input.clear()
        username_input.send_keys(stage["username"])

        password_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        password_input.clear()
        password_input.send_keys(stage["password"])

        submit_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        submit_btn.click()
        time.sleep(2.5)

        # Follow to the expected landing page (login may already redirect there)
        if stage["landing"] not in driver.current_url:
            driver.get(f"{BASE}{stage['landing']}")
            time.sleep(2)

        try:
            skip_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Skip Tour')]")
            skip_btn.click()
            time.sleep(0.5)
        except Exception:
            pass

        print("URL:", driver.current_url)
        path = os.path.join(OUT_DIR, f"{stage['name']}.png")
        driver.save_screenshot(path)
        print("Saved", path)

finally:
    driver.quit()
    print("Done.")
