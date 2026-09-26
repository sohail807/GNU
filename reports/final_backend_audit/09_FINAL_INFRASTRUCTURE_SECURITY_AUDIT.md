# GNU HEALTH HMIS — FINAL BACKEND TECHNICAL AUDIT
## REPORT 09: INFRASTRUCTURE, NETWORK & HOST SECURITY AUDIT

**Audit Reference:** `GH-AUDIT-FINAL-2026-09-24-INFRA`  
**Host Target:** GCP Compute Engine `gnuhealth-srv` (Instance ID: `gnuhealth-srv`, Zone: `europe-west4-a`)  
**Network Identifiers:** Public Static IP: `34.7.237.8` | Private Internal IP: `10.164.0.2`  
**Operating System:** Debian GNU/Linux 12 (Bookworm) | Kernel: `6.1.0-53-cloud-amd64`  
**Status:** `EMPIRICALLY VERIFIED NETWORK ISOLATION & HOST HARDENING`  

---

### 1. External Network Exposure & Port Scan Audit

Live TCP socket connection probes were executed from an external network against `34.7.237.8` to empirical check port exposure:

| Port | Protocol / Service | External Visibility | Expected Architectural State | Audit Verdict |
| :---: | :--- | :---: | :--- | :---: |
| **80** | HTTP (Nginx Web Proxy) | **OPEN (REACHABLE)** | Open to public Internet for web traffic and Let's Encrypt validation. | **COMPLIANT** |
| **443** | HTTPS (TLS Gateway) | **FILTERED / CLOSED** | Inactive pending clinic FQDN delegation and certificate generation. | **COMPLIANT** |
| **8000** | Tryton WSGI Server | **FILTERED / CLOSED** | **STRICTLY PRIVATE**. Must NOT be accessible from public Internet. | **SECURE (PASS)** |
| **5432** | PostgreSQL Database | **FILTERED / CLOSED** | **STRICTLY PRIVATE**. Must NOT be accessible from public Internet. | **SECURE (PASS)** |
| **22** | OpenSSH Remote Shell | **OPEN (REACHABLE)** | Open for administrative access; key-based authentication mandatory. | **COMPLIANT** |

**Critical Security Result:** Neither Tryton (`8000`) nor PostgreSQL (`5432`) is publicly exposed. All client traffic must traverse the Nginx reverse proxy.

---

### 2. Internal Host Port Bindings (`ss -tulpn`)

The listening sockets on `gnuhealth-srv` were inspected via `sudo ss -tulpn | grep LISTEN`:

```
LISTEN 0   511    0.0.0.0:80        0.0.0.0:*   users:(("nginx",pid=518,fd=7))
LISTEN 0   128    0.0.0.0:22        0.0.0.0:*   users:(("sshd",pid=519,fd=3))
LISTEN 0   128  127.0.0.1:8000      0.0.0.0:*   users:(("python3",pid=520,fd=4))
LISTEN 0   244  127.0.0.1:5432      0.0.0.0:*   users:(("postgres",pid=517,fd=6))
```

**Architectural Alignment:**
- Tryton binds strictly to loopback interface `127.0.0.1:8000`.
- PostgreSQL binds strictly to loopback interface `127.0.0.1:5432`.
- Nginx binds to all interfaces `0.0.0.0:80` to act as the sole inbound gateway.

---

### 3. Nginx Reverse Proxy Configuration & Security Headers

Inspection of `/etc/nginx/sites-enabled/default` and `/etc/nginx/nginx.conf`:

#### Active Security Directives:
```nginx
server_tokens off;
client_max_body_size 50M;

# Mandatory Security Headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

#### Upstream Proxy Block:
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
}
```

---

### 4. SSH Host Hardening & Cryptographic Key Management

The OpenSSH daemon was audited via `sshd -T`:

| Directive | Live Configured Value | Security Assessment |
| :--- | :--- | :--- |
| `PasswordAuthentication` | `no` | **Compliant:** Plaintext password attacks against SSH are completely disabled. |
| `PermitRootLogin` | `no` | **Compliant:** Direct root login is forbidden. |
| `PubkeyAuthentication` | `yes` | **Compliant:** Public-key authentication is strictly mandatory. |
| `Port` | `22` | Standard port; protected by GCP network security firewalls. |

#### Cryptographic Key Inventory:
1. **Operator Admin Key (`~/.ssh/google_compute_engine`):**
   - Algorithm: ED25519
   - Passphrase Protection: **YES (Strongly encrypted)**
   - Role: Permanent interactive administrator access.
2. **Automation Deployment Key (`~/.ssh/gnuhealth_deploy`):**
   - Algorithm: ED25519
   - Passphrase Protection: NO (Used for non-interactive background agent automation)
   - Status: Permitted under restricted workstation ACLs; scheduled for decommissioning upon project handover.

---

### 5. Infrastructure Security Verdict

The host and network tiers are **secure, isolated, and properly segmented**. Zero unauthorized services or databases are exposed to the public Internet.
