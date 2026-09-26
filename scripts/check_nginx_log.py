import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

cmd = [
    "ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    "sudo tail -n 20 /var/log/nginx/access.log; echo '=== ERROR LOG ==='; sudo tail -n 20 /var/log/nginx/error.log"
]
proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
print(proc.stdout)
