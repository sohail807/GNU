import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM = "debian@34.7.237.8"

query = """
SELECT tablename FROM pg_tables WHERE 
tablename LIKE 'gnuhealth_inpatient%' OR 
tablename LIKE 'gnuhealth_hospital%' OR 
tablename LIKE 'gnuhealth_surgery%' OR 
tablename LIKE 'gnuhealth_medicament%' OR 
tablename LIKE 'stock_move%' OR
tablename LIKE 'gnuhealth_prescription%'
ORDER BY tablename;
"""

cmd = [
    "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM,
    f"sudo -u postgres psql -d gnuhealth -t -c \"{query.replace(chr(10), ' ')}\""
]

p = subprocess.run(cmd, capture_output=True, text=True)
print("Tables found:")
print(p.stdout)
if p.stderr:
    print("Errors:", p.stderr)
