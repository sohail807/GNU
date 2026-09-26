import urllib.request
import json
import base64

def try_login(user, pwd):
    BASE_URL = "http://34.7.237.8/gnuhealth/"
    auth_header = "Basic " + base64.b64encode(f"{user}:{pwd}".encode()).decode()
    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps({"id": 1, "method": "common.db.login", "params": [user, {"password": pwd}]}).encode(),
        headers={"Content-Type": "application/json", "Authorization": auth_header}
    )
    try:
        r = json.loads(urllib.request.urlopen(req).read())
        print(f"SUCCESS for {user}: {r}")
        return True
    except urllib.error.HTTPError as e:
        print(f"FAILED for {user} ({e.code}): {e.reason}")
        return False
    except Exception as e:
        print(f"ERROR for {user}: {e}")
        return False

print("Testing demo_admin1 / DemoAdmin2026!:")
try_login("demo_admin1", "DemoAdmin2026!")

print("\nTesting admin / Admin12345!:")
try_login("admin", "Admin12345!")

print("\nTesting admin / gnusolidario:")
try_login("admin", "gnusolidario")

print("\nTesting demo_dr1 / Doctor2026!:")
try_login("demo_dr1", "Doctor2026!")
