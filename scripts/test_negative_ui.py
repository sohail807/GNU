import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    # 1. Front Desk negative test
    login(driver, "demo_frontdesk1", "Frontdesk2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print("Front Desk search for 'Prescriptions':", [it.text for it in items])
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_frontdesk_rx_search.png"))
    
    search_entry.clear()
    search_entry.send_keys("Evaluations")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print("Front Desk search for 'Evaluations':", [it.text for it in items])
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_frontdesk_eval_search.png"))

    # Logout
    driver.delete_all_cookies()
    driver.get("http://34.7.237.8/")
    time.sleep(2)

    # 2. Cashier negative test
    login(driver, "demo_cashier1", "Cashier2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.clear()
    search_entry.send_keys("Evaluations")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print("Cashier search for 'Evaluations':", [it.text for it in items])
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_cashier_eval_search.png"))

    # Logout
    driver.delete_all_cookies()
    driver.get("http://34.7.237.8/")
    time.sleep(2)

    # 3. Physician negative test
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.clear()
    search_entry.send_keys("Account Moves")
    time.sleep(2)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    print("Physician search for 'Account Moves':", [it.text for it in items])
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_physician_moves_search.png"))

finally:
    driver.quit()
