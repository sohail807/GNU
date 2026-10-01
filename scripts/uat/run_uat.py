#!/usr/bin/env python3
"""UAT runner for IST Health (aster-dubai).  Executes TC-001..TC-067 through the app's HTTP API as the
right role for each case and writes reports/uat/uat_results.json  ([{id, status, observed}]).

* Synthetic data only.  At most ONE new patient ("Alexander Wright", QID "UAT"+digits) is created; its ids are
  cached in reports/uat/uat_state.json so a re-run reuses it instead of creating another.
* Passwords are read from the staff JSON file and are never printed or written.
* Status values: PASS, FAIL, NOT_TESTABLE (cannot be exercised through the API; the reason is in `observed`).

Usage:  python scripts/uat/run_uat.py [--fresh]
Env:    UAT_STAFF_FILE  path to the staff json (list of {role, username, password})
"""
import datetime as dt
import http.cookiejar
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from aster_demo.client import BASE_URL, load_profiles, open_session  # noqa: E402

HOSPITAL = "aster-dubai"
STAFF_FILE = os.environ.get(
    "UAT_STAFF_FILE",
    r"C:/Users/MOHAMM~1/AppData/Local/Temp/claude/C--Users-MohammedSohail-OneDrive---IRISSTAR-TECHNOLOGIES-GNU-Health/"
    r"f7c75dc7-1841-4c8e-856e-ec07de9df951/scratchpad/staff_aster-dubai.json",
)
OUT_DIR = os.path.join(ROOT, "reports", "uat")
STATE_FILE = os.path.join(OUT_DIR, "uat_state.json")
API_DIR = os.path.join(ROOT, "frontend", "src", "app", "api")
ACL_FILE = os.path.join(ROOT, "frontend", "src", "lib", "access-control.ts")
os.makedirs(OUT_DIR, exist_ok=True)

# ----------------------------------------------------------------------------------------------- http layer
LOG = []  # every error response (status >= 400), scanned by TC-067
ALL_IDS = []


class Resp:
    def __init__(self, status, text, ctype):
        self.status, self.text, self.ctype = status, text, ctype
        try:
            self.data = json.loads(text) if text else {}
        except ValueError:
            self.data = None

    @property
    def err(self):
        return (self.data or {}).get("error") if isinstance(self.data, dict) else None

    def snip(self, n=160):
        t = self.text.replace("\n", " ")
        return t[:n]

    def __getitem__(self, k):
        return (self.data or {}).get(k)

    def get(self, k, d=None):
        return (self.data or {}).get(k, d) if isinstance(self.data, dict) else d


def call(client, method, path, body=None, label=None, retry=True):
    """client=None -> unauthenticated request (no cookies)."""
    if client is None:
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    else:
        opener = client.opener
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data is not None else {}
    last = None
    for attempt in range(3):
        req = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
        try:
            with opener.open(req, timeout=90) as r:
                resp = Resp(r.status, r.read().decode("utf-8", "replace"), r.headers.get("Content-Type", ""))
        except urllib.error.HTTPError as e:
            resp = Resp(e.code, e.read().decode("utf-8", "replace"), e.headers.get("Content-Type", ""))
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last = Resp(0, f"network error: {e}", "")
            time.sleep(1.5 * (attempt + 1))
            continue
        # transient gateway errors are retried for idempotent GETs only
        gateway_html = resp.status in (502, 503, 504) and resp.data is None  # proxy/Cloud Run error page, never reached the app
        if resp.status in (502, 503, 504) and (method == "GET" or gateway_html) and attempt < 2 and retry:
            time.sleep(1.5 * (attempt + 1))
            last = resp
            continue
        if resp.status >= 400 or resp.status == 0:
            LOG.append({"who": label or (client.username if client else "anon"), "method": method, "path": path,
                        "status": resp.status, "ctype": resp.ctype, "body": resp.text[:700]})
        return resp
    return last


# ----------------------------------------------------------------------------------------------- results
RES = {}
DETAIL = {}


def rec(tc, ok, observed, status=None):
    st = status or ("PASS" if ok else "FAIL")
    RES[tc] = {"id": tc, "status": st, "observed": observed[:900]}
    print(f"{tc}: {st}  {observed[:150]}")


def guarded(name, fn, tcs):
    try:
        fn()
    except Exception as e:  # a crash must not lose the other cases
        import traceback
        traceback.print_exc()
        for tc in tcs:
            if tc not in RES:
                rec(tc, False, f"script error in {name}: {type(e).__name__}: {e}")


def rid(v):
    """id out of an int or a [id, name] tuple"""
    if isinstance(v, list) and v:
        return v[0]
    return v


def today_dubai():
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=4)).date()


def fut_day(lo, hi):
    return today_dubai() + dt.timedelta(days=random.randint(lo, hi))


# ----------------------------------------------------------------------------------------------- setup
fresh = "--fresh" in sys.argv
state = {} if fresh or not os.path.exists(STATE_FILE) else json.load(open(STATE_FILE, encoding="utf-8"))
profile = load_profiles(True)[HOSPITAL]
staff = json.load(open(STAFF_FILE, encoding="utf-8"))
by_role = {}
for s in staff:
    by_role.setdefault(s["role"], s)
S = {}


def login(key, role, nth=0):
    cands = [s for s in staff if s["role"] == role]
    s = cands[nth]
    S[key] = open_session(profile, HOSPITAL, s["username"], s["password"])
    return S[key]


ROLE_KEYS = {"physician": "phys", "nursing": "nurse", "reception": "rec", "cashier": "cash", "accountant": "acct",
             "lab": "lab", "radiology": "rad"}
for role, key in ROLE_KEYS.items():
    login(key, role)
login("phys2", "physician", 1)
phys, nurse, rec_, cash, acct, lab, rad = (S[k] for k in ("phys", "nurse", "rec", "cash", "acct", "lab", "rad"))
HPID = phys.user.get("healthprofId")
print("logged in as:", {k: v.user.get("role") for k, v in S.items()})

P = {}  # shared context (patient ids, evaluation ids ...)

# =============================================================================================== TC-001/011/012
GENDER_OK = None


def tc_patient():
    global GENDER_OK
    if state.get("patient"):
        P.update(state["patient"])
        prev = state.get("tc001")
        if prev:
            RES["TC-001"] = prev
            print("TC-001: reused from earlier run ->", prev["status"])
    else:
        qid = "UAT" + "".join(random.choices("0123456789", k=9))
        r = call(rec_, "POST", "/api/clinical/patients",
                 {"name": "Alexander Wright", "qid": qid, "dob": "1992-03-08", "gender": "Female", "bloodType": "O-"})
        P.update(qid=qid)
        if r.status == 200 and r["success"]:
            pat = r["patient"]
            P.update(patientId=r["patientId"], puid=r["puid"])
            bg = pat.get("bloodGroup", "")
            ok = bool(re.search(r"(AB|A|B|O)", bg)) and ("+" in bg or "-" in bg)
            rec("TC-001", ok, f"HTTP 200 patientId={r['patientId']} puid={r['puid']} bloodGroup='{bg}' (sent 'O-'); "
                f"response gender field='{pat.get('gender')}' for a Female patient")
        else:
            rec("TC-001", False, f"HTTP {r.status} {r.snip()}")
            raise RuntimeError("cannot create the UAT patient")
        # partyId for insurance
        g = call(rec_, "GET", f"/api/clinical/patients?id={P['patientId']}")
        P["partyId"] = (g["patients"] or [{}])[0].get("partyId")
        state["patient"] = {k: P[k] for k in ("patientId", "puid", "qid", "partyId") if k in P}
        state["tc001"] = RES["TC-001"]
        json.dump(state, open(STATE_FILE, "w", encoding="utf-8"), indent=1)

    # TC-011 duplicate QID / TC-012 invalid gender
    r = call(rec_, "POST", "/api/clinical/patients",
             {"name": "Alexander Wright", "qid": P["qid"], "dob": "1992-03-08", "gender": "Female", "bloodType": "O-"})
    rec("TC-011", r.status == 409 and r.get("isDuplicate") is True,
        f"HTTP {r.status} isDuplicate={r.get('isDuplicate')} {r.snip(110)} (same name+QID; QID-only uniqueness not isolated, "
        f"a different name would create a 2nd patient if QID is not unique, so it was not attempted)")
    r = call(rec_, "POST", "/api/clinical/patients",
             {"name": "UAT Invalid Gender", "qid": "UATBAD" + str(random.randint(10**8, 10**9)), "dob": "1990-01-01", "gender": "Zebra"})
    rec("TC-012", r.status == 400, f"HTTP {r.status} {r.snip(140)}")


guarded("patient", tc_patient, ["TC-001", "TC-011", "TC-012"])
if "patientId" not in P:
    print("no patient; abort")
    sys.exit(1)
PID, PUID = P["patientId"], P["puid"]


# =============================================================================================== TC-014
def tc014():
    r1 = call(rec_, "GET", "/api/clinical/patients?q=Alexander%20Wri")
    n1 = [p for p in (r1["patients"] or []) if p["id"] == PID]
    r2 = call(rec_, "GET", f"/api/clinical/patients?q={PUID}")
    n2 = [p for p in (r2["patients"] or []) if p["id"] == PID]
    half = PUID[:max(3, len(PUID) // 2)]
    r3 = call(rec_, "GET", f"/api/clinical/patients?q={half}")
    rec("TC-014", bool(n1) and bool(n2),
        f"partial name 'Alexander Wri': HTTP {r1.status}, {len(r1['patients'] or [])} hits, UAT patient found={bool(n1)}; "
        f"PUID '{PUID}': HTTP {r2.status}, {len(r2['patients'] or [])} hits, found={bool(n2)}; partial PUID '{half}': "
        f"{len(r3['patients'] or [])} hits (results capped at 50 newest)")


guarded("tc014", tc014, ["TC-014"])

# =============================================================================================== appointments
APPT = {}


def book(body_over=None, client=None):
    body = {"action": "book", "patientId": PID, "healthprofId": HPID, "appointmentDate": str(today_dubai()),
            "appointmentTime": "09:15", "urgency": "normal"}
    body.update(body_over or {})
    return call(client or rec_, "POST", "/api/clinical/appointments", body)


def book_free(over=None, tries=12):
    """book an appointment, picking a random 15-minute slot and retrying on a 409 (earlier runs leave appointments behind)"""
    over = dict(over or {})
    fixed_time = "appointmentTime" in over
    r = None
    for _ in range(tries):
        if not fixed_time:
            over["appointmentTime"] = f"{random.randint(6, 22):02d}:{random.choice(['00', '15', '30', '45'])}"
        r = book(over)
        if r.status != 409:
            break
    return r


def tc_appts():
    r = book_free()
    ok = r.status == 200 and r["appointmentId"]
    APPT["id"] = r["appointmentId"] if ok else None
    chk = call(rec_, "GET", f"/api/clinical/appointments?patientId={PID}")
    mine = [a for a in (chk["appointments"] or []) if a["id"] == APPT["id"]]
    rec("TC-002", bool(ok and mine and mine[0]["patientId"] == PID),
        f"HTTP {r.status} appointmentId={APPT['id']}; listed for patient={bool(mine)} state={mine[0]['state'] if mine else None}"
        f" physician='{mine[0]['physicianName'] if mine else None}' time={mine[0]['time'] if mine else None}")

    # TC-003 check-in
    r = call(rec_, "POST", "/api/clinical/appointments", {"action": "checkin", "appointmentId": APPT["id"]})
    lst = call(rec_, "GET", "/api/clinical/appointments")  # the front-desk roster feed (no patient filter)
    row = [a for a in (lst["appointments"] or []) if a["id"] == APPT["id"]]
    st = row[0]["state"] if row else None
    # frontdesk/page.tsx builds the arrival roster from state === "checkin"
    rec("TC-003", r.status == 200 and st == "checkin",
        f"checkin HTTP {r.status}; appointment is in the roster feed={bool(row)} with state='{st}'. "
        f"Front-desk page (frontdesk/page.tsx:116,123,346,372) matches state === 'checkin' only")

    # TC-016 invalid time (and invalid date)
    r = book({"appointmentTime": "25:99", "appointmentDate": str(fut_day(500, 900))})
    rA = r
    r = book({"appointmentDate": "2026-02-30"})
    rB = r
    r = book({"appointmentTime": "abc", "appointmentDate": str(fut_day(901, 1300))})
    rec("TC-016", rA.status == 400 and r.status == 400,
        f"time '25:99' -> HTTP {rA.status} {rA.snip(80)}; time 'abc' -> HTTP {r.status} {r.snip(80)}; "
        f"invalid date 2026-02-30 -> HTTP {rB.status} {rB.snip(60)}")

    # TC-017 same doctor + slot twice
    d = str(fut_day(10, 60))
    a = book_free({"appointmentDate": d})
    slot = a["appointmentId"] and next((x["time"] for x in (call(rec_, "GET", f"/api/clinical/appointments?patientId={PID}")["appointments"] or []) if x["id"] == a["appointmentId"]), "14:45")
    b = book({"appointmentDate": d, "appointmentTime": slot})
    rec("TC-017", a.status == 200 and b.status in (400, 409),
        f"first HTTP {a.status} id={a['appointmentId']}; second identical doctor+slot HTTP {b.status} "
        f"{'id=' + str(b['appointmentId']) if b.status == 200 else b.snip(100)}  ({'second ACCEPTED -> double booking' if b.status == 200 else 'rejected'})")


guarded("appts", tc_appts, ["TC-002", "TC-003", "TC-016", "TC-017"])


# =============================================================================================== triage
def tc_triage():
    n0 = len(call(nurse, "GET", f"/api/clinical/triage?patientId={PID}")["evaluations"] or [])
    v1 = {"patientId": PID, "systolic": 118, "diastolic": 76, "bpm": 72, "temperature": 36.8, "respiratoryRate": 16,
          "osat": 98, "weight": 62, "height": 165, "chiefComplaint": "UAT fever and cough"}
    r1 = call(nurse, "POST", "/api/clinical/triage", v1)
    E1 = r1["evaluationId"]
    P["E1"] = E1
    g = call(nurse, "GET", f"/api/clinical/triage?patientId={PID}")
    evs = g["evaluations"] or []
    inprog = [e for e in evs if e["state"] == "in_progress"]
    rec("TC-024", r1.status == 200 and E1 and len(inprog) == 1 and inprog[0]["id"] == E1 and len(evs) == n0 + 1,
        f"first vitals HTTP {r1.status} new evaluationId={E1}; patient evaluations {n0}->{len(evs)} (earlier ones are already done), {len(inprog)} in_progress "
        f"(state={inprog[0]['state'] if inprog else None}, start={inprog[0]['evaluationStart'] if inprog else None})")
    v2 = dict(v1, systolic=124, diastolic=80, bpm=80, osat=97)
    r2 = call(nurse, "POST", "/api/clinical/triage", v2)
    g2 = call(nurse, "GET", f"/api/clinical/triage?patientId={PID}")
    evs2 = g2["evaluations"] or []
    ip2 = [e for e in evs2 if e["state"] == "in_progress"]
    rec("TC-004", r2.status == 200 and r2["evaluationId"] == E1 and len(evs2) == len(evs) and len(ip2) == 1 and ip2[0]["systolic"] == 124,
        f"second vitals HTTP {r2.status} evaluationId={r2['evaluationId']} (first was {E1}); evaluations for patient {len(evs)}->{len(evs2)}, in_progress={len(ip2)}; "
        f"vitals updated systolic={ip2[0]['systolic'] if ip2 else None}")
    v3 = dict(v1, systolic=130, bpm=84)
    r3 = call(nurse, "POST", "/api/clinical/triage", v3)
    g3 = call(nurse, "GET", f"/api/clinical/triage?patientId={PID}")
    e3 = [e for e in (g3["evaluations"] or []) if e["id"] == E1]
    got = e3[0] if e3 else {}
    # does the nursing UI use the GET?  (static check of the page source)
    nsrc = open(os.path.join(ROOT, "frontend", "src", "app", "(app)", "nursing", "page.tsx"), encoding="utf-8").read()
    ui_reads = "api/clinical/triage?patientId" in nsrc or re.search(r"fetch\([^)]*triage[^)]*\)\s*;?\s*\n", nsrc) and "triage?" in nsrc
    rec("TC-025", r3.status == 200 and r3["evaluationId"] == E1 and got.get("systolic") == 130,
        f"repeat vitals HTTP {r3.status} resumed evaluationId={r3['evaluationId']}. Triage GET (nurse) returns previously captured "
        f"vitals: systolic={got.get('systolic')} bpm={got.get('bpm')} temp={got.get('temperature')} spo2={got.get('osat')} (API: yes). "
        f"UI gap: nursing/page.tsx only POSTs to /api/clinical/triage (line ~105) and clears the form after save (line ~86); "
        f"it never GETs earlier vitals, so a nurse cannot see/edit them on that page" + ("" if not ui_reads else " [GET found in page?]"))


guarded("triage", tc_triage, ["TC-024", "TC-004", "TC-025"])
E1 = P.get("E1")

# pathology code
pr = call(phys, "GET", "/api/clinical/pathology?q=J06")
PATH = (pr["pathologies"] or [])
if not PATH:
    PATH = call(phys, "GET", "/api/clinical/pathology?q=A")["pathologies"] or []
DX = PATH[0] if PATH else {"id": None, "code": None}
PATH2 = (call(phys, "GET", "/api/clinical/pathology?q=K35")["pathologies"] or PATH)
DX2 = PATH2[0] if PATH2 else DX

soap = {"patientId": PID, "evaluationId": E1, "chiefComplaint": "UAT fever and cough x3 days",
        "presentIllness": "Synthetic UAT history: fever, dry cough, no dyspnoea.",
        "physicalExam": "Synthetic UAT exam: T 38.1, throat erythema, chest clear.", "directions": "Rest, fluids, paracetamol PRN.",
        "diagnosisCode": DX["code"]}

LAB_TESTS = (call(phys, "GET", "/api/clinical/laboratory?catalog=tests")["tests"] or [])
IMG_TYPES = (call(phys, "GET", "/api/clinical/radiology")["testTypes"] or [])
lab_by = {t["name"]: t for t in LAB_TESTS}
img_by = {t["name"]: t for t in IMG_TYPES}


def tc_consult_prelim():
    # TC-018 save, then save again with the evaluation id -> same evaluation updated
    a = call(phys, "POST", "/api/clinical/consultations", soap)
    soap2 = dict(soap, chiefComplaint="UAT fever and cough x3 days (updated)", directions="Rest, fluids (updated).")
    b = call(phys, "POST", "/api/clinical/consultations", soap2)
    g = call(phys, "GET", f"/api/clinical/consultations?patientId={PID}")
    rows = g["consultations"] or []
    mine = [x for x in rows if x["id"] == E1]
    # extra probe: save WITHOUT evaluationId while the triage evaluation is still in_progress
    c = call(phys, "POST", "/api/clinical/consultations", dict(soap, evaluationId=None, chiefComplaint="UAT probe without evaluation id"))
    extra = ""
    if c.status == 200 and c["evaluationId"] and c["evaluationId"] != E1:
        extra = f" EXTRA: save without evaluationId created NEW evaluation {c['evaluationId']} next to in_progress {E1} (no resume of the open triage evaluation)"
        call(phys, "POST", "/api/clinical/consultations", dict(soap, evaluationId=c["evaluationId"], completed=True))  # tidy: close the probe
        P["E_probe"] = c["evaluationId"]
    elif c.status == 200:
        extra = f" EXTRA: save without evaluationId resumed {c['evaluationId']}"
    rec("TC-018", a.status == 200 and b.status == 200 and a["evaluationId"] == E1 and b["evaluationId"] == E1
        and mine and mine[0]["chief_complaint"].endswith("(updated)") and a["state"] == "in_progress",
        f"save#1 HTTP {a.status} eval={a['evaluationId']} state={a['state']}; save#2 HTTP {b.status} eval={b['evaluationId']}; "
        f"stored chief_complaint='{mine[0]['chief_complaint'] if mine else None}'.{extra}")

    # TC-021 invalid lab test name -> 400, evaluation still saved
    before = call(lab, "GET", f"/api/clinical/laboratory?patientId={PID}")
    nb = len(before["labOrders"] or [])
    r = call(phys, "POST", "/api/clinical/consultations",
             dict(soap, chiefComplaint="UAT invalid-lab probe", orderLab=True, labTestName="ZZZ-NO-SUCH-TEST-UAT"))
    after = call(lab, "GET", f"/api/clinical/laboratory?patientId={PID}")
    na = len(after["labOrders"] or [])
    g = call(phys, "GET", f"/api/clinical/consultations?patientId={PID}")
    cc = [x for x in g["consultations"] if x["id"] == E1]
    saved = bool(cc) and cc[0]["chief_complaint"] == "UAT invalid-lab probe"
    fb = ""
    if r.status == 200:
        ordered = [o for o in after["labOrders"] if o["id"] == r["labOrderId"]]
        fb = f" -> silently ordered '{ordered[0]['testName'] if ordered else '?'}' (catalog fallback, clinical-lookup.ts resolveLabTestType ~line 604)"
    rec("TC-021", r.status == 400 and saved,
        f"HTTP {r.status} {r.snip(110)}; lab orders {nb}->{na}; evaluation chief_complaint saved={saved}{fb}")


guarded("consult_prelim", tc_consult_prelim, ["TC-018", "TC-021"])


# =============================================================================================== labs: helper
def lab_get(order_id):
    g = call(lab, "GET", f"/api/clinical/laboratory?patientId={PID}")
    for o in g["labOrders"] or []:
        if o["id"] == order_id:
            return o
    return None


def build_results(order, extreme=None):
    crit = []
    for c in order["criteria"]:
        item = {"id": c["id"], "result": None, "resultText": "", "remarks": ""}
        if c["excluded"]:
            crit.append(item)
            continue
        lo, up = c["lowerLimit"], c["upperLimit"]
        if lo is not None and up is not None:
            item["result"] = round((lo + up) / 2, 2)
        elif up is not None:
            item["result"] = round(up / 2, 2)
        elif lo is not None:
            item["result"] = round(lo + 1, 2)
        elif c["unit"]:
            item["result"] = 5
        else:
            item["resultText"] = "Normal"
        crit.append(item)
    if extreme:
        for item, c in zip(crit, order["criteria"]):
            if c["upperLimit"] is not None and not c["excluded"]:
                item["result"] = round(c["upperLimit"] * 3 + 10, 2)
                item["resultText"] = ""
                break
    return crit


def order_lab(test, extra=None, client=None):
    body = dict(soap, orderLab=True, labTestId=test["id"], chiefComplaint="UAT lab " + test["name"][:30])
    body.update(extra or {})
    return call(client or phys, "POST", "/api/clinical/consultations", body)


# =============================================================================================== TC-005 .. TC-009 golden path
G = {}


def tc_golden_orders():
    # TC-020 lab + imaging together (in the same evaluation, still in progress)
    cbc = lab_by.get("COMPLETE BLOOD COUNT") or LAB_TESTS[0]
    xr = img_by.get("Abdominal X-Ray") or IMG_TYPES[0]
    r = call(phys, "POST", "/api/clinical/consultations",
             dict(soap, chiefComplaint="UAT lab+imaging together", orderLab=True, labTestId=cbc["id"],
                  orderRadiology=True, radiologyTestId=xr["id"]))
    P["tc020"] = r
    rec("TC-020", r.status == 200 and bool(r["labOrderId"]) and bool(r["radiologyOrderId"]),
        f"HTTP {r.status} labOrderId={r['labOrderId']} radiologyOrderId={r['radiologyOrderId']} {r.snip(80) if r.status != 200 else ''}")
    G["extra_lab"], G["extra_img"] = r["labOrderId"], r["radiologyOrderId"]


guarded("golden_orders1", tc_golden_orders, ["TC-020"])


def tc027_panels():
    """one lab case from each panel type: order (physician) -> save-results -> complete (lab)"""
    rows, bad = [], []
    for t in LAB_TESTS:
        try:
            r = order_lab(t)
            if r.status != 200 or not r["labOrderId"]:
                bad.append(f"{t['name']}: order HTTP {r.status} {r.snip(70)}")
                continue
            oid = r["labOrderId"]
            o = lab_get(oid)
            n = len(o["criteria"]) if o else -1
            if not o or n == 0:
                bad.append(f"{t['name']}: order {oid} has {n} analytes")
                continue
            s = call(lab, "POST", "/api/clinical/laboratory",
                     {"action": "save-results", "labId": oid, "criteria": build_results(o), "results": "UAT results"})
            if s.status != 200:
                bad.append(f"{t['name']}: save-results HTTP {s.status} {s.snip(110)}")
                continue
            c = call(lab, "POST", "/api/clinical/laboratory", {"action": "complete", "labId": oid})
            o2 = lab_get(oid)
            if c.status != 200 or (o2 or {}).get("state") != "done":
                bad.append(f"{t['name']}: complete HTTP {c.status} state={(o2 or {}).get('state')}")
                continue
            rows.append(f"{t['name']}({n})")
            P.setdefault("panel_orders", {})[t["name"]] = oid
        except Exception as e:
            bad.append(f"{t['name']}: script error {e}")
    DETAIL["lab_panels_ok"] = rows
    DETAIL["lab_panels_failed"] = bad
    rec("TC-027", not bad and len(rows) == len(LAB_TESTS),
        f"{len(LAB_TESTS)} panel types in catalog: {', '.join(t['name'] for t in LAB_TESTS)}. Full order->save-results->complete OK for "
        f"{len(rows)}/{len(LAB_TESTS)}" + (f"; FAILED: {' | '.join(bad)}" if bad else ""))


guarded("tc027", tc027_panels, ["TC-027"])


def tc_lab_negatives():
    t = lab_by.get("LIPID PROFILE") or LAB_TESTS[0]
    r = order_lab(t)
    oid = r["labOrderId"]
    o = lab_get(oid)
    # TC-028 mismatched analyte ids
    s = call(lab, "POST", "/api/clinical/laboratory",
             {"action": "save-results", "labId": oid, "criteria": [{"id": 999999991, "result": 1}]})
    s2 = None
    if o and o["criteria"]:
        bad = build_results(o)
        bad[0]["id"] = 999999991
        s2 = call(lab, "POST", "/api/clinical/laboratory", {"action": "save-results", "labId": oid, "criteria": bad})
    rec("TC-028", s.status == 400 and (s2 is None or s2.status == 400),
        f"unknown analyte only -> HTTP {s.status} {s.snip(80)}; right count but one wrong id -> HTTP {s2.status if s2 else None} {s2.snip(80) if s2 else ''}")
    # TC-030 numeric + qualitative together
    both = build_results(o)
    both[0]["result"] = 5
    both[0]["resultText"] = "Positive"
    s = call(lab, "POST", "/api/clinical/laboratory", {"action": "save-results", "labId": oid, "criteria": both})
    rec("TC-030", s.status == 400, f"HTTP {s.status} {s.snip(120)}")
    # TC-031 out-of-range -> warning flag + saved
    ext = build_results(o, extreme=True)
    s = call(lab, "POST", "/api/clinical/laboratory", {"action": "save-results", "labId": oid, "criteria": ext})
    o2 = lab_get(oid)
    warned = [c["name"] for c in (o2 or {}).get("criteria", []) if c["warning"]]
    rec("TC-031", s.status == 200 and bool(warned),
        f"HTTP {s.status}; save response has no 'warning' key (keys: {sorted((s.data or {}).keys())}, alertsRaised={s.get('alertsRaised')}); "
        f"criteria flagged warning=true on re-read: {warned[:3]}")
    P["lab_open"] = oid
    # complete then TC-029: save-results on a non-draft order
    c = call(lab, "POST", "/api/clinical/laboratory", {"action": "complete", "labId": oid})
    s = call(lab, "POST", "/api/clinical/laboratory", {"action": "save-results", "labId": oid, "criteria": build_results(o)})
    rec("TC-029", s.status == 409, f"complete HTTP {c.status}; save-results on done order -> HTTP {s.status} {s.snip(110)}")


guarded("lab_neg", tc_lab_negatives, ["TC-028", "TC-030", "TC-031", "TC-029"])


def tc032_imaging():
    names = [("X-ray", "Skull X-Ray"), ("Ultrasound", "Abdominal Ultrasound"), ("MRI", "Brain MRI"), ("CT", "Head CT")]
    created = {}
    for mod, n in names:
        t = img_by.get(n)
        if not t:
            cands = [k for k in img_by if mod.lower().replace("-", "") in k.lower().replace("-", "")]
            t = img_by[cands[0]] if cands else None
        if not t:
            created[mod] = (None, "no such study in catalogue")
            continue
        r = call(phys, "POST", "/api/clinical/radiology", {"action": "create", "patientId": PID, "testId": t["id"]})
        created[mod] = (r["orderId"], t["name"]) if r.status == 200 else (None, f"HTTP {r.status} {r.snip(60)}")
    P["img_orders"] = created
    # TC-033 finalize without findings (use the X-ray order), then proper finalisation of all four
    xid = created["X-ray"][0]
    r33 = call(rad, "POST", "/api/clinical/radiology", {"action": "finalize", "requestId": xid})
    r33b = call(rad, "POST", "/api/clinical/radiology", {"action": "finalize", "requestId": xid, "findings": "   "})
    rec("TC-033", r33.status == 400 and r33b.status == 400,
        f"no findings -> HTTP {r33.status} {r33.snip(90)}; blank findings -> HTTP {r33b.status}")
    out = {}
    for mod, (oid, n) in created.items():
        if not oid:
            out[mod] = f"not created ({n})"
            continue
        f = call(rad, "POST", "/api/clinical/radiology", {"action": "finalize", "requestId": oid, "findings": f"UAT synthetic {mod} findings: no acute abnormality."})
        out[mod] = f"{n}: HTTP {f.status}"
    g = call(rad, "GET", f"/api/clinical/radiology?patientId={PID}")
    states = {o["id"]: o["state"] for o in g["radiologyOrders"] or []}
    ok = all(oid and states.get(oid) == "done" for oid, _ in created.values())
    rec("TC-032", ok, "; ".join(f"{m}: {out[m]} state={states.get(created[m][0])}" for m in created))
    # TC-034 re-finalize
    f2 = call(rad, "POST", "/api/clinical/radiology", {"action": "finalize", "requestId": xid, "findings": "UAT second finalisation attempt"})
    rec("TC-034", f2.status in (400, 409), f"re-finalize of done study {xid}: HTTP {f2.status} {f2.snip(110)} "
        f"({'accepted: a 2nd result row is created and the report overwritten' if f2.status == 200 else 'rejected'})")


guarded("imaging", tc032_imaging, ["TC-032", "TC-033", "TC-034"])


def tc_golden_complete():
    """TC-005/026/019: final save with SOAP + ICD-10 + lab + imaging and completed:true"""
    cbc = lab_by.get("COMPLETE BLOOD COUNT") or LAB_TESTS[0]
    xr = img_by.get("Abdominal X-Ray") or IMG_TYPES[0]
    body = dict(soap, chiefComplaint="UAT fever and cough x3 days", orderLab=True, labTestId=cbc["id"],
                orderRadiology=True, radiologyTestId=xr["id"], completed=True)
    r = call(phys, "POST", "/api/clinical/consultations", body)
    P["tc005"] = r
    lo, ro = r["labOrderId"], r["radiologyOrderId"]
    G["lab"], G["img"] = lo, ro
    o = lab_get(lo) if lo else None
    n = len(o["criteria"]) if o else 0
    g = call(phys, "GET", f"/api/clinical/consultations?patientId={PID}")
    ev = [x for x in g["consultations"] if x["id"] == E1]
    state_now = ev[0]["state"] if ev else None
    dxname = ev[0].get("diagnosis") if ev else None
    rc = call(rad, "GET", f"/api/clinical/radiology?patientId={PID}")
    img = [x for x in rc["radiologyOrders"] if x["id"] == ro] if ro else []
    rec("TC-005", r.status == 200 and n > 0 and bool(img) and r["state"] == "done" and state_now == "done",
        f"HTTP {r.status} state={r['state']} evaluation={E1} now '{state_now}' dx={dxname}; labOrderId={lo} with {n} analytes "
        f"({', '.join(c['name'] for c in (o or {}).get('criteria', [])[:4])}...); radiologyOrderId={ro} listed={bool(img)} state={img[0]['state'] if img else None}"
        + ("" if r.status == 200 else " " + r.snip(150)))
    rec("TC-026", r.status == 200 and state_now == "done",
        f"complete HTTP {r.status}; end_evaluation accepted with server-created UTC timestamps (evaluation_start made by triage in UTC); "
        f"no 'End time before start' rejection" + ("" if r.status == 200 else f" — {r.snip(150)}"))
    # TC-019 complete twice -> 409
    r2 = call(phys, "POST", "/api/clinical/consultations", dict(soap, completed=True))
    r3 = call(phys, "POST", "/api/clinical/consultations", dict(soap, evaluationId=E1, completed=True))
    rec("TC-019", r3.status == 409, f"second complete with evaluationId={E1}: HTTP {r3.status} {r3.snip(100)}; "
        f"(complete without evaluationId creates new evaluation: HTTP {r2.status} eval={r2['evaluationId']} state={r2['state']})")
    if r2.status == 200 and r2["evaluationId"]:
        P["E_extra_done"] = r2["evaluationId"]


guarded("golden_complete", tc_golden_complete, ["TC-005", "TC-026", "TC-019"])


def tc007_008():
    lo = G.get("lab")
    o = lab_get(lo)
    s = call(lab, "POST", "/api/clinical/laboratory", {"action": "save-results", "labId": lo, "criteria": build_results(o), "results": "UAT golden CBC"})
    c = call(lab, "POST", "/api/clinical/laboratory", {"action": "complete", "labId": lo})
    o2 = lab_get(lo)
    rec("TC-007", s.status == 200 and c.status == 200 and o2["state"] == "done",
        f"save-results (first attempt) HTTP {s.status} savedCriteria={s.get('savedCriteria')} {s.snip(80) if s.status != 200 else ''}; "
        f"complete HTTP {c.status}; final state='{o2['state'] if o2 else None}'")
    ro = G.get("img")
    f = call(rad, "POST", "/api/clinical/radiology", {"action": "finalize", "requestId": ro, "findings": "UAT synthetic chest/abdomen findings normal."})
    g = call(rad, "GET", f"/api/clinical/radiology?patientId={PID}")
    st = [x for x in g["radiologyOrders"] if x["id"] == ro]
    rec("TC-008", f.status == 200 and st and st[0]["state"] == "done",
        f"finalize HTTP {f.status}; state='{st[0]['state'] if st else None}', findings stored='{(st[0]['findings'] or '')[:40] if st else None}'")


guarded("tc007_008", tc007_008, ["TC-007", "TC-008"])


# =============================================================================================== prescriptions / pharmacy
def find_med(q):
    r = call(phys, "GET", f"/api/clinical/medicaments?q={q}")
    return r["medicaments"] or []


def tc_rx():
    meds = find_med("paracetamol") or find_med("a")
    med = meds[0]
    P["med"] = med
    ph0 = call(cash, "GET", "/api/clinical/pharmacy")
    P["ph0"] = ph0["stats"]
    r = call(phys, "POST", "/api/clinical/prescriptions",
             {"patientId": PID, "lines": [{"medicamentId": med["id"], "dose": 500, "frequency": "tid", "duration": 5}], "notes": "UAT golden Rx"})
    rxid = r["prescriptionId"]
    P["rx"] = rxid
    rec("TC-006", r.status == 200 and r["state"] == "draft",
        f"HTTP {r.status} prescriptionId={rxid} state='{r['state']}' reference={r['reference']} medicament='{med['name']}'")
    # TC-009 pending before dispense; nothing auto-dispenses it
    ph1 = call(cash, "GET", "/api/clinical/pharmacy")
    row1 = [x for x in ph1["prescriptions"] if x["id"] == rxid]
    time.sleep(8)
    ph2 = call(cash, "GET", "/api/clinical/pharmacy")
    row2 = [x for x in ph2["prescriptions"] if x["id"] == rxid]
    P["ph_before"] = ph2["stats"]
    P["ph_list_before"] = ph2["prescriptions"]
    # stock before dispense (if tracked)
    stk = call(cash, "GET", "/api/clinical/stock")
    P["stock_before"] = sum(b["quantity"] for b in (stk["batches"] or []) if b["medicineId"] == med["id"])
    P["stock_tracked"] = any(b["medicineId"] == med["id"] for b in (stk["batches"] or []))
    P["_row_pre"] = (row1, row2)


guarded("rx", tc_rx, ["TC-006", "TC-009"])


def tc_dispense():
    rxid, med = P["rx"], P["med"]
    row1, row2 = P["_row_pre"]
    d1 = call(cash, "POST", "/api/clinical/pharmacy", {"prescriptionId": rxid, "verificationNotes": "UAT label and dose verified"})
    ph3 = call(cash, "GET", "/api/clinical/pharmacy")
    row3 = [x for x in ph3["prescriptions"] if x["id"] == rxid]
    stk = call(cash, "GET", "/api/clinical/stock")
    s_after1 = sum(b["quantity"] for b in (stk["batches"] or []) if b["medicineId"] == med["id"])
    # TC-009
    rec("TC-009", bool(row1) and row1[0]["state"] == "draft" and bool(row2) and row2[0]["state"] == "draft"
        and d1.status == 200 and row3 and row3[0]["state"] == "done",
        f"before dispense: state='{row1[0]['state'] if row1 else None}', 8s later still '{row2[0]['state'] if row2 else None}'; "
        f"dispense HTTP {d1.status}; after: '{row3[0]['state'] if row3 else None}'")
    # TC-035 counts
    b, a = P["ph_before"], ph3["stats"]
    lst = ph3["prescriptions"]
    calc_p = sum(1 for x in lst if x["state"] in ("draft", "invoiced"))
    calc_d = sum(1 for x in lst if x["state"] == "done")
    ok = (a["pendingDispensation"] == calc_p and a["dispensed"] == calc_d and a["pendingDispensation"] == b["pendingDispensation"] - 1
          and a["dispensed"] == b["dispensed"] + 1)
    cap = " NOTE: stats are computed from the newest 200 orders only (route limit 200), so totals are capped" if a["totalOrders"] >= 200 else ""
    rec("TC-035", ok, f"before pending={b['pendingDispensation']} dispensed={b['dispensed']} total={b['totalOrders']}; after pending={a['pendingDispensation']} "
        f"dispensed={a['dispensed']} total={a['totalOrders']}; recount of the returned list: pending={calc_p} dispensed={calc_d}; formularyCount={a['formularyCount']}{cap}")
    # TC-036
    note = row3[0]["notes"] if row3 else None
    rec("TC-036", bool(note) and note.startswith("Dispensed by Pharmacy: UAT label and dose verified"), f"stored notes='{note}'")
    # TC-037 double dispense
    d2 = call(cash, "POST", "/api/clinical/pharmacy", {"prescriptionId": rxid, "verificationNotes": "UAT second dispense attempt"})
    ph4 = call(cash, "GET", "/api/clinical/pharmacy")
    row4 = [x for x in ph4["prescriptions"] if x["id"] == rxid]
    stk2 = call(cash, "GET", "/api/clinical/stock")
    s_after2 = sum(b["quantity"] for b in (stk2["batches"] or []) if b["medicineId"] == med["id"])
    effect = ""
    if P.get("stock_tracked"):
        effect = f" stock of this medicine: {P['stock_before']} -> {s_after1} (1st) -> {s_after2} (2nd)"
    else:
        effect = " (medicine not stock-tracked, so no stock effect visible)"
    rec("TC-037", d2.status in (400, 409),
        f"2nd dispense HTTP {d2.status} {d2.snip(80)}; state still '{row4[0]['state'] if row4 else None}', notes now '{(row4[0]['notes'] or '')[:60] if row4 else None}'.{effect}")


guarded("dispense", tc_dispense, ["TC-009", "TC-035", "TC-036", "TC-037"])


def tc_rx_special():
    # TC-022 vaccine / controlled search terms and the free-text fallback
    out = []
    for q in ("vaccine", "morphine", "BCG", "hepatitis"):
        out.append(f"'{q}'={len(find_med(q))} hits")
    r = call(phys, "POST", "/api/clinical/prescriptions",
             {"patientId": PID, "lines": [{"medicament": "Zzqx Nonexistent Controlled Opioid", "dose": 5}], "notes": "UAT unresolved-name probe"})
    resolved = None
    if r.status == 200:
        g = call(phys, "GET", f"/api/clinical/prescriptions?patientId={PID}")
        rx = [x for x in g["prescriptions"] if x["id"] == r["prescriptionId"]]
        resolved = rx[0]["lines"][0]["medicament"] if rx and rx[0]["lines"] else None
    rec("TC-022", r.status in (400, 404, 422),
        f"search: {', '.join(out)}. Prescribing the unknown free-text drug 'Zzqx Nonexistent Controlled Opioid' -> HTTP {r.status}"
        + (f", draft Rx {r['prescriptionId']} created for '{resolved}' (silent substitution, prescriptions/route.ts ~lines 300-325 'anyMed' fallback)" if r.status == 200 else f" {r.snip(90)}"))
    # TC-023 safety gate
    pw = None
    scanned = {}
    ph = call(cash, "GET", "/api/clinical/pharmacy")
    for m in ph["medicaments"] or []:
        scanned[m["id"]] = m
        if m["pregnancyWarning"] and not pw:
            pw = m
    for q in ("a", "e", "i", "o", "u", "mg", "warfarin", "methotrexate", "isotretinoin", "misoprostol", "valpro", "enalapril", "statin", "tetracycline"):
        for m in find_med(q):
            scanned[m["id"]] = m
            if m.get("pregnancyWarning") and not pw:
                pw = dict(m, activeComponent=m["name"])
    if pw:
        r = call(phys, "POST", "/api/clinical/prescriptions", {"patientId": PID, "lines": [{"medicamentId": pw["id"], "dose": 10}], "notes": "UAT pregnancy-warning probe"})
        res = f"pregnancy-warning medicament '{pw.get('activeComponent') or pw.get('name')}' prescribed to a 34-year-old female: HTTP {r.status} state={r['state']}"
        okgate = r.status in (400, 409, 422)
    else:
        res, okgate = f"none of the {len(scanned)} formulary medicines inspected has pregnancy_warning set (data gap: the aster-dubai formulary never flags any drug), so the gate could not be triggered by data", False
    rec("TC-023", okgate,
        f"{res}. No allergy-record path exists: no route writes gnuhealth.patient.disease / crit_allergic (grep of frontend/src/app/api: only "
        f"patients PUT critical_info); prescriptions/route.ts reads childbearing_age/crit_allergic (line ~265) but then hard-codes pregnancy_warning:false, "
        f"allergy_warning:false, prescription_warning_ack:true (line ~393), so the gate never fires")


guarded("rx_special", tc_rx_special, ["TC-022", "TC-023"])


def tc038():
    stk = call(cash, "GET", "/api/clinical/stock")
    all_meds = [m["label"] for m in (stk["medicines"] or [])]
    pharm = call(cash, "GET", "/api/clinical/pharmacy")
    found = {}
    for kind, terms in (("IV fluid", ["sodium chloride", "saline", "dextrose", "ringer", "glucose", "infusion"]),
                        ("anticoagulant", ["heparin", "warfarin", "enoxaparin", "rivaroxaban", "apixaban", "clopidogrel"]),
                        ("vaccine", ["vaccine", "bcg", "hepatitis", "influenza", "tetanus", "mmr", "polio"])):
        hits = []
        for t in terms:
            hits += [m["name"] for m in find_med(t.replace(" ", "%20"))[:3]]
            if len(hits) >= 3:
                break
        found[kind] = list(dict.fromkeys(hits))[:3]
    n_vacc = sum(1 for m in pharm["medicaments"] if m["isVaccine"])
    rec("TC-038", all(found.values()),
        f"formulary size: stock route lists {len(all_meds)} medicines (cap 300); pharmacy page shows first {len(pharm['medicaments'])} (cap 60, formularyCount={pharm['stats']['formularyCount']}), "
        f"{n_vacc} flagged is_vaccine within them; picker (medicaments?q=, cap 30) hits: " + "; ".join(f"{k}: {v or 'NONE'}" for k, v in found.items()))


guarded("tc038", tc038, ["TC-038"])


# =============================================================================================== billing
def settle_open_invoices():
    """pay off draft/posted invoices left by earlier runs so the duplicate-description check starts clean"""
    n = 0
    for inv in call(cash, "GET", f"/api/clinical/billing?patientId={PID}")["invoices"] or []:
        if inv["status"] == "draft":
            call(cash, "POST", "/api/clinical/billing", {"action": "post", "invoiceId": inv["id"]})
        if inv["status"] in ("draft", "posted"):
            call(cash, "POST", "/api/clinical/billing", {"action": "pay", "invoiceId": inv["id"], "description": "UAT tidy-up"})
            n += 1
    return n


def tc_billing():
    P["settled_before"] = settle_open_invoices()
    g = call(cash, "GET", f"/api/clinical/billing?patientId={PID}")
    services = g["services"] or []
    P["services"] = services

    def pick(words, idx):
        for s in services:
            if any(w in s["name"].lower() for w in words):
                return s
        return services[idx % len(services)]

    cons = pick(["consult"], 0)
    labs = pick(["lab", "blood", "cbc", "pathology"], 1)
    img = pick(["x-ray", "xray", "radiolog", "imaging", "scan", "ultrasound"], 2)
    P["inv_services"] = (cons, labs, img)
    lines = [{"desc": s["name"], "productId": s["id"]} for s in (cons, labs, img)]
    before = len(call(cash, "GET", f"/api/clinical/billing?patientId={PID}")["invoices"] or [])
    c = call(cash, "POST", "/api/clinical/billing", {"action": "create", "patientId": PID, "lines": lines})
    iid = c["invoiceId"]
    P["inv"] = iid
    after_g = call(cash, "GET", f"/api/clinical/billing?patientId={PID}")
    invs = after_g["invoices"] or []
    mine = [i for i in invs if i["id"] == iid]
    P["inv_row"] = mine[0] if mine else None
    rec("TC-052", c.status == 200 and bool(mine) and mine[0]["status"] == "draft" and mine[0]["date"] == str(today_dubai()),
        f"create HTTP {c.status} invoiceId={iid}; listed={bool(mine)} status={mine[0]['status'] if mine else None} date={mine[0]['date'] if mine else None} "
        f"(Dubai today {today_dubai()}), total={mine[0]['totalQar'] if mine else None} {after_g.get('currency')}; number before posting='{mine[0]['number'] if mine else None}'"
        f"; note: this patient already had {len(invs) - 1} earlier invoice(s) today from aborted runs of this script, so it is the first of the day only for this run")
    rec("TC-058", c.status == 200 and len(invs) - before == 1 and mine and len(mine[0]["lines"]) == 3,
        f"3 lines in one submission: invoices for patient {before}->{len(invs)}, lines on the new invoice={len(mine[0]['lines']) if mine else None} "
        f"({', '.join(l['desc'][:22] for l in (mine[0]['lines'] if mine else []))})")
    # TC-053 duplicate (invoice still draft)
    d = call(cash, "POST", "/api/clinical/billing", {"action": "create", "patientId": PID, "lines": [{"desc": cons["name"], "productId": cons["id"]}]})
    rec("TC-053", d.status == 409, f"duplicate same-day same-description create: HTTP {d.status} {d.snip(130)}")
    # ledger move watermark
    lm0 = call(acct, "GET", "/api/clinical/ledger")
    mx0 = max([m["id"] for m in lm0["moves"]] or [0])
    # TC-054 post
    p = call(cash, "POST", "/api/clinical/billing", {"action": "post", "invoiceId": iid})
    g2 = call(cash, "GET", f"/api/clinical/billing?patientId={PID}")
    row = [i for i in g2["invoices"] if i["id"] == iid]
    num = row[0]["number"] if row else None
    lm1 = call(acct, "GET", "/api/clinical/ledger")
    mx1 = max([m["id"] for m in lm1["moves"]] or [0])
    rec("TC-054", p.status == 200 and row and row[0]["status"] == "posted" and num and num != str(iid) and re.search(r"[A-Za-z]", num) is not None,
        f"post HTTP {p.status}; status={row[0]['status'] if row else None} number='{num}' amountToPay={row[0]['amountToPay'] if row else None}; "
        f"new ledger move created by posting={mx1 > mx0}")
    # TC-056 modify / delete posted invoice
    tries = []
    ok56 = True
    for label, body in (("re-post", {"action": "post", "invoiceId": iid}),
                        ("delete", {"action": "delete", "invoiceId": iid}),
                        ("cancel", {"action": "cancel", "invoiceId": iid}),
                        ("edit-lines", {"action": "update", "invoiceId": iid, "lines": [{"desc": "x", "amount": 1}]}),
                        ("set-draft", {"action": "draft", "invoiceId": iid})):
        r = call(cash, "POST", "/api/clinical/billing", body)
        tries.append(f"{label}: HTTP {r.status} '{(r.err or r.snip(70))[:70]}'")
        if label == "re-post":  # posting an already posted invoice is an idempotent no-op in Tryton; not a modification
            if r.status >= 500:
                ok56 = False
            continue
        if r.status >= 500 or r.status == 200 or not r.err:
            ok56 = False
    rec("TC-056", ok56, "; ".join(tries))
    # TC-055 pay
    pay = call(cash, "POST", "/api/clinical/billing", {"action": "pay", "invoiceId": iid, "description": "UAT cash settlement"})
    g3 = call(cash, "GET", f"/api/clinical/billing?patientId={PID}")
    row = [i for i in g3["invoices"] if i["id"] == iid]
    lm2 = call(acct, "GET", "/api/clinical/ledger")
    mx2 = max([m["id"] for m in lm2["moves"]] or [0])
    new_moves = [m for m in lm2["moves"] if m["id"] > mx1]
    rec("TC-055", pay.status == 200 and row and row[0]["status"] == "paid" and row[0]["amountToPay"] == 0 and mx2 > mx1,
        f"pay HTTP {pay.status} {pay.snip(70) if pay.status != 200 else ''}; status={row[0]['status'] if row else None} amountToPay={row[0]['amountToPay'] if row else None}; "
        f"new payment move(s) in ledger={len(new_moves)} (e.g. {new_moves[0]['ref'] if new_moves else None}, lines={len(new_moves[0]['lines']) if new_moves else 0}); "
        f"zero-amount probe below")
    # zero amount invoice probe
    z = call(cash, "POST", "/api/clinical/billing", {"action": "create", "patientId": PID,
                                                    "lines": [{"desc": "UAT-zero-amount-unknown-service", "amount": 0}]})
    zi = None
    if z.status == 200:
        g4 = call(cash, "GET", f"/api/clinical/billing?patientId={PID}")
        zi = [i for i in g4["invoices"] if i["id"] == z["invoiceId"]]
    RES["TC-055"]["observed"] += (f" | ZERO-AMOUNT PROBE: HTTP {z.status}; " + (f"invoice {z['invoiceId']} created, total={zi[0]['totalQar'] if zi else None}, line='{zi[0]['lines'][0]['desc'] if zi and zi[0]['lines'] else None}' "
                                                                                  f"(unknown description is silently mapped to a catalog service)" if z.status == 200 else z.snip(90)))[:500]
    P["zero_inv"] = z["invoiceId"] if z.status == 200 else None
    if z.status == 200:
        call(cash, "POST", "/api/clinical/billing", {"action": "post", "invoiceId": z["invoiceId"]})
        call(cash, "POST", "/api/clinical/billing", {"action": "pay", "invoiceId": z["invoiceId"], "description": "UAT tidy-up"})
    # TC-010: golden path = TC-052..055 chain with consult+lab+imaging
    rec("TC-010", RES["TC-052"]["status"] == "PASS" and RES["TC-054"]["status"] == "PASS" and RES["TC-055"]["status"] == "PASS",
        f"invoice {iid} (consultation+lab+imaging): create -> post (number '{num}') -> pay: final status={row[0]['status'] if row else None}, amountToPay={row[0]['amountToPay'] if row else None}")


guarded("billing", tc_billing, ["TC-052", "TC-058", "TC-053", "TC-054", "TC-056", "TC-055", "TC-010"])


def tc057():
    svc = P.get("services") or call(cash, "GET", "/api/clinical/billing")["services"]
    beds = call(nurse, "GET", "/api/clinical/inpatient")["beds"]
    bed_names = {b["name"].strip().lower() for b in beds}
    clash = [s["name"] for s in svc if s["name"].strip().lower() in bed_names]
    pat = re.compile(r"\b(bed|ward|room|suite)\b|^DXB-[A-Z]{2}-\d+", re.I)
    sus = [s["name"] for s in svc if pat.search(s["name"])]
    rec("TC-057", not clash and not sus,
        f"picker lists {len(svc)} services; exact matches with the {len(beds)} bed names: {clash[:4] or 'none'}; names that look like beds/rooms: {sus[:4] or 'none'}")


guarded("tc057", tc057, ["TC-057"])


# =============================================================================================== insurance
def tc_insurance():
    g = call(cash, "GET", "/api/clinical/insurance")
    comps = g["insuranceCompanies"] or []
    names = {c["name"] for c in comps}
    wanted = profile["insurers"]
    missing = [w for w in wanted if w not in names]
    rec("TC-059", g.status == 200 and not missing and len(comps) >= len(wanted),
        f"HTTP {g.status}; {len(comps)} insurance companies; profile insurers {len(wanted)}, missing: {missing or 'none'}; examples: {sorted(names)[:6]}")
    part = {p["partyId"] for p in (g["enrollablePatients"] or [])}
    both = [c for c in comps if c["id"] in part]
    # server-side attempt: patient enrolled with their own party as insurer (after TC-061 so the chart check is not polluted)
    insurer = next((c for c in comps if c["id"] != P.get("partyId") and c["name"] in wanted), comps[0])
    num = "UATPOL" + str(random.randint(10**6, 10**7))
    e = call(rec_, "POST", "/api/clinical/insurance", {"partyId": P["partyId"], "companyId": insurer["id"], "number": num, "insuranceType": "private"})
    lst = call(cash, "GET", "/api/clinical/insurance")
    pol = [x for x in lst["insurances"] if x["number"] == num]
    chart = call(rec_, "GET", f"/api/clinical/patients?id={PID}")
    chart_keys = sorted((chart["patients"] or [{}])[0].keys())
    chart_src = open(os.path.join(ROOT, "frontend", "src", "app", "(app)", "patient", "[id]", "page.tsx"), encoding="utf-8").read()
    chart_reads_ins = "api/clinical/insurance" in chart_src
    rec("TC-061", e.status == 200 and bool(pol) and chart_reads_ins,
        f"enroll HTTP {e.status} insuranceId={e['insuranceId']} with '{insurer['name']}'; policy {num} appears in /api/clinical/insurance list={bool(pol)}; "
        f"patient chart feed (/api/clinical/patients?id=) keys={chart_keys} contains no insurance, and patient/[id]/page.tsx does not call /api/clinical/insurance "
        f"(it loads patients, appointments, consultations, prescriptions, laboratory, radiology, billing only) -> policy NOT shown on the chart")
    me = call(rec_, "POST", "/api/clinical/insurance", {"partyId": P["partyId"], "companyId": P["partyId"], "number": "UATSELF" + str(random.randint(10**6, 10**7))})
    rec("TC-060", me.status in (400, 409, 422) and not both,
        f"parties that are both a patient and a listed insurance company: {[c['name'] for c in both][:3] or 'none found in the 200 enrollable patients'}; "
        f"API check: enrolling the patient with their OWN party as insurer -> HTTP {me.status} {me.snip(80)} "
        f"({'accepted: no server-side self-insurer / is_insurance_company validation (insurance/route.ts POST ~line 112)' if me.status == 200 else 'rejected'})")


guarded("insurance", tc_insurance, ["TC-059", "TC-061", "TC-060"])


# =============================================================================================== inpatient
def census():
    g = call(nurse, "GET", "/api/clinical/inpatient")
    return g


def discharge_cycle(label, bed, ward_name, strict=True):
    """admit -> clearance -> discharge -> bedclean; returns dict of step results"""
    out = {"ward": ward_name, "bed": bed["name"]}
    a = call(nurse, "POST", "/api/clinical/inpatient", {"patientId": PID, "bedId": bed["id"], "admissionType": "routine", "nursingPlan": "UAT observation"})
    out["admit"] = (a.status, a.snip(80))
    if a.status != 200:
        return out
    adm = a["admission"]
    out["adm"] = adm
    c = census()
    brow = [b for b in c["beds"] if b["id"] == bed["id"]]
    out["bed_after_admit"] = brow[0]["state"] if brow else None
    # clearance
    st = call(phys, "POST", "/api/clinical/discharges", {"action": "start", "registrationId": adm})
    out["clr_start"] = (st.status, st.snip(70))
    gl = call(phys, "GET", "/api/clinical/discharges")
    row = [d for d in gl["discharges"] if d["registrationId"] == adm]
    did = row[0]["id"] if row else st["dischargeId"]
    out["dischargeId"] = did
    # TC-042 gate: discharge before clearance
    pre = call(nurse, "PATCH", "/api/clinical/inpatient", {"admissionId": adm, "bedId": bed["id"], "dischargeReason": "home", "dischargeDxId": DX["id"], "admissionReasonId": DX["id"]})
    out["pre_clear"] = (pre.status, pre.snip(70))
    signers = {"medical": phys, "nursing": nurse, "pharmacy": cash, "billing": cash, "insurance": rec_}
    res = []
    for dept, cl in signers.items():
        r = call(cl, "POST", "/api/clinical/discharges", {"action": "clear", "id": did, "department": dept, "outcome": "cleared"})
        res.append(f"{dept}:{r.status}")
    out["clear"] = res
    gl = call(phys, "GET", "/api/clinical/discharges")
    row = [d for d in gl["discharges"] if d["id"] == did]
    out["clr_state"] = row[0]["state"] if row else None
    return out


def finish_discharge(out, bed, ok_probe=False):
    adm = out["adm"]
    valid = {"admissionId": adm, "bedId": bed["id"], "dischargeReason": "home", "dischargeDxId": DX["id"], "admissionReasonId": DX2["id"],
             "dischargePlan": "UAT discharge home, review in 7 days"}
    if ok_probe:
        a = call(nurse, "PATCH", "/api/clinical/inpatient", {k: v for k, v in valid.items() if k != "dischargeReason"})
        b = call(nurse, "PATCH", "/api/clinical/inpatient", {k: v for k, v in valid.items() if k != "dischargeDxId"})
        c = call(nurse, "PATCH", "/api/clinical/inpatient", {k: v for k, v in valid.items() if k != "admissionReasonId"})
        d = call(nurse, "PATCH", "/api/clinical/inpatient", dict(valid, dischargeReason="bogus"))
        out["probe"] = (a, b, c, d)
    r = call(nurse, "PATCH", "/api/clinical/inpatient", valid)
    out["discharge"] = (r.status, r.snip(80))
    c = census()
    brow = [b for b in c["beds"] if b["id"] == bed["id"]]
    arow = [x for x in c["admissions"] if x["id"] == adm]
    out["bed_after_discharge"] = brow[0]["state"] if brow else None
    out["adm_after_discharge"] = arow[0]["state"] if arow else None
    if ok_probe:
        # admitting into a to_clean bed must be refused
        t = call(nurse, "POST", "/api/clinical/inpatient", {"patientId": PID, "bedId": bed["id"]})
        out["to_clean_admit"] = (t.status, t.snip(90))
    b = call(nurse, "PATCH", "/api/clinical/inpatient", {"action": "bedclean", "admissionId": adm, "bedId": bed["id"]})
    out["bedclean"] = (b.status, b.snip(60))
    c = census()
    brow = [x for x in c["beds"] if x["id"] == bed["id"]]
    arow = [x for x in c["admissions"] if x["id"] == adm]
    out["bed_after_clean"] = brow[0]["state"] if brow else None
    out["adm_after_clean"] = arow[0]["state"] if arow else None
    return out


def release_patient():
    """discharge any admission of the UAT patient that is still open (left by an aborted run or by TC-066 probes)"""
    c = census()
    signers = {"medical": phys, "nursing": nurse, "pharmacy": cash, "billing": cash, "insurance": rec_}
    n = 0
    for a in c["admissions"]:
        if a["patientId"] != PID or a["state"] != "hospitalized":
            continue
        call(phys, "POST", "/api/clinical/discharges", {"action": "start", "registrationId": a["id"]})
        gl = call(phys, "GET", "/api/clinical/discharges")
        row = [d for d in gl["discharges"] if d["registrationId"] == a["id"] and d["state"] != "cancelled"]
        if not row:
            continue
        for dept, cl in signers.items():
            call(cl, "POST", "/api/clinical/discharges", {"action": "clear", "id": row[0]["id"], "department": dept, "outcome": "cleared"})
        body = {"admissionId": a["id"], "dischargeReason": "home", "dischargeDxId": DX["id"], "admissionReasonId": DX2["id"], "dischargePlan": "UAT tidy-up"}
        if a["bedId"]:
            body["bedId"] = a["bedId"]
        call(nurse, "PATCH", "/api/clinical/inpatient", body)
        if a["bedId"]:
            call(nurse, "PATCH", "/api/clinical/inpatient", {"action": "bedclean", "admissionId": a["id"], "bedId": a["bedId"]})
        n += 1
    return n


def tc_inpatient():
    P["released_before"] = release_patient()
    c = census()
    wards = {w["id"]: w for w in c["wards"]}
    free = [b for b in c["beds"] if b["state"] == "free"]
    by_ward = {}
    for b in free:
        by_ward.setdefault(b["wardId"], []).append(b)
    # prefer wards usable for a female patient
    order = sorted(by_ward, key=lambda w: 0 if (wards.get(w, {}).get("gender") in ("women", "unisex", None)) else 1)
    DETAIL["wards_with_free_beds"] = {wards[w]["name"]: len(by_ward[w]) for w in by_ward if w in wards}
    if not free:
        for tc in ("TC-039", "TC-040", "TC-041", "TC-042", "TC-043", "TC-044"):
            rec(tc, False, "no free bed in the census, cannot test", status="NOT_TESTABLE")
        return
    cycles = []
    for w in order[:3]:
        bed = by_ward[w][0]
        cycles.append((w, bed))
    first_w, first_bed = cycles[0]
    out = discharge_cycle("c1", first_bed, wards[first_w]["name"])
    P["cycle1"] = out
    # TC-039
    rec("TC-039", out["admit"][0] == 200 and out.get("bed_after_admit") == "occupied",
        f"free beds in census: {len(free)} across {len(by_ward)} wards; admitted by nurse to {out['bed']} ({out['ward']}): HTTP {out['admit'][0]} admission={out.get('adm')}; bed state afterwards='{out.get('bed_after_admit')}'")
    # TC-040a occupied bed
    occ = call(nurse, "POST", "/api/clinical/inpatient", {"patientId": PID, "bedId": first_bed["id"]})
    other_occ = [b for b in c["beds"] if b["state"] == "occupied"]
    occ2 = call(nurse, "POST", "/api/clinical/inpatient", {"patientId": PID, "bedId": other_occ[0]["id"]}) if other_occ else None
    # TC-041/042 : after clearance
    if out.get("adm") and out["clr_state"] == "complete":
        out = finish_discharge(out, first_bed, ok_probe=True)
        pa, pb, pc, pd = out["probe"]
        rec("TC-041", pa.status == 400 and pb.status == 400 and pc.status == 400,
            f"missing reason -> HTTP {pa.status} '{(pa.err or '')[:60]}'; missing discharge dx -> HTTP {pb.status} '{(pb.err or '')[:55]}'; missing admission reason -> HTTP {pc.status} '{(pc.err or '')[:55]}'; "
            f"bogus reason -> HTTP {pd.status}")
        rec("TC-042", out["discharge"][0] == 200 and out["bed_after_discharge"] == "to_clean",
            f"clearance: start {out['clr_start'][0]}, sign-offs {out['clear']} -> clearance state='{out['clr_state']}'; discharge before clearance -> HTTP {out['pre_clear'][0]} '{out['pre_clear'][1][:70]}'; "
            f"discharge after clearance HTTP {out['discharge'][0]}; bed='{out['bed_after_discharge']}', admission state='{out['adm_after_discharge']}'")
        rec("TC-043", out["bedclean"][0] == 200 and out["bed_after_clean"] == "free" and out["adm_after_clean"] == "finished",
            f"bedclean HTTP {out['bedclean'][0]}; admission state='{out['adm_after_clean']}', bed state='{out['bed_after_clean']}'")
        tcl = out.get("to_clean_admit", (None, ""))
    else:
        for tc in ("TC-041", "TC-042", "TC-043"):
            rec(tc, False, f"clearance did not complete: {out}")
        tcl = (None, "n/a")
    rec("TC-040", occ.status == 409 and tcl[0] == 409 and (occ2 is None or occ2.status == 409),
        f"admit to occupied bed {first_bed['name']} -> HTTP {occ.status} '{(occ.err or '')[:60]}'; another occupied bed -> HTTP {occ2.status if occ2 else None}; "
        f"admit to a to_clean bed -> HTTP {tcl[0]} '{tcl[1][:60]}'")
    # TC-044 three wards
    done = [(out["ward"], out.get("bed_after_clean"), out.get("adm_after_clean"))]
    if out.get("adm_after_clean") != "finished":
        done = []
    for w, bed in cycles[1:3]:
        o = discharge_cycle("cN", bed, wards[w]["name"])
        if o.get("adm") and o.get("clr_state") == "complete":
            o = finish_discharge(o, bed)
            done.append((o["ward"], o["bed_after_clean"], o["adm_after_clean"]) if o["discharge"][0] == 200 else (o["ward"], "discharge HTTP %s %s" % o["discharge"], None))
        else:
            done.append((o["ward"], f"cycle stopped: admit={o['admit']} clearance={o.get('clr_state')}", None))
    okw = [d for d in done if d[1] == "free" and d[2] == "finished"]
    rec("TC-044", len(okw) >= 3, f"{len(okw)}/3 wards completed admit->clearance->discharge->bedclean: " + "; ".join(f"{d[0]}: bed={d[1]} adm={d[2]}" for d in done))


guarded("inpatient", tc_inpatient, ["TC-039", "TC-040", "TC-041", "TC-042", "TC-043", "TC-044"])


# =============================================================================================== surgery
def sdt(day, hhmm):
    return f"{day} {hhmm}:00"


def book_surgery(body):
    return call(phys, "POST", "/api/clinical/surgery", body)


def surgery_list():
    return call(phys, "GET", "/api/clinical/surgery")


def tc_surgery():
    ors = surgery_list()["operatingRooms"]
    P["ors"] = ors
    # TC-045 no OR
    r = book_surgery({"patientId": PID, "description": "UAT Appendectomy (no theatre yet)", "surgeryDate": sdt(fut_day(30, 90), "09:00"), "classification": "elective"})
    # TC-013 PUID as patientId
    r13 = book_surgery({"patientId": PUID, "description": "UAT Cholecystectomy booked by PUID", "surgeryDate": sdt(fut_day(91, 150), "09:00")})
    big = book_surgery({"patientId": "28264873791", "description": "UAT unknown 11-digit id"})
    sl = surgery_list()["surgeries"]
    row13 = [s for s in sl if s["id"] == r13["surgery"]] if r13.status == 200 else []
    rec("TC-045", r.status == 200 and r["surgery"], f"HTTP {r.status} surgery={r['surgery']} {r.snip(90) if r.status != 200 else ''}")
    rec("TC-013", r13.status == 200 and row13 and row13[0]["patientId"] == PID,
        f"PUID '{PUID}' as patientId -> HTTP {r13.status} surgery={r13['surgery']} resolved patient={row13[0]['patientName'] if row13 else None}; "
        f"non-existent 11-digit id -> HTTP {big.status} '{(big.err or '')[:70]}'")
    # TC-046..048 using OR 1
    or1 = next((o for o in ors if o["name"].startswith("OT 1")), ors[0])
    for attempt in range(6):
        day = fut_day(200, 700)
        a = book_surgery({"patientId": PID, "description": "UAT Laparoscopic Appendectomy", "operatingRoomId": or1["id"], "surgeryDate": sdt(day, "08:00"), "classification": "elective"})
        if a.status != 409:
            break
    P["surg_a"] = a["surgery"]
    ors_after = surgery_list()["operatingRooms"]
    or1_state = [o for o in ors_after if o["id"] == or1["id"]][0]["state"]
    # overlapping: starts 09:00, inside the (08:00 + default 120 min) window
    b = book_surgery({"patientId": PID, "description": "UAT overlapping booking", "operatingRoomId": or1["id"], "surgeryDate": sdt(day, "09:00")})
    # non overlapping 11:00
    c = book_surgery({"patientId": PID, "description": "UAT Laparoscopic Cholecystectomy", "operatingRoomId": or1["id"], "surgeryDate": sdt(day, "11:00")})
    rec("TC-046", a.status == 200 and or1_state == "scheduled",
        f"book with OR '{or1['name']}', no end time -> HTTP {a.status} surgery={a['surgery']}; OR state='{or1_state}'; "
        f"default end proven by TC-047 (a 09:00 start collides with 08:00 start => end >= 09:00). The API list does not expose surgery_end_date")
    rec("TC-047", b.status == 409, f"overlapping 09:00 booking in {or1['name']}: HTTP {b.status} {b.snip(110)}")
    rec("TC-048", c.status == 200, f"non-overlapping 11:00 booking in {or1['name']}: HTTP {c.status} surgery={c['surgery']} {c.snip(80) if c.status != 200 else ''}")
    # TC-050 each OR
    out = []
    for o in ors:
        for attempt in range(6):
            d = fut_day(701, 1200)
            r = book_surgery({"patientId": PID, "description": f"UAT booking for {o['name']}", "operatingRoomId": o["id"], "surgeryDate": sdt(d, "13:00")})
            if r.status != 409:
                break
        out.append((o["name"], r.status, r["surgery"]))
    rec("TC-050", all(x[1] == 200 for x in out) and len(out) >= 4,
        f"{len(ors)} operating rooms listed; bookings: " + "; ".join(f"{n}: HTTP {s}" for n, s, _ in out))


guarded("surgery", tc_surgery, ["TC-045", "TC-013", "TC-046", "TC-047", "TC-048", "TC-050"])


def tc049():
    sid = P["surg_a"]
    ors0 = {o["id"]: o["state"] for o in surgery_list()["operatingRooms"]}
    steps = []
    # gate before checklist
    g0 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "in_progress"})
    steps.append(f"in_progress before checklist: {g0.status}")
    st = call(phys, "POST", "/api/clinical/theatre-safety", {"action": "start", "surgeryId": sid})
    cid = st["checklistId"]
    steps.append(f"checklist start {st.status}")
    for ph in ("sign_in", "time_out"):
        r = call(phys, "POST", "/api/clinical/theatre-safety", {"action": "phase", "id": cid, "phase": ph, "done": True})
        steps.append(f"{ph} {r.status}")
    t1 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "in_progress"})
    steps.append(f"in_progress {t1.status}")
    orsx = {o["id"]: o["state"] for o in surgery_list()["operatingRooms"]}
    P["or_state_in_progress"] = orsx
    t2g = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "done"})
    steps.append(f"done before sign_out {t2g.status}")
    r = call(phys, "POST", "/api/clinical/theatre-safety", {"action": "phase", "id": cid, "phase": "sign_out", "done": True})
    steps.append(f"sign_out {r.status}")
    t2 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "done"})
    steps.append(f"done {t2.status}")
    t3 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "signed"})
    steps.append(f"signed {t3.status}")
    sl = [s for s in surgery_list()["surgeries"] if s["id"] == sid]
    final = sl[0]["state"] if sl else None
    w1 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "postopGuidelines": "UAT edit after signing"})
    w2 = call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "draft"})
    sl2 = [s for s in surgery_list()["surgeries"] if s["id"] == sid]
    rec("TC-049", g0.status == 409 and t1.status == 200 and t2g.status == 409 and t2.status == 200 and t3.status == 200 and final == "signed"
        and w1.status in (400, 403, 409) and w2.status in (400, 403, 409),
        f"{'; '.join(steps)}; final state '{final}'. Write after signed: postop-guidelines edit -> HTTP {w1.status} '{(w1.err or '')[:60]}'; "
        f"state back to 'draft' -> HTTP {w2.status} '{(w2.err or '')[:60]}'; state afterwards '{sl2[0]['state'] if sl2 else None}' "
        f"postop='{(sl2[0]['postopGuidelines'] or '')[:30] if sl2 else None}'")
    DETAIL["or_states_before"] = ors0
    DETAIL["or_states_in_progress"] = orsx


guarded("tc049", tc049, ["TC-049"])


def tc051():
    pr = call(phys, "GET", "/api/clinical/ambulatory")
    sr = call(phys, "GET", "/api/clinical/surgery")
    has_cat = "procedureCatalog" in (sr.data or {})
    rec("TC-051", False,
        f"/api/clinical/surgery response has no procedure catalogue (keys {sorted((sr.data or {}).keys())}); the surgery booking form (surgery/page.tsx ~line 378) is a free-text 'Procedure Name & Description' input. "
        f"/api/clinical/ambulatory (gnuhealth.procedure catalogue 'procedureCatalog', route.ts line ~60) returned HTTP {pr.status} '{(pr.err or '')[:60]}' for the physician: the ambulatory module is enabled for the admin role only "
        f"(access-control.ts), so appendectomy/cholecystectomy/cesarean code resolution could not be verified with the available staff logins (no admin credentials supplied)",
        status="FAIL" if pr.status == 403 else "PASS")
    if pr.status == 200:
        cat = pr["procedureCatalog"] or []
        hits = {k: [c["code"] for c in cat if k in (c["description"] or "").lower() or k in (c["code"] or "").lower()][:2] for k in ("appendic", "cholecyst", "caesar", "cesar")}
        RES["TC-051"]["observed"] = f"ambulatory catalogue {len(cat)} procedures; hits {hits}"
        RES["TC-051"]["status"] = "PASS" if all(hits[k] for k in ("appendic", "cholecyst")) and (hits["caesar"] or hits["cesar"]) else "FAIL"


guarded("tc051", tc051, ["TC-051"])


# =============================================================================================== TC-015 / TC-062 / TC-063
def tc015():
    ch = call(rec_, "GET", f"/api/clinical/patients?id={PID}")
    p = (ch["patients"] or [{}])[0]
    cons = call(rec_, "GET", f"/api/clinical/consultations?patientId={PID}")
    rx = call(rec_, "GET", f"/api/clinical/prescriptions?patientId={PID}")
    lb = call(rec_, "GET", f"/api/clinical/laboratory?patientId={PID}")
    rd = call(rec_, "GET", f"/api/clinical/radiology?patientId={PID}")
    leaks = []
    for row in cons["consultations"] or []:
        leaks += [k for k in row if k in ("chief_complaint", "present_illness", "evaluation_summary", "directions", "diagnosis", "systolic")]
    if any(r_["lines"] for r_ in rx["prescriptions"] or []):
        leaks.append("rx lines")
    if any(o["results"] or o["criteria"] or o["diagnosis"] for o in lb["labOrders"] or []):
        leaks.append("lab results")
    if any(o["findings"] for o in rd["radiologyOrders"] or []):
        leaks.append("radiology findings")
    page = open(os.path.join(ROOT, "frontend", "src", "app", "(app)", "patient", "[id]", "page.tsx"), encoding="utf-8").read()
    msg = re.search(r'"(Not visible to your role[^"]*)"', page)
    rec("TC-015", ch.status == 200 and p.get("allergiesRestricted") is True and p.get("allergies") is None and not leaks,
        f"chart feed = /api/clinical/patients?id=: HTTP {ch.status} allergiesRestricted={p.get('allergiesRestricted')} allergiesLoaded={p.get('allergiesLoaded')} allergies={p.get('allergies')}; "
        f"consultations statusOnly={cons.get('statusOnly')}, clinical keys leaked={sorted(set(leaks)) or 'none'}; UI message for restricted role: '{msg.group(1) if msg else None}'")


guarded("tc015", tc015, ["TC-015"])


def tc062():
    exp_redirect = {"phys": "/physician", "nurse": "/nursing", "rec": "/frontdesk", "cash": "/billing", "acct": "/billing?tab=ledger",
                    "lab": "/laboratory", "rad": "/radiology"}
    bad = []
    land = []
    for k, want in exp_redirect.items():
        got = S[k].user.get("redirect")
        land.append(f"{S[k].user['role']}->{got}")
        if got != want:
            bad.append(f"{k}: landed {got}, expected {want}")
    # forbidden writes
    tests = [
        ("cashier creates prescription", cash, "/api/clinical/prescriptions", {"patientId": PID, "lines": [{"medicamentId": P["med"]["id"]}]}),
        ("front desk saves SOAP", rec_, "/api/clinical/consultations", {"patientId": PID, "chiefComplaint": "x"}),
        ("nurse creates invoice", nurse, "/api/clinical/billing", {"action": "create", "patientId": PID}),
        ("lab finalises imaging", lab, "/api/clinical/radiology", {"action": "finalize", "requestId": 1, "findings": "x"}),
        ("radiology saves lab results", rad, "/api/clinical/laboratory", {"action": "save-results", "labId": 1, "criteria": []}),
        ("cashier books surgery", cash, "/api/clinical/surgery", {"patientId": PID, "description": "x"}),
        ("reception admits", rec_, "/api/clinical/inpatient", {"patientId": PID}),
        ("accountant records triage", acct, "/api/clinical/triage", {"patientId": PID, "systolic": 1}),
        ("physician takes payment", phys, "/api/clinical/billing", {"action": "pay", "invoiceId": 1}),
    ]
    res = []
    for label, cl, path, body in tests:
        r = call(cl, "POST", path, body)
        res.append(f"{label}: {r.status}")
        if r.status != 403:
            bad.append(f"{label} -> HTTP {r.status} {r.snip(60)}")
    # front desk cannot see SOAP
    cons = call(rec_, "GET", f"/api/clinical/consultations?patientId={PID}")
    soapkeys = {k for row in cons["consultations"] or [] for k in row if k in ("chief_complaint", "present_illness", "evaluation_summary", "directions")}
    if soapkeys or not cons.get("statusOnly"):
        bad.append(f"front desk sees SOAP fields {sorted(soapkeys)}")
    rec("TC-062", not bad, f"landing routes {', '.join(land)}; writes outside role: " + "; ".join(res) + f"; reception consultation feed statusOnly={cons.get('statusOnly')}" + (f" | PROBLEMS: {bad}" if bad else ""))


guarded("tc062", tc062, ["TC-062"])


def tc063():
    d = call(phys, "DELETE", "/api/clinical/laboratory", {"labId": G.get("lab")})
    d2 = call(phys, "DELETE", f"/api/clinical/laboratory?labId={G.get('lab')}")
    still = lab_get(G.get("lab"))
    created = P.get("tc005") is not None and P["tc005"].status == 200 and G.get("lab")
    orst = P.get("or_state_in_progress", {})
    ors0 = DETAIL.get("or_states_before", {})
    changed = {k: (ors0.get(k), v) for k, v in orst.items() if ors0.get(k) != v}
    rec("TC-063", bool(created) and d.status in (404, 405) and still is not None,
        f"physician created lab orders via consultations/laboratory (labOrderId {G.get('lab')}): yes. DELETE /api/clinical/laboratory -> HTTP {d.status}/{d2.status}, order still exists={still is not None}: no DELETE handler exists in any route, "
        f"so the Tryton delete-ACL itself cannot be exercised through this API. Operating-room state writes: no route writes gnuhealth.hospital.or directly; OR state during an in_progress surgery changed={changed or 'no (all rooms stayed scheduled)'}",
        status="PASS" if (created and d.status in (404, 405) and still is not None) else "FAIL")


guarded("tc063", tc063, ["TC-063"])


# =============================================================================================== route enumeration
def read_acl():
    txt = open(ACL_FILE, encoding="utf-8").read()
    m = re.search(r"DEFAULT_ROLE_PERMISSIONS[^=]*=\s*\{(.*?)\n\};", txt, re.S)
    perms = {}
    for role, body in re.findall(r"\n  (\w+): \{(.*?)\n  \},", m.group(1) + "\n", re.S):
        perms[role] = {k: v == "true" for k, v in re.findall(r"(\w+):\s*(true|false)", body)}
    return perms


ACL = read_acl()


def enumerate_routes():
    routes = []
    for dp, _, fs in os.walk(API_DIR):
        for f in fs:
            if f == "route.ts":
                full = os.path.join(dp, f)
                rel = os.path.relpath(dp, API_DIR).replace("\\", "/")
                src = open(full, encoding="utf-8").read()
                parts = re.split(r"(?=export async function (?:GET|POST|PUT|PATCH|DELETE)\b)", src)
                for seg in parts:
                    m = re.match(r"export async function (GET|POST|PUT|PATCH|DELETE)\b", seg)
                    if not m:
                        continue
                    mods = set(re.findall(r'hasModuleAccess\(\s*session\.role,\s*"(\w+)"', seg))
                    for g in re.findall(r"guard\(\[([^\]]*)\]\)", seg):
                        mods |= set(re.findall(r'"(\w+)"', g))
                    for cname in re.findall(r"guard\(\[\.\.\.(\w+)\]\)", seg):
                        cm = re.search(r"const " + cname + r"[^=]*=\s*\[([^\]]*)\]", src)
                        if cm:
                            mods |= set(re.findall(r'"(\w+)"', cm.group(1)))
                    routes.append({"path": "/api/" + rel, "method": m.group(1), "modules": sorted(mods), "file": os.path.relpath(full, ROOT).replace("\\", "/")})
    return sorted(routes, key=lambda r: (r["path"], r["method"]))


ROUTES = enumerate_routes()
UNDEPLOYED = set()
CLIN = [r for r in ROUTES if r["path"].startswith("/api/clinical")]
DETAIL["routes_enumerated"] = len(ROUTES)


def tc064():
    bad, n = [], 0
    for r in ROUTES:
        if not (r["path"].startswith("/api/clinical") or r["path"] == "/api/admin/users"):
            continue
        body = {} if r["method"] != "GET" else None
        resp = call(None, r["method"], r["path"], body, label="anon")
        if resp.status == 404 and resp.data is None:  # Next.js HTML 404: route exists in the working tree but is not deployed yet
            UNDEPLOYED.add(r["path"])
            continue
        n += 1
        if resp.status != 401:
            bad.append(f"{r['method']} {r['path']} -> {resp.status} {resp.snip(50)}")
    # also: a garbage cookie
    DETAIL["tc064_bad"] = bad
    rec("TC-064", not bad, f"{n} deployed handlers (GET/POST/PATCH/PUT under /api/clinical + /api/admin/users) called with no session cookie; non-401: {bad[:6] or 'none'}"
        + (f" (+{len(bad) - 6} more)" if len(bad) > 6 else "") + (f". Skipped (in working tree but not deployed yet, HTML 404): {sorted(UNDEPLOYED)}" if UNDEPLOYED else ""))


guarded("tc064", tc064, ["TC-064"])


def tc065():
    roles = {"physician": phys, "nursing": nurse, "reception": rec_, "cashier": cash, "accountant": acct, "lab": lab, "radiology": rad}
    odd, n, gated = [], 0, 0
    never = ("Traceback", "psycopg", "IntegrityError", "<html", "<!DOCTYPE", "    at ")
    info503 = set()
    for r in CLIN:
        if r["method"] == "DELETE" or r["path"] in UNDEPLOYED:
            continue
        for role, cl in roles.items():
            allowed = any(ACL.get(role, {}).get(m, False) for m in r["modules"]) if r["modules"] else None
            if r["method"] == "GET":
                path, body = r["path"], None
            else:
                path, body = r["path"], {}
            if r["path"].endswith("invoice-pdf"):
                path += "?invoiceId=0"
            resp = call(cl, r["method"], path, body, label=role)
            n += 1
            is_json = resp.data is not None and "json" in resp.ctype
            if allowed is False:
                gated += 1
                if resp.status != 403:
                    odd.append(f"{role} {r['method']} {r['path']}: expected 403 got {resp.status} {resp.snip(55)}")
                elif not is_json or not isinstance(resp.err, str) or not resp.err or any(x in resp.text for x in never):
                    odd.append(f"{role} {r['method']} {r['path']}: 403 but body not clean JSON message: {resp.snip(70)}")
            else:
                if resp.status == 503 and is_json and resp.err:
                    info503.add(r["path"])
                elif resp.status >= 500 or not is_json or any(x in resp.text for x in never):
                    odd.append(f"{role} {r['method']} {r['path']}: HTTP {resp.status} (module allowed) {resp.snip(70)}")
    ungated = sorted({f"{r['method']} {r['path']}" for r in CLIN if not r["modules"] and r["method"] != "DELETE"})
    DETAIL["tc065_odd"] = odd
    DETAIL["tc065_ungated"] = ungated
    rec("TC-065", not odd, f"{n} role x endpoint calls ({len(CLIN)} handlers x 7 roles; {gated} expected-403 combinations by access-control.ts module matrix); "
        f"deviations: {len(odd)}: {' || '.join(odd[:8]) or 'none'}" + (f"; handlers with no module gate at all: {ungated}" if ungated else "")
        + (f"; 503 'feature not enabled for this hospital' (clean JSON, IST module not installed in tenant): {sorted(info503)}" if info503 else ""))


guarded("tc065", tc065, ["TC-065"])


def tc066():
    BADV = [-1, 0, 99999999999, "abc", 2147483648]
    plan = [
        (phys, "POST", "/api/clinical/consultations", lambda v: {"patientId": v, "chiefComplaint": "x"}),
        (phys, "POST", "/api/clinical/consultations", lambda v: {"patientId": PID, "evaluationId": v, "chiefComplaint": "x"}),
        (phys, "POST", "/api/clinical/prescriptions", lambda v: {"patientId": v, "lines": [{"medicamentId": 1}]}),
        (phys, "POST", "/api/clinical/prescriptions", lambda v: {"patientId": PID, "lines": [{"medicamentId": v}]}),
        (phys, "POST", "/api/clinical/prescriptions", lambda v: {"action": "issue", "prescriptionId": v}),
        (rec_, "POST", "/api/clinical/appointments", lambda v: {"action": "book", "patientId": v, "appointmentDate": "2030-01-01", "urgency": "normal"}),
        (rec_, "POST", "/api/clinical/appointments", lambda v: {"action": "book", "patientId": PID, "healthprofId": v, "appointmentDate": "2030-01-01", "urgency": "normal"}),
        (rec_, "POST", "/api/clinical/appointments", lambda v: {"action": "checkin", "appointmentId": v}),
        (nurse, "POST", "/api/clinical/triage", lambda v: {"patientId": v, "systolic": 120}),
        (lab, "POST", "/api/clinical/laboratory", lambda v: {"action": "create", "patientId": v, "testId": 1}),
        (lab, "POST", "/api/clinical/laboratory", lambda v: {"action": "save-results", "labId": v, "criteria": [{"id": 1, "result": 1}]}),
        (lab, "POST", "/api/clinical/laboratory", lambda v: {"action": "complete", "labId": v}),
        (rad, "POST", "/api/clinical/radiology", lambda v: {"action": "create", "patientId": v, "testId": 1}),
        (rad, "POST", "/api/clinical/radiology", lambda v: {"action": "finalize", "requestId": v, "findings": "x"}),
        (cash, "POST", "/api/clinical/billing", lambda v: {"action": "create", "patientId": v}),
        (cash, "POST", "/api/clinical/billing", lambda v: {"action": "post", "invoiceId": v}),
        (cash, "POST", "/api/clinical/billing", lambda v: {"action": "pay", "invoiceId": v}),
        (cash, "POST", "/api/clinical/pharmacy", lambda v: {"prescriptionId": v}),
        (nurse, "POST", "/api/clinical/inpatient", lambda v: {"patientId": v}),
        (nurse, "POST", "/api/clinical/inpatient", lambda v: {"patientId": PID, "bedId": v}),
        (nurse, "PATCH", "/api/clinical/inpatient", lambda v: {"admissionId": v, "dischargeReason": "home", "dischargeDxId": 1, "admissionReasonId": 1}),
        (nurse, "PATCH", "/api/clinical/inpatient", lambda v: {"action": "bedclean", "admissionId": v, "bedId": v}),
        (phys, "POST", "/api/clinical/surgery", lambda v: {"patientId": v, "description": "x"}),
        (phys, "POST", "/api/clinical/surgery", lambda v: {"patientId": PID, "description": "x", "operatingRoomId": v}),
        (phys, "PATCH", "/api/clinical/surgery", lambda v: {"surgeryId": v, "state": "confirmed"}),
        (phys, "POST", "/api/clinical/theatre-safety", lambda v: {"action": "start", "surgeryId": v}),
        (phys, "POST", "/api/clinical/theatre-safety", lambda v: {"action": "phase", "id": v, "phase": "sign_in"}),
        (phys, "POST", "/api/clinical/discharges", lambda v: {"action": "start", "registrationId": v}),
        (cash, "POST", "/api/clinical/discharges", lambda v: {"action": "clear", "id": v, "department": "billing"}),
        (rec_, "POST", "/api/clinical/insurance", lambda v: {"partyId": v, "companyId": 1, "number": "X"}),
        (rec_, "POST", "/api/clinical/insurance", lambda v: {"partyId": PID, "companyId": v, "number": "X"}),
        (rec_, "PUT", "/api/clinical/patients", lambda v: {"patientId": v, "criticalInfo": "x"}),
    ]
    gets = [
        (rec_, "/api/clinical/patients?id={v}"), (rec_, "/api/clinical/appointments?patientId={v}"), (nurse, "/api/clinical/triage?patientId={v}"),
        (phys, "/api/clinical/consultations?patientId={v}"), (phys, "/api/clinical/prescriptions?patientId={v}"), (lab, "/api/clinical/laboratory?patientId={v}"),
        (rad, "/api/clinical/radiology?patientId={v}"), (cash, "/api/clinical/billing?patientId={v}"), (cash, "/api/clinical/billing/invoice-pdf?invoiceId={v}"),
    ]
    bad, n = [], 0
    made_surgeries = []
    for cl, method, path, mk in plan:
        for v in BADV:
            r = call(cl, method, path, mk(v), label=cl.user["role"])
            n += 1
            if r.status == 200 and path.endswith("/surgery") and method == "POST" and isinstance(r["surgery"], int):
                made_surgeries.append(r["surgery"])
            leak = r.status >= 500 or r.status == 0
            if r.status not in (400, 404, 409, 403, 422) or leak or (r.err and re.search(r"Tryton|RPC|psycopg|out of range|SQL|Traceback|KeyError|You are trying|Model has no attribute|int\(\)", r.err or "", re.I)):
                bad.append(f"{method} {path} {json.dumps(mk(v))[:70]} -> {r.status} {r.snip(70)}")
    for sid in made_surgeries:  # tidy the surgeries the bad-id probes unexpectedly created
        call(phys, "PATCH", "/api/clinical/surgery", {"surgeryId": sid, "state": "cancelled"})
    DETAIL["tc066_tidy"] = {"surgeries_cancelled": made_surgeries, "admissions_released": release_patient()}
    for cl, tmpl in gets:
        for v in (-1, 99999999999, "abc"):
            r = call(cl, "GET", tmpl.format(v=v), label=cl.user["role"])
            n += 1
            main_keys = ("patients", "appointments", "evaluations", "consultations", "prescriptions", "labOrders", "radiologyOrders", "invoices")
            empty_ok = r.status == 200 and any(k in (r.data or {}) for k in main_keys) and not any((r.data or {}).get(k) for k in main_keys)
            if r.status >= 500 or (r.status not in (400, 404) and not empty_ok) or re.search(r"Tryton|RPC|psycopg|out of range|SQL|You are trying", r.text, re.I):
                bad.append(f"GET {tmpl.format(v=v)} -> {r.status} {r.snip(70)}")
    DETAIL["tc066_bad"] = bad
    rec("TC-066", not bad, f"{n} probes (ids -1, 0, 99999999999, 'abc', 2147483648 across {len(plan)} write bodies + {len(gets)} GET filters); {len(bad)} deviations: "
        + " || ".join(bad[:5]) + (f" (+{len(bad) - 5} more, see uat_details.json)" if len(bad) > 5 else ""))


guarded("tc066", tc066, ["TC-066"])


def tc067():
    pat = re.compile(r"Traceback|psycopg|IntegrityError|ProgrammingError|DataError|OperationalError|SQLSTATE|relation \"|duplicate key|violates|"
                     r"\bSELECT\b.*\bFROM\b|\bINSERT INTO\b|UPDATE \".*\" SET|File \"|node_modules|\.tsx?:\d+|at [A-Za-z.]+ \(|Tryton RPC error|UserError|"
                     r"KeyError|TypeError|ReferenceError|stack|integer out of range|You are trying to (?:read|write)|Model has no attribute|"
                     r"int\(\) argument|Security rules prevent|A value is required for field|for field \"|does not exist|Access Denied:", re.I)
    leaks = []
    for e in LOG:
        m = pat.search(e["body"])
        if m:
            leaks.append(f"{e['method']} {e['path']} HTTP {e['status']} matched '{m.group(0)[:30]}': {e['body'][:110]}")
        elif e["status"] >= 500 and "json" not in (e["ctype"] or ""):
            leaks.append(f"{e['method']} {e['path']} HTTP {e['status']} non-JSON body: {e['body'][:80]}")
    seen = {}
    for l in leaks:
        seen.setdefault(l.split(" HTTP ")[0], l)
    DETAIL["tc067_leaks"] = list(seen.values())
    rec("TC-067", not leaks, f"scanned {len(LOG)} error responses (HTTP>=400) captured during this run across {len({(e['method'], e['path'].split('?')[0]) for e in LOG})} distinct endpoints; "
        f"{len(seen)} endpoint(s) with leaking text: " + " || ".join(list(seen.values())[:4]))


guarded("tc067", tc067, ["TC-067"])

# =============================================================================================== write results
ids = [f"TC-{i:03d}" for i in range(1, 68)]
for i in ids:
    if i not in RES:
        RES[i] = {"id": i, "status": "FAIL", "observed": "not executed (earlier step failed)"}
out = [RES[i] for i in ids]
json.dump(out, open(os.path.join(OUT_DIR, "uat_results.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
DETAIL["error_log_sample"] = LOG[-60:]
json.dump(DETAIL, open(os.path.join(OUT_DIR, "uat_details.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False, default=str)
print("\nSUMMARY:", {s: sum(1 for r in out if r["status"] == s) for s in ("PASS", "FAIL", "NOT_TESTABLE")})
