"""Tiny HTTP client for the IST Health app API (stdlib only).

Logs in with a hospital code, keeps the session cookie, and returns (status, json) for every call.
Used by the Aster demo loader so every record is created through the same validated code paths as
the real UI.
"""
import http.cookiejar
import json
import time
import urllib.error
import urllib.request

BASE_URL = "https://isthealth.irisstar.tech"


class AppClient:
    def __init__(self, hospital: str, username: str, password: str, base_url: str = BASE_URL, pause: float = 0.0):
        self.hospital = hospital
        self.username = username
        self.base_url = base_url.rstrip("/")
        self.pause = pause
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        status, data = self.request(
            "/api/auth/login", "POST",
            {"username": username, "password": password, "hospital": hospital},
        )
        if status != 200 or not data.get("success"):
            raise RuntimeError(f"login failed for {username}@{hospital}: HTTP {status}")
        self.user = data["user"]

    def request(self, path: str, method: str = "GET", data=None, retries: int = 4):
        body = json.dumps(data).encode() if data is not None else None
        headers = {"Content-Type": "application/json"} if body else {}
        last = (0, {})
        for attempt in range(retries + 1):
            req = urllib.request.Request(self.base_url + path, data=body, headers=headers, method=method)
            try:
                with self.opener.open(req, timeout=60) as resp:
                    raw = resp.read().decode("utf-8", "replace")
                    status = resp.status
            except urllib.error.HTTPError as err:
                raw = err.read().decode("utf-8", "replace")
                status = err.code
            except (urllib.error.URLError, TimeoutError) as err:
                last = (0, {"error": str(err)})
                time.sleep(1.5 * (attempt + 1))
                continue
            try:
                parsed = json.loads(raw) if raw else {}
            except ValueError:
                parsed = {"error": raw[:200]}
            # 5xx gateway blips, and PostgreSQL "could not serialize access" when two loaders write at once
            if (status in (502, 503, 504) or (status == 500 and "serialize" in raw)) and attempt < retries:
                time.sleep(1.5 * (attempt + 1))
                last = (status, parsed)
                continue
            if self.pause:
                time.sleep(self.pause)
            return status, parsed
        return last

    def switch_hospital(self, hospital_id: str):
        """Group customers: make `hospital_id` the active hospital for this session."""
        status, data = self.request("/api/auth/hospital", "POST", {"hospitalId": hospital_id})
        if status != 200 or not data.get("success"):
            raise RuntimeError(f"cannot switch to {hospital_id}: HTTP {status} {data.get('error')}")
        self.hospital_id = hospital_id

    def get(self, path):
        return self.request(path, "GET")

    def post(self, path, data):
        return self.request(path, "POST", data)

    def logout(self):
        self.request("/api/auth/logout", "POST", {})


def load_profiles(gulf: bool = False) -> dict:
    """Profiles keyed by code. Gulf profiles are per hospital and carry the tenant they live in."""
    import os
    here = os.path.dirname(__file__)
    if gulf:
        return json.load(open(os.path.join(here, "profiles_gulf.json"), encoding="utf-8"))["hospitals"]
    return json.load(open(os.path.join(here, "profiles.json"), encoding="utf-8"))


def open_session(profile: dict, code: str, username: str, password: str) -> "AppClient":
    """Sign in to the profile's tenant and, for a group hospital, switch to that hospital."""
    client = AppClient(profile.get("tenant", code), username, password)
    if profile.get("hospital_id"):
        client.switch_hospital(profile["hospital_id"])
    return client
