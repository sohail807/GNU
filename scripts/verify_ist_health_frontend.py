import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

SCREENSHOT_DIR = os.path.abspath("screenshots/ist_health")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

import sys

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else os.getenv("TEST_BASE_URL", "http://34.7.237.8")

def run_verification():
    print(f"Starting Upgraded IST Health Enterprise HMIS QA on {BASE_URL}...")
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1600,1050")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=opts)

    try:
        # 1. Login Portal (Enterprise Medical OS)
        print("\n1. Verifying Enterprise Login Portal...")
        driver.get(f"{BASE_URL}/login")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "01_enterprise_login.png"))
        print("Captured: 01_enterprise_login.png")

        # Execute Login as Receptionist
        print("Executing Login via demo_frontdesk1...")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_btn.click()
        time.sleep(4) # Wait for redirect to /frontdesk

        # 2. Front Desk Dashboard with Expanded Sidebar
        print(f"Current URL: {driver.current_url}")
        driver.get(f"{BASE_URL}/frontdesk")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "02_frontdesk_expanded.png"))
        print("Captured: 02_frontdesk_expanded.png")

        # 3. Test Sidebar Collapse Toggle
        print("3. Testing Collapsible Sidebar...")
        collapse_btn = driver.find_element(By.CSS_SELECTOR, "button[title*='Collapse Sidebar']")
        collapse_btn.click()
        time.sleep(1)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "03_sidebar_collapsed.png"))
        print("Captured: 03_sidebar_collapsed.png")

        # Expand Sidebar back
        expand_btn = driver.find_element(By.CSS_SELECTOR, "button[title*='Expand Sidebar']")
        expand_btn.click()
        time.sleep(1)

        # 4. Test Interactive Onboarding Tour
        print("4. Testing Interactive Onboarding Tour...")
        tour_btn = driver.find_element(By.CSS_SELECTOR, "button[title*='Interactive Onboarding Walkthrough']")
        tour_btn.click()
        time.sleep(1)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "04_onboarding_walkthrough.png"))
        print("Captured: 04_onboarding_walkthrough.png")

        # Close tour modal
        close_tour_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Skip Tour')]")
        close_tour_btn.click()
        time.sleep(1)

        # 5. Patient Registration Form
        print("5. Verifying Patient Registration Form...")
        driver.get(f"{BASE_URL}/frontdesk/register")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "05_patient_registration.png"))
        print("Captured: 05_patient_registration.png")

        # 6. Appointment Calendar
        print("6. Verifying Appointment Calendar...")
        driver.get(f"{BASE_URL}/frontdesk/appointments")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "06_appointments_calendar.png"))
        print("Captured: 06_appointments_calendar.png")

        # 7. Nursing Triage & Vitals
        print("7. Verifying Nursing Triage & Vitals...")
        driver.get(f"{BASE_URL}/nursing")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "07_nursing_triage.png"))
        print("Captured: 07_nursing_triage.png")

        # 8. Physician Consultation Cockpit
        print("8. Verifying Physician Consultation Cockpit...")
        driver.get(f"{BASE_URL}/physician")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "08_physician_consultation.png"))
        print("Captured: 08_physician_consultation.png")

        # 9. Diagnostic Laboratory CBC
        print("9. Verifying Laboratory CBC Entry...")
        driver.get(f"{BASE_URL}/laboratory")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "09_laboratory_results.png"))
        print("Captured: 09_laboratory_results.png")

        # 10. Digital Radiology Report
        print("10. Verifying Radiology Report...")
        driver.get(f"{BASE_URL}/radiology")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "10_radiology_report.png"))
        print("Captured: 10_radiology_report.png")

        # 11. Outpatient Billing Cashier
        print("11. Verifying Outpatient Billing Cashier...")
        driver.get(f"{BASE_URL}/billing")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "11_cashier_billing.png"))
        print("Captured: 11_cashier_billing.png")

        # 12. Unified Patient Chart
        print("12. Verifying Unified Patient Chart...")
        driver.get(f"{BASE_URL}/patient/66")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "12_unified_patient_chart.png"))
        print("Captured: 12_unified_patient_chart.png")

        # 13. Admin Governance & RBAC
        print("13. Verifying Administration & RBAC...")
        driver.get(f"{BASE_URL}/admin")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "13_admin_governance.png"))
        print("Captured: 13_admin_governance.png")

        # 14. Mobile Responsive Viewport (390x844)
        print("\n14. Verifying Mobile Viewport (390x844)...")
        driver.set_window_size(390, 844)
        driver.get(f"{BASE_URL}/frontdesk")
        time.sleep(2)
        driver.save_screenshot(os.path.join(SCREENSHOT_DIR, "14_mobile_frontdesk.png"))
        print("Captured: 14_mobile_frontdesk.png")

        print("\n[SUCCESS] ALL ENTERPRISE HMIS BROWSER QA SCREENSHOTS SUCCESSFULLY CAPTURED!")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_verification()
