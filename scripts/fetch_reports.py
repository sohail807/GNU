import subprocess
import tarfile
import io
import sys

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

cmd = [
    "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    "tar -czf - -C /tmp e2e_cert_results.json e2e_transaction_evidence.json e2e_database_integrity.json e2e_accounting_evidence.json e2e_rbac_evidence.json e2e_negative_tests.json e2e_performance_baseline.json"
]

print("Fetching reports via SSH stream...")
proc = subprocess.run(cmd, capture_output=True)
if proc.returncode != 0:
    print("SSH Error:", proc.stderr.decode("utf-8", errors="replace"))
    sys.exit(1)

tar_bytes = io.BytesIO(proc.stdout)
with tarfile.open(fileobj=tar_bytes, mode="r:gz") as tar:
    for member in tar.getmembers():
        print(f"Extracting {member.name} -> reports/{member.name}")
        fileobj = tar.extractfile(member)
        if fileobj:
            target_name = member.name
            if target_name == "e2e_cert_results.json":
                target_name = "e2e_test_results.json"
            with open(f"reports/{target_name}", "wb") as f_out:
                f_out.write(fileobj.read())

print("All reports downloaded successfully!")
