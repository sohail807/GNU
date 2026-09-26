import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_ssh(cmd_str):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return proc.stdout + "\n" + proc.stderr

print("=== SERVICE ===")
print(run_ssh("cat /etc/systemd/system/gnuhealth.service"))

print("=== TRYTOND CONF ===")
print(run_ssh("cat /home/gnuhealth/trytond.conf"))

print("=== NGINX CONF ===")
print(run_ssh("cat /etc/nginx/sites-enabled/*"))

print("=== RUNNING PROCESSES ===")
print(run_ssh("ps aux | grep trytond"))
