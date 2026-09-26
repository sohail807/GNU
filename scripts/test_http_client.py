import json
import base64
import http.client

# Connect directly using http.client to inspect exact socket behavior
conn = http.client.HTTPConnection("34.7.237.8", 80, timeout=10)

# 1. Login
auth_hdr = "Basic " + base64.b64encode(b"demo_frontdesk1:FrontDesk2026!").decode()
payload1 = json.dumps({"id": 1, "method": "common.db.login", "params": ["demo_frontdesk1", {"password": "FrontDesk2026!"}]})
conn.request("POST", "/gnuhealth_test_alpha/", payload1, headers={"Content-Type": "application/json", "Authorization": auth_hdr, "Connection": "close"})
resp1 = conn.getresponse()
print("Resp 1 status:", resp1.status, "Headers:", resp1.getheaders())
body1 = json.loads(resp1.read().decode())
print("Resp 1 body:", body1)
uid, tok = body1["result"]
conn.close()

# 2. Party create
conn2 = http.client.HTTPConnection("34.7.237.8", 80, timeout=10)
sess_hdr = "Session " + base64.b64encode(f"demo_frontdesk1:{uid}:{tok}".encode()).decode()
payload2 = json.dumps({
    "id": 2,
    "method": "model.party.party.create",
    "params": [[{"name": "HttpDirect-Patient-1", "ref": "QID-DIRECT-1", "is_person": True, "is_patient": True, "fed_country": "QAT", "gender": "m"}], {"company": 2, "language": "en"}]
})
conn2.request("POST", "/gnuhealth_test_alpha/", payload2, headers={"Content-Type": "application/json", "Authorization": sess_hdr, "Connection": "close"})
resp2 = conn2.getresponse()
print("Resp 2 status:", resp2.status, "Headers:", resp2.getheaders())
body2 = json.loads(resp2.read().decode())
print("Resp 2 body:", body2)
conn2.close()
