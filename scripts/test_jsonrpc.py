import urllib.request
import json
import base64

base_url = "http://127.0.0.1:8000"
auth_str = base64.b64encode(b"admin:admin").decode('utf-8')

req_auth = urllib.request.Request(
    f"{base_url}/gnuhealth/",
    data=json.dumps({"method": "common.db.login", "params": ["admin", {"password": "admin"}]}).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Basic {auth_str}'
    }
)
try:
    with urllib.request.urlopen(req_auth) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("LOGIN SUCCESS! Result:", res)
        # Result format: [user_id, session_token]
        user_id, session_token = res['result']
        print(f"Authenticated as User ID {user_id}, Session Token: {session_token[:15]}...")

        # Now test Model call using session token!
        # Tryton session header is: Authorization: Session base64(user_id:session_token)
        sess_str = base64.b64encode(f"{user_id}:{session_token}".encode('utf-8')).decode('utf-8')
        
        # Test model.gnuhealth.patient.search_read
        model_req = urllib.request.Request(
            f"{base_url}/gnuhealth/",
            data=json.dumps({
                "method": "model.gnuhealth.patient.search_read",
                "params": [
                    [("puid", "like", "DEMO%")],
                    0, 10, None, ["id", "puid", "name"]
                ]
            }).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Session {sess_str}'
            }
        )
        with urllib.request.urlopen(model_req) as mresp:
            mres = json.loads(mresp.read().decode('utf-8'))
            print("SEARCH_READ PATIENTS SUCCESS! Found:", len(mres.get('result', [])), "records:")
            for p in mres.get('result', []):
                print("  ", p)

except Exception as e:
    import traceback
    traceback.print_exc()
