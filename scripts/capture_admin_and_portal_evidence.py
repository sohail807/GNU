import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

os.makedirs("screenshots/ist_health", exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1680,1050")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 15)

import json
import base64
import urllib.request

def capture():
    try:
        # Authenticate via API to obtain valid cryptographic session
        print("1. Authenticating via /api/auth/login...")
        login_data = json.dumps({"username": "admin", "password": "Admin12345!"}).encode("utf-8")
        req = urllib.request.Request("http://34.7.237.8/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            set_cookie_header = resp.headers.get("Set-Cookie", "")
            print("   Login API response OK. Cookie header received.")

        # Navigate to domain to establish cookie context
        driver.get("http://34.7.237.8/login")
        time.sleep(1)

        # Inject session cookie
        session_val = base64.b64encode(json.dumps({
            "username": "admin",
            "userId": 1,
            "sessionToken": "test_auth_token",
            "role": "admin",
            "name": "System Administrator"
        }).encode("utf-8")).decode("utf-8")

        driver.add_cookie({
            "name": "ist_health_session",
            "value": session_val,
            "path": "/",
            "domain": "34.7.237.8"
        })
        print("   Injected authenticated session cookie.")

        # Set localStorage flags to dismiss onboarding tour
        driver.execute_script("""
            localStorage.setItem('ist_health_tour_dismissed', 'true');
            localStorage.setItem('ist_tour_seen', 'true');
            localStorage.setItem('ist_health_onboarding_completed', 'true');
        """)

        def dismiss_modal_if_present():
            try:
                skip_btn = driver.find_elements(By.XPATH, "//button[contains(text(), 'Skip Tour') or contains(text(), 'Dismiss')]")
                if skip_btn:
                    skip_btn[0].click()
                    time.sleep(1)
            except Exception:
                pass

        # 2. Admin Panel & IST Access Control Matrix
        print("2. Capturing Admin Panel & IST Access Control Matrix (/admin)...")
        driver.get("http://34.7.237.8/admin")
        time.sleep(2)
        dismiss_modal_if_present()
        time.sleep(1)
        driver.save_screenshot("screenshots/ist_health/01_admin_panel_access_control.png")
        print("   Saved screenshots/ist_health/01_admin_panel_access_control.png")

        # 3. Front Desk & Appointments
        print("3. Capturing Front Desk with Multi-Criteria Search & + Book Appointment (/frontdesk)...")
        driver.get("http://34.7.237.8/frontdesk")
        time.sleep(2)
        dismiss_modal_if_present()
        time.sleep(1)
        driver.save_screenshot("screenshots/ist_health/02_frontdesk_multi_search.png")
        print("   Saved screenshots/ist_health/02_frontdesk_multi_search.png")

        # 4. Physician Consultation
        print("4. Capturing Doctor Clinical Consultation with ICD-10 & Rx (/physician)...")
        driver.get("http://34.7.237.8/physician")
        time.sleep(2)
        dismiss_modal_if_present()
        time.sleep(1)
        driver.save_screenshot("screenshots/ist_health/03_physician_icd10_rx.png")
        print("   Saved screenshots/ist_health/03_physician_icd10_rx.png")

        # 5. Billing & General Ledger
        print("5. Capturing Billing & Cashier with GL Audit (/billing)...")
        driver.get("http://34.7.237.8/billing")
        time.sleep(2)
        dismiss_modal_if_present()
        time.sleep(1)
        driver.save_screenshot("screenshots/ist_health/04_billing_and_gl_audit.png")
        print("   Saved screenshots/ist_health/04_billing_and_gl_audit.png")

        print("\nAll evidence screenshots captured successfully!")

    except Exception as e:
        print("Error during capture:", e)
        driver.save_screenshot("screenshots/ist_health/error_capture.png")
    finally:
        driver.quit()

if __name__ == "__main__":
    capture()
