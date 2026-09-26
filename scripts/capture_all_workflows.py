import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1600,1000")
chrome_options.add_argument("--no-sandbox")

os.makedirs("screenshots", exist_ok=True)

driver = webdriver.Chrome(options=chrome_options)
try:
    print("Navigating to http://34.7.237.8/ ...")
    driver.get("http://34.7.237.8/")
    wait = WebDriverWait(driver, 20)
    
    login_input = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    login_input.clear()
    login_input.send_keys("admin")
    login_input.send_keys(Keys.ENTER)
    
    pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_input.clear()
    pwd_input.send_keys("Admin12345!")
    pwd_input.send_keys(Keys.ENTER)
    
    search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    time.sleep(2)
    
    def open_exact_action(search_query, match_text, screenshot_file, double_click_row=False):
        print(f"\nSearching '{search_query}' for '{match_text}' -> {screenshot_file}")
        search_entry = wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
        search_entry.clear()
        search_entry.send_keys(search_query)
        time.sleep(1.2)
        
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        matched = False
        for item in items:
            t = item.text.strip()
            if match_text.lower() in t.lower():
                print(f"Clicking dropdown item: '{t}'")
                item.click()
                matched = True
                break
        if not matched and items:
            print(f"Fallback clicking: '{items[0].text}'")
            items[0].click()
            
        time.sleep(3.5)
        
        if double_click_row:
            try:
                # Find the first table row in the active tab and double click it to open form view
                rows = driver.find_elements(By.CSS_SELECTOR, ".tab-pane.active table tbody tr")
                if rows:
                    print("Double clicking first row to open detail form view...")
                    ActionChains(driver).double_click(rows[0]).perform()
                    time.sleep(3)
            except Exception as e_dc:
                print("Double click error:", e_dc)
                
        driver.save_screenshot(f"screenshots/{screenshot_file}")
        print(f"Saved screenshots/{screenshot_file}")

    # 1. Patients List
    open_exact_action("Patients", "Health / Patients", "01_patients_list.png")
    
    # 2. Patient Detail Form
    open_exact_action("Patients", "Health / Patients", "02_patient_detail_record.png", double_click_row=True)
    
    # 3. Appointments List
    open_exact_action("Appointments", "Health / Appointments", "03_appointments_list.png")
    
    # 4. Clinical Evaluations / Nursing
    open_exact_action("Evaluations", "Patient Evaluations", "04_evaluations_list.png")
    
    # 5. Prescriptions
    open_exact_action("Prescriptions", "Health / Prescriptions", "05_prescriptions_list.png")
    
    # 6. Laboratory
    open_exact_action("Laboratory", "Laboratory / Test", "06_laboratory_tests.png")
    
    # 7. Customer Invoices
    open_exact_action("Customer Invoices", "Customer Invoices", "07_customer_invoices.png")
    
    # 8. Customer Invoice Detail
    open_exact_action("Customer Invoices", "Customer Invoices", "08_invoice_detail.png", double_click_row=True)
    
    # 9. General Ledger / Account Moves
    open_exact_action("General Ledger", "General Ledger", "09_general_ledger.png")
    
    # 10. Health Professionals Roster
    open_exact_action("Health Professionals", "Health Professionals", "10_health_professionals.png")

except Exception as e:
    print("Error during execution:", e)
finally:
    driver.quit()
