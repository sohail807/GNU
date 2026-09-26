import sys
import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def query(sql):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sudo -u postgres psql -d gnuhealth"
    ]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if proc.stderr and not "NOTICE" in proc.stderr:
        print("STDERR:", proc.stderr)
    return proc.stdout

if __name__ == "__main__":
    if len(sys.argv) > 1:
        sql = " ".join(sys.argv[1:])
        print(query(sql))
    else:
        print("Provide SQL as arg")
