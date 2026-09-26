import time
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane

driver = create_driver()
try:
    print("Logging in as demo_dr1...")
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(3)
    
    # Try search box for Patient Evaluations
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Patient Evaluations")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print(f"Doctor search results for 'Patient Evaluations': {len(items)}")
    for it in items:
        print("Search item:", it.text)
    if items:
        items[0].click()
        time.sleep(3)
        pane = get_active_pane(driver)
        print("Doctor opened Patient Evaluations successfully:", pane.text[:150])
        driver.save_screenshot("reports/doctor_eval_menu_verified.png")
        print("Saved reports/doctor_eval_menu_verified.png")

finally:
    driver.quit()
