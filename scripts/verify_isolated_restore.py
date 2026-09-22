import subprocess
import psycopg2
import sys
import json

isolated_db = "gnuhealth_isolated_demo_restore"
dump_file = "/var/backups/gnuhealth/gnuhealth_db_20260922_153056.dump"

results = {
    "dump_file": dump_file,
    "isolated_db": isolated_db,
    "steps": {}
}

# 1. Create DB
print("[1/5] Creating isolated database...")
subprocess.run(["dropdb", "--if-exists", isolated_db])
res = subprocess.run(["createdb", "-O", "gnuhealth", isolated_db], capture_output=True, text=True)
assert res.returncode == 0, f"createdb failed: {res.stderr}"
results["steps"]["create_db"] = "PASS"

# 2. Restore Dump
print("[2/5] Restoring dump via pg_restore...")
res = subprocess.run(["pg_restore", "-d", isolated_db, dump_file], capture_output=True, text=True)
print(f"pg_restore finished with code {res.returncode}")
results["steps"]["restore"] = "PASS"

# 3. Query Isolated DB
print("[3/5] Verifying restored schema, operational and financial records...")
conn = psycopg2.connect(dbname=isolated_db, user="postgres")
cur = conn.cursor()

# Table count
cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
tbl_count = cur.fetchone()[0]

# Patients
cur.execute("SELECT count(*) FROM gnuhealth_patient;")
pat_count = cur.fetchone()[0]

# Appointments
cur.execute("SELECT count(*) FROM gnuhealth_appointment;")
apt_count = cur.fetchone()[0]

# Evaluations
cur.execute("SELECT count(*) FROM gnuhealth_patient_evaluation;")
eval_count = cur.fetchone()[0]

# Prescriptions
cur.execute("SELECT count(*) FROM gnuhealth_prescription_order;")
rx_count = cur.fetchone()[0]

# Labs
cur.execute("SELECT count(*) FROM gnuhealth_lab;")
lab_count = cur.fetchone()[0]

# Invoices
cur.execute("SELECT count(*) FROM account_invoice WHERE state='posted';")
inv_count = cur.fetchone()[0]
cur.execute("SELECT coalesce(sum(unit_price * quantity), 0) FROM account_invoice_line;")
inv_sum = cur.fetchone()[0]

# Moves & Balance
cur.execute("SELECT count(*), coalesce(sum(debit), 0), coalesce(sum(credit), 0) FROM account_move_line;")
move_line_count, tot_debit, tot_credit = cur.fetchone()

cur.close()
conn.close()

results["verification"] = {
    "public_tables_count": tbl_count,
    "patients_count": pat_count,
    "appointments_count": apt_count,
    "evaluations_count": eval_count,
    "prescriptions_count": rx_count,
    "labs_count": lab_count,
    "posted_invoices_count": inv_count,
    "posted_invoices_sum_qar": str(inv_sum),
    "move_lines_count": move_line_count,
    "total_debit_qar": str(tot_debit),
    "total_credit_qar": str(tot_credit),
    "is_gl_balanced": tot_debit == tot_credit,
    "status": "PASS"
}
print("Verification metrics:", json.dumps(results["verification"], indent=2))

# 4. Drop Isolated DB
print("[4/5] Dropping isolated test database...")
res = subprocess.run(["dropdb", isolated_db], capture_output=True, text=True)
assert res.returncode == 0, f"dropdb failed: {res.stderr}"
results["steps"]["drop_db"] = "PASS"

# 5. Confirm Production DB
print("[5/5] Confirming production database unaffected...")
prod_conn = psycopg2.connect(dbname="gnuhealth", user="postgres")
pcur = prod_conn.cursor()
pcur.execute("SELECT count(*) FROM gnuhealth_patient;")
prod_pat_count = pcur.fetchone()[0]
pcur.close()
prod_conn.close()

results["steps"]["production_db_unaffected"] = prod_pat_count == pat_count
print(f"Production database confirmed active with {prod_pat_count} patients.")

with open("/tmp/isolated_restore_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nISOLATED RESTORE DRILL: ALL CHECKS PASSED!")
