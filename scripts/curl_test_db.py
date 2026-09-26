import subprocess
import json
import base64

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

auth_header = "Basic " + base64.b64encode(b"demo_frontdesk1:FrontDesk2026!").decode()
payload = json.dumps({
    "id": 1,
    "method": "common.db.login",
    "params": ["demo_frontdesk1", {"password": "FrontDesk2026!"}]
})

print("=== 1. Testing port 8000 directly on VM ===")
cmd_8000 = [
    "ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    f"""curl -s -X POST http://127.0.0.1:8000/gnuhealth_test_alpha/ -H "Content-Type: application/json" -H "Authorization: {auth_header}" -d '{payload}'"""
]
proc = subprocess.run(cmd_8000, capture_output=True, text=True, timeout=20)
print("Port 8000 response:", proc.stdout)

print("\n=== 2. Testing port 80 through Nginx on VM ===")
cmd_80 = [
    "ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
    f"""curl -s -X POST http://127.0.0.1/gnuhealth_test_alpha/ -H "Content-Type: application/json" -H "Authorization: {auth_header}" -d '{payload}'"""
]
proc = subprocess.run(cmd_80, capture_output=True, text=True, timeout=20)
print("Port 80 response:", proc.stdout)
