import urllib.request
import json
import base64
import time

BASE_URL = "http://34.7.237.8"

USER_PASSWORDS = {
    'demo_admin1': 'DemoAdmin2026!',
    'demo_dr1': 'Doctor2026!',
    'demo_dr2': 'Doctor2026!',
    'demo_nurse1': 'Nurse2026!',
    'demo_frontdesk1': 'FrontDesk2026!',
    'demo_cashier1': 'Cashier2026!',
    'demo_lab1': 'Lab2026!',
    'demo_rad1': 'Rad2026!'
}

def test_login(username, password):
    auth_str = base64.b64encode(f"{username}:{password}".encode('utf-8')).decode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/gnuhealth/",
        data=json.dumps({"method": "common.db.login", "params": [username, {"password": password}]}).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {auth_str}'
        }
    )
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=10) as resp:
            lat = round((time.time() - t0) * 1000, 2)
            res = json.loads(resp.read().decode('utf-8'))
            if isinstance(res, list) and len(res) == 2:
                uid, token = res
                print(f"[PASS] {username:16} authenticated successfully (UID: {uid}, latency: {lat} ms)")
                return uid, token
            elif isinstance(res, dict) and res.get('result'):
                uid, token = res['result']
                print(f"[PASS] {username:16} authenticated successfully (UID: {uid}, latency: {lat} ms)")
                return uid, token
            else:
                print(f"[FAIL] {username:16} returned unexpected response: {res}")
                return None, None
    except Exception as e:
        print(f"[FAIL] {username:16} error: {e}")
        return None, None

def test_model(username, uid, token, model, method, params):
    sess_bytes = f"{username}:{uid}:{token}".encode('utf-8')
    sess_str = base64.b64encode(sess_bytes).decode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/gnuhealth/",
        data=json.dumps({"method": f"model.{model}.{method}", "params": params}).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Session {sess_str}'
        }
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            lat = round((time.time() - t0) * 1000, 2)
            res = json.loads(resp.read().decode('utf-8'))
            records = res if isinstance(res, list) else res.get('result', [])
            print(f"  [ALLOW] {model:32}.{method} -> {len(records)} items ({lat} ms)")
            return "ALLOW", len(records), lat
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        status = "DENY" if e.code in [401, 403, 500] else f"HTTP_{e.code}"
        print(f"  [DENY]  {model:32}.{method} {status} ({e.code})")
        return "DENY", 0, 0
    except Exception as e:
        print(f"  [ERROR] {model:32}.{method} -> {e}")
        return "ERROR", 0, 0

if __name__ == "__main__":
    print("============================================================")
    print("TESTING OPERATIONAL ROLES VIA NATIVE JSON-RPC API")
    print("Target: http://34.7.237.8/gnuhealth/")
    print("============================================================")
    
    sessions = {}
    for u, p in USER_PASSWORDS.items():
        uid, tok = test_login(u, p)
        if uid and tok:
            sessions[u] = (uid, tok)

    models_to_probe = [
        ("Patient", "gnuhealth.patient"),
        ("Appointment", "gnuhealth.appointment"),
        ("Evaluation", "gnuhealth.patient.evaluation"),
        ("Prescription", "gnuhealth.prescription.order"),
        ("Lab", "gnuhealth.lab"),
        ("Radiology", "gnuhealth.imaging.test.request"),
        ("HealthService", "gnuhealth.health_service"),
        ("Invoice", "account.invoice"),
        ("PaymentMove", "account.move")
    ]

    api_rbac_results = {}
    for user, (uid, tok) in sessions.items():
        print(f"\nUser: {user} (UID: {uid})")
        api_rbac_results[user] = {"uid": uid, "models": {}}
        for mlabel, mname in models_to_probe:
            params = [[], 0, 1, None, ["id"], {"company": 2}]
            status, cnt, lat = test_model(user, uid, tok, mname, "search_read", params)
            api_rbac_results[user]["models"][mlabel] = status

    # Save to JSON
    import os
    os.makedirs(os.path.join("reports", "final_backend_audit"), exist_ok=True)
    with open(os.path.join("reports", "final_backend_audit", "api_rbac_matrix.json"), "w") as f:
        json.dump(api_rbac_results, f, indent=2)
    print("\nSaved API RBAC matrix to reports/final_backend_audit/api_rbac_matrix.json")
