import os
import sys
import time
sys.path.append(os.path.join(os.path.dirname(__file__)))
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, open_menu, click_new, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_frontdesk1", "FrontDesk2026!")
    open_menu(driver, "Appointments")
    click_new(driver)
    
    pane = driver.find_element(By.CSS_SELECTOR, ".tab-pane.active")
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys("LIVE")
    time.sleep(2.5)
    
    dds = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    print(f"Dropdown items for patient ({len(dds)}):")
    for d in dds:
        print("  dropdown item:", repr(d.text), "displayed:", d.is_displayed())
finally:
    driver.quit()
