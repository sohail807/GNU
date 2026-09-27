import subprocess

cmd = [
    'ssh', '-n', '-o', 'BatchMode=yes',
    '-i', r'C:\Users\MohammedSohail\.ssh\gnuhealth_deploy',
    'debian@34.7.237.8',
    'grep -n "cursor-not-allowed" /var/www/ist-health-frontend/src/components/app/AppSidebar.tsx || echo "NOT FOUND IN VM FILE"'
]
out = subprocess.check_output(cmd)
print("Remote VM AppSidebar.tsx search result:")
print(out.decode())

cmd2 = [
    'ssh', '-n', '-o', 'BatchMode=yes',
    '-i', r'C:\Users\MohammedSohail\.ssh\gnuhealth_deploy',
    'debian@34.7.237.8',
    'grep -n "Zero Locked Clutter" /var/www/ist-health-frontend/src/components/app/AppSidebar.tsx || echo "COMMENT NOT FOUND"'
]
out2 = subprocess.check_output(cmd2)
print("Comment search result:")
print(out2.decode())
