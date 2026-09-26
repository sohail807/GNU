import subprocess

cmd = [
    "ssh", "-n", "-i", r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy",
    "-o", "StrictHostKeyChecking=no", "debian@34.7.237.8",
    "sudo cat /home/gnuhealth/trytond.conf"
]

proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
print("STDOUT:\n" + proc.stdout)
print("STDERR:\n" + proc.stderr)
