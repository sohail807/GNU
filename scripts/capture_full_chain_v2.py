import sys, time, os
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu, OUT_DIR
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

driver = create_driver()
try:
    print("Capturing Phase 13: Full Chain Traceability...")
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
        print("Switching back to Patients tab...")
        tabs = driver.find_elements(By.CSS_SELECTOR, "ul.navbar-nav li")
        for t in tabs:
            if "Patients" in t.text and "Appointments" not in t.text and "Evaluations" not in t.text:
                t.click()
                time.sleep(1.5)
                return
        print("Warning: Could not find Patients tab in navbar.")

    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    
    # 1. Open Appointments
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Appointments']").click()
    time.sleep(2)
    print("Opened Appointments tab.")
    
    # 2. Back to Patients -> Open Evaluations
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Evaluations']").click()
    time.sleep(2)
    print("Opened Evaluations tab.")
    
    # 3. Back to Patients -> Open Prescriptions
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Prescriptions']").click()
    time.sleep(2)
    print("Opened Prescriptions tab.")
    
    # 4. Back to Patients -> Open Lab Results
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Lab: Results']").click()
    time.sleep(2)
    print("Opened Lab Results tab.")
    
    # 5. Back to Patients -> Open Medical Imaging Results
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Medical Imaging Results']").click()
    time.sleep(2)
    print("Opened Medical Imaging Results tab.")
    
    # 6. Switch back to Patients and open Relate dropdown so user sees both the tabs bar and relate menu
    switch_to_patients_tab()
    patient_pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1.5)
    
    out_path = os.path.join(OUT_DIR, "14_complete_transaction.png")
    driver.save_screenshot(out_path)
    print(f"Successfully captured {out_path}!")

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_full_chain_err2.png"))
finally:
    driver.quit()
