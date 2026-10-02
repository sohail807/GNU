import urllib.request
import json
import base64
import time

BASE_URL = "http://34.7.237.8"
auth_str = base64.b64encode(b"admin:admin").decode('utf-8')

print("1. Sending login request to Nginx proxy at http://34.7.237.8/gnuhealth/ ...")
req_auth = urllib.request.Request(
    f"{BASE_URL}/gnuhealth/",
    data=json.dumps({"method": "common.db.login", "params": ["admin", {"password": "admin"}]}).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth_str}'
    }
)

try:
    t0 = time.time()
    with urllib.request.urlopen(req_auth, timeout=10) as resp:
        t_login = round((time.time() - t0) * 1000, 2)
        res = json.loads(resp.read().decode('utf-8'))
        print(f"LOGIN SUCCESS ({t_login} ms)! Result:", res)
        user_id, session_token = res['result']
        print(f"Authenticated as User ID {user_id}, Session Token: {session_token[:15]}...")

        sess_str = base64.b64encode(f"{user_id}:{session_token}".encode('utf-8')).decode('utf-8')
        
        # Test model.gnuhealth.patient.search_read
        print("\n2. Querying model.gnuhealth.patient.search_read via Session Token...")
        model_req = urllib.request.Request(
            f"{BASE_URL}/gnuhealth/",
            data=json.dumps({
                "method": "model.gnuhealth.patient.search_read",
                "params": [
                    [],
                    0, 5, None, ["id", "puid", "name"]
                ]
            }).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Session {sess_str}'
            }
        )
        t1 = time.time()
        with urllib.request.urlopen(model_req, timeout=10) as mresp:
            t_sr = round((time.time() - t1) * 1000, 2)
            mres = json.loads(mresp.read().decode('utf-8'))
            records = mres.get('result', [])
            print(f"SEARCH_READ PATIENTS SUCCESS ({t_sr} ms)! Found {len(records)} records:")
            for p in records:
                print("  ", p)

        # Test appointment search_read
        print("\n3. Querying model.gnuhealth.appointment.search_read via Session Token...")
        apt_req = urllib.request.Request(
            f"{BASE_URL}/gnuhealth/",
            data=json.dumps({
                "method": "model.gnuhealth.appointment.search_read",
                "params": [
                    [],
                    0, 5, None, ["id", "appointment_date", "patient", "state"]
                ]
            }).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Session {sess_str}'
            }
        )
        t2 = time.time()
        with urllib.request.urlopen(apt_req, timeout=10) as aresp:
            t_apt = round((time.time() - t2) * 1000, 2)
            ares = json.loads(aresp.read().decode('utf-8'))
            apts = ares.get('result', [])
            print(f"SEARCH_READ APPOINTMENTS SUCCESS ({t_apt} ms)! Found {len(apts)} records:")
            for a in apts:
                print("  ", a)

except Exception as e:
    import traceback
    traceback.print_exc()
