# Rollback Plan: GNU Health Qatar Outpatient Clinic Configuration

**Document:** `19_ROLLBACK_PLAN.md`  
**Scope:** Reversal and recovery strategy for GNU Health 5.0 configuration changes  
**Target:** Database `gnuhealth` on GCP Compute Engine (`34.7.237.8`)  
**Status:** `VERIFIED`

---

## 1. Rollback Objectives

1. Enable rapid restoration of pristine baseline state without clinical record corruption.
2. Provide granular rollback capabilities at both the Tryton ORM master-data level and the PostgreSQL database level.
3. Prevent unintended side-effects on the preloaded WHO ICD-10 ontologies (14,416 records), specialties (73 records), and diagnostic types.

---

## 2. Granular ORM Rollback (Non-Destructive)

Because all configuration actions are executed through the standard Tryton ORM / JSON-RPC interface, individual test records and placeholders can be safely archived or unlinked:

| Component | Rollback Action | Method |
| :--- | :--- | :--- |
| **Test Patient** (`TEST - Qatar Clinic Patient`) | Deactivate (`active = false`) or Delete | `model.gnuhealth.patient.delete([id])` |
| **Test Appointments / Vitals** | Unlink and delete child evaluations | `model.gnuhealth.appointment.delete([id])` |
| **Clinic Organization & Company** | Unlink health institution and deactivate company | `model.company.company.write([id], {'active': false})` |
| **Currencies & Countries** | Set `active = false` on `QAR` or `QA` | `model.currency.currency.write([id], {'active': false})` |
| **Outpatient Services Catalog** | Deactivate newly added clinic products | `model.product.product.write([ids], {'active': false})` |

---

## 3. Full Database Rollback (Disaster Recovery)

In the event of an unrecoverable model state or structural inconsistency:

1. **Host Connection**: Access `gnuhealth-srv` via GCP console or SSH.
2. **Stop Daemons**: Stop GNU Health Tryton service:
   ```bash
   sudo systemctl stop gnuhealth
   ```
3. **Re-initialize Database**:
   ```bash
   sudo -u postgres dropdb gnuhealth
   sudo -u postgres createdb -O gnuhealth -E UTF8 gnuhealth
   ```
4. **Re-apply Initial Setup**:
   Restore from the baseline dump:
   ```bash
   sudo -u postgres pg_restore -d gnuhealth /home/gnuhealth/backup_gnuhealth_preconfig_*.dump
   ```
   *Alternatively*, if re-running vanilla module initialization:
   ```bash
   sudo -u gnuhealth /home/gnuhealth/venv/bin/trytond-admin -c /home/gnuhealth/trytond.conf -d gnuhealth --all -p
   ```
5. **Start Daemons**:
   ```bash
   sudo systemctl start gnuhealth
   ```
6. **Health Check**: Verify `http://34.7.237.8` loads SAO login screen and `common.server.version` returns `7.0.57`.

---

## 4. Rollback Sign-Off & Verification

- Baseline pre-configuration snapshot verified.
- Rollback steps tested against Tryton 7.0 ORM constraints.
- No production patient records exist, ensuring zero risk of clinical data loss.
