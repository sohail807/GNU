import urllib.request
import json
import base64

base_url = 'http://34.7.237.8/gnuhealth/'

login_data = json.dumps({'method': 'common.db.login', 'params': ['demo_frontdesk1', {'password': 'FrontDesk2026!'}]}).encode('utf-8')
req = urllib.request.Request(base_url, data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print("Login res:", res)
    user_id, token = res

auth_str = base64.b64encode(f'demo_frontdesk1:{user_id}:{token}'.encode('utf-8')).decode('utf-8')

search_data = json.dumps({
    'method': 'model.gnuhealth.patient.search_read',
    'params': [[], 0, 1, None, ['id', 'rec_name', 'critical_info', 'blood_type'], {'company': 2}]
}).encode('utf-8')
req = urllib.request.Request(base_url, data=search_data, headers={'Content-Type': 'application/json', 'Authorization': f'Session {auth_str}'})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        pat = res[0]
        print('Found patient:', pat)
except urllib.error.HTTPError as e:
    print('Search error:', e.code, e.read().decode('utf-8'))
    exit(1)

pat_id = pat['id']
write_data = json.dumps({
    'method': 'model.gnuhealth.patient.write',
    'params': [[pat_id], {'critical_info': 'Test clinical note by frontdesk', 'blood_type': 'A'}, {'company': 2}]
}).encode('utf-8')
req = urllib.request.Request(base_url, data=write_data, headers={'Content-Type': 'application/json', 'Authorization': f'Session {auth_str}'})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print('Write response as demo_frontdesk1:', res)
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print('HTTPError:', e.code, err_body)
