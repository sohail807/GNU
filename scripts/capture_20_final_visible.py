import sys, time, os
sys.path.append('scripts')
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import login, open_menu, OUT_DIR

opts = Options()
opts.add_argument("--window-size=1600,1000")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=opts)

try:
    print("Capturing 16_patient_related_records.png and 20_final_transaction.png in visible Chrome...")
    login(driver, 'demo_dr1', 'Doctor2026!')
    open_menu(driver, 'Patients')
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    for r in pane.find_elements(By.CSS_SELECTOR, 'table tbody tr'):
        if 'LIVE E2E' in r.text or 'KQI816APL' in r.text:
            print("Opening patient form...")
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    def switch_to_patients_tab():
        tabs = driver.find_elements(By.CSS_SELECTOR, "ul.navbar-nav li")
        for t in tabs:
            if "Patients" in t.text and "Appointments" not in t.text and "Evaluations" not in t.text:
                t.click()
                time.sleep(1.5)
                return

    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    
    # 1. Open Appointments
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Appointments']").click()
    time.sleep(2)
    
    # 2. Back to Patients -> Open Evaluations
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Evaluations']").click()
    time.sleep(2)
    
    # 3. Back to Patients -> Open Prescriptions
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Prescriptions']").click()
    time.sleep(2)
    
    # 4. Back to Patients -> Open Lab Results
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Lab: Results']").click()
    time.sleep(2)
    
    # 5. Back to Patients -> Open Medical Imaging Results
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Medical Imaging Results']").click()
    time.sleep(2)
    
    # 6. Switch back to Patients and open Relate dropdown so user sees both the tabs bar and relate menu
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1.5)
    
    out16 = os.path.join(OUT_DIR, "16_patient_related_records.png")
    driver.save_screenshot(out16)
    print(f"Captured {out16} ({os.path.getsize(out16):,} bytes)!")
    
    out20 = os.path.join(OUT_DIR, "20_final_transaction.png")
    driver.save_screenshot(out20)
    print(f"Captured {out20} ({os.path.getsize(out20):,} bytes)!")

finally:
    driver.quit()
