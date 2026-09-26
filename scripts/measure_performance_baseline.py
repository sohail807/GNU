import urllib.request
import json
import base64
import time
import os

BASE_URL = "http://34.7.237.8"
USERNAME = "demo_dr1"
PASSWORD = "Doctor2026!"

def benchmark():
    print("=== MEASURING API & BACKEND PERFORMANCE BASELINE ===")
    
    # 1. Login latency
    login_latencies = []
    uid, token = None, None
    for _ in range(5):
        t0 = time.time()
        auth_str = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode('utf-8')).decode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/gnuhealth/",
            data=json.dumps({"method": "common.db.login", "params": [USERNAME, {"password": PASSWORD}]}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {auth_str}'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            lat = (time.time() - t0) * 1000
            login_latencies.append(lat)
            res = json.loads(resp.read().decode('utf-8'))
            if isinstance(res, list):
                uid, token = res
            elif isinstance(res, dict):
                uid, token = res.get('result', [None, None])

    sess_bytes = f"{USERNAME}:{uid}:{token}".encode('utf-8')
    sess_str = base64.b64encode(sess_bytes).decode('utf-8')

    models_to_test = [
        ("Patient Search/Read", "gnuhealth.patient", [[], 0, 10, None, ["id", "rec_name"], {"company": 2}]),
        ("Appointment Search/Read", "gnuhealth.appointment", [[], 0, 10, None, ["id", "appointment_date", "patient", "state"], {"company": 2}]),
        ("Evaluation Search/Read", "gnuhealth.patient.evaluation", [[], 0, 10, None, ["id", "patient", "evaluation_start", "state"], {"company": 2}]),
        ("Prescription Search/Read", "gnuhealth.prescription.order", [[], 0, 10, None, ["id", "patient", "prescription_date", "state"], {"company": 2}]),
        ("Lab Search/Read", "gnuhealth.lab", [[], 0, 10, None, ["id", "patient", "test", "state"], {"company": 2}]),
        ("Radiology Search/Read", "gnuhealth.imaging.test.request", [[], 0, 10, None, ["id", "patient", "state"], {"company": 2}])
    ]

    metrics = {
        "login_ms": {
            "min": round(min(login_latencies), 2),
            "avg": round(sum(login_latencies) / len(login_latencies), 2),
            "max": round(max(login_latencies), 2)
        },
        "models": {}
    }
    print(f"Login Latency: Avg={metrics['login_ms']['avg']} ms (Min={metrics['login_ms']['min']}, Max={metrics['login_ms']['max']})")

    for label, model, params in models_to_test:
        lats = []
        for _ in range(5):
            t0 = time.time()
            req = urllib.request.Request(
                f"{BASE_URL}/gnuhealth/",
                data=json.dumps({"method": f"model.{model}.search_read", "params": params}).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Session {sess_str}'
                }
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                lat = (time.time() - t0) * 1000
                lats.append(lat)
        
        stat = {
            "min_ms": round(min(lats), 2),
            "avg_ms": round(sum(lats) / len(lats), 2),
            "max_ms": round(max(lats), 2)
        }
        metrics["models"][label] = stat
        print(f"{label:30}: Avg={stat['avg_ms']:6.2f} ms (Min={stat['min_ms']:6.2f}, Max={stat['max_ms']:6.2f})")

    out_dir = os.path.join("reports", "final_backend_audit")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "performance_baseline.json")
    with open(out_file, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved performance baseline to {out_file}")

if __name__ == "__main__":
    benchmark()
