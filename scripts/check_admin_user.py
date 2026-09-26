import subprocess

cmd = [
    "ssh", "-n", "-i", r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy",
    "-o", "StrictHostKeyChecking=no", "debian@34.7.237.8",
    "sudo -u postgres psql -d gnuhealth -t -c \"SELECT id, login, name, active, password_hash FROM res_user WHERE login in ('admin', 'demo_admin1');\""
]

proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
print("STDOUT:\n" + proc.stdout)
print("STDERR:\n" + proc.stderr)
