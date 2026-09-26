import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, get_active_pane, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_dr1", "Doctor2026!")
    time.sleep(2)
    
    # Open Prescriptions
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(1.5)
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    items[0].click()
    time.sleep(2.5)
    
    pane = get_active_pane(driver)
    
    # Click New (+) on top toolbar
    new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
    new_btn.click()
    time.sleep(2)
    
    # Select Patient
    patient_inp = pane.find_element(By.NAME, "patient")
    patient_inp.click()
    patient_inp.clear()
    patient_inp.send_keys("LIVE E2E TEST PATIENT")
    time.sleep(1)
    patient_inp.send_keys(Keys.TAB)
    time.sleep(1.5)
    print("Entered patient name.")
    
    # Find the Prescription Line toolbar 'New' button
    # Let's locate the prescription_line container
    line_new_btns = pane.find_elements(By.CSS_SELECTOR, "button[title='New']")
    print(f"Total 'New' buttons found: {len(line_new_btns)}")
    # The second New button should be the line new button
    line_new_btn = line_new_btns[1]
    line_new_btn.click()
    time.sleep(2)
    
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_line_clicked.png"))
    
    # Check if a modal popped up
    modals = driver.find_elements(By.CSS_SELECTOR, ".modal.in, .modal.show")
    print(f"Modals open: {len(modals)}")
    for idx, m in enumerate(modals):
        print(f"Modal {idx}: text={m.text[:100]}")
        inputs = m.find_elements(By.CSS_SELECTOR, "input, select, textarea, button")
        for inp in inputs:
            n = inp.get_attribute("name")
            t = inp.get_attribute("type")
            title = inp.get_attribute("title")
            if n or title:
                print(f"  Modal elem name={n} type={t} title={title}")
                
except Exception as e:
    print("Error:", e)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_prescription_error.png"))
finally:
    driver.quit()
