import urllib.request
import json
import base64

VM = "http://34.7.237.8/gnuhealth/"
USER = "demo_admin1"
PASS = "DemoAdmin2026!"

auth_header = "Basic " + base64.b64encode(f"{USER}:{PASS}".encode()).decode()

def rpc(method, params):
    req = urllib.request.Request(
        VM,
        data=json.dumps({"id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json", "Authorization": auth_header}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# 1. Login to get session
login_res = rpc("common.db.login", [USER, {"password": PASS}])
user_id, session_token = login_res["result"]
print(f"Logged in as {USER}, user_id={user_id}")

# 2. Check fields of gnuhealth.hospital.ward
res = rpc("model.gnuhealth.hospital.ward.fields_get", [[]])
print("ward fields_get result keys:", list(res.get("result", {}).keys())[:10])
for k, v in res.get("result", {}).items():
    if v.get("required"):
        print(f" - Required ward field: {k} ({v.get('type')})")

res_bed = rpc("model.gnuhealth.hospital.bed.fields_get", [[]])
print("bed fields_get result keys:", list(res_bed.get("result", {}).keys())[:10])
for k, v in res_bed.get("result", {}).items():
    if v.get("required"):
        print(f" - Required bed field: {k} ({v.get('type')})")
