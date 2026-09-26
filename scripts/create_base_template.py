import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_ssh(cmd_str):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    return proc.stdout + "\n" + proc.stderr

print("Creating /var/backups/gnuhealth with postgres ownership...")
print(run_ssh("sudo mkdir -p /var/backups/gnuhealth && sudo chown -R postgres:postgres /var/backups/gnuhealth && sudo chmod 770 /var/backups/gnuhealth"))

print("Executing pg_dump of gnuhealth to template dump...")
print(run_ssh("sudo -u postgres pg_dump -Fc -O -x -d gnuhealth -f /var/backups/gnuhealth/gnuhealth_template.dump"))

print("Verifying dump:")
print(run_ssh("ls -lh /var/backups/gnuhealth/gnuhealth_template.dump"))
