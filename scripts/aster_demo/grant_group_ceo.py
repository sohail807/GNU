"""Give the Aster group executive the lab, imaging and billing groups on top of admin (so the Group Overview can read them).

    python grant_group_ceo.py <admin_creds.json> <group_ceo_username> [user_id]

admin_creds.json is the provisioning result ({"adminUsername": ..., "adminPassword": ...}). Run once, through the app API.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient  # noqa: E402

creds = json.load(open(sys.argv[1], encoding="utf-8"))
username = sys.argv[2] if len(sys.argv) > 2 else "aster_group_ceo"
admin = AppClient("aster", creds["adminUsername"], creds["adminPassword"])
# the user list is capped at 50, so sign in as the executive to learn the account id
user_id = int(sys.argv[3]) if len(sys.argv) > 3 else 103
status, result = admin.post("/api/admin/users", {"action": "update_user", "userId": user_id, "role": "admin",
                                                 "extraRoles": ["lab", "radiology", "cashier"]})
print(status, result)
