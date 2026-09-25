# IST HEALTH HMIS — CREDENTIAL ROTATION & SECURITY RUNBOOK

> [!WARNING]
> In strict accordance with the Workspace Operating Directives (AGENTS.md Directive 7), **live credential rotation, firewall modifications, and production accounting alterations require explicit user authorization before execution**.
> This runbook documents the verified, audited procedures for execution during the authorized production go-live window.

---

## 1. Overview of Platform Secrets

| Secret / Asset | Current Scope | Production Target | Rotation Cadence |
|---|---|---|---|
| **Platform Super-Admin** (`admin`) | Master bootstrap account in Tryton | Rotated via `emergency_admin_recovery.py` with physical key vault storage | 90 days or immediate upon departure |
| **Tenant Administrative Users** (`demo_admin1`) | Tenant group administration | Replaced with client-specific tenant administrators | 90 days |
| **Clinical Persona Credentials** (`demo_dr1`, `demo_nurse1`, etc.) | Synthetic demonstration accounts | Deactivated / replaced by provisioned clinical staff with initial mandatory reset | Per-staff lifecycle |
| **PostgreSQL User Password** (`gnuhealth`) | Database connection string in `/home/gnuhealth/tryton.conf` | Secure 32-character CSPRNG secret injected via environment/secret manager | 180 days |
| **SSH Deployment Key** (`gnuhealth_deploy`) | Ed25519 / RSA deployment key on `debian@34.7.237.8` | Rotated through GCP IAM OS-Login or authorized SSH key registry | 90 days |
| **JWT / Session HMAC Secret** | Next.js BFF cookie signer (`SESSION_SECRET`) | 64-byte hex string in production `.env.production` | On compromise or annually |

---

## 2. Tryton User Credential Rotation Procedure

### Step 2.1: Rotate Tenant User Passwords
When authorized, execute the rotation natively through Tryton's `res.user.write` API or via administrative session:

```bash
# Example rotation via Tryton JSON-RPC with authorized session
curl -X POST http://127.0.0.1:8000/gnuhealth/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Session <ENCODED_SESSION>" \
  -d '{
    "id": 1,
    "method": "model.res.user.write",
    "params": [[[146], {"password": "NEW_SECURE_PASSWORD"}], {"company": 2}]
  }'
```

### Step 2.2: Platform Administrator Break-Glass Recovery
For the platform super-administrator (`admin`), use the audited emergency CLI tool:

```bash
python scripts/emergency_admin_recovery.py \
  --operator "Lead Systems Architect" \
  --reason "Scheduled quarterly production credential rotation" \
  --new-password "<SECURE_32_CHAR_PASSPHRASE>"
```
This utility:
1. Updates the native SHA-512 cryptographically hashed password in PostgreSQL.
2. Invalids all existing session tokens.
3. Appends an immutable SHA-256 HMAC entry to `reports/security_audit_log.json`.

---

## 3. Session Invalidation Procedure

To immediately terminate all active sessions across all tenants without restarting Tryton services:

1. **Purge Frontend Session Storage:**
   ```bash
   # Add all issued active token IDs to persistent revocation store
   node -e "
     const fs = require('fs');
     const store = '.tokens/revoked_sessions.json';
     const now = Date.now();
     // Invalidate all sessions issued prior to current epoch
     fs.writeFileSync(store, JSON.stringify({ globalRevocationEpoch: now }));
   "
   ```

2. **Revoke Tryton Native Sessions:**
   ```bash
   # Connect to PostgreSQL on backend VM
   sudo -u postgres psql -d gnuhealth -c "DELETE FROM res_user_session;"
   sudo -u postgres psql -d gnuhealth_test_alpha -c "DELETE FROM res_user_session;"
   sudo -u postgres psql -d gnuhealth_test_beta -c "DELETE FROM res_user_session;"
   ```

---

## 4. Backend Port 8000 Public Access Restriction (GCP Firewall)

Currently, Tryton is reachable on port 80 through Nginx reverse proxy. Direct external access to port 8000 should be restricted to ensure all traffic traverses Nginx TLS and rate limiting.

### Verification (Check Current Port Binding):
```bash
# Check if trytond is bound to 0.0.0.0:8000 or 127.0.0.1:8000
ssh debian@34.7.237.8 "sudo ss -tulpn | grep 8000"
```

### Firewall Rule Modification (Requires Explicit Authorization):
```bash
# Run from authorized Google Cloud SDK console:
gcloud compute firewall-rules update default-allow-tryton-8000 \
  --source-ranges=127.0.0.1/32 \
  --disabled

# Verify that only ports 80 (HTTP redirect) and 443 (HTTPS) remain publicly exposed:
gcloud compute firewall-rules list --filter="targetTags:gnuhealth"
```

### Tryton Configuration Update (Bind to Localhost Only):
Edit `/home/gnuhealth/tryton.conf`:
```ini
[web]
listen = 127.0.0.1:8000
```
Then restart the Tryton service:
```bash
sudo systemctl restart gnuhealth
```

---

## 5. SSL / TLS Certificate Issuance (Let's Encrypt Certbot)

Once the production domain DNS (e.g. `ist-health.qa` or `hmis.ist-health.com`) points to `34.7.237.8`:

1. **Install Certbot on the VM:**
   ```bash
   sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. **Acquire Certificate:**
   ```bash
   sudo certbot --nginx -d ist-health.qa -d *.ist-health.qa --agree-tos --email admin@ist-health.qa
   ```

3. **Deploy Production Nginx Configuration:**
   ```bash
   sudo cp deploy/nginx/ist-health-production-ssl.conf /etc/nginx/sites-available/ist-health
   sudo ln -sf /etc/nginx/sites-available/ist-health /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
