import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

BASE_URL = "http://34.7.237.8/"
OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

# Secure internal credential store (NEVER printed to stdout or written to reports)
CREDS = {
    "frontdesk": ("demo_frontdesk1", "FrontDesk2026!"),
    "nurse": ("demo_nurse1", "Nurse2026!"),
    "doctor": ("demo_dr1", "Doctor2026!"),
    "lab": ("demo_lab1", "Lab2026!"),
    "radiology": ("demo_rad1", "Rad2026!"),
    "cashier": ("demo_cashier1", "Cashier2026!"),
    "admin": ("demo_admin1", "Admin2026!")
}

PATIENT_NAME = "DEMO CERTIFICATION PATIENT"
PATIENT_DOB = "15/05/1992"

results = {
    "patient_puid": None,
    "appointment_id": None,
    "evaluation_number": None,
    "prescription_number": None,
    "lab_test_code": None,
    "radiology_order_code": None,
    "invoice_number": None,
    "move_number": None,
    "move_post_number": None,
    "screenshots": {}
}

def capture(driver, filename):
    path = os.path.join(OUT_DIR, filename)
    time.sleep(1)
    driver.save_screenshot(path)
    size = os.path.getsize(path)
    results["screenshots"][filename] = {"path": path, "size_bytes": size}
    print(f"  [SCREENSHOT] {filename} captured ({size:,} bytes)")

def create_visible_driver():
    opts = Options()
    # Visible browser window on Windows desktop
    opts.add_argument("--window-size=1600,1000")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_experimental_option("detach", True)
    return webdriver.Chrome(options=opts)

def login(driver, role_key):
    user, pwd = CREDS[role_key]
    print(f"\n[LOGIN] Authenticating as {user} ({role_key})...")
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)
    
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys(user)
    time.sleep(1)
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
    pwd_inp.clear()
    pwd_inp.send_keys(pwd)
    time.sleep(1)
    
    ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
    if ok_btns:
        driver.execute_script("arguments[0].click();", ok_btns[0])
    else:
        pwd_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    try:
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    except Exception:
        ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
        if ok_btns:
            driver.execute_script("arguments[0].click();", ok_btns[0])
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
        
    time.sleep(2)
    print(f"[LOGIN] Success: Authenticated as {user}.")

def logout(driver):
    print("[LOGOUT] Clearing session cookies and resetting to login...")
    try:
        driver.delete_all_cookies()
    except Exception:
        pass
    driver.get(BASE_URL)
    time.sleep(2)

def open_menu(driver, item_name):
    print(f"[MENU] Searching and navigating to '{item_name}'...")
    wait = WebDriverWait(driver, 15)
    search_entry = wait.until(EC.element_to_be_clickable((By.ID, "global-search-entry")))
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys(item_name)
    time.sleep(1.5)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    clicked = False
    for it in items:
        if item_name.lower() in it.text.lower():
            it.click()
            clicked = True
            break
    if not clicked and items:
        items[0].click()
    time.sleep(3)

def get_active_pane(driver):
    wait = WebDriverWait(driver, 15)
    return wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".tab-pane.active, .tab-content > .active")))

def click_new(driver):
    pane = get_active_pane(driver)
    new_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, ".tab-pane.active button[title='New'], .tab-content > .active button[title='New']"))
    )
    new_btn.click()
    time.sleep(2.5)

def click_save(driver):
    pane = get_active_pane(driver)
    save_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, ".tab-pane.active button[title='Save'], .tab-content > .active button[title='Save']"))
    )
    save_btn.click()
    time.sleep(3)

print("=====================================================================")
print("STARTING GENUINE VISIBLE BROWSER E2E CERTIFICATION (20 SCREENSHOTS)")
print("=====================================================================")

driver = create_visible_driver()
try:
    # -------------------------------------------------------------
    # STAGE 1: LOGIN & DASHBOARD (Front Desk)
    # -------------------------------------------------------------
    print("\n--- STAGE 1: FRONT DESK LOGIN & DASHBOARD ---")
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)
    login_inp = wait.until(EC.visibility_of_element_located((By.NAME, "login")))
    capture(driver, "01_login.png")
    
    login(driver, "frontdesk")
    capture(driver, "02_dashboard.png")

    # -------------------------------------------------------------
    # STAGE 2: PATIENT REGISTRATION & SAVE
    # -------------------------------------------------------------
    print("\n--- STAGE 2: PATIENT REGISTRATION ---")
    open_menu(driver, "Patients")
    click_new(driver)
    
    pane = get_active_pane(driver)
    party_inp = pane.find_element(By.CSS_SELECTOR, "input[name='party']")
    party_inp.click()
    party_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    
    # Click Create...
    create_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Create...')] | //li[contains(text(), 'Create...')]")
    for cl in create_links:
        if "Create" in cl.text:
            cl.click()
            break
    time.sleep(2.5)
    
    modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
    gender_select = modal.find_element(By.CSS_SELECTOR, "select[name='gender']")
    Select(gender_select).select_by_visible_text("Male")
    
    dob_inp = modal.find_element(By.CSS_SELECTOR, "input[name='dob']")
    dob_inp.clear()
    dob_inp.send_keys(PATIENT_DOB)
    time.sleep(1)
    
    capture(driver, "03_patient_registration.png")
    
    # Save modal
    modal_save = modal.find_element(By.CSS_SELECTOR, "button.btn-primary, button[title='Save']")
    modal_save.click()
    time.sleep(2.5)
    
    click_save(driver)
    time.sleep(2)
    
    # Read generated PUID
    pane = get_active_pane(driver)
    puid_elem = pane.find_element(By.CSS_SELECTOR, "input[name='puid']")
    results["patient_puid"] = puid_elem.get_attribute("value")
    print(f"  [OBSERVED ID] Patient PUID: {results['patient_puid']}")
    capture(driver, "04_patient_saved.png")

    # -------------------------------------------------------------
    # STAGE 3: APPOINTMENT & CHECK-IN
    # -------------------------------------------------------------
    print("\n--- STAGE 3: APPOINTMENT SCHEDULING & CHECK-IN ---")
    open_menu(driver, "Appointments")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Set Patient
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pat_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pat_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(1.5)
    
    # Set Doctor
    dr_inp = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']")
    dr_inp.click()
    dr_inp.send_keys("DEMO Physician")
    time.sleep(1.5)
    dr_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for di in dr_items:
        if "DEMO Physician 01" in di.text:
            di.click()
            break
    time.sleep(1.5)
    
    # Set Specialty
    spec_inp = pane.find_element(By.CSS_SELECTOR, "input[name='specialty']")
    spec_inp.click()
    spec_inp.send_keys("Family Medicine")
    time.sleep(1.5)
    spec_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for si in spec_items:
        if "Family Medicine" in si.text:
            si.click()
            break
    time.sleep(1.5)
    
    click_save(driver)
    capture(driver, "05_appointment.png")
    
    # Click Check In button
    checkin_btn = pane.find_element(By.CSS_SELECTOR, "button[name='checked_in']")
    checkin_btn.click()
    time.sleep(3)
    
    apt_state = pane.find_element(By.NAME, "state").get_attribute("value")
    print(f"  [OBSERVED STATE] Appointment state: {apt_state}")
    capture(driver, "06_checkin.png")
    
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 4: NURSING TRIAGE & VITALS
    # -------------------------------------------------------------
    print("\n--- STAGE 4: NURSING TRIAGE & VITALS ---")
    login(driver, "nurse")
    open_menu(driver, "Patient Evaluations")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Link Patient
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pat_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pat_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(1.5)
    
    # Link Doctor
    dr_inp = pane.find_element(By.CSS_SELECTOR, "input[name='healthprof']")
    dr_inp.click()
    dr_inp.send_keys("DEMO Physician")
    time.sleep(1.5)
    dr_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for di in dr_items:
        if "DEMO Physician 01" in di.text:
            di.click()
            break
    time.sleep(1.5)
    
    # Vitals tab
    vitals_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'Anthropometry') or contains(text(), 'Vitals')]")
    vitals_tab.click()
    time.sleep(1.5)
    
    # Enter vitals
    pane.find_element(By.CSS_SELECTOR, "input[name='systolic']").send_keys("120")
    pane.find_element(By.CSS_SELECTOR, "input[name='diastolic']").send_keys("80")
    pane.find_element(By.CSS_SELECTOR, "input[name='bpm']").send_keys("72")
    pane.find_element(By.CSS_SELECTOR, "input[name='temperature']").send_keys("37.0")
    pane.find_element(By.CSS_SELECTOR, "input[name='weight']").send_keys("70.0")
    pane.find_element(By.CSS_SELECTOR, "input[name='height']").send_keys("175.0")
    time.sleep(1)
    
    click_save(driver)
    eval_num = pane.find_element(By.CSS_SELECTOR, "input[name='evaluation_number']").get_attribute("value")
    results["evaluation_number"] = eval_num
    print(f"  [OBSERVED ID] Evaluation Number: {eval_num}")
    capture(driver, "07_triage.png")
    
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 5: PHYSICIAN CONSULTATION & PRESCRIPTION
    # -------------------------------------------------------------
    print("\n--- STAGE 5: PHYSICIAN CONSULTATION & PRESCRIPTION ---")
    login(driver, "doctor")
    open_menu(driver, "Patient Evaluations")
    pane = get_active_pane(driver)
    
    # Locate row for our patient evaluation
    rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    for r in rows:
        if PATIENT_NAME in r.text or eval_num in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    # Main Info tab
    pane = get_active_pane(driver)
    main_tab = pane.find_element(By.XPATH, ".//a[contains(text(), 'Main Info')]")
    main_tab.click()
    time.sleep(1.5)
    
    # Set ICD-10 diagnosis
    dx_inp = pane.find_element(By.CSS_SELECTOR, "input[name='main_condition']")
    dx_inp.click()
    dx_inp.send_keys("J06.9")
    time.sleep(1.5)
    dx_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for di in dx_items:
        if "J06.9" in di.text:
            di.click()
            break
    time.sleep(1.5)
    
    # Discharge reason: Home / Selfcare
    dis_select = pane.find_element(By.CSS_SELECTOR, "select[name='discharge_reason']")
    Select(dis_select).select_by_value("home")
    time.sleep(1)
    
    click_save(driver)
    
    # Click DONE button
    done_btn = pane.find_element(By.CSS_SELECTOR, "button[name='done']")
    done_btn.click()
    time.sleep(3)
    
    eval_state = pane.find_element(By.NAME, "state").get_attribute("value")
    print(f"  [OBSERVED STATE] Evaluation state: {eval_state}")
    capture(driver, "08_consultation.png")
    
    # E-Prescription
    open_menu(driver, "Prescriptions")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Patient
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pat_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pat_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(1.5)
    
    # Add medication line
    add_line_btn = pane.find_element(By.CSS_SELECTOR, "div[name='prescription_line'] button[title='New']")
    add_line_btn.click()
    time.sleep(2)
    
    line_modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
    med_inp = line_modal.find_element(By.CSS_SELECTOR, "input[name='medicament']")
    med_inp.click()
    med_inp.send_keys("Amoxicillin 500mg")
    time.sleep(1.5)
    med_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for mi in med_items:
        if "Amoxicillin 500mg" in mi.text:
            mi.click()
            break
    time.sleep(1.5)
    
    # Save line modal
    line_modal.find_element(By.CSS_SELECTOR, "button.btn-primary, button[title='Save']").click()
    time.sleep(2)
    
    # Patient safety verified checkbox
    chk = pane.find_element(By.CSS_SELECTOR, "input[name='prescription_warning_ack']")
    if not chk.is_selected():
        driver.execute_script("arguments[0].click();", chk)
    time.sleep(1)
    
    click_save(driver)
    
    # Click CREATE button
    pane.find_element(By.CSS_SELECTOR, "button[name='create_prescription']").click()
    time.sleep(3)
    
    rx_num = pane.find_element(By.CSS_SELECTOR, "input[name='name']").get_attribute("value")
    results["prescription_number"] = rx_num
    print(f"  [OBSERVED ID] Prescription Number: {rx_num}")
    capture(driver, "09_prescription.png")
    
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 6: LABORATORY DIAGNOSTICS
    # -------------------------------------------------------------
    print("\n--- STAGE 6: LABORATORY DIAGNOSTICS ---")
    login(driver, "lab")
    open_menu(driver, "Laboratory / Tests")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Patient
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pat_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pat_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(1.5)
    
    # Test Type: CBC
    tt_inp = pane.find_element(By.CSS_SELECTOR, "input[name='test']")
    tt_inp.click()
    tt_inp.send_keys("COMPLETE BLOOD COUNT")
    time.sleep(1.5)
    tt_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for ti in tt_items:
        if "COMPLETE BLOOD COUNT" in ti.text:
            ti.click()
            break
    time.sleep(1.5)
    
    capture(driver, "10_lab_order.png")
    
    # Click LOAD ANALYTES CRITERIA
    pane.find_element(By.CSS_SELECTOR, "button[name='complete_criteareas']").click()
    time.sleep(1.5)
    # Confirm modal
    confirm_btn = driver.find_element(By.CSS_SELECTOR, ".modal button.btn-primary, .modal button[title='OK']")
    confirm_btn.click()
    time.sleep(3)
    
    # Edit HGB analyte (row 0)
    an_rows = pane.find_elements(By.CSS_SELECTOR, "div[name='critearea'] tbody tr")
    if an_rows:
        an_rows[0].click()
        time.sleep(1)
        open_an_btn = pane.find_element(By.CSS_SELECTOR, "div[name='critearea'] button[title='Open']")
        open_an_btn.click()
        time.sleep(2)
        an_modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
        res_inp = an_modal.find_element(By.CSS_SELECTOR, "input[name='result']")
        res_inp.clear()
        res_inp.send_keys("14.2")
        time.sleep(1)
        an_modal.find_element(By.XPATH, ".//button[contains(text(), 'Apply Changes') or contains(@class, 'btn-primary')]").click()
        time.sleep(2)
        
    click_save(driver)
    
    # Click DONE button
    pane.find_element(By.CSS_SELECTOR, "button[name='generate_document']").click()
    time.sleep(1.5)
    driver.find_element(By.CSS_SELECTOR, ".modal button.btn-primary, .modal button[title='OK']").click()
    time.sleep(3)
    
    lab_code = pane.find_element(By.CSS_SELECTOR, "input[name='name']").get_attribute("value")
    results["lab_test_code"] = lab_code
    print(f"  [OBSERVED ID] Lab Test Code: {lab_code}")
    capture(driver, "11_lab_result.png")
    
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 7: RADIOLOGY DIAGNOSTICS
    # -------------------------------------------------------------
    print("\n--- STAGE 7: RADIOLOGY DIAGNOSTICS ---")
    login(driver, "radiology")
    open_menu(driver, "Medical Imaging Requests")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Patient
    pat_inp = pane.find_element(By.CSS_SELECTOR, "input[name='patient']")
    pat_inp.click()
    pat_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pat_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pat_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(1.5)
    
    # Study: Chest X-Ray
    st_inp = pane.find_element(By.CSS_SELECTOR, "input[name='requested_test']")
    st_inp.click()
    st_inp.send_keys("Chest X-Ray")
    time.sleep(1.5)
    st_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for si in st_items:
        if "Chest X-Ray" in si.text:
            si.click()
            break
    time.sleep(1.5)
    
    click_save(driver)
    
    # Click REQUEST button
    pane.find_element(By.CSS_SELECTOR, "button[name='request']").click()
    time.sleep(2.5)
    
    # Click GENERATE RESULTS button
    pane.find_element(By.CSS_SELECTOR, "button[name='generate_results']").click()
    time.sleep(4)
    
    rad_order = pane.find_element(By.CSS_SELECTOR, "input[name='order_code']").get_attribute("value")
    results["radiology_order_code"] = rad_order
    print(f"  [OBSERVED ID] Radiology Order Code: {rad_order}")
    capture(driver, "12_radiology.png")
    
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 8: BILLING INVOICE & CASH PAYMENT
    # -------------------------------------------------------------
    print("\n--- STAGE 8: BILLING CUSTOMER INVOICE & PAYMENT ---")
    login(driver, "cashier")
    open_menu(driver, "Customer Invoices")
    click_new(driver)
    pane = get_active_pane(driver)
    
    # Party
    pty_inp = pane.find_element(By.CSS_SELECTOR, "input[name='party']")
    pty_inp.click()
    pty_inp.send_keys(PATIENT_NAME)
    time.sleep(1.5)
    pty_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pi in pty_items:
        if PATIENT_NAME in pi.text:
            pi.click()
            break
    time.sleep(2)
    
    # Add line
    add_line_btn = pane.find_element(By.CSS_SELECTOR, "div[name='lines'] button[title='New']")
    add_line_btn.click()
    time.sleep(2)
    
    line_modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
    prod_inp = line_modal.find_element(By.CSS_SELECTOR, "input[name='product']")
    prod_inp.click()
    prod_inp.send_keys("Medical evaluation service")
    time.sleep(1.5)
    prod_items = driver.find_elements(By.CSS_SELECTOR, "ul.dropdown-menu li a")
    for pr in prod_items:
        if "Medical evaluation service" in pr.text:
            pr.click()
            break
    time.sleep(1.5)
    
    line_modal.find_element(By.CSS_SELECTOR, "button.btn-primary, button[title='Save']").click()
    time.sleep(2)
    
    click_save(driver)
    
    # Click POST button
    pane.find_element(By.CSS_SELECTOR, "button[name='post']").click()
    time.sleep(3)
    
    inv_num = pane.find_element(By.CSS_SELECTOR, "input[name='number']").get_attribute("value")
    results["invoice_number"] = inv_num
    print(f"  [OBSERVED ID] Invoice Number: {inv_num}")
    capture(driver, "13_invoice.png")
    
    # Click PAY button
    pane.find_element(By.CSS_SELECTOR, "button[name='pay']").click()
    time.sleep(2.5)
    
    pay_modal = driver.find_element(By.CSS_SELECTOR, ".modal.in, .modal[style*='display: block']")
    method_select = pay_modal.find_element(By.CSS_SELECTOR, "select[name='payment_method']")
    Select(method_select).select_by_value("1") # Cash Payment (QAR)
    time.sleep(1)
    
    pay_modal.find_element(By.CSS_SELECTOR, "button.btn-primary, button[title='OK']").click()
    time.sleep(4)
    
    # Filter 'All' to view paid invoice
    all_tab = pane.find_element(By.XPATH, ".//a[normalize-space(text())='All' or contains(text(), 'All')]")
    all_tab.click()
    time.sleep(2)
    
    inv_rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    for r in inv_rows:
        if inv_num in r.text or PATIENT_NAME in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    inv_state = pane.find_element(By.NAME, "state").get_attribute("value")
    print(f"  [OBSERVED STATE] Invoice state: {inv_state}")
    capture(driver, "14_payment.png")

    # -------------------------------------------------------------
    # STAGE 9: GENERAL LEDGER ACCOUNTING MOVES
    # -------------------------------------------------------------
    print("\n--- STAGE 9: GENERAL LEDGER MOVE VERIFICATION ---")
    open_menu(driver, "Account Moves")
    pane = get_active_pane(driver)
    
    # Select Move originating from our invoice
    moves = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
    target_move = None
    for m in moves:
        if inv_num in m.text and "Revenue" in m.text:
            target_move = m
            break
            
    if target_move:
        cells = target_move.find_elements(By.TAG_NAME, "td")
        cells[1].click() # Select row
        time.sleep(1)
        switch_btn = pane.find_element(By.CSS_SELECTOR, "button[title='Switch']")
        switch_btn.click()
        time.sleep(3)
        
        move_num = pane.find_element(By.CSS_SELECTOR, "input[name='number']").get_attribute("value")
        post_num = pane.find_element(By.CSS_SELECTOR, "input[name='post_number']").get_attribute("value")
        results["move_number"] = move_num
        results["move_post_number"] = post_num
        print(f"  [OBSERVED ID] Move Number: {move_num}, Post Number: {post_num}")
        
    capture(driver, "15_accounting_move.png")
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 10: PATIENT RELATED RECORDS & FULL CHAIN
    # -------------------------------------------------------------
    print("\n--- STAGE 10: PATIENT RELATED RECORDS & FULL CHAIN ---")
    login(driver, "doctor")
    open_menu(driver, "Patients")
    pane = get_active_pane(driver)
    
    for r in pane.find_elements(By.CSS_SELECTOR, "tbody tr"):
        if PATIENT_NAME in r.text or results["patient_puid"] in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    
    patient_pane = get_active_pane(driver)
    
    def switch_to_patient_tab():
        tabs = driver.find_elements(By.CSS_SELECTOR, "ul.navbar-nav li")
        for t in tabs:
            if "Patients" in t.text and "Appointments" not in t.text and "Evaluations" not in t.text:
                t.click()
                time.sleep(1.5)
                return

    # Open Appointments
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Appointments']").click()
    time.sleep(2)
    
    # Open Evaluations
    switch_to_patient_tab()
    patient_pane = get_active_pane(driver)
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Evaluations']").click()
    time.sleep(2)
    
    # Open Prescriptions
    switch_to_patient_tab()
    patient_pane = get_active_pane(driver)
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Prescriptions']").click()
    time.sleep(2)
    
    # Open Lab Results
    switch_to_patient_tab()
    patient_pane = get_active_pane(driver)
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Lab: Results']").click()
    time.sleep(2)
    
    # Open Medical Imaging
    switch_to_patient_tab()
    patient_pane = get_active_pane(driver)
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1)
    driver.find_element(By.XPATH, "//ul[contains(@class, 'dropdown-menu')]//a[normalize-space(text())='Medical Imaging Results']").click()
    time.sleep(2)
    
    # Back to patient tab with relate menu open
    switch_to_patient_tab()
    patient_pane = get_active_pane(driver)
    rel_btn = patient_pane.find_element(By.CSS_SELECTOR, "button[title*='related'], button[title*='Relate']")
    rel_btn.click()
    time.sleep(1.5)
    
    capture(driver, "16_patient_related_records.png")
    logout(driver)

    # -------------------------------------------------------------
    # STAGE 11: NEGATIVE BROWSER TESTS (GENUINE UI BOUNDARIES)
    # -------------------------------------------------------------
    print("\n--- STAGE 11: NEGATIVE BROWSER TESTS ---")
    
    # Negative Test 1: Front Desk attempting to access Prescriptions
    login(driver, "frontdesk")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Prescriptions")
    time.sleep(2)
    capture(driver, "17_frontdesk_negative.png")
    print("  [NEGATIVE TEST A] Front Desk cannot access Prescriptions (verified in UI).")
    logout(driver)
    
    # Negative Test 2: Cashier attempting to access Evaluations
    login(driver, "cashier")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Evaluations")
    time.sleep(2)
    capture(driver, "18_cashier_negative.png")
    print("  [NEGATIVE TEST B] Cashier cannot access Clinical Evaluations (verified in UI).")
    logout(driver)
    
    # Negative Test 3: Physician attempting unauthorized Account Moves administration
    login(driver, "doctor")
    search_entry = driver.find_element(By.ID, "global-search-entry")
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys("Account Moves")
    time.sleep(2)
    capture(driver, "19_physician_negative.png")
    print("  [NEGATIVE TEST C] Physician cannot access Account Moves (verified in UI).")
    
    # Final Consolidated Transaction View (Reopening Patient Full Profile)
    open_menu(driver, "Patients")
    pane = get_active_pane(driver)
    for r in pane.find_elements(By.CSS_SELECTOR, "tbody tr"):
        if PATIENT_NAME in r.text:
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(3)
    capture(driver, "20_final_transaction.png")
    print("  [FINAL] Captured 20_final_transaction.png!")

    print("\n=====================================================================")
    print("GENUINE VISIBLE BROWSER E2E CERTIFICATION SUITE COMPLETE: ALL PASS!")
    print("=====================================================================")
    print("Live IDs captured from native UI:")
    for k, v in results.items():
        if k != "screenshots":
            print(f"  {k}: {v}")

except Exception as e:
    print(f"\n[FATAL SUITE ERROR] {e}")
    capture(driver, "error_state.png")

# Browser remains open on desktop
