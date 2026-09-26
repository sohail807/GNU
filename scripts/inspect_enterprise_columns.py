import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM = "debian@34.7.237.8"

tables = [
    "gnuhealth_hospital_ward",
    "gnuhealth_hospital_bed",
    "gnuhealth_inpatient_registration",
    "gnuhealth_hospital_or",
    "gnuhealth_surgery",
    "gnuhealth_medicament"
]

for t in tables:
    query = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}' ORDER BY ordinal_position;"
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM,
        f"sudo -u postgres psql -d gnuhealth -t -c \"{query}\""
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    print(f"\n=== Columns for {t} ===")
    print(p.stdout.strip())
