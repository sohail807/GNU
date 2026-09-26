import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

py_code = """
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool

Pool.start()
pool = Pool('gnuhealth')
pool.init()
Patient = pool.get('gnuhealth.patient')
for name, field in Patient._fields.items():
    if field.required or 'name' in name or 'party' in name:
        print(f"{name}: {field.__class__.__name__}, required={field.required}")
"""

cmd = [
    "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    "sudo -u gnuhealth /home/gnuhealth/venv/bin/python3"
]
proc = subprocess.run(cmd, input=py_code, capture_output=True, text=True, timeout=60)
print(proc.stdout)
print(proc.stderr)
