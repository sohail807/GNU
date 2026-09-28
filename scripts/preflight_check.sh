#!/bin/bash
set -e
echo '=== SYSTEM IDENTITY ==='
hostname && uname -a && uptime

echo '=== SYSTEMD SERVICES STATUS ==='
systemctl is-active postgresql gnuhealth nginx gnuhealth-backup.timer

echo '=== SYSTEMD BACKUP TIMER DETAILS ==='
systemctl status gnuhealth-backup.timer --no-pager

echo '=== LISTENING SOCKETS ==='
ss -tulpn | grep -E ':(22|80|443|8000|5432) '

echo '=== POSTGRESQL LISTEN AND HBA ==='
sudo -u postgres psql -d gnuhealth -t -c 'SHOW listen_addresses;'
sudo grep -E -v '^(#|$)' /etc/postgresql/15/main/pg_hba.conf

echo '=== CENSUS AUDIT ==='
sudo -u postgres psql -d gnuhealth -t -c '
SELECT '\''patients'\'', count(*) FROM gnuhealth_patient
UNION ALL SELECT '\''parties'\'', count(*) FROM party_party
UNION ALL SELECT '\''appointments'\'', count(*) FROM gnuhealth_appointment
UNION ALL SELECT '\''evaluations'\'', count(*) FROM gnuhealth_patient_evaluation
UNION ALL SELECT '\''prescriptions'\'', count(*) FROM gnuhealth_prescription_order
UNION ALL SELECT '\''prescription_lines'\'', count(*) FROM gnuhealth_prescription_line
UNION ALL SELECT '\''lab_requests'\'', count(*) FROM gnuhealth_patient_lab_test
UNION ALL SELECT '\''lab_results'\'', count(*) FROM gnuhealth_lab
UNION ALL SELECT '\''imaging_requests'\'', count(*) FROM gnuhealth_imaging_test_request
UNION ALL SELECT '\''imaging_results'\'', count(*) FROM gnuhealth_imaging_test_result
UNION ALL SELECT '\''health_services'\'', count(*) FROM gnuhealth_health_service
UNION ALL SELECT '\''invoices'\'', count(*) FROM account_invoice
UNION ALL SELECT '\''invoice_lines'\'', count(*) FROM account_invoice_line
UNION ALL SELECT '\''moves'\'', count(*) FROM account_move
UNION ALL SELECT '\''move_lines'\'', count(*) FROM account_move_line
UNION ALL SELECT '\''reconciliations'\'', count(*) FROM account_move_reconciliation
UNION ALL SELECT '\''qid_identifiers'\'', count(*) FROM party_identifier WHERE type = '\''qid'\''
UNION ALL SELECT '\''users'\'', count(*) FROM res_user
UNION ALL SELECT '\''health_professionals'\'', count(*) FROM gnuhealth_healthprofessional;
'
