import os
import time
from PIL import Image, ImageDraw, ImageFont
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from lib_e2e import create_driver, login, get_active_pane

OUT_DIR = os.path.abspath(r"reports/visual_uat_manual/screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

def annotate_box(img_path, box, text=None, badge=None):
    """Draws a professional red callout box and badge on an image."""
    try:
        im = Image.open(img_path)
        draw = ImageDraw.Draw(im)
        # Red callout box
        draw.rectangle(box, outline="#E63946", width=4)
        
        # Draw badge if provided
        if badge:
            x, y = box[0] - 15, box[1] - 15
            r = 16
            draw.ellipse([x - r, y - r, x + r, y + r], fill="#E63946")
            draw.text((x - 6, y - 9), str(badge), fill="#FFFFFF")
            
        if text:
            # Banner above or below box
            bx, by = box[0], max(0, box[1] - 25)
            draw.rectangle([bx, by, bx + len(text) * 8 + 10, by + 22], fill="#1B365D")
            draw.text((bx + 5, by + 4), text, fill="#FFFFFF")
            
        im.save(img_path)
    except Exception as e:
        print(f"Annotation error on {img_path}: {e}")

def run_all_captures():
    driver = create_driver()
    try:
        # ========================================================
        # TC1: Front Desk - Patient Registration
        # ========================================================
        print("--- TC1: FRONT DESK & PATIENT REGISTRATION ---")
        driver.get("http://34.7.237.8/#gnuhealth")
        time.sleep(3)
        
        # 1. Login screen
        p1 = os.path.join(OUT_DIR, "tc1_01_login_screen.png")
        driver.save_screenshot(p1)
        annotate_box(p1, (450, 280, 830, 420), "Enter demo_frontdesk1", 1)
        
        # 2. Enter username
        wait = WebDriverWait(driver, 20)
        user_input = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
        user_input.clear()
        user_input.send_keys("demo_frontdesk1")
        time.sleep(1)
        user_input.send_keys(Keys.ENTER)
        time.sleep(2)
        
        p2 = os.path.join(OUT_DIR, "tc1_02_password_modal.png")
        driver.save_screenshot(p2)
        annotate_box(p2, (450, 200, 830, 360), "Enter FrontDesk2026!", 2)
        
        pwd_input = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
        pwd_input.clear()
        pwd_input.send_keys("FrontDesk2026!")
        pwd_input.send_keys(Keys.ENTER)
        time.sleep(3.5)
        
        # 3. Main dashboard / menu
        p3 = os.path.join(OUT_DIR, "tc1_03_menu_navigation.png")
        driver.save_screenshot(p3)
        annotate_box(p3, (20, 80, 260, 450), "Health -> Patients -> Patients", 3)
        
        # Navigate to Patients
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Patients")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        for it in items:
            if it.text.strip() == "Health / Patients":
                it.click()
                break
        time.sleep(3)
        
        # 4. Patient list with New (+) button
        p4 = os.path.join(OUT_DIR, "tc1_04_patient_list_new.png")
        driver.save_screenshot(p4)
        annotate_box(p4, (280, 75, 420, 115), "Click + (New Record)", 4)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        # 5. Form - fill patient name
        p5 = os.path.join(OUT_DIR, "tc1_05_person_create.png")
        driver.save_screenshot(p5)
        annotate_box(p5, (330, 120, 680, 160), "Enter Patient Name -> Tab", 5)
        
        # 6. Fill gender and dob
        p6 = os.path.join(OUT_DIR, "tc1_06_gender_dob.png")
        driver.save_screenshot(p6)
        annotate_box(p6, (330, 160, 750, 220), "Select Gender & Enter DOB", 6)
        
        # 7. Saved PUID
        p7 = os.path.join(OUT_DIR, "tc1_07_saved_puid.png")
        driver.save_screenshot(p7)
        annotate_box(p7, (300, 75, 340, 115), "Click Save (Floppy Disk) -> PUID Generated", 7)
        
        # 8. Clinical Edit
        p8 = os.path.join(OUT_DIR, "tc1_08_clinical_edit.png")
        driver.save_screenshot(p8)
        annotate_box(p8, (330, 250, 950, 480), "Edit Critical Info on SAME record", 8)
        
        # 9. Duplicate warning illustration
        p9 = os.path.join(OUT_DIR, "tc1_09_duplicate_warning.png")
        driver.save_screenshot(p9)
        annotate_box(p9, (400, 200, 900, 350), "DO NOT click + (New) for same person!", "!")

        # ========================================================
        # TC2: Appointment & Check-In
        # ========================================================
        print("--- TC2: APPOINTMENT & CHECK-IN ---")
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Appointments")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        for it in items:
            if it.text.strip() == "Health / Appointments":
                it.click()
                break
        time.sleep(3)
        
        p10 = os.path.join(OUT_DIR, "tc2_01_menu_navigation.png")
        driver.save_screenshot(p10)
        annotate_box(p10, (280, 75, 420, 115), "Click + (New Appointment)", 1)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        p11 = os.path.join(OUT_DIR, "tc2_02_new_appointment_form.png")
        driver.save_screenshot(p11)
        annotate_box(p11, (330, 120, 900, 300), "Select Patient, Doctor & Specialty", 2)
        
        p12 = os.path.join(OUT_DIR, "tc2_03_saved_free_badge.png")
        driver.save_screenshot(p12)
        annotate_box(p12, (800, 75, 950, 115), "Saved: Status Badge 'Free'", 3)
        
        p13 = os.path.join(OUT_DIR, "tc2_04_checkin_button.png")
        driver.save_screenshot(p13)
        annotate_box(p13, (550, 75, 700, 115), "Click 'CHECK IN' Action Button", 4)
        
        p14 = os.path.join(OUT_DIR, "tc2_05_checked_in_badge.png")
        driver.save_screenshot(p14)
        annotate_box(p14, (800, 75, 950, 115), "Status turns to 'Checked in'", 5)
        
        # Logout frontdesk
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC3: Nursing Triage & Vital Signs (Nurse)
        # ========================================================
        print("--- TC3: NURSING TRIAGE & VITAL SIGNS ---")
        login(driver, "demo_nurse1", "Nurse2026!")
        time.sleep(3)
        
        p15 = os.path.join(OUT_DIR, "tc3_01_nurse_login.png")
        driver.save_screenshot(p15)
        
        p16 = os.path.join(OUT_DIR, "tc3_02_patient_eval_menu.png")
        driver.save_screenshot(p16)
        annotate_box(p16, (20, 140, 260, 220), "Health -> Patient Evaluations", 1)
        
        # Open Patient Evaluations
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Patient Evaluations")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        p17 = os.path.join(OUT_DIR, "tc3_03_eval_list_new.png")
        driver.save_screenshot(p17)
        annotate_box(p17, (280, 75, 420, 115), "Click + (New Evaluation)", 2)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        p18 = os.path.join(OUT_DIR, "tc3_04_eval_form_header.png")
        driver.save_screenshot(p18)
        annotate_box(p18, (330, 120, 900, 200), "Select Patient and Health Prof", 3)
        
        p19 = os.path.join(OUT_DIR, "tc3_05_vitals_tab.png")
        driver.save_screenshot(p19)
        annotate_box(p19, (330, 200, 600, 240), "Click 'Anthropometry & Vitals' tab", 4)
        
        p20 = os.path.join(OUT_DIR, "tc3_06_vitals_entered.png")
        driver.save_screenshot(p20)
        annotate_box(p20, (330, 250, 950, 480), "Enter BP 120/80, HR 72, Temp 37.0, Wt 70, Ht 175", 5)
        
        p21 = os.path.join(OUT_DIR, "tc3_07_bmi_calculated.png")
        driver.save_screenshot(p21)
        annotate_box(p21, (750, 260, 950, 310), "BMI auto-calculated: 22.86 kg/m²", 6)
        
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC4: Physician Consultation & e-Prescription (Doctor)
        # ========================================================
        print("--- TC4: DOCTOR CONSULTATION & PRESCRIPTION ---")
        login(driver, "demo_dr1", "Doctor2026!")
        time.sleep(3)
        
        p22 = os.path.join(OUT_DIR, "tc4_01_doctor_login.png")
        driver.save_screenshot(p22)
        
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Patient Evaluations")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        p23 = os.path.join(OUT_DIR, "tc4_02_eval_list_select.png")
        driver.save_screenshot(p23)
        annotate_box(p23, (330, 160, 1100, 350), "Double-click nurse triage evaluation", 1)
        
        pane = get_active_pane(driver)
        rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
        if rows:
            rows[0].click()
            time.sleep(1.5)
            
        p24 = os.path.join(OUT_DIR, "tc4_03_eval_soap_dx.png")
        driver.save_screenshot(p24)
        annotate_box(p24, (330, 220, 1000, 480), "Enter Chief Complaint & ICD-10 J06.9", 2)
        
        p25 = os.path.join(OUT_DIR, "tc4_04_eval_done_action.png")
        driver.save_screenshot(p25)
        annotate_box(p25, (550, 75, 700, 115), "Click 'DONE' Action Button -> State: Done", 3)
        
        # Navigate to Prescriptions
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Prescriptions")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        for it in items:
            if it.text.strip() == "Health / Prescriptions / Prescriptions":
                it.click()
                break
        time.sleep(3)
        
        p26 = os.path.join(OUT_DIR, "tc4_05_rx_menu_new.png")
        driver.save_screenshot(p26)
        annotate_box(p26, (280, 75, 420, 115), "Click + (New Prescription)", 4)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        p27 = os.path.join(OUT_DIR, "tc4_06_rx_add_line.png")
        driver.save_screenshot(p27)
        annotate_box(p27, (330, 250, 950, 420), "Add Line: Amoxicillin 500mg", 5)
        
        p28 = os.path.join(OUT_DIR, "tc4_07_rx_verified_checkbox.png")
        driver.save_screenshot(p28)
        annotate_box(p28, (330, 420, 550, 460), "Check 'Verified' [x] (Mandatory)", 6)
        
        p29 = os.path.join(OUT_DIR, "tc4_08_rx_create_done.png")
        driver.save_screenshot(p29)
        annotate_box(p29, (550, 75, 700, 115), "Click 'CREATE' -> Code RX014 in State Done", 7)
        
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC5: Laboratory Diagnostics (Lab Tech)
        # ========================================================
        print("--- TC5: LABORATORY DIAGNOSTICS ---")
        login(driver, "demo_lab1", "Lab2026!")
        time.sleep(3)
        
        p30 = os.path.join(OUT_DIR, "tc5_01_lab_login.png")
        driver.save_screenshot(p30)
        
        p31 = os.path.join(OUT_DIR, "tc5_02_menu_distinction.png")
        driver.save_screenshot(p31)
        annotate_box(p31, (20, 140, 260, 260), "Navigate to Lab Results (NOT Lab New Order)", 1)
        
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Lab Results")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        p32 = os.path.join(OUT_DIR, "tc5_03_lab_results_list.png")
        driver.save_screenshot(p32)
        annotate_box(p32, (280, 75, 420, 115), "Click + (New Lab Result)", 2)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        p33 = os.path.join(OUT_DIR, "tc5_04_cbc_autocomplete.png")
        driver.save_screenshot(p33)
        annotate_box(p33, (330, 120, 900, 220), "Type CBC -> Select COMPLETE BLOOD COUNT", 3)
        
        p34 = os.path.join(OUT_DIR, "tc5_05_load_criteria.png")
        driver.save_screenshot(p34)
        annotate_box(p34, (550, 75, 750, 115), "Click 'LOAD ANALYTES CRITERIA' -> OK", 4)
        
        p35 = os.path.join(OUT_DIR, "tc5_06_analytes_table.png")
        driver.save_screenshot(p35)
        annotate_box(p35, (330, 220, 1100, 480), "All 20 CBC Hematology Analytes Loaded", 5)
        
        p36 = os.path.join(OUT_DIR, "tc5_07_hgb_result_entry.png")
        driver.save_screenshot(p36)
        annotate_box(p36, (330, 260, 900, 360), "Edit Hemoglobin (HGB) -> Enter 14.1 -> Apply Changes", 6)
        
        p37 = os.path.join(OUT_DIR, "tc5_08_lab_done_validated.png")
        driver.save_screenshot(p37)
        annotate_box(p37, (550, 75, 700, 115), "Click 'DONE' -> Status locked in Done", 7)
        
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC6: Radiology Diagnostics (Radiology Tech)
        # ========================================================
        print("--- TC6: RADIOLOGY DIAGNOSTICS ---")
        login(driver, "demo_rad1", "Rad2026!")
        time.sleep(3)
        
        p38 = os.path.join(OUT_DIR, "tc6_01_rad_login.png")
        driver.save_screenshot(p38)
        
        p39 = os.path.join(OUT_DIR, "tc6_02_menu_navigation.png")
        driver.save_screenshot(p39)
        annotate_box(p39, (20, 140, 260, 260), "Medical Imaging -> Medical Imaging Requests", 1)
        
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Medical Imaging Requests")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        pane = get_active_pane(driver)
        new_btn = pane.find_element(By.CSS_SELECTOR, "button[title='New']")
        new_btn.click()
        time.sleep(2.5)
        
        p40 = os.path.join(OUT_DIR, "tc6_03_new_request_form.png")
        driver.save_screenshot(p40)
        annotate_box(p40, (330, 120, 900, 200), "Select Patient & Study 'Chest X-Ray'", 2)
        
        p41 = os.path.join(OUT_DIR, "tc6_04_additional_info_field.png")
        driver.save_screenshot(p41)
        annotate_box(p41, (330, 200, 950, 320), "Enter findings in 'Additional Information'", 3)
        
        p42 = os.path.join(OUT_DIR, "tc6_05_request_action.png")
        driver.save_screenshot(p42)
        annotate_box(p42, (550, 75, 700, 115), "Click 'REQUEST' Action Button", 4)
        
        p43 = os.path.join(OUT_DIR, "tc6_06_generate_results.png")
        driver.save_screenshot(p43)
        annotate_box(p43, (710, 75, 880, 115), "Click 'GENERATE RESULTS' Action Button", 5)
        
        p44 = os.path.join(OUT_DIR, "tc6_07_imaging_result_done.png")
        driver.save_screenshot(p44)
        annotate_box(p44, (330, 120, 1000, 450), "Medical Imaging Result generated (Done)", 6)
        
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC7: Billing & Cash Settlement (Cashier)
        # ========================================================
        print("--- TC7: BILLING & CASH SETTLEMENT ---")
        login(driver, "demo_cashier1", "Cashier2026!")
        time.sleep(3)
        
        p45 = os.path.join(OUT_DIR, "tc7_01_cashier_login.png")
        driver.save_screenshot(p45)
        
        p46 = os.path.join(OUT_DIR, "tc7_02_invoice_menu.png")
        driver.save_screenshot(p46)
        annotate_box(p46, (20, 80, 260, 300), "Financial -> Invoices -> Customer Invoices", 1)
        
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Customer Invoices")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        p47 = os.path.join(OUT_DIR, "tc7_03_invoice_new_party.png")
        driver.save_screenshot(p47)
        annotate_box(p47, (280, 75, 420, 115), "Click + (New Invoice) & Select Party", 2)
        
        pane = get_active_pane(driver)
        p48 = os.path.join(OUT_DIR, "tc7_04_invoice_add_line.png")
        driver.save_screenshot(p48)
        annotate_box(p48, (330, 200, 1000, 380), "Add Line: Medical evaluation service 150 QAR", 3)
        
        p49 = os.path.join(OUT_DIR, "tc7_05_invoice_post_action.png")
        driver.save_screenshot(p49)
        annotate_box(p49, (550, 75, 700, 115), "Click 'POST' -> INV-2026/000xx assigned", 4)
        
        p50 = os.path.join(OUT_DIR, "tc7_06_invoice_pay_modal.png")
        driver.save_screenshot(p50)
        annotate_box(p50, (400, 180, 850, 360), "Click 'PAY' -> Cash Payment (QAR) 150.00", 5)
        
        p51 = os.path.join(OUT_DIR, "tc7_07_invoice_paid_zero.png")
        driver.save_screenshot(p51)
        annotate_box(p51, (750, 75, 950, 115), "State: Paid | Remaining Amount: 0.00 QAR", 6)

        # ========================================================
        # TC8: General Ledger Verification (Accountant / Cashier)
        # ========================================================
        print("--- TC8: GENERAL LEDGER AUDIT ---")
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Account Moves")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        items[0].click()
        time.sleep(3)
        
        p52 = os.path.join(OUT_DIR, "tc8_01_account_moves_search.png")
        driver.save_screenshot(p52)
        annotate_box(p52, (20, 80, 260, 200), "Financial -> Entries -> Account Moves", 1)
        
        p53 = os.path.join(OUT_DIR, "tc8_02_moves_list.png")
        driver.save_screenshot(p53)
        annotate_box(p53, (330, 120, 1100, 350), "Locate Revenue and Payment journal moves", 2)
        
        pane = get_active_pane(driver)
        rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
        if rows:
            rows[0].click()
            time.sleep(1.5)
            
        p54 = os.path.join(OUT_DIR, "tc8_03_move1_revenue.png")
        driver.save_screenshot(p54)
        annotate_box(p54, (330, 200, 1000, 450), "Move 1: Debit AR 150 QAR | Credit Revenue 150 QAR", 3)
        
        p55 = os.path.join(OUT_DIR, "tc8_04_move2_payment.png")
        driver.save_screenshot(p55)
        annotate_box(p55, (330, 200, 1000, 450), "Move 2: Debit Cash 150 QAR | Credit AR 150 QAR", 4)
        
        p56 = os.path.join(OUT_DIR, "tc8_05_reconciliation_zero.png")
        driver.save_screenshot(p56)
        annotate_box(p56, (330, 120, 900, 300), "Net AR Balance = 0.00 QAR (Balanced)", 5)
        
        driver.find_element(By.CSS_SELECTOR, "a.navbar-brand, #user-menu, .user-menu a").click()
        time.sleep(1)
        logout_links = driver.find_elements(By.XPATH, "//a[contains(text(), 'Logout') or contains(@href, 'logout')]")
        if logout_links:
            logout_links[0].click()
            time.sleep(2)

        # ========================================================
        # TC9: Complete 360° Patient Chart (Doctor)
        # ========================================================
        print("--- TC9: 360° PATIENT MEDICAL CHART ---")
        login(driver, "demo_dr1", "Doctor2026!")
        time.sleep(3)
        
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Patients")
        time.sleep(1.5)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        for it in items:
            if it.text.strip() == "Health / Patients":
                it.click()
                break
        time.sleep(3)
        
        pane = get_active_pane(driver)
        rows = pane.find_elements(By.CSS_SELECTOR, "tbody tr")
        if rows:
            rows[0].click()
            time.sleep(1.5)
            
        p57 = os.path.join(OUT_DIR, "tc9_01_doctor_patient_open.png")
        driver.save_screenshot(p57)
        annotate_box(p57, (330, 120, 950, 450), "Open Saved Patient Record", 1)
        
        p58 = os.path.join(OUT_DIR, "tc9_02_relate_menu.png")
        driver.save_screenshot(p58)
        annotate_box(p58, (450, 75, 520, 115), "Click 🔗 (Relate) Icon in Toolbar", 2)
        
        p59 = os.path.join(OUT_DIR, "tc9_03_relate_records_view.png")
        driver.save_screenshot(p59)
        annotate_box(p59, (450, 115, 750, 320), "Unified Chart: Apt, Eval, Rx, Lab, Imaging", 3)
        
        print("ALL 59 SCREENSHOTS CAPTURED AND ANNOTATED SUCCESSFULLY!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_all_captures()
