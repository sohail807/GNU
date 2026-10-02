"""Read user and group assignments from the authorized Tryton API.

Credentials and endpoint must be supplied through the operator's secure local
environment. This diagnostic deliberately never logs session tokens or passwords.
"""

import base64
import json
import os
import sys
import urllib.error
import urllib.request


def required_environment(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Required secure environment variable is missing: {name}")
    return value


def rpc(url: str, payload: dict, authorization: str) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": authorization,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            result = json.loads(response.read())
    except (urllib.error.URLError, TimeoutError) as exc:
        raise SystemExit("Tryton API request failed; details were suppressed.") from exc
    if not isinstance(result, dict):
        raise SystemExit("Tryton API returned an invalid response.")
    if result.get("error"):
        raise SystemExit("Tryton API rejected the request; details were suppressed.")
    return result


def main() -> int:
    url = required_environment("GNUHEALTH_AUDIT_RPC_URL")
    username = required_environment("GNUHEALTH_AUDIT_USERNAME")
    password = required_environment("GNUHEALTH_AUDIT_PASSWORD")
    try:
        base = base64.b64encode(f"{username}:{password}".encode()).decode()
        login = rpc(
            url,
            {"id": 1, "method": "common.db.login", "params": [username, {"password": password}]},
            f"Basic {base}",
        )
        user_id, session_token = login.get("result", [None, None])
        if not user_id or not session_token:
            raise SystemExit("Tryton authentication failed; response details were suppressed.")

        session = base64.b64encode(
            f"{username}:{user_id}:{session_token}".encode()
        ).decode()
        users = rpc(
            url,
            {
                "id": 2,
                "method": "model.res.user.search_read",
                "params": [
                    [], 0, 30, None,
                    ["id", "login", "name", "groups"],
                    {"company": int(os.environ.get("GNUHEALTH_AUDIT_COMPANY_ID", "1")), "language": "en"},
                ],
            },
            f"Session {session}",
        )
        print(f"Authenticated as user ID {user_id}; session token omitted.")
        print(json.dumps(users.get("result", []), indent=2))
        return 0
    finally:
        # Avoid retaining secret references longer than the one-shot process.
        password = ""
        session_token = "" if "session_token" in locals() else ""


if __name__ == "__main__":
    sys.exit(main())
