import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

sql = """
SELECT m.id, m.active_component, pt.name 
FROM gnuhealth_medicament m
JOIN product_product p ON m.product = p.id
JOIN product_template pt ON p.template = pt.id
LIMIT 20;
"""

cmd = [
    "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    f"sudo -u postgres psql -d gnuhealth -t -c \"{sql}\""
]

proc = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT len:", len(proc.stdout), "STDERR:", proc.stderr)
for line in proc.stdout.splitlines():
    print(line)
