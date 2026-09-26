import sys
import json
import base64
import urllib.request
import time

BACKEND_URL = "http://34.7.237.8/gnuhealth_test_alpha/"

# Login
auth_hdr = "Basic " + base64.b64encode(b"demo_frontdesk1:FrontDesk2026!").decode()
req = urllib.request.Request(
    BACKEND_URL,
    data=json.dumps({"id": 1, "method": "common.db.login", "params": ["demo_frontdesk1", {"password": "FrontDesk2026!"}]}).encode(),
    headers={"Content-Type": "application/json", "Authorization": auth_hdr}
)
t0 = time.time()
res = json.loads(urllib.request.urlopen(req, timeout=15).read())
print(f"Login took {time.time()-t0:.2f}s:", res)
uid, tok = res["result"]

# Create Party
sess_hdr = "Session " + base64.b64encode(f"demo_frontdesk1:{uid}:{tok}".encode()).decode()
now_ts = int(time.time())
party_payload = {
    "name": f"Alpha-Synthetic-Patient-{now_ts}",
    "ref": f"QID-{now_ts}",
    "is_person": True,
    "is_patient": True,
    "fed_country": "QAT",
    "gender": "m"
}
req2 = urllib.request.Request(
    BACKEND_URL,
    data=json.dumps({"id": 2, "method": "model.party.party.create", "params": [[party_payload], {"company": 2, "language": "en"}]}).encode(),
    headers={"Content-Type": "application/json", "Authorization": sess_hdr}
)
t0 = time.time()
res2 = json.loads(urllib.request.urlopen(req2, timeout=15).read())
print(f"Party create took {time.time()-t0:.2f}s:", res2)
party_id = res2["result"][0]

# Create Patient
req3 = urllib.request.Request(
    BACKEND_URL,
    data=json.dumps({"id": 3, "method": "model.gnuhealth.patient.create", "params": [[{"party": party_id}], {"company": 2, "language": "en"}]}).encode(),
    headers={"Content-Type": "application/json", "Authorization": sess_hdr}
)
t0 = time.time()
res3 = json.loads(urllib.request.urlopen(req3, timeout=15).read())
print(f"Patient create took {time.time()-t0:.2f}s:", res3)
pat_id = res3["result"][0]

print(f"\n[SUCCESS] Successfully created Patient ID {pat_id} with Party ID {party_id} in gnuhealth_test_alpha!")
