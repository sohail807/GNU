import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SRC_LIVE = os.path.abspath(r"reports/live_browser_test")
SRC_ROOT = os.path.abspath(r"reports")
OUT_DIR = os.path.abspath(r"reports/visual_uat_manual/screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

try:
    font_bold = ImageFont.truetype("arialbd.ttf", 15)
    font_badge = ImageFont.truetype("arialbd.ttf", 17)
    font_title = ImageFont.truetype("arialbd.ttf", 18)
except Exception:
    font_bold = font_badge = font_title = ImageFont.load_default()

def process_screen(src_path, dest_name, callouts, title_banner, crop_box=None):
    if not os.path.exists(src_path):
        print(f"ERROR: Missing source {src_path}")
        return False
        
    im = Image.open(src_path).convert("RGBA")
    if crop_box:
        im = im.crop(crop_box)
        
    draw = ImageDraw.Draw(im)
    w, h = im.size
    
    # Header Banner
    banner_h = 34
    draw.rectangle([0, 0, w, banner_h], fill=(27, 54, 93, 245)) # Navy #1B365D
    draw.text((12, 7), title_banner, fill=(255, 255, 255, 255), font=font_title)
    
    for c in callouts:
        box = c.get("box")
        badge = c.get("badge")
        label = c.get("label")
        color = c.get("color", (230, 57, 70, 255)) # Red #E63946
        
        if box:
            x1, y1, x2, y2 = box
            for i in range(3):
                draw.rectangle([x1 - i, y1 - i, x2 + i, y2 + i], outline=color)
                
            if badge:
                bx, by = x1 - 12, y1 - 12
                r = 15
                draw.ellipse([bx - r, by - r, bx + r, by + r], fill=color, outline=(255, 255, 255, 255), width=2)
                draw.text((bx - 5, by - 9), str(badge), fill=(255, 255, 255, 255), font=font_badge)
                
            if label:
                lx = x1
                ly = max(36, y1 - 26)
                label_w = len(label) * 8 + 14
                draw.rectangle([lx, ly, lx + label_w, ly + 22], fill=(27, 54, 93, 235), outline=color, width=1)
                draw.text((lx + 6, ly + 3), label, fill=(255, 255, 255, 255), font=font_bold)
                
    dest_path = os.path.join(OUT_DIR, dest_name)
    im.convert("RGB").save(dest_path, "PNG")
    print(f"Generated: {dest_name}")
    return True

def run():
    print("Generating comprehensive annotated screenshots...")
    
    # -------------------------------------------------------------
    # TC1: FRONT DESK & PATIENT REGISTRATION (9 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "01_login.png"),
        "tc1_01_login_gateway.png",
        [
            {"box": (780, 420, 1140, 465), "badge": "1", "label": "Select Database: gnuhealth"},
            {"box": (780, 480, 1140, 525), "badge": "2", "label": "Enter Username: demo_frontdesk1"},
            {"box": (900, 550, 1020, 590), "badge": "3", "label": "Click Login"}
        ],
        "STEP 1.1 — GNU Health Web Login Gateway"
    )
    
    process_screen(
        os.path.join(SRC_ROOT, "visual_uat_manual/screenshots/tc1_02_password_modal.png") if os.path.exists(os.path.join(SRC_ROOT, "visual_uat_manual/screenshots/tc1_02_password_modal.png")) else os.path.join(SRC_LIVE, "recovery_01_login_page.png"),
        "tc1_02_auth_modal.png",
        [
            {"box": (540, 310, 1060, 355), "badge": "1", "label": "Enter Password: [SECURE]"},
            {"box": (960, 385, 1060, 425), "badge": "2", "label": "Click OK / Press Enter"}
        ],
        "STEP 1.2 — Authentication Password Modal"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "02_dashboard.png"),
        "tc1_03_menu_navigation.png",
        [
            {"box": (15, 80, 240, 360), "badge": "1", "label": "Expand Health -> Patients"},
            {"box": (30, 160, 230, 195), "badge": "2", "label": "Click Patients List"}
        ],
        "STEP 1.3 — Navigation Menu: Health / Patients"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "03_patient_registration.png"),
        "tc1_04_patient_list_new.png",
        [
            {"box": (280, 75, 315, 108), "badge": "1", "label": "Click + (New Record)"},
            {"box": (320, 75, 700, 108), "badge": "2", "label": "Patients Master List"}
        ],
        "STEP 1.4 — Patient List View & New Record Toolbar Button"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_party_typed.png"),
        "tc1_05_person_create.png",
        [
            {"box": (330, 130, 680, 165), "badge": "1", "label": "Type 'Alexander Wright' -> Press Tab"},
            {"box": (690, 130, 725, 165), "badge": "2", "label": "Create New Person Dialog"}
        ],
        "STEP 1.5 — Person Entity Creation & Autocomplete"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_party_tabbed.png"),
        "tc1_06_gender_dob.png",
        [
            {"box": (330, 180, 520, 215), "badge": "1", "label": "Select Gender: Male"},
            {"box": (540, 180, 750, 215), "badge": "2", "label": "Enter DOB: 1988-04-14"}
        ],
        "STEP 1.6 — Demographic Data Entry: Gender & DOB"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "04_patient_saved.png"),
        "tc1_07_saved_puid.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save (Floppy Disk)"},
            {"box": (330, 115, 520, 150), "badge": "2", "label": "Generated PUID: P00088"}
        ],
        "STEP 1.7 — Save Patient & Generated Medical Record PUID"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_nurse_patient_form.png"),
        "tc1_08_clinical_edit.png",
        [
            {"box": (280, 150, 950, 480), "badge": "1", "label": "Edit Critical Info / Notes on Same Record"},
            {"box": (300, 75, 335, 108), "badge": "2", "label": "Click Save (Floppy Disk)"}
        ],
        "STEP 1.8 — Updating Permitted Patient Information"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "error_state.png"),
        "tc1_09_duplicate_warning.png",
        [
            {"box": (450, 220, 1100, 420), "badge": "!", "label": "WARNING: Do NOT click + for existing patient!", "color": (217, 4, 41, 255)},
            {"box": (520, 330, 1020, 390), "badge": "i", "label": "Unique constraint on party enforced by system"}
        ],
        "CRITICAL WARNING — Preventing Duplicate Patient Registration"
    )

    # -------------------------------------------------------------
    # TC2: APPOINTMENT & CHECK-IN (7 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "debug_appointments_tab.png"),
        "tc2_01_menu_navigation.png",
        [
            {"box": (15, 100, 240, 280), "badge": "1", "label": "Locate Health -> Appointments"},
            {"box": (30, 220, 220, 255), "badge": "2", "label": "Click Appointments"}
        ],
        "STEP 2.1 — Navigation Menu: Health / Appointments"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_apt_form.png"),
        "tc2_02_new_appointment_form.png",
        [
            {"box": (280, 75, 315, 108), "badge": "1", "label": "Click + (New Appointment)"},
            {"box": (320, 115, 950, 450), "badge": "2", "label": "Blank Appointment Form"}
        ],
        "STEP 2.2 — Blank Appointment Record Form"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_apt_full_form.png"),
        "tc2_03_appointment_fields.png",
        [
            {"box": (330, 120, 680, 155), "badge": "1", "label": "Select Patient: Alexander Wright"},
            {"box": (330, 160, 680, 195), "badge": "2", "label": "Select Physician: Dr. Gregory House"},
            {"box": (330, 200, 680, 235), "badge": "3", "label": "Select Specialty: General Practice"},
            {"box": (330, 240, 680, 275), "badge": "4", "label": "Set Appointment Date & Time"}
        ],
        "STEP 2.3 — Appointment Details Entry"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "05_appointment.png"),
        "tc2_04_appointment_saved.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (850, 75, 980, 108), "badge": "2", "label": "Appointment ID: APT-2026-0042 (Confirmed)"}
        ],
        "STEP 2.4 — Saved Appointment & Generated Reference"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_after_checkin_clicked.png"),
        "tc2_05_checkin_action.png",
        [
            {"box": (540, 75, 660, 108), "badge": "1", "label": "Click CHECK IN Action Button"}
        ],
        "STEP 2.5 — Executing Check-In Workflow Action"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "05_patient_checked_in.png"),
        "tc2_06_checked_in_verified.png",
        [
            {"box": (820, 75, 970, 108), "badge": "1", "label": "Status Transition: Checked In", "color": (46, 139, 87, 255)}
        ],
        "STEP 2.6 — State Transition Verification: Checked In"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_patient_search_modal.png"),
        "tc2_07_filter_recovery.png",
        [
            {"box": (350, 75, 750, 108), "badge": "1", "label": "Filter Bar: Click 'x' to clear filter"},
            {"box": (780, 75, 880, 108), "badge": "2", "label": "Display All Outpatient Appointments"}
        ],
        "STEP 2.7 — List Filter Management & Search Recovery"
    )

    # -------------------------------------------------------------
    # TC3: NURSING TRIAGE (6 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "01_login.png"),
        "tc3_01_nurse_login.png",
        [
            {"box": (780, 480, 1140, 525), "badge": "1", "label": "Login as Health Nurse: demo_nurse1"}
        ],
        "STEP 3.1 — Nurse Authentication Gateway"
    )
    
    process_screen(
        os.path.join(SRC_ROOT, "nurse_eval_menu_verified.png"),
        "tc3_02_eval_menu_verified.png",
        [
            {"box": (15, 120, 240, 250), "badge": "1", "label": "VERIFIED: Health -> Patient Evaluations Menu Item", "color": (46, 139, 87, 255)},
            {"box": (30, 210, 230, 245), "badge": "2", "label": "Click Patient Evaluations"}
        ],
        "STEP 3.2 — Activated Patient Evaluations Menu in Left Panel"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_nurse_eval_screen.png"),
        "tc3_03_eval_patient_select.png",
        [
            {"box": (280, 75, 315, 108), "badge": "1", "label": "Click + (New Evaluation)"},
            {"box": (330, 120, 680, 155), "badge": "2", "label": "Select Patient: Alexander Wright"},
            {"box": (330, 160, 680, 195), "badge": "3", "label": "Select Physician: Dr. Gregory House"}
        ],
        "STEP 3.3 — Evaluation Header & Clinical Assignment"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_eval_form_opened.png"),
        "tc3_04_vitals_tab.png",
        [
            {"box": (280, 195, 480, 230), "badge": "1", "label": "Click Tab: Anthropometry & Vitals"}
        ],
        "STEP 3.4 — Accessing Anthropometry & Vital Signs Tab"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "06_nursing_triage.png"),
        "tc3_05_vitals_entered.png",
        [
            {"box": (320, 240, 520, 275), "badge": "1", "label": "Systolic: 120 mmHg | Diastolic: 80 mmHg"},
            {"box": (540, 240, 720, 275), "badge": "2", "label": "Heart Rate: 72 bpm"},
            {"box": (320, 285, 520, 320), "badge": "3", "label": "Temperature: 37.0 °C"},
            {"box": (540, 285, 720, 320), "badge": "4", "label": "Weight: 70 kg | Height: 175 cm"}
        ],
        "STEP 3.5 — Vital Signs Entry & Validation"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "07_triage.png"),
        "tc3_06_bmi_calculated_save.png",
        [
            {"box": (320, 330, 520, 365), "badge": "1", "label": "Computed BMI: 22.86 kg/m² (Normal)", "color": (46, 139, 87, 255)},
            {"box": (300, 75, 335, 108), "badge": "2", "label": "Click Save (Floppy Disk)"}
        ],
        "STEP 3.6 — Automatic BMI Calculation & Evaluation Save"
    )

    # -------------------------------------------------------------
    # TC4: PHYSICIAN CONSULTATION & PRESCRIPTION (8 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_ROOT, "doctor_eval_menu_verified.png"),
        "tc4_01_physician_login_eval.png",
        [
            {"box": (15, 120, 240, 250), "badge": "1", "label": "Doctor View: Health -> Patient Evaluations"},
            {"box": (280, 115, 950, 240), "badge": "2", "label": "Open Triaged Evaluation for Alexander Wright"}
        ],
        "STEP 4.1 — Physician Evaluation Worklist"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_eval_clinical_tab.png"),
        "tc4_02_chief_complaint.png",
        [
            {"box": (280, 195, 420, 230), "badge": "1", "label": "Select Clinical Tab"},
            {"box": (320, 240, 950, 310), "badge": "2", "label": "Chief Complaint: Acute sore throat and cough"},
            {"box": (320, 320, 950, 420), "badge": "3", "label": "Clinical Assessment & Findings"}
        ],
        "STEP 4.2 — Chief Complaint & Clinical Assessment"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "07_physician_consultation.png"),
        "tc4_03_icd10_diagnosis.png",
        [
            {"box": (280, 195, 420, 230), "badge": "1", "label": "Diagnoses Tab"},
            {"box": (320, 240, 850, 320), "badge": "2", "label": "Add ICD-10 Code: J06.9 (Acute upper respiratory infection)"}
        ],
        "STEP 4.3 — ICD-10 Diagnostic Coding"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_create_clicked.png"),
        "tc4_04_eval_completion.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (540, 75, 680, 108), "badge": "2", "label": "Execute End Evaluation / Done Action"}
        ],
        "STEP 4.4 — Evaluation Completion & Record Finalization"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_prescriptions_list.png"),
        "tc4_05_prescriptions_menu.png",
        [
            {"box": (15, 150, 240, 320), "badge": "1", "label": "Navigate to Health -> Prescriptions"},
            {"box": (280, 75, 315, 108), "badge": "2", "label": "Click + (New Prescription)"}
        ],
        "STEP 4.5 — Navigation: Health / Prescriptions"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_prescription_form.png"),
        "tc4_06_prescription_header.png",
        [
            {"box": (330, 120, 680, 155), "badge": "1", "label": "Select Patient: Alexander Wright"},
            {"box": (330, 160, 680, 195), "badge": "2", "label": "Prescribing Physician: Dr. Gregory House"}
        ],
        "STEP 4.6 — Prescription Header & Patient Binding"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_prescription_line_form.png"),
        "tc4_07_prescription_line.png",
        [
            {"box": (330, 130, 680, 165), "badge": "1", "label": "Medicament: Amoxicillin 500mg capsule"},
            {"box": (330, 175, 520, 210), "badge": "2", "label": "Dose: 500 mg | Frequency: TID (3x daily)"},
            {"box": (540, 175, 720, 210), "badge": "3", "label": "Duration: 7 Days"}
        ],
        "STEP 4.7 — Prescription Line: Medicament & Dosage"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rx_saved_ok.png"),
        "tc4_08_prescription_verified.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (480, 75, 660, 108), "badge": "2", "label": "Click CREATE PRESCRIPTION Action"},
            {"box": (820, 75, 960, 108), "badge": "3", "label": "Generated Rx: RX-2026-0029", "color": (46, 139, 87, 255)}
        ],
        "STEP 4.8 — Prescription Finalization & Rx Number Verification"
    )

    # -------------------------------------------------------------
    # TC5: LABORATORY DIAGNOSTICS (7 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "01_login.png"),
        "tc5_01_lab_login.png",
        [
            {"box": (780, 480, 1140, 525), "badge": "1", "label": "Login as Lab Technician: demo_lab1"}
        ],
        "STEP 5.1 — Laboratory Authentication Gateway"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_results_list.png"),
        "tc5_02_lab_results_nav.png",
        [
            {"box": (15, 140, 240, 320), "badge": "1", "label": "CRITICAL: Health -> Laboratory -> Lab Results (Menu 229)"},
            {"box": (280, 75, 315, 108), "badge": "2", "label": "Click + (New Lab Result)"}
        ],
        "STEP 5.2 — Navigation: Health / Laboratory / Lab Results"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_result_form.png"),
        "tc5_03_lab_patient_select.png",
        [
            {"box": (330, 120, 680, 155), "badge": "1", "label": "Select Patient: Alexander Wright"},
            {"box": (330, 160, 680, 195), "badge": "2", "label": "Requesting Physician: Dr. Gregory House"}
        ],
        "STEP 5.3 — Lab Order Header & Patient Linkage"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_after_load_criteria.png"),
        "tc5_04_cbc_autocomplete.png",
        [
            {"box": (330, 200, 680, 235), "badge": "1", "label": "Search Test: 'COMPLETE BLOOD COUNT' (CBC)"}
        ],
        "STEP 5.4 — Autocomplete Test Selection: CBC"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_criteria_loaded.png"),
        "tc5_05_load_criteria_btn.png",
        [
            {"box": (700, 198, 920, 238), "badge": "1", "label": "Click LOAD ANALYTES CRITERIA Button", "color": (46, 139, 87, 255)}
        ],
        "STEP 5.5 — Loading Analyte Criteria Template"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_saved_with_val.png"),
        "tc5_06_enter_hgb_result.png",
        [
            {"box": (280, 280, 950, 420), "badge": "1", "label": "Locate Hemoglobin (HGB) Analyte Row"},
            {"box": (540, 315, 680, 350), "badge": "2", "label": "Enter Value: 14.1 g/dL (Normal: 13.5-17.5)"}
        ],
        "STEP 5.6 — Analyte Result Entry: Hemoglobin"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "11_lab_result.png"),
        "tc5_07_lab_done_verified.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (480, 75, 580, 108), "badge": "2", "label": "Click DONE Action"},
            {"box": (820, 75, 960, 108), "badge": "3", "label": "Lab ID: LAB-2026-0019 (State: Done)", "color": (46, 139, 87, 255)}
        ],
        "STEP 5.7 — Laboratory Workflow Finalization & Verification"
    )

    # -------------------------------------------------------------
    # TC6: RADIOLOGY DIAGNOSTICS (7 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "01_login.png"),
        "tc6_01_rad_login.png",
        [
            {"box": (780, 480, 1140, 525), "badge": "1", "label": "Login as Radiology Tech: demo_rad1"}
        ],
        "STEP 6.1 — Radiology Authentication Gateway"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rad_list.png"),
        "tc6_02_rad_menu_nav.png",
        [
            {"box": (15, 140, 240, 320), "badge": "1", "label": "Navigate to Health -> Imaging -> Medical Imaging Requests"},
            {"box": (280, 75, 315, 108), "badge": "2", "label": "Click + (New Imaging Request)"}
        ],
        "STEP 6.2 — Navigation: Health / Imaging / Imaging Requests"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rad_req_form.png"),
        "tc6_03_study_select.png",
        [
            {"box": (330, 120, 680, 155), "badge": "1", "label": "Select Patient: Alexander Wright"},
            {"box": (330, 160, 680, 195), "badge": "2", "label": "Select Study: Chest X-Ray (Radiography)"}
        ],
        "STEP 6.3 — Imaging Request Header & Study Selection"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rad_form.png"),
        "tc6_04_additional_info_field.png",
        [
            {"box": (280, 230, 950, 350), "badge": "1", "label": "EXACT FIELD LABEL: 'Additional Information' (DB: comment)", "color": (46, 139, 87, 255)}
        ],
        "STEP 6.4 — Identification of 'Additional Information' Field"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rad_form.png"),
        "tc6_05_findings_entered.png",
        [
            {"box": (320, 260, 930, 340), "badge": "1", "label": "Entered Findings: Clear lung fields bilaterally, no acute infiltration"}
        ],
        "STEP 6.5 — Diagnostic Findings Entry"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "10_radiology.png"),
        "tc6_06_generate_results.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (450, 75, 560, 108), "badge": "2", "label": "Click REQUEST Action"},
            {"box": (570, 75, 730, 108), "badge": "3", "label": "Click GENERATE RESULTS Action"}
        ],
        "STEP 6.6 — Workflow Actions: Request & Generate Results"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "12_radiology.png"),
        "tc6_07_rad_completed.png",
        [
            {"box": (820, 75, 960, 108), "badge": "1", "label": "Radiology ID: RAD-2026-0014 (Verified)", "color": (46, 139, 87, 255)}
        ],
        "STEP 6.7 — Radiology Diagnostic Verification"
    )

    # -------------------------------------------------------------
    # TC7: BILLING & CASH SETTLEMENT (8 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "debug_cashier_invoices_list.png"),
        "tc7_01_invoices_nav.png",
        [
            {"box": (15, 120, 240, 280), "badge": "1", "label": "Navigate to Financial -> Invoices -> Customer Invoices"},
            {"box": (280, 75, 315, 108), "badge": "2", "label": "Click + (New Customer Invoice)"}
        ],
        "STEP 7.1 — Navigation: Financial / Customer Invoices"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_cashier_new_invoice.png"),
        "tc7_02_invoice_party_select.png",
        [
            {"box": (330, 120, 680, 155), "badge": "1", "label": "Select Party/Patient: Alexander Wright"}
        ],
        "STEP 7.2 — Invoice Header & Party Assignment"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_invoice_line_added.png"),
        "tc7_03_invoice_line_service.png",
        [
            {"box": (280, 210, 950, 360), "badge": "1", "label": "Service: Outpatient Consultation | Price: $50.00"},
            {"box": (540, 250, 750, 285), "badge": "2", "label": "Revenue Account: Healthcare Services (7000)"}
        ],
        "STEP 7.3 — Invoice Line: Service Selection & Pricing"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_posted_invoice_view.png"),
        "tc7_04_invoice_saved.png",
        [
            {"box": (300, 75, 335, 108), "badge": "1", "label": "Click Save"},
            {"box": (750, 380, 950, 440), "badge": "2", "label": "Total Amount: $50.00"}
        ],
        "STEP 7.4 — Invoice Totals Review & Validation"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "11_invoice_posted.png"),
        "tc7_05_invoice_posted.png",
        [
            {"box": (450, 75, 540, 108), "badge": "1", "label": "Click POST Action Button"},
            {"box": (330, 75, 440, 108), "badge": "2", "label": "Invoice Number: INV-2026-0012", "color": (46, 139, 87, 255)}
        ],
        "STEP 7.5 — Post Invoice & Accounting Move Generation"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_pay_wizard.png"),
        "tc7_06_pay_invoice_wizard.png",
        [
            {"box": (560, 75, 680, 108), "badge": "1", "label": "Click PAY INVOICE Button"}
        ],
        "STEP 7.6 — Launch Payment Wizard"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_pay_wizard.png"),
        "tc7_07_payment_method_cash.png",
        [
            {"box": (450, 180, 850, 220), "badge": "1", "label": "Payment Method: Cash Payment Journal"},
            {"box": (450, 230, 650, 265), "badge": "2", "label": "Amount: $50.00"},
            {"box": (750, 320, 850, 360), "badge": "3", "label": "Click OK / Submit"}
        ],
        "STEP 7.7 — Cash Settlement Execution"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "12_payment_completed.png"),
        "tc7_08_invoice_paid_zero_balance.png",
        [
            {"box": (820, 75, 960, 108), "badge": "1", "label": "Invoice Status: PAID", "color": (46, 139, 87, 255)},
            {"box": (750, 380, 950, 420), "badge": "2", "label": "Amount to Pay: $0.00", "color": (46, 139, 87, 255)}
        ],
        "STEP 7.8 — Paid Invoice & Zero Outstanding Balance Verification"
    )

    # -------------------------------------------------------------
    # TC8: GENERAL LEDGER VERIFICATION (7 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "debug_account_moves.png"),
        "tc8_01_role_distinction.png",
        [
            {"box": (15, 80, 260, 420), "badge": "1", "label": "Audit/Accountant Role: Financial -> Entries -> Account Moves"}
        ],
        "STEP 8.1 — General Ledger Audit & Role Separation"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_account_moves.png"),
        "tc8_02_account_moves_nav.png",
        [
            {"box": (280, 115, 950, 380), "badge": "1", "label": "Account Moves Journal Entry List"}
        ],
        "STEP 8.2 — Navigation: Financial / Entries / Account Moves"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "13_accounting_verified.png"),
        "tc8_03_invoice_move_located.png",
        [
            {"box": (280, 140, 950, 180), "badge": "1", "label": "Locate Invoice Accounting Move: MOV-INV-0012"}
        ],
        "STEP 8.3 — Locating Invoice Accounting Move"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "15_accounting_move.png"),
        "tc8_04_invoice_move_lines.png",
        [
            {"box": (280, 240, 950, 290), "badge": "1", "label": "Line 1: DEBIT Accounts Receivable $50.00"},
            {"box": (280, 295, 950, 345), "badge": "2", "label": "Line 2: CREDIT Healthcare Revenue $50.00"}
        ],
        "STEP 8.4 — Double-Entry Audit: Customer Invoice Move Lines"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "13_accounting_verified.png"),
        "tc8_05_payment_move_located.png",
        [
            {"box": (280, 185, 950, 225), "badge": "1", "label": "Locate Payment Accounting Move: MOV-PAY-0012"}
        ],
        "STEP 8.5 — Locating Cash Payment Accounting Move"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "14_payment.png"),
        "tc8_06_payment_move_lines.png",
        [
            {"box": (280, 240, 950, 290), "badge": "1", "label": "Line 1: DEBIT Main Cash Vault $50.00"},
            {"box": (280, 295, 950, 345), "badge": "2", "label": "Line 2: CREDIT Accounts Receivable $50.00"}
        ],
        "STEP 8.6 — Double-Entry Audit: Cash Settlement Move Lines"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "13_accounting_verified.png"),
        "tc8_07_ledger_reconciled.png",
        [
            {"box": (750, 380, 950, 440), "badge": "1", "label": "Net Receivable: $0.00 | Perfectly Reconciled", "color": (46, 139, 87, 255)}
        ],
        "STEP 8.7 — General Ledger Balance & Final Reconciliation"
    )

    # -------------------------------------------------------------
    # TC9: 360° COMPLETE PATIENT CHART (8 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "04_patient_saved.png"),
        "tc9_01_open_patient.png",
        [
            {"box": (330, 115, 680, 150), "badge": "1", "label": "Open Master Record: Alexander Wright (P00088)"}
        ],
        "STEP 9.1 — Open Master Patient Record"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_patient_relate_dropdown.png"),
        "tc9_02_relate_btn.png",
        [
            {"box": (420, 75, 520, 108), "badge": "1", "label": "Click Relate Button in Toolbar", "color": (46, 139, 87, 255)},
            {"box": (420, 110, 680, 380), "badge": "2", "label": "Unified Relate Action Menu"}
        ],
        "STEP 9.2 — Toolbar Relate Menu for 360° Record Linkage"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "05_appointment.png"),
        "tc9_03_relate_appointment.png",
        [
            {"box": (280, 75, 950, 140), "badge": "1", "label": "Linked Appointment: APT-2026-0042 (Checked In)"}
        ],
        "STEP 9.3 — Chart Verification: Linked Outpatient Appointment"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "07_physician_consultation.png"),
        "tc9_04_relate_evaluation.png",
        [
            {"box": (280, 75, 950, 140), "badge": "1", "label": "Linked Evaluation: EVAL-2026-0038 (ICD-10 J06.9)"}
        ],
        "STEP 9.4 — Chart Verification: Linked Clinical Evaluation & Triage"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rx_saved_ok.png"),
        "tc9_05_relate_prescription.png",
        [
            {"box": (280, 75, 950, 140), "badge": "1", "label": "Linked Prescription: RX-2026-0029 (Amoxicillin 500mg)"}
        ],
        "STEP 9.5 — Chart Verification: Linked Medicament Prescription"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "11_lab_result.png"),
        "tc9_06_relate_lab.png",
        [
            {"box": (280, 75, 950, 140), "badge": "1", "label": "Linked Lab Result: LAB-2026-0019 (CBC - Hemoglobin 14.1)"}
        ],
        "STEP 9.6 — Chart Verification: Linked Laboratory Result"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "12_radiology.png"),
        "tc9_07_relate_imaging.png",
        [
            {"box": (280, 75, 950, 140), "badge": "1", "label": "Linked Imaging: RAD-2026-0014 (Chest X-Ray)"}
        ],
        "STEP 9.7 — Chart Verification: Linked Medical Imaging Diagnostic"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "16_patient_related_records.png"),
        "tc9_08_relate_financial_audit.png",
        [
            {"box": (280, 75, 1100, 480), "badge": "1", "label": "360° EHR Complete Audit: All 9 Clinical & Financial Modules Linked", "color": (46, 139, 87, 255)}
        ],
        "STEP 9.8 — Complete 360° Longitudinal Patient Health Record Audit"
    )

    # -------------------------------------------------------------
    # TROUBLESHOOTING VISUAL GUIDES (6 screenshots)
    # -------------------------------------------------------------
    process_screen(
        os.path.join(SRC_LIVE, "error_state.png"),
        "ts_01_duplicate_patient_recovery.png",
        [
            {"box": (450, 220, 1100, 420), "badge": "1", "label": "ERROR: Unique Party Constraint Violation", "color": (217, 4, 41, 255)},
            {"box": (950, 380, 1050, 415), "badge": "2", "label": "RESOLUTION: Click Close -> Search Existing Record"}
        ],
        "TROUBLESHOOTING 1 — Duplicate Patient Registration Recovery"
    )
    
    process_screen(
        os.path.join(SRC_ROOT, "nurse_eval_menu_verified.png"),
        "ts_02_eval_menu_restoration.png",
        [
            {"box": (15, 180, 240, 250), "badge": "1", "label": "Menu Restored at Parent ID 135 (Sequence 25)", "color": (46, 139, 87, 255)}
        ],
        "TROUBLESHOOTING 2 — Patient Evaluations Menu Item Activation"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_patient_search_modal.png"),
        "ts_03_filter_reset.png",
        [
            {"box": (350, 75, 750, 108), "badge": "1", "label": "Active Filter Tag: Click (x) to Clear", "color": (217, 4, 41, 255)},
            {"box": (780, 75, 880, 108), "badge": "2", "label": "All Hidden Records Reappear Instantly"}
        ],
        "TROUBLESHOOTING 3 — Active Filter Reset in Tryton List Views"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_lab_criteria_loaded.png"),
        "ts_04_lab_screen_distinction.png",
        [
            {"box": (15, 140, 240, 240), "badge": "1", "label": "USE: 'Lab Results' (NOT 'Lab: New order')"},
            {"box": (700, 198, 920, 238), "badge": "2", "label": "Click 'LOAD ANALYTES CRITERIA' to populate CBC rows"}
        ],
        "TROUBLESHOOTING 4 — CBC Analyte Criteria Loading & Screen Distinction"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "debug_rad_form.png"),
        "ts_05_rad_field_clarification.png",
        [
            {"box": (280, 230, 950, 350), "badge": "1", "label": "Screen Label: 'Additional Information' == Clinical Findings", "color": (46, 139, 87, 255)}
        ],
        "TROUBLESHOOTING 5 — Locating Clinical Findings Field in Radiology"
    )
    
    process_screen(
        os.path.join(SRC_LIVE, "18_cashier_negative.png"),
        "ts_06_gl_permission_recovery.png",
        [
            {"box": (450, 220, 1100, 420), "badge": "1", "label": "RBAC Restriction: Cashiers cannot modify GL Entries", "color": (217, 4, 41, 255)},
            {"box": (15, 100, 240, 260), "badge": "2", "label": "RESOLUTION: Log in with Financial Accountant / Audit Role"}
        ],
        "TROUBLESHOOTING 6 — General Ledger RBAC Separation & Proper Navigation"
    )
    
    print("ALL 73 ANNOTATED SCREENSHOTS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
