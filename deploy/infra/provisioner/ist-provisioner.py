#!/usr/bin/env python3
"""IST hospital provisioning service.

Creates one hospital database by running the single whitelisted provisioning script
(/usr/local/bin/ist-provision-tenant.sh, allowed via /etc/sudoers.d/ist-tenant-provisioning).
Called by the Platform screen (Cloud Run) through nginx at https://<api host>/_provision.

Hard limits, by design:
  * listens on 127.0.0.1 only (nginx is the only way in, over TLS)
  * every request needs `Authorization: Bearer <PROVISIONER_TOKEN>` (constant-time compare)
  * the only input is a hospital code matching ^[a-z0-9]{2,24}$ (never reserved names); the database
    name is derived from it, and the script re-validates it independently
  * a fixed argv is executed (no shell); one provisioning at a time; hard timeout
  * the generated admin password is returned once in the response and is never logged
"""
import hmac
import json
import os
import re
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = os.environ.get("PROVISIONER_TOKEN", "")
BIND = os.environ.get("PROVISIONER_BIND", "127.0.0.1")
PORT = int(os.environ.get("PROVISIONER_PORT", "8200"))
# Test hooks only; production uses the defaults.
SCRIPT = os.environ.get("PROVISIONER_SCRIPT", "/usr/local/bin/ist-provision-tenant.sh")
SUDO = os.environ.get("PROVISIONER_SUDO", "sudo -n").split()

CODE_RE = re.compile(r"^[a-z0-9]{2,24}$")
RESERVED = {"central", "admin", "api", "www", "platform", "staging", "template", "gnuhealth", "default"}
NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'()&-]{1,79}$")
CURRENCY_RE = re.compile(r"^[A-Z]{3}$")
TZ_RE = re.compile(r"^([A-Za-z_]+/[A-Za-z_]+|UTC)$")
MAX_BODY = 1024
TIMEOUT_SECONDS = 300  # cloning + bootstrapping takes about a minute

_lock = threading.Lock()


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


class Handler(BaseHTTPRequestHandler):
    server_version = "ist-provisioner"
    sys_version = ""

    def log_message(self, fmt, *args):  # route access logs through our own logger, no client data
        log("request: " + (fmt % args))

    def _send(self, status: int, body: dict) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _authorized(self) -> bool:
        supplied = self.headers.get("Authorization", "")
        expected = f"Bearer {TOKEN}"
        return hmac.compare_digest(supplied.encode(), expected.encode())

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"ok": True})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/provision":
            return self._send(404, {"error": "not found"})
        if not self._authorized():
            return self._send(401, {"error": "unauthorized"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send(400, {"error": "bad request"})
        if length <= 0 or length > MAX_BODY:
            return self._send(400, {"error": "bad request"})
        try:
            payload = json.loads(self.rfile.read(length))
            code = payload.get("code")
        except (ValueError, AttributeError):
            return self._send(400, {"error": "bad request"})

        if not isinstance(code, str) or not CODE_RE.fullmatch(code) or code in RESERVED:
            return self._send(400, {"error": "invalid hospital code"})
        database = f"gnuhealth_h_{code}"

        # Optional hospital details: when given, the script also bootstraps the database (institution,
        # chart of accounts, fiscal year, payment method, access rules, catalogues). All validated here
        # and again inside the script.
        extra = []
        if payload.get("name") is not None:
            name, currency, tz = payload.get("name"), payload.get("currency"), payload.get("timezone")
            if not (isinstance(name, str) and NAME_RE.fullmatch(name) and isinstance(currency, str)
                    and CURRENCY_RE.fullmatch(currency) and isinstance(tz, str) and TZ_RE.fullmatch(tz)):
                return self._send(400, {"error": "invalid hospital details"})
            extra = [name, code.upper()[:12], currency, tz]

        if not _lock.acquire(blocking=False):
            return self._send(429, {"error": "another provisioning is in progress"})
        try:
            log(f"provisioning {database}")
            try:
                proc = subprocess.run(
                    [*SUDO, SCRIPT, database, *extra],
                    capture_output=True, text=True, timeout=TIMEOUT_SECONDS, check=False,
                )
            except subprocess.TimeoutExpired:
                log(f"provisioning {database}: TIMEOUT")
                return self._send(504, {"error": "provisioning timed out"})

            if proc.returncode != 0:
                already = "already exists" in proc.stderr
                # stderr stays in the server log only; the caller gets a generic message.
                log(f"provisioning {database}: FAILED rc={proc.returncode} {proc.stderr.strip()[:300]}")
                return self._send(409 if already else 500, {"error": "already exists" if already else "provisioning failed"})

            user = re.search(r"^ADMIN_USERNAME=(.+)$", proc.stdout, re.M)
            password = re.search(r"^ADMIN_PASSWORD=(.+)$", proc.stdout, re.M)
            if not user or not password:
                log(f"provisioning {database}: script gave no admin credentials")
                return self._send(500, {"error": "provisioning failed"})
            log(f"provisioning {database}: OK")
            return self._send(200, {
                "ok": True,
                "database": database,
                "adminUsername": user.group(1).strip(),
                "adminPassword": password.group(1).strip(),
            })
        finally:
            _lock.release()


def main() -> None:
    if len(TOKEN) < 32:
        sys.exit("PROVISIONER_TOKEN must be set to at least 32 characters")
    ThreadingHTTPServer((BIND, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
