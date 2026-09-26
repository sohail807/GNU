import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_sql(sql_text):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sudo -u postgres psql -d gnuhealth"
    ]
    proc = subprocess.run(cmd, input=sql_text, capture_output=True, text=True, timeout=30)
    return proc.stdout, proc.stderr

print("=== 1. CHECK LAB TEST TYPES ===")
out, err = run_sql("SELECT id, name, code FROM gnuhealth_lab_test_type LIMIT 25;")
print(out)

print("=== 2. CHECK MENUS FOR EVALUATIONS ===")
out, err = run_sql("""
SELECT m.id, m.name, m.parent, p.name as parent_name, m.action 
FROM ir_ui_menu m 
LEFT JOIN ir_ui_menu p ON m.parent = p.id 
WHERE m.name ILIKE '%eval%' OR m.name ILIKE '%triage%' 
ORDER BY m.id;
""")
print(out)

print("=== 3. CHECK WHICH GROUPS demo_nurse1 AND demo_dr1 BELONG TO ===")
out, err = run_sql("""
SELECT u.login, g.name as group_name, g.id as group_id
FROM res_user u
JOIN res_user_res_group ug ON u.id = ug.res_user
JOIN res_group g ON ug.res_group = g.id
WHERE u.login IN ('demo_nurse1', 'demo_dr1', 'demo_frontdesk1', 'demo_cashier1')
ORDER BY u.login, g.name;
""")
print(out)

print("=== 4. CHECK RADIOLOGY REQUEST VS RESULT FIELDS ===")
out, err = run_sql("""
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('gnuhealth_imaging_test_request', 'gnuhealth_imaging_test_result')
  AND (column_name ILIKE '%find%' OR column_name ILIKE '%comment%' OR column_name ILIKE '%note%' OR column_name ILIKE '%diag%' OR column_name ILIKE '%request%')
ORDER BY table_name, column_name;
""")
print(out)

print("=== 5. CHECK PATIENT CONSTRAINTS AND 'Patient already exist' ERROR ===")
out, err = run_sql("""
SELECT conname, contype, pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'gnuhealth_patient';
""")
print(out)
