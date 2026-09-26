import sys, time, os
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu, OUT_DIR
from selenium.webdriver.common.by import By

driver = create_driver()
try:
    login(driver, 'demo_dr1', 'Doctor2026!')
    open_menu(driver, 'Patients')
    time.sleep(2.5)
    
    # Check top navbar items
    nav_tabs = driver.find_elements(By.CSS_SELECTOR, "nav li, .navbar-nav li, #main-tab li, ul.nav li")
    print(f"Found {len(nav_tabs)} nav items:")
    for nt in nav_tabs:
        print(f"  Tag: {nt.tag_name}, Class: {nt.get_attribute('class')}, Text: {nt.text}")

finally:
    driver.quit()
