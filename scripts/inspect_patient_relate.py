import sys, time, os
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu, OUT_DIR
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

driver = create_driver()
try:
    login(driver, 'demo_dr1', 'Doctor2026!')
    open_menu(driver, 'Patients')
    time.sleep(2.5)
    
    pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    for r in pane.find_elements(By.CSS_SELECTOR, 'table tbody tr'):
        if 'LIVE E2E' in r.text or 'KQI816APL' in r.text:
            print("Found patient row:", r.text)
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    pane = driver.find_element(By.CSS_SELECTOR, 'div.tab-content > div.tab-pane.active')
    
    # Click related records button
    rel_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1.5)
    
    rel_items = pane.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    print(f"Found {len(rel_items)} relate menu items:")
    for it in rel_items:
        print(f"  - {it.text}")
        
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_patient_relate_dropdown.png"))
    print("Saved debug_patient_relate_dropdown.png")

except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_relate_err2.png"))
finally:
    driver.quit()
