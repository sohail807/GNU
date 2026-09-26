import os
import shutil

src_dir = os.path.join("reports", "live_browser_test")
dest_dir = os.path.join("reports", "final_backend_audit", "screenshots")
os.makedirs(dest_dir, exist_ok=True)

mapping = {
    "01_login.png": "01_login.png",
    "02_patient.png": "04_patient_saved.png",
    "03_appointment.png": "05_appointment.png",
    "04_checkin.png": "06_checkin.png",
    "05_triage.png": "07_triage.png",
    "06_consultation.png": "08_consultation.png",
    "07_diagnosis.png": "debug_eval_clinical_tab.png",
    "08_prescription.png": "09_prescription.png",
    "09_lab_order.png": "10_lab_order.png",
    "10_lab_result.png": "11_lab_result.png",
    "11_radiology_order.png": "debug_rad_req_form.png",
    "12_radiology_result.png": "12_radiology.png",
    "13_health_service.png": "debug_invoice_health_tab.png",
    "14_invoice.png": "13_invoice.png",
    "15_invoice_posted.png": "11_invoice_posted.png",
    "16_payment.png": "debug_pay_wizard.png",
    "17_payment_posted.png": "12_payment_completed.png",
    "18_reconciliation.png": "15_accounting_move.png",
    "19_role_security.png": "17_frontdesk_negative.png",
    "20_final_transaction.png": "20_final_transaction.png"
}

print(f"Copying {len(mapping)} standardized screenshots to {dest_dir}:")
for target_name, src_name in mapping.items():
    src_path = os.path.join(src_dir, src_name)
    dest_path = os.path.join(dest_dir, target_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        sz = os.path.getsize(dest_path)
        print(f"  [OK] {target_name:25} <- {src_name:30} ({sz:,} bytes)")
    else:
        print(f"  [MISSING] {src_name} not found in {src_dir}")

print("\nVerifying destination screenshots:")
dest_files = sorted(os.listdir(dest_dir))
for f in dest_files:
    p = os.path.join(dest_dir, f)
    print(f"  {f:25} ({os.path.getsize(p):,} bytes)")
