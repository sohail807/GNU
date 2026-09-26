import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, OUT_DIR

driver = create_driver()
try:
    print("Logging in as Nurse demo_nurse1...")
    login(driver, "demo_nurse1", "Nurse2026!")
    time.sleep(2)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_nurse_dashboard.png"))
    print("Saved debug_nurse_dashboard.png")
    
    # Check search suggestions for Evaluat, Triage, Vitals, Patient
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Evaluat")
    time.sleep(1.5)
    
    dds = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Suggestions for 'Evaluat' ({len(dds)}):")
    for d in dds:
        print("  suggestion:", d.text)
        
    search_entry.clear()
    search_entry.send_keys("Health")
    time.sleep(1.5)
    dds = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Suggestions for 'Health' ({len(dds)}):")
    for d in dds:
        print("  suggestion:", d.text)
finally:
    driver.quit()
