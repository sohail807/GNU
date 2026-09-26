import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_ssh(cmd_str):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    return proc.stdout + "\n" + proc.stderr

# Test creating base dump if not already present
print("Checking /home/gnuhealth/backups directory...")
print(run_ssh("sudo mkdir -p /home/gnuhealth/backups && sudo chown -R gnuhealth:gnuhealth /home/gnuhealth/backups"))

print("Generating base template dump from gnuhealth...")
print(run_ssh("sudo -u postgres pg_dump -Fc -O -x -d gnuhealth -f /home/gnuhealth/backups/gnuhealth_template.dump"))

print("Verifying dump size...")
print(run_ssh("ls -lh /home/gnuhealth/backups/gnuhealth_template.dump"))
