# PHASE 0 OPERATOR RUNBOOK: SECURITY HARDENING EXECUTION
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Document**: `audit/PHASE_0_OPERATOR_RUNBOOK.md`  
**Classification**: Authoritative Future Execution Procedure (Read-Only Specification)  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Host**: APPLICATION SERVER (`34.7.237.8`)  
**Document Date**: 2026-09-21  
**Execution State**: `STANDBY — DO NOT EXECUTE UNTIL ALL GATES ARE CONFIRMED`  

---

> [!CAUTION]
> ### CRITICAL GOVERNANCE MANDATE: SCOPE RESTRICTION
> **NO CLINIC MASTER DATA POPULATION IS PART OF PHASE 0.**  
> Do **NOT** create patients, doctors, health professionals, appointments, medicines, formulary items, prices, tariffs, insurers, invoices, cash vouchers, accounting journals, clinical evaluations, or any other operational records during Phase 0 execution. Phase 0 is strictly limited to infrastructure and security hardening.

---

## 1. Operating Principles & Safety Guidelines

1. **Strict Linearity**: Follow the 28 numbered steps in exact chronological sequence. Never skip, reorder, or parallelize steps.
2. **Pre-Change Database Safety**: No configuration or service alteration may take place before Step 9 (Backup Validation) successfully passes all 4 criteria.
3. **Secret Hygiene**: Never print, display, or store passwords, private keys, or credentials in terminal outputs, documentation, screenshots, or logs.
4. **Failure Rule**: If any command fails or produces unexpected behavior, **STOP IMMEDIATELY**. Do not proceed to subsequent steps. Determine whether rollback is required.

---

## 2. Step-by-Step Operator Execution Sequence

### Step 1: Confirm Maintenance Window
* **Action**: Verify that the current time falls within the formally approved 30-minute operational maintenance window (`<PENDING MAINTENANCE WINDOW>`).
* **Check**: Confirm that clinic reception, medical staff, and administration are aware of the service maintenance window.

### Step 2: Confirm Approvals
* **Action**: Cross-check [`audit/PHASE_0_APPROVAL_MATRIX.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_APPROVAL_MATRIX.md).
* **Check**: Ensure all 12 items in the Approval Matrix are marked `CONFIRMED` with signed evidence.

### Step 3: Confirm SSH Access
* **Action**: Establish an interactive SSH session to the host VM:
  ```bash
  ssh -i ~/.ssh/authorized_id_ed25519 gnuhealth@34.7.237.8
  ```
* **Check**: Shell session opens cleanly without password prompt; MOTD confirms Debian 12 host.

### Step 4: Confirm Sudo Capability
* **Action**: Verify sudo elevation for required administrative binaries:
  ```bash
  sudo systemctl status gnuhealth.service
  sudo nginx -v
  sudo -u postgres psql -c "SELECT version();"
  ```
* **Check**: Commands succeed without sudo permission errors.

### Step 5: Confirm GCP Access
* **Action**: Verify cloud operator access to Google Cloud SDK (`gcloud`):
  ```bash
  gcloud compute firewall-rules list --project=<TARGET_GCP_PROJECT>
  ```
* **Check**: Firewall list returns target rules without authorization errors.

### Step 6: Inspect Current Production Configuration
* **Action**: Review live on-disk service and reverse proxy configuration files:
  ```bash
  cat /home/gnuhealth/trytond.conf
  cat /etc/nginx/sites-available/gnuhealth
  ```
* **Check**: Note current bind address (`listen = 0.0.0.0:8000`) and proxy pass destination (`http://127.0.0.1:8000`).

### Step 7: Capture Pre-Change Evidence
* **Action**: Execute pre-change socket and process capture:
  ```bash
  ss -tlpn | grep -E '(80|443|8000|5432)'
  ```
* **Check**: Log output matching baseline: Port 80 (nginx), Port 8000 (python3/trytond), Port 5432 (local postgres), Port 443 (absent).

### Step 8: Create PostgreSQL Backup
* **Action**: Create dedicated backup directory and dump the production `gnuhealth` database in custom compressed format:
  ```bash
  mkdir -p /home/gnuhealth/backups
  chmod 700 /home/gnuhealth/backups
  sudo -u postgres pg_dump -Fc gnuhealth > /home/gnuhealth/backups/gnuhealth_pre_phase0_$(date +%Y%m%d_%H%M%S).dump
  ```
* **Check**: File is generated in `/home/gnuhealth/backups/`.

### Step 9: Validate Backup
* **Action**: Perform complete integrity validation of the newly generated archive:
  ```bash
  BACKUP_FILE=$(ls -t /home/gnuhealth/backups/gnuhealth_pre_phase0_*.dump | head -1)
  ls -lh "$BACKUP_FILE"
  sudo -u postgres pg_restore --list "$BACKUP_FILE" > /dev/null
  echo "EXIT_CODE: $?"
  ```
* **Check**: File size is non-zero ($> 25\text{ MB}$); `pg_restore --list` returns exit code 0. If validation fails, **STOP IMMEDIATELY**.

### Step 10: Rotate Compromised Tryton Admin Credential
* **Action**: Generate a 24-character enterprise passphrase via secure local generator (stored exclusively in enterprise password vault). Apply via `trytond-admin`:
  ```bash
  sudo -u gnuhealth TRYTONPASS="<NEW_ENTERPRISE_PASSPHRASE>" \
      /home/gnuhealth/venv/bin/trytond-admin -c /home/gnuhealth/trytond.conf -d gnuhealth -p
  ```
* **Check**: Command completes with zero errors. Do NOT echo or print passphrase to terminal. Do NOT delete old credential file yet.

### Step 11: Verify New Credential
* **Action**: Authenticate against JSON-RPC using the new administrative passphrase:
  ```bash
  curl -s -u admin:"<NEW_ENTERPRISE_PASSPHRASE>" -X POST http://127.0.0.1:8000/gnuhealth/ \
      -H "Content-Type: application/json" \
      -d '{"method": "common.server.version", "params": []}'
  ```
* **Check**: Returns valid JSON response `{"result": "7.0.57"}`.

### Step 12: Verify Old Credential No Longer Authenticates
* **Action**: Test authentication using the initial provisioning credential:
  ```bash
  curl -s -u admin:"<OLD_PROVISIONING_PASSWORD>" -X POST http://127.0.0.1:8000/gnuhealth/ \
      -H "Content-Type: application/json" \
      -d '{"method": "common.server.version", "params": []}'
  ```
* **Check**: Request fails with HTTP 401 Unauthorized or Tryton authentication error.

### Step 13: Remove Unauthorized Plaintext Credential Copies Where Authorized
* **Action**: Only after Steps 11 and 12 are verified, securely shred the legacy on-host credential artifact:
  ```bash
  if [ -f /home/gnuhealth/admin_password.txt ]; then
      shred -u /home/gnuhealth/admin_password.txt
  fi
  ```
* **Check**: Confirm file `/home/gnuhealth/admin_password.txt` no longer exists on disk.

### Step 14: Verify Tryton / Nginx Architecture
* **Action**: Confirm that Nginx reverse proxy configuration targets `http://127.0.0.1:8000`:
  ```bash
  grep -i "proxy_pass" /etc/nginx/sites-available/gnuhealth
  ```
* **Check**: Output confirms `proxy_pass http://127.0.0.1:8000;`.

### Step 15: Restrict Tryton Binding to Loopback Interface
* **Action**: Backup configuration file and update bind address in `/home/gnuhealth/trytond.conf`:
  ```bash
  cp /home/gnuhealth/trytond.conf /home/gnuhealth/trytond.conf.bak_pre_loopback
  sed -i 's/^listen = 0.0.0.0:8000/listen = 127.0.0.1:8000/' /home/gnuhealth/trytond.conf
  sudo systemctl restart gnuhealth.service
  ```
* **Check**: Verify socket binding:
  ```bash
  ss -tlpn | grep 8000
  ```
  Must display `127.0.0.1:8000`. Socket `0.0.0.0:8000` must be absent.

### Step 16: Inspect GCP Firewall Rules
* **Action**: Identify the active GCP VPC firewall rule permitting external TCP 8000:
  ```bash
  gcloud compute firewall-rules list --filter="allowed.ports:8000" --project=<TARGET_GCP_PROJECT>
  ```
* **Check**: Record exact rule name, source ranges, target tags, and network.

### Step 17: Remove / Restrict Unintended Public TCP 8000 Exposure
* **Action**: Update the identified GCP firewall rule to remove `tcp:8000`:
  ```bash
  gcloud compute firewall-rules update <IDENTIFIED_RULE_NAME> \
      --allow=tcp:80,tcp:443 \
      --project=<TARGET_GCP_PROJECT>
  ```
* **Check**: External probe to port 8000 from remote test client fails/times out.

### Step 18: Configure Official FQDN / TLS
* **Action**: Verify that public DNS A-record resolves `<OFFICIAL_CLINIC_FQDN>` to `34.7.237.8`:
  ```bash
  dig +short <OFFICIAL_CLINIC_FQDN>
  ```
* **Check**: Returns `34.7.237.8`. If DNS does not resolve, do not invoke Certbot.

### Step 19: Configure Nginx HTTPS
* **Action**: Install Certbot and request CA-signed certificate for the official clinic FQDN:
  ```bash
  sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d <OFFICIAL_CLINIC_FQDN> --non-interactive --agree-tos -m <ADMIN_EMAIL>
  ```
* **Check**: Certificate and private key created in `/etc/letsencrypt/live/<OFFICIAL_CLINIC_FQDN>/`.

### Step 20: Redirect HTTP to HTTPS Where Approved
* **Action**: Enforce TLS 1.2+ (TLS 1.3 preferred) and HTTP 301 redirection in `/etc/nginx/sites-available/gnuhealth`:
  ```nginx
  server {
      listen 80;
      listen [::]:80;
      server_name <OFFICIAL_CLINIC_FQDN>;
      return 301 https://$host$request_uri;
  }
  server {
      listen 443 ssl http2;
      listen [::]:443 ssl http2;
      server_name <OFFICIAL_CLINIC_FQDN>;

      ssl_certificate /etc/letsencrypt/live/<OFFICIAL_CLINIC_FQDN>/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/<OFFICIAL_CLINIC_FQDN>/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_prefer_server_ciphers on;

      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
      add_header X-Content-Type-Options nosniff;
      add_header X-Frame-Options SAMEORIGIN;

      location / {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto https;
      }
  }
  ```
  Validate and reload:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```
* **Check**: `nginx -t` confirms syntax is valid; reload succeeds.

### Step 21: Configure Automated PostgreSQL Backups
* **Action**: Deploy automated daily backup script in `/home/gnuhealth/scripts/backup_daily.sh` with permissions `chmod 700`:
  ```bash
  mkdir -p /home/gnuhealth/scripts
  cat << 'EOF' > /home/gnuhealth/scripts/backup_daily.sh
  #!/bin/bash
  set -eo pipefail
  BACKUP_DIR="/home/gnuhealth/backups"
  DATE=$(date +%Y%m%d_%H%M%S)
  FILE="$BACKUP_DIR/gnuhealth_auto_$DATE.dump"
  /usr/bin/pg_dump -Fc -U gnuhealth gnuhealth > "$FILE"
  /usr/bin/pg_restore --list "$FILE" > /dev/null
  find "$BACKUP_DIR" -name "gnuhealth_auto_*.dump" -mtime +30 -delete
  echo "Backup successfully created and validated: $FILE"
  EOF
  chmod 700 /home/gnuhealth/scripts/backup_daily.sh
  ```
  Install user crontab:
  ```bash
  (crontab -l 2>/dev/null; echo "0 2 * * * /home/gnuhealth/scripts/backup_daily.sh >> /home/gnuhealth/backups/backup.log 2>&1") | crontab -
  ```
* **Check**: `crontab -l` displays scheduled backup job at 02:00 AST.

### Step 22: Validate Backup Automation
* **Action**: Test-run the backup automation script manually:
  ```bash
  /home/gnuhealth/scripts/backup_daily.sh
  ```
* **Check**: Script exits 0; newly created archive exists in `/home/gnuhealth/backups/` and passes `pg_restore --list`.

### Step 23: Restart Only Required Services
* **Action**: Restart application daemon to ensure clean environment:
  ```bash
  sudo systemctl restart gnuhealth.service
  sudo systemctl status gnuhealth.service --no-pager
  ```
* **Check**: Status is `active (running)`.

### Step 24: Perform Application Validation
* **Action**: Verify Tryton SAO web client over HTTPS:
  ```bash
  curl -Ik https://<OFFICIAL_CLINIC_FQDN>/
  ```
* **Check**: HTTP 200 response with security headers present. HTTP port 80 returns HTTP 301 redirect to HTTPS. Authenticated login via web browser succeeds with new passphrase.

### Step 25: Perform Security Validation
* **Action**: Validate external network exposure from remote testing workstation:
  - TCP Port 80: HTTP 301 Redirect to HTTPS
  - TCP Port 443: HTTPS TLS 1.2+ Active (SSL Labs rating A)
  - TCP Port 8000: Connection Refused / Timed Out (Bypassing proxy is impossible)
  - TCP Port 5432: Connection Refused (PostgreSQL internal only)
* **Check**: All 4 perimeter conditions satisfied.

### Step 26: Capture Evidence
* **Action**: Complete [`audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md) with timestamps, exact command outputs, and post-change states.
* **Check**: All post-change items verified.

### Step 27: Record Final Status
* **Action**: Document final results in [`audit/PHASE_0_POSTCHANGE_VALIDATION.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_POSTCHANGE_VALIDATION.md) and [`audit/PHASE_0_EXECUTION_LOG.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_LOG.md).
* **Check**: Gate set to `COMPLETE — SECURITY HARDENING VERIFIED`.

### Step 28: Stop
* **Action**: Close SSH session. Inform stakeholders of maintenance window completion.
* **Check**: Transition to Phase 1 onboarding standby. Do not perform any clinic data entry.

---

## 3. Rollback Runbook Summary

| Subsystem | Trigger Condition | Rollback Command Sequence |
| :--- | :--- | :--- |
| **Tryton Binding** | Service fails to bind or Nginx cannot reach loopback | `cp /home/gnuhealth/trytond.conf.bak_pre_loopback /home/gnuhealth/trytond.conf`<br>`sudo systemctl restart gnuhealth.service` |
| **GCP Firewall** | Inadvertent loss of SSH or legitimate traffic | `gcloud compute firewall-rules update <RULE> --allow=tcp:80,tcp:443,tcp:8000` |
| **Nginx / TLS** | Certbot failure or redirection loop | `cp /etc/nginx/sites-available/gnuhealth.bak /etc/nginx/sites-available/gnuhealth`<br>`sudo nginx -t && sudo systemctl reload nginx` |
| **Admin Credential** | New passphrase locked out | Re-run `trytond-admin -p` with saved temporary recovery passphrase |
| **Database Corruption** | Unintended schema or data change | `sudo -u postgres pg_restore -d gnuhealth --clean --if-exists <BACKUP_FILE>` |
