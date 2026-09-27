# Infrastructure configs — GCP VM (34.7.237.8)

Snapshot of the live configuration on `debian@34.7.237.8` (`gnuhealth-srv`, project
`gnu-health-509307`), pulled from the server on 2026-09-27. These files are **copies for
review and disaster recovery** — editing them here does not change the live server.
Deploy changes by editing the file on the VM directly (or scp-ing an updated copy over),
then re-running the matching command below.

## Topology

| Service | Port | Process manager | Database |
|---|---|---|---|
| nginx (production) | 80 (443 once TLS is set up) | systemd (`nginx.service`) | — |
| nginx (staging) | 8080, HTTP Basic Auth | same nginx instance, separate `server{}` block | — |
| Tryton/GNU Health backend (production) | 127.0.0.1:8000 | systemd (`gnuhealth.service`), gunicorn 4 workers | `gnuhealth` |
| Tryton/GNU Health backend (staging) | 127.0.0.1:8100 | systemd (`gnuhealth-staging.service`), gunicorn 2 workers | `gnuhealth_staging` |
| Next.js frontend (production) | 3000 | PM2 (`ist-health-frontend`) | — |
| Next.js frontend (staging) | 3100 | PM2 (`ist-health-frontend-staging`) | — |
| PostgreSQL 15 | 127.0.0.1:5432 | systemd (`postgresql@15-main`) | `gnuhealth`, `gnuhealth_staging` |

Both backends are `trytond.application:app` served via gunicorn — the built-in werkzeug
dev server ("do not use in production") was replaced with gunicorn during the September
2026 production-readiness pass.

## Directory contents

- `nginx/production.conf` → `/etc/nginx/sites-enabled/default` on the VM. Defines the
  rate-limit zones (`login_zone`, `api_zone`, `rpc_zone`, `conn_zone`) shared by both the
  production and staging server blocks, plus the production routing/security headers.
- `nginx/staging.conf` → `/etc/nginx/sites-enabled/staging`. HTTP Basic Auth gated
  (`auth_basic_user_file /etc/nginx/.htpasswd_staging` — that file is **not** in this repo,
  it's root-only on the VM).
- `systemd/gnuhealth.service` → `/etc/systemd/system/gnuhealth.service` (production backend).
- `systemd/gnuhealth-staging.service` → `/etc/systemd/system/gnuhealth-staging.service`.
- `systemd/gnuhealth-backup.{service,timer}` → daily 02:00 UTC backup job (pre-existing,
  not created this session — documented here for completeness).
- `scripts/gnuhealth-backup.sh` → `/usr/local/bin/gnuhealth-backup.sh`. Dumps `gnuhealth`
  (DB + attachments) locally with 14-day retention, then uploads to
  `gs://ist-health-backups-509307` (30-day GCS lifecycle) if
  `/etc/gcs/ist-health-backup-key.json` is present. That key file is **not** in this repo —
  it's a bucket-scoped service account key (`ist-health-backup@gnu-health-509307.iam.gserviceaccount.com`,
  `roles/storage.objectAdmin` on that one bucket only), root-only readable on the VM.
- `monitoring/ops-agent-config.yaml` → `/etc/google-cloud-ops-agent/config.yaml`. Ships
  syslog/journald, nginx access+error, PostgreSQL, and the backup job log to Cloud Logging;
  collects host metrics (CPU/mem/disk/network) every 60s to Cloud Monitoring.
- `pm2/ecosystem.*.config.js` → not deployed as files on the VM (the real processes were
  started with ad-hoc `pm2 start` commands); these documents let you reproduce the same
  PM2 processes if `~/.pm2/dump.pm2` is ever lost, run from the appropriate frontend
  directory.
- `env-templates/frontend.env.*.example` → templates only. Real `.env.production` files live at
  `/var/www/ist-health-frontend/.env.production` and
  `/var/www/ist-health-frontend-staging/.env.production` on the VM and are gitignored —
  never commit the real values (`SESSION_ENCRYPTION_KEY` in particular).

## Cloud Monitoring / alerting (not files — GCP resources, `gcloud` reference)

Created via `gcloud alpha monitoring` / `gcloud logging`, not represented as local config:

- Notification channel: email to the ops contact.
- Uptime check `ist-health-login-page` on `http://34.7.237.8/login`.
- Alert policies: Site Down, Core Service Crash (systemd unit failures via log-based metric
  `gnuhealth_service_failures`), High CPU (>90%/10min), Disk Usage High (>85%), Memory Usage
  High (>90%), Nightly Backup Failure (log-based metric `gnuhealth_backup_failures`).
- Log-based metrics: `gnuhealth_backup_failures`, `gnuhealth_service_failures`.

To inspect or modify these, use the Cloud Console (Monitoring → Alerting) or
`gcloud alpha monitoring policies list --project=gnu-health-509307`.

## Firewall

- OS-level: `ufw` — default-deny incoming, allows 22 (SSH), 80 (HTTP), 443 (HTTPS),
  8080 (staging).
- GCP VPC-level (separate layer, both must allow a port): `allow-gnuhealth-web`
  (tcp:80,443), `allow-gnuhealth-staging` (tcp:8080), plus the pre-existing
  `default-allow-ssh`/`default-allow-icmp`/`default-allow-rdp`.

## Known drift risk

These are point-in-time copies. If you change nginx/systemd/the backup script directly on
the VM, re-pull the file into this directory so the repo doesn't silently go stale. There
is no CI/CD wiring these back together automatically yet.

## Pending

TLS/HTTPS is not yet configured — `certbot` is installed and ready
(`sudo certbot --nginx -d yourdomain.com`) but blocked on the domain purchase. Once that's
done, `nginx/production.conf` here should be re-pulled (certbot rewrites it in place to add
the 443 server block and redirect).
