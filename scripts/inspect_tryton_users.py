import subprocess

ssh_key = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
# Use base64 or pass via stdin to avoid shell quoting issues
sql = """
SELECT u.id, u.login, u.name, string_agg(g.name, ', ') 
FROM res_user u 
LEFT JOIN "res_user-res_group" ug ON u.id = ug."user" 
LEFT JOIN res_group g ON ug."group" = g.id 
GROUP BY u.id, u.login, u.name 
ORDER BY u.id;
"""

cmd = [
    "ssh", "-i", ssh_key, "-o", "StrictHostKeyChecking=no", "debian@34.7.237.8",
    "sudo -u postgres psql -d gnuhealth -A -F'|'"
]

p = subprocess.run(cmd, input=sql, capture_output=True, text=True)
print(p.stdout)
if p.stderr:
    print("STDERR:", p.stderr)
