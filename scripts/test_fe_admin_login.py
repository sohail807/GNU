import urllib.request
import json

req = urllib.request.Request(
    "http://localhost:3000/api/auth/login",
    data=json.dumps({"username": "demo_admin1", "password": "DemoAdmin2026!"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Body:", resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
