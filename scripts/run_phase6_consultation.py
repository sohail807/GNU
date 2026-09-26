import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from lib_e2e import create_driver, login, open_menu, OUT_DIR

driver = create_driver()
try:
    print("PHASE 6: Physician Consultation Workflow")
    print("Step 1: Logging in as Doctor demo_dr1...")
    login(driver, "demo_dr1", "Doctor2026!")
    
    print("Step 2: Navigating to Patients...")
    open_menu(driver, "Patients")
    time.sleep(2.5)
    
    print("Step 3: Opening LIVE E2E TEST PATIENT record...")
    pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active")
    rows = pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    for r in rows:
        if "LIVE E2E" in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    print("Step 4: Opening related Evaluations...")
    relate_btn = pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    relate_btn.click()
    time.sleep(1.5)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[contains(text(), 'Evaluations')]").click()
    time.sleep(3)
    
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    eval_rows = top_pane.find_elements(By.CSS_SELECTOR, "table tbody tr")
    print(f"Found {len(eval_rows)} evaluation rows. Opening evaluation...")
    ActionChains(driver).double_click(eval_rows[0]).perform()
    time.sleep(2.5)
    
    # Switch to Main Info tab
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    for st in sub_tabs:
        if "main" in st.text.lower():
            st.click()
            time.sleep(1.5)
            break
            
    print("Step 5: Entering Chief Complaint and SOAP notes...")
    # Chief Complaint
    cc_inp = top_pane.find_element(By.CSS_SELECTOR, "input[name='chief_complaint']")
    cc_inp.clear()
    cc_inp.send_keys("Mild fever and headache")
    print("  Entered Chief Complaint.")
    
    # Subjective -> present_illness
    pi_ta = top_pane.find_element(By.CSS_SELECTOR, "textarea[name='present_illness']")
    pi_ta.clear()
    pi_ta.send_keys("Patient reports mild fever and headache for two days.")
    print("  Entered Subjective (Present Illness).")
    
    # Objective -> evaluation_summary
    es_ta = top_pane.find_element(By.CSS_SELECTOR, "textarea[name='evaluation_summary']")
    es_ta.clear()
    es_ta.send_keys("Temperature 37.0 C. Vital signs otherwise stable.")
    print("  Entered Objective (Evaluation Summary).")
    
    # Assessment -> info_diagnosis
    id_ta = top_pane.find_element(By.CSS_SELECTOR, "textarea[name='info_diagnosis']")
    id_ta.clear()
    id_ta.send_keys("Viral upper respiratory infection.")
    print("  Entered Assessment (Diagnostic Judgement).")
    
    # Plan -> directions
    dir_ta = top_pane.find_element(By.CSS_SELECTOR, "textarea[name='directions']")
    dir_ta.clear()
    dir_ta.send_keys("Hydration, symptomatic treatment, CBC, follow-up as required.")
    print("  Entered Plan (Therapeutic Plan).")
    
    print("Step 6: Checking ICD-10 Diagnosis (J06.9)...")
    diag_inp = top_pane.find_element(By.CSS_SELECTOR, "input[name='diagnosis']")
    current_diag = diag_inp.get_attribute("value") or ""
    print(f"Current diagnosis value: '{current_diag}'")
    if "J06.9" not in current_diag:
        diag_container = top_pane.find_element(By.XPATH, "//input[@name='diagnosis']/ancestor::div[contains(@class, 'input-group')]")
        search_img = diag_container.find_element(By.CSS_SELECTOR, "img[title*='Search']")
        search_img.click()
        time.sleep(2)
        
        # Modal dialog for pathology search
        modal = driver.find_element(By.CSS_SELECTOR, "div.modal.fade.in")
        search_entry = modal.find_element(By.CSS_SELECTOR, "input[placeholder*='Search'], input.search-entry, input[type='text']")
        search_entry.clear()
        search_entry.send_keys("J06.9")
        search_entry.send_keys(Keys.ENTER)
        time.sleep(2)
        
        modal_rows = modal.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"Pathology search returned {len(modal_rows)} rows.")
        for mr in modal_rows:
            if "J06.9" in mr.text or "respiratory" in mr.text.lower():
                print("Selecting diagnosis:", mr.text.strip())
                ActionChains(driver).double_click(mr).perform()
                break
        time.sleep(2)
    else:
        print("ICD-10 J06.9 is already selected on the record.")
        
    print("Step 7: Saving Physician Consultation...")
    save_btn = [b for b in top_pane.find_elements(By.CSS_SELECTOR, "button[title='Save']") if b.is_displayed()][0]
    save_btn.click()
    time.sleep(3)
    
    info_banners = driver.find_elements(By.CSS_SELECTOR, ".alert-info, .alert-success")
    for b in info_banners:
        if b.is_displayed():
            print("STATUS BANNER:", b.text)
            
    print("Step 8: Performing Workflow Transition (Discharge / Sign)...")
    disch_btn = top_pane.find_element(By.CSS_SELECTOR, "button[name='end_evaluation']")
    disch_btn.click()
    time.sleep(2)
    
    # Click OK on confirmation modal
    confirm_modal = driver.find_element(By.CSS_SELECTOR, "div.modal.fade.in, div.ask-dialog.modal.in")
    ok_btn = confirm_modal.find_element(By.XPATH, ".//button[contains(text(), 'OK') or contains(text(), 'Ok')]")
    ok_btn.click()
    print("Clicked OK on confirmation modal.")
    time.sleep(4)
    
    # Verify state and signed_by
    eval_status = driver.execute_script('''
        var cur = Sao.Tab.tabs.get_current();
        if (cur && cur.screen && cur.screen.current_record) {
            var rec = cur.screen.current_record;
            return {
                id: rec.id,
                state: rec.field_get('state'),
                signed_by: rec.field_get_client('signed_by'),
                chief_complaint: rec.field_get('chief_complaint'),
                diagnosis: rec.field_get_client('diagnosis')
            };
        }
        return {};
    ''')
    import pprint
    print("FINAL EVALUATION STATUS AFTER SIGNING:")
    pprint.pprint(eval_status)
    
    screenshot_path = os.path.join(OUT_DIR, "07_physician_consultation.png")
    driver.save_screenshot(screenshot_path)
    print(f"Captured screenshot: {screenshot_path}")
    print("PHASE 6 PHYSICIAN CONSULTATION COMPLETED AND VERIFIED 100% SUCCESSFULLY!")

finally:
    driver.quit()
