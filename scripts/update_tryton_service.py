import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_ssh(cmd_str):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return proc.stdout + "\n" + proc.stderr

service_content = """[Unit]
Description=GNU Health / Tryton Application Server (Multi-Tenant SaaS)
After=syslog.target network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=gnuhealth
Group=gnuhealth
ExecStart=/home/gnuhealth/venv/bin/trytond -c /home/gnuhealth/trytond.conf -d gnuhealth -d gnuhealth_test_alpha -d gnuhealth_test_beta
Restart=always
RestartSec=5

# Security Sandboxing
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/home/gnuhealth /var/log

[Install]
WantedBy=multi-user.target
"""

print("Deploying updated gnuhealth.service with multi-database support...")
cmd = f"cat << 'EOF' | sudo tee /etc/systemd/system/gnuhealth.service > /dev/null\n{service_content}\nEOF\n"
print(run_ssh(cmd))

print("Reloading systemd daemon...")
print(run_ssh("sudo systemctl daemon-reload"))

print("Restarting gnuhealth service...")
print(run_ssh("sudo systemctl restart gnuhealth"))

print("Checking gnuhealth service status...")
print(run_ssh("sudo systemctl status gnuhealth --no-pager"))
