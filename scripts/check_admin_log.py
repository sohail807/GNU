import subprocess

cmd = [
    "ssh", "-n", "-i", r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy",
    "-o", "StrictHostKeyChecking=no", "debian@34.7.237.8",
    "sudo journalctl -u gnuhealth -n 100 --no-pager"
]

proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
lines = [l for l in proc.stdout.splitlines() if "admin" in l]
for l in lines[-30:]:
    print(l)
