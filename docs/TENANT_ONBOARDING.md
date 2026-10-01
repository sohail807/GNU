# Onboarding a hospital (tenant)

Each hospital gets **its own Tryton/PostgreSQL database** (patient data is isolated by database) and a
**hospital code**. Everyone signs in at one address, `https://isthealth.irisstar.tech`, typing their hospital code
(blank = the default hospital, IST Central). No DNS, domain or server change is needed per hospital.

## Onboard a hospital (about a minute)
1. Sign in as a platform super-admin (`SUPER_ADMIN_USERNAMES`, currently `irisstar_admin`) and open **Platform**.
2. **Add hospital**: name, hospital code, currency (ISO), country (ISO). Code rules: 2-24 lowercase letters/digits,
   not a reserved word (`central, admin, api, www, platform, staging, template, gnuhealth, default`).
3. The app asks the provisioning service on the database VM to clone the clean template into
   `gnuhealth_h_<code>`, registers the hospital and shows the hospital's **first admin login once**. Hand it over
   through an approved secure channel; never paste it in chat, tickets or git.
4. Tell the hospital: address `https://isthealth.irisstar.tech`, hospital code `<code>`, their admin username and
   password. They create their own staff in **Admin**, rename the company and set currency/fiscal data in Tryton
   (the clone is named "New Hospital (Rename Me)", USD), and rotate the initial password.
5. Backups: the nightly job discovers every `gnuhealth_h_*` database automatically. Nothing to do.

Sign-in details: a wrong, unknown, malformed or suspended hospital code fails with the same generic message as a wrong
password, so hospitals cannot be enumerated. Failed attempts are throttled per hospital + username and per IP.
Optional: a hospital subdomain (`<code>.isthealth.irisstar.tech`, Firebase custom domain + GoDaddy CNAME) still works
and locks the page to that hospital, but it is not required.

## How it works
- `frontend/src/app/api/auth/login/route.ts` picks the hospital from the visited subdomain, else the typed code, else
  the default; the registry (`tenants-registry.json` in the state bucket) maps code -> database.
- `frontend/src/app/api/platform/tenants/route.ts` calls `PROVISIONER_URL` with `PROVISIONER_TOKEN` (Secret Manager
  `ist-provisioner-token`). Fallbacks: `TENANT_PROVISIONING=manual` (operator-created database, app only verifies it),
  or the legacy local script.
- `deploy/infra/provisioner/ist-provisioner.py` (VM, 127.0.0.1:8200, behind nginx `POST /_provision` with TLS,
  a 1 KB body limit and rate limiting): bearer-token (constant-time compare), accepts only a hospital code, runs the
  single whitelisted `ist-provision-tenant.sh` (sudoers rule `/etc/sudoers.d/ist-tenant-provisioning`), one at a time,
  returns the admin password once and never logs it.
- nginx exposes only the main database and `gnuhealth_h_<code>` databases to the internet; test, staging and template
  databases in the same PostgreSQL cluster are not routable.

## One-time setup on the VM (operator)
Copy `deploy/infra` files and a token file to the VM and run the installer (idempotent, rolls back on failure):
```bash
sudo bash install.sh <dir with provisioner/ nginx/ scripts/> <token file>   # token = value of secret ist-provisioner-token
```
It installs the service, updates nginx, installs the discovery-based backup script, and removes the backend's
`TRYTOND_DATABASE_NAMES` allow-list (one backend restart of a few seconds, auto-rolled-back if the backend does not
recover). **Security note:** after this, the allow-list is replaced by nginx's name pattern as the gate. That is the
price of restart-free onboarding; review it before enabling. To go back, restore the previous
`/etc/systemd/system/gnuhealth.service.d/databases.conf` (kept in `/root/ist-install-backup-*`) and restart.

## Suspending / offboarding
Platform -> suspend only blocks sign-in; the database and data stay. Deleting a hospital database is a deliberate
manual act on the VM, after the contract's retention period and a verified backup.

## Verification checklist (synthetic data only)
Sign in with the right code; blank/wrong code is rejected with the generic message; the hospital's admin sees only its
own users and 0 foreign patients; the nightly backup contains `gnuhealth_tenant_gnuhealth_h_<code>_*.dump`; restore
that dump into a scratch database and compare tables/rows (done 2026-10-01 for the first test hospital: 306/306 tables).
`scripts/test_tenant_isolation_live.py` exists for a cross-tenant check; review its target URL first.

## Known limits
- Password recovery is disabled until SMTP exists: a forgotten hospital-admin password is reset by an operator.
- One VM hosts every hospital's database: size it and keep testing restores as you add clients.

## Verified on the live system (2026-10-01, synthetic `demohospital`)
Created through the provisioning service (HTTP 200); the database became routable with **no backend restart**; a repeat of
the same code is refused (409); sign-in works only with the right hospital code (blank/wrong/old codes get the same generic
401); the hospital's admin sees only its own user and 0 foreign patients; the nightly backup picked the database up
automatically and uploaded it off-site; a restore of that dump matched the source (306/306 tables, same users).

Lessons from the first run, now fixed: the service unit must use `ProtectHome=read-only` (the script runs
`/home/gnuhealth/venv/bin/trytond-admin`; `true` hides /home and provisioning fails), and `ist-provision-tenant.sh` now drops
the database again (`dropdb --force`) if any step after creation fails, because a half-built database still carries the
template's default admin password.

