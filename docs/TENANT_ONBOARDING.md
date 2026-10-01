# Onboarding a hospital (tenant) — operator runbook

Each hospital gets **its own Tryton/PostgreSQL database** (strong data isolation) and its own address:
`https://<subdomain>.isthealth.irisstar.tech`. The bare domain `https://isthealth.irisstar.tech` is the
default hospital (IST Central, database `gnuhealth`). Designed for a handful of hospitals.

How the app picks a hospital: Firebase Hosting forwards the visited host in `X-Forwarded-Host`; middleware maps
`<subdomain>` to a registry entry; the login API ignores any client-supplied tenant once `APP_BASE_DOMAIN` is set.
The login page never lists other hospitals. Session cookies are per host, so a session for one hospital cannot be
replayed on another.

Choose `<subdomain>`: 2–31 chars, lowercase letters/digits/hyphens (e.g. `alnoor`). The database is always
`gnuhealth_<subdomain with hyphens → underscores>` (e.g. `gnuhealth_alnoor`).

## Steps

### 1. Create the hospital database (VM, operator)
```bash
ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8
sudo /usr/local/bin/ist-provision-tenant.sh gnuhealth_alnoor
```
Clones the template dump and prints `ADMIN_USERNAME` / `ADMIN_PASSWORD` (unique per hospital). Deliver them to the
hospital's administrator over an approved secure channel. Never paste them in chat, tickets or git.

### 2. Let the backend serve it (VM, operator)
The backend only serves databases listed in `TRYTOND_DATABASE_NAMES` (deliberately — it stops test/UAT databases
being reachable). Append the new name (comma-separated) in the `gnuhealth` systemd unit, then restart:
```bash
sudo systemctl edit gnuhealth      # add/extend: Environment=TRYTOND_DATABASE_NAMES=gnuhealth,gnuhealth_alnoor
sudo systemctl restart gnuhealth   # a few seconds of backend downtime for ALL hospitals: do it off-peak
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.isthealth.irisstar.tech/gnuhealth_alnoor/ \
  -H 'content-type: application/json' -d '{"id":1,"method":"common.db.login","params":["x",{"password":"x"}]}'
# expect 401 (served). 404 = not served yet.
```

### 3. Back it up (VM, operator) — verify before real data
`/usr/local/bin/gnuhealth-backup.sh` (source: `deploy/infra/scripts/gnuhealth-backup.sh`) backs up the main
database **and every name in `TRYTOND_DATABASE_NAMES`**, so step 2 already enrols the hospital. Confirm it:
```bash
sudo /usr/local/bin/gnuhealth-backup.sh --list-databases   # must include gnuhealth_alnoor
sudo systemctl start gnuhealth-backup.service              # run now
sudo tail -n 15 /var/log/gnuhealth_backup.log              # look for "DB backup successful [gnuhealth_alnoor]"
```
Hospital dumps are named `gnuhealth_tenant_<db>_<timestamp>.dump` (14-day retention, copied off-site to GCS). If any
database fails the run exits non-zero (`systemctl status gnuhealth-backup.service` shows failed) but the others are
still backed up. Test a **restore of the new hospital's dump** into a scratch database before entering real data.

### 4. Register the hospital (platform admin)
Sign in at `https://isthealth.irisstar.tech` as an allow-listed super-admin (`SUPER_ADMIN_USERNAMES`, currently
`irisstar_admin`), open **Platform**, and add: name, subdomain, currency (ISO, e.g. QAR), country (ISO, e.g. QAT).
In `TENANT_PROVISIONING=manual` mode the app only checks that the backend serves the database (step 2) and then
writes the registry entry (stored in the GCS bucket `ist-health-hmis-21722-state`). It returns 409 if step 2 is
missing.

### 5. Give it an address (Firebase + GoDaddy)
1. Firebase console (as `praveen@irisstar.tech`) → project `ist-health-hmis-21722` → Hosting → **Add custom
   domain** → `alnoor.isthealth.irisstar.tech`.
2. GoDaddy → `irisstar.tech` → DNS → add **CNAME** `alnoor.isthealth` → `ist-health-hmis-21722.web.app`.
3. Back in Firebase click **Verify**; the certificate is issued in minutes to a few hours.
Firebase has no wildcard domains, so each hospital is added individually.

### 6. Hand over and verify
- The hospital admin signs in at `https://alnoor.isthealth.irisstar.tech` with the step-1 credentials, creates their
  own staff users in **Admin**, and rotates the initial password.
- Verify with synthetic data only (fake patients): login, one role-restricted action, and that the user cannot see
  another hospital's data. `scripts/test_tenant_isolation_live.py` exists for the cross-tenant check; review its
  target URL before running it.
- Password recovery is disabled until SMTP is configured: a forgotten admin password is reset by the operator.

## Suspending / offboarding
Platform → suspend only blocks logins; the database and data are untouched. Deleting a hospital's database is a
deliberate manual act on the VM, after the contract's retention period and a verified backup.

## Known limits
- Step 2 restarts the backend for every hospital.
- Provisioning is manual; the app cannot create databases itself from Cloud Run.
- One VM hosts every hospital's database: size it and test restores before adding clients.
