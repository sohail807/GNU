import re

with open("scripts/generate_presentation.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update dashboard screenshot
content = content.replace(
    '"screenshots/02_main_dashboard.png"',
    '"reports/live_browser_test/02_dashboard.png"'
)

# 2. Update login screenshot
content = content.replace(
    '"screenshots/01_login_dialog.png"',
    '"reports/live_browser_test/01_login.png"'
)

# 3. Update patient registry screenshot
content = content.replace(
    '"screenshots/01_patients_list.png"',
    '"reports/live_browser_test/03_patient_created.png"'
)
content = content.replace(
    '"Real database records showing certified patients, PUIDs (DEMO-QID, E2E-CERT), and demographics"',
    '"Real patient record showing LIVE E2E TEST PATIENT, auto-generated PUID KQI816APL, and verified demographics"'
)

# 4. Update appointment screenshot
content = content.replace(
    '"screenshots/03_appointments_list.png"',
    '"reports/live_browser_test/04_appointment_created.png"'
)
content = content.replace(
    '"Active clinic appointments showing doctor assignment, specialty routing, and \'CHECK IN\' action buttons"',
    '"Live appointment record for LIVE E2E TEST PATIENT scheduled with Dr. DEMO Physician 01, Family Medicine"'
)

# 5. Update front desk check-in slide to include screenshot 05_patient_checked_in.png
old_checkin = '''    add_card(s, 0.8, 1.7, 5.7, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Operational Front Desk Check-in"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Patient Identification: Identity verified against official Qatar QID.\\n" \\
             "• Appointment Lookup: Scheduled encounter retrieved via JSON-RPC.\\n" \\
             "• Status Update: Front desk executes `checked_in` state transition.\\n" \\
             "• Triage Routing: Patient immediately appears on nursing dashboard.\\n" \\
             "• Privilege Isolation: Reception cannot edit clinical notes or modify diagnoses."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "STATE: CHECKED_IN", TEAL, width=2.2)

    add_card(s, 6.8, 1.7, 5.7, 5.2)
    tb2 = s.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf2 = tb2.text_frame; tf2.word_wrap = True
    p = tf2.paragraphs[0]; p.text = "Security Boundary Test (CLN-02 PASS)"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = GREEN_PASS
    p = tf2.add_paragraph()
    p.text = "• Role: Front Desk Receptionist (`demo_frontdesk1`)\\n" \\
             "• Action: Attempted direct write to clinical evaluation table\\n" \\
             "• Result: PERMISSION DENIED (`ir.model.access`)\\n" \\
             "• Guarantee: Front desk staff can never tamper with medical records or physician orders."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 7.0, 5.9, "DENIED AS EXPECTED", GREEN_PASS, width=2.2)'''

new_checkin = '''    add_card(s, 0.8, 1.7, 4.5, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(4.1), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Operational Front Desk Check-in"; p.font.size = Pt(15); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Patient Identification: Identity verified against patient registry.\\n" \\
             "• Appointment Lookup: Scheduled encounter opened in SAO interface.\\n" \\
             "• Status Transition: Reception executes 'CHECK IN' action button.\\n" \
             "• State Transition: Appointment status updates to `checked_in`.\\n" \\
             "• Nursing Handoff: Patient routed immediately to triage queue.\\n" \\
             "• Privilege Isolation: Reception cannot edit clinical notes or diagnoses."
    p.font.size = Pt(10.5); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "STATE: CHECKED_IN", GREEN_PASS, width=2.4)

    add_screenshot_card(s, 5.5, 1.7, 7.0, 5.2, "reports/live_browser_test/05_patient_checked_in.png",
                        "Live Patient Check-in Action Transition",
                        "Real appointment state transitioned to 'Checked in' via native Tryton SAO action button")'''

content = content.replace(old_checkin, new_checkin)

# 6. Update nursing triage screenshot
content = content.replace(
    '"screenshots/04_evaluations_list.png"',
    '"reports/live_browser_test/06_nursing_triage.png"'
)
content = content.replace(
    '"Patient evaluations showing certified timestamps (EVAL 2026/000049, EVAL 2026/000048) and Outpatient visit types"',
    '"Evaluation EVAL 2026/000050 showing vitals (BP 120/80, HR 72, 37.0 C) and auto-calculated BMI 22.9 kg/m2"'
)

# 7. Update physician consultation screenshot
content = content.replace(
    '"screenshots/02_patient_detail_record.png"',
    '"reports/live_browser_test/07_physician_consultation.png"'
)
content = content.replace(
    '"Complete clinical profile showing conditions, surgeries, lifestyle, socioeconomics, and focus areas"',
    '"Consultation EVAL 2026/000050 with SOAP clinical notes, ICD-10 J06.9 diagnosis, and discharge to Home / Selfcare"'
)

# 8. Update prescription screenshot
content = content.replace(
    '"screenshots/05_prescriptions_list.png"',
    '"reports/live_browser_test/08_prescription.png"'
)
content = content.replace(
    '"Active prescriptions with doctor attribution, timestamps, and sequential tracking numbers (PRES 2026/000042)"',
    '"Electronic prescription PRES 2026/000044 for Amoxicillin 500mg with Safety Verified check and doctor sign-off"'
)

# 9. Update laboratory screenshot
content = content.replace(
    '"screenshots/06_laboratory_tests.png"',
    '"reports/live_browser_test/09_laboratory.png"'
)
content = content.replace(
    '"Real diagnostic tests (TEST031, TEST030, TEST022) verified in \'Validated\' state linked to certified patients"',
    '"CBC lab test TEST037 with 20 criteria analytes loaded, HGB 14.1 g/dL recorded, and state transitioned to Done"'
)

# 10. Update radiology slide to include screenshot 10_radiology.png
old_rad = '''    add_card(s, 0.8, 1.7, 5.7, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Diagnostic Imaging Lifecycle"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Order Entity: `gnuhealth.imaging.test.request`\\n" \\
             "• Catalog Modalities: Chest X-Ray (RAD-CXR), Ultrasound (RAD-US), MRI, CT.\\n" \\
             "• Certified Encounter: Chest X-Ray PA view ordered by Dr. DEMO.\\n" \\
             "• Imaging Findings: Clear lung fields, normal cardiothoracic ratio.\\n" \\
             "• Status Sign-off: State transitions to `signed`.\\n" \\
             "• Charge Linking: Diagnostic service tariff routed to billing."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "CERTIFIED: RAD-01 PASS", GREEN_PASS, width=2.4)

    add_card(s, 6.8, 1.7, 5.7, 5.2)
    tb2 = s.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf2 = tb2.text_frame; tf2.word_wrap = True
    p = tf2.paragraphs[0]; p.text = "Negative Test & Role Boundary (RAD-02 PASS)"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = GREEN_PASS
    p = tf2.add_paragraph()
    p.text = "• Test: Radiology request with invalid imaging type\\n" \\
             "• Result: Rejected by model validation\\n" \\
             "• Role Check: Non-medical users blocked from signing imaging reports\\n" \\
             "• Result: Diagnostic integrity fully maintained."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 7.0, 5.9, "IMAGING INTEGRITY PASS", GREEN_PASS, width=2.6)'''

new_rad = '''    add_card(s, 0.8, 1.7, 4.5, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(4.1), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Diagnostic Imaging Lifecycle"; p.font.size = Pt(15); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Order Entity: `gnuhealth.imaging.test.request`\\n" \\
             "• Diagnostic Modality: Chest X-Ray (PA view)\\n" \\
             "• Study Order: Order 032 requested for patient\\n" \\
             "• Technician Evaluation: DEMO Radiology Technician 01\\n" \\
             "• Imaging Findings: Clear lung fields, normal anatomy\\n" \\
             "• Result Generation: Finalized record TEST030 in state Done."
    p.font.size = Pt(10.5); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "CERTIFIED: RAD-01 PASS", GREEN_PASS, width=2.4)

    add_screenshot_card(s, 5.5, 1.7, 7.0, 5.2, "reports/live_browser_test/10_radiology.png",
                        "Live Medical Imaging Diagnostics",
                        "Chest X-Ray study TEST030 generated, evaluated, and signed off in Done state by Radiology Technician")'''

content = content.replace(old_rad, new_rad)

# 11. Update invoice posted screenshot
content = content.replace(
    '"screenshots/07_posted_invoices.png"',
    '"reports/live_browser_test/11_invoice_posted.png"'
)
content = content.replace(
    '"Filter \'Posted (12)\' showing 12 live posted invoices with QAR 475.00 balances and certified party linkage"',
    '"Customer Invoice INV-2026/00014 for LIVE E2E TEST PATIENT (150.00 QAR) posted to General Ledger"'
)

# 12. Update account moves screenshot
content = content.replace(
    '"screenshots/09_account_moves.png"',
    '"reports/live_browser_test/13_accounting_verified.png"'
)
content = content.replace(
    '"Real accounting entries showing Cash and Revenue journal moves with posted states and invoice origin tracking"',
    '"Account Move 47 (MV-2026/00037) showing balanced debit (Main Receivable: 150.00 QAR) and credit (Main Revenue: 150.00 QAR)"'
)

# 13. Update payment settlement slide to include screenshot 12_payment_completed.png
old_pay = '''    add_card(s, 0.8, 1.7, 5.7, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Point-of-Sale Cash Collection"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Cashier Role: `demo_cashier1` collects patient payment.\\n" \\
             "• Settlement Amount: 475.00 QAR paid in cash.\\n" \\
             "• Journal Entry: Cash Move created in Cash Journal.\\n" \\
             "• Debit Line: Cash on Hand (Account 501000) = +475.00 QAR.\\n" \\
             "• Credit Line: Customer Accounts Receivable (Account 101000) = -475.00 QAR.\\n" \\
             "• Payment Matching: Cash line paired with Invoice receivable line."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "CERTIFIED: PAY-01 PASS", GREEN_PASS, width=2.4)

    add_card(s, 6.8, 1.7, 5.7, 5.2)
    tb2 = s.shapes.add_textbox(Inches(7.0), Inches(1.9), Inches(5.3), Inches(4.7))
    tf2 = tb2.text_frame; tf2.word_wrap = True
    p = tf2.paragraphs[0]; p.text = "Cash Journal Verification"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = TEAL
    p = tf2.add_paragraph()
    p.text = "• Account 501000 (Cash on Hand): Verified positive inflow.\\n" \\
             "• Account 101000 (Accounts Receivable): Reduced by 475.00 QAR.\\n" \\
             "• State: Posted immediately upon receipt.\\n" \\
             "• Audit Trail: Time, operator ID, and cash receipt number permanently stored."
    p.font.size = Pt(11); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 7.0, 5.9, "CASH INFLOW VERIFIED", GREEN_PASS, width=2.6)'''

new_pay = '''    add_card(s, 0.8, 1.7, 4.5, 5.2)
    tb1 = s.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(4.1), Inches(4.7))
    tf1 = tb1.text_frame; tf1.word_wrap = True
    p = tf1.paragraphs[0]; p.text = "Point-of-Sale Cash Collection"; p.font.size = Pt(15); p.font.bold = True; p.font.color.rgb = DARK_NAVY
    p = tf1.add_paragraph()
    p.text = "• Cashier Role: `demo_cashier1` collects patient payment.\\n" \\
             "• Settlement Amount: 150.00 QAR paid in cash.\\n" \\
             "• Payment Method: Cash Payment (QAR).\\n" \\
             "• Native SAO Wizard: 'Pay Invoice' dialog handles settlement.\\n" \\
             "• Invoice Transition: Status updates immediately from Posted to Paid.\\n" \\
             "• General Ledger Effect: Balanced cash moves created and reconciled."
    p.font.size = Pt(10.5); p.font.color.rgb = DARK_GRAY; p.space_before = Pt(8)
    add_badge(s, 1.0, 5.9, "STATE: PAID", GREEN_PASS, width=2.4)

    add_screenshot_card(s, 5.5, 1.7, 7.0, 5.2, "reports/live_browser_test/12_payment_completed.png",
                        "Live Cash Payment & Paid Invoice View",
                        "Invoice INV-2026/00014 transitioned to Paid state with zero remaining balance and cash settlement")'''

content = content.replace(old_pay, new_pay)

# 14. Update Slide 25 (Reconciliation) screenshot to 14_complete_transaction.png or add new slide
old_rec_shot = '''    add_screenshot_card(s, 5.5, 1.7, 7.0, 5.2, "screenshots/08_posted_invoice_lines.png",
                        "Live Party Ledger & Qatar Demographic Verification",
                        "Party entity showing verified Qatar residence, QID identifier binding, and zero outstanding receivables balance")'''

new_rec_shot = '''    add_screenshot_card(s, 5.5, 1.7, 7.0, 5.2, "reports/live_browser_test/14_complete_transaction.png",
                        "Live Full-Chain Clinical & Billing Traceability",
                        "Unified patient chart dynamically interconnecting Appointments, Evaluations, Prescriptions, Labs, and Imaging")'''

content = content.replace(old_rec_shot, new_rec_shot)

with open("scripts/generate_presentation.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated scripts/generate_presentation.py successfully!")
