-- ENDOCRINOLOGY panel: mark the analyte reference limits as clinically verified, AFTER the lab director has reviewed them.
--
-- WHY THIS EXISTS: four of the five analytes (FSH, LH, PROLACTIN, TESTOSTERONE) carry limits that fold several
-- phase- or sex-specific ranges into one lower/upper pair (for example FSH 2-151 spans follicular to post-menopausal),
-- so the system refuses to accept results against them until a clinician confirms them. Marking them verified is a
-- CLINICAL decision. This script does not make it: it only records yours.
--
-- HOW TO USE
--   1) Run it as shipped (it ends with ROLLBACK). Read the table of current limits.
--   2) If the lab director wants different limits, edit the VALUES below (lower, upper) to the approved numbers.
--   3) Change the final ROLLBACK; to COMMIT; and run it again.
--
--   $sql = Get-Content -Raw scripts/verify_endocrinology_limits.sql
--   $sql | ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "sudo -u postgres psql -d gnuhealth"

BEGIN;

\echo '== Current ENDOCRINOLOGY analytes (template rows, not patient results) =='
select c.id, c.name, c.lower_limit, c.upper_limit, c.limits_verified, c.normal_range
from gnuhealth_lab_test_critearea c
join gnuhealth_lab_test_type t on t.id = c.test_type_id
where t.name = 'ENDOCRINOLOGY'
order by c.sequence, c.id;

-- Edit these approved limits before committing. The numbers below are the CURRENT values, shown only as a starting
-- point: they are NOT approved by anyone until your lab director signs them off.
with approved(name, lower_limit, upper_limit) as (
    values ('FSH', 2, 151), ('LH', 0.8, 40.8), ('PROLACTIN', 1.2, 19.5), ('TESTOSTERONE', 0, 0.6)
)
update gnuhealth_lab_test_critearea c
set lower_limit = a.lower_limit, upper_limit = a.upper_limit, limits_verified = true
from approved a, gnuhealth_lab_test_type t
where t.id = c.test_type_id and t.name = 'ENDOCRINOLOGY' and c.name = a.name;

\echo '== After =='
select c.id, c.name, c.lower_limit, c.upper_limit, c.limits_verified
from gnuhealth_lab_test_critearea c
join gnuhealth_lab_test_type t on t.id = c.test_type_id
where t.name = 'ENDOCRINOLOGY'
order by c.sequence, c.id;

ROLLBACK;  -- change to COMMIT; once the lab director has approved the limits
