import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

sql = '''
SELECT id, model, type, field_childs FROM ir_ui_view WHERE model = 'gnuhealth.patient.evaluation' ORDER BY type;
'''
cmd = ['ssh', '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', VM_HOST, 'sudo -u postgres psql -d gnuhealth']
proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
print("STDOUT:", proc.stdout)
print("STDERR:", proc.stderr)
