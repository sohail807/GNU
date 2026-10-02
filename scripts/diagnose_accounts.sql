-- READ ONLY. Lists what the advance-posting fix needs to know about the Qatar Central Campus books (database gnuhealth).
-- Nothing here changes data.
--
--   $sql = Get-Content -Raw scripts/diagnose_accounts.sql
--   $sql | ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "sudo -u postgres psql -d gnuhealth"

\echo '== 1. Accounts (code, name, kind) for the active company =='
select a.id, a.code, a.name, t.name as type_name, a.company
from account_account a left join account_account_type t on t.id = a.type
where a.code is not null
order by a.code;

\echo '== 2. Payment methods (cash/bank) with their journal and accounts =='
select m.id, m.name, m.company, j.name as journal, ca.code as credit_account, da.code as debit_account
from account_invoice_payment_method m
left join account_journal j on j.id = m.journal
left join account_account ca on ca.id = m.credit_account
left join account_account da on da.id = m.debit_account
order by m.id;

\echo '== 3. Journals =='
select id, name, code, type from account_journal order by id;

\echo '== 4. Fiscal year and open periods =='
select p.id, p.name, p.start_date, p.end_date, p.state from account_period p where p.type = 'standard' order by p.start_date desc limit 5;
