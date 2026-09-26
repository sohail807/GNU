#!/usr/bin/env python3
"""
GNU HEALTH HMIS — SAMPLE TASK 1: MODEL & NATIVE API INSPECTION
==============================================================
Demonstrates inspection of Tryton model `gnuhealth.patient.evaluation`
via native JSON-RPC 2.0 API with cryptographic session authentication.
"""

import urllib.request
import json
import base64
import os

BASE_URL = "http://34.7.237.8"
USERNAME = os.getenv("GNUHEALTH_USER_DOC", "demo_dr1")
PASSWORD = os.getenv("GNUHEALTH_PWD_DOC", "Doctor2026!")

def inspect_evaluation_model():
    print("=" * 70)
    print("SAMPLE TASK 1: NATIVE MODEL & JSON-RPC API INSPECTION")
    print("=" * 70)
    
    # Step 1: Authentication via common.db.login
    auth_str = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode('utf-8')).decode('utf-8')
    login_payload = json.dumps({
        "method": "common.db.login",
        "params": [USERNAME, {"password": PASSWORD}]
    }).encode('utf-8')
    
    req_login = urllib.request.Request(
        f"{BASE_URL}/gnuhealth/",
        data=login_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth_str}"
        }
    )
    
    with urllib.request.urlopen(req_login, timeout=10) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        uid, token = res
        print(f"[AUTH SUCCESS] User: {USERNAME} | UID: {uid} | Session Token: {token[:16]}... (64 hex digits)")

    # Step 2: Native Model Query via model.gnuhealth.patient.evaluation.search_read
    sess_bytes = f"{USERNAME}:{uid}:{token}".encode('utf-8')
    sess_str = base64.b64encode(sess_bytes).decode('utf-8')
    
    # Params: [domain, offset, limit, order, fields, context]
    query_payload = json.dumps({
        "method": "model.gnuhealth.patient.evaluation.search_read",
        "params": [
            [], 0, 5, [("id", "DESC")],
            ["id", "patient", "healthprof", "evaluation_date", "systolic", "diastolic", "bpm", "temperature", "bmi", "state"],
            {"company": 2}
        ]
    }).encode('utf-8')
    
    req_model = urllib.request.Request(
        f"{BASE_URL}/gnuhealth/",
        data=query_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Session {sess_str}"
        }
    )
    
    with urllib.request.urlopen(req_model, timeout=10) as resp:
        eval_records = json.loads(resp.read().decode('utf-8'))
        print(f"\n[MODEL INSPECTION] Model: 'gnuhealth.patient.evaluation'")
        print(f"Total Records Retrieved: {len(eval_records)}")
        print("-" * 70)
        for r in eval_records:
            print(f"• Eval ID: {r.get('id'):<4} | Patient ID: {r.get('patient')} | Doctor ID: {r.get('healthprof')} | BP: {r.get('systolic')}/{r.get('diastolic')} mmHg | BMI: {r.get('bmi')} | State: {r.get('state')}")
        print("-" * 70)
        
    print("\nAPI Architecture Explanation:")
    print("1. Protocol: Tryton JSON-RPC 2.0 over HTTP POST.")
    print("2. Endpoint: http://34.7.237.8/gnuhealth/")
    print("3. Auth Scheme: Session tokens issued via 'common.db.login', sent as 'Authorization: Session base64(username:uid:token)'.")
    print("4. Model Dispatcher: 'model.<model_name>.<method>' with params [domain, offset, limit, order, fields, context].")
    print("=" * 70)

if __name__ == "__main__":
    inspect_evaluation_model()
