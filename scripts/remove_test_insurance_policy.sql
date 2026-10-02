-- Remove the test insurance policy created while re-testing TC-060 (patient insured by itself).
-- Policy id 9, number SELF-TEST-1, patient party "Rishma" insured by "Rishma". Created 2026-10-02 by an automated retest.
-- The app has no way to delete a policy, so this is done on the server. Preview first, then change ROLLBACK to COMMIT.
--
--   ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "sudo -u postgres psql -d gnuhealth" < scripts/remove_test_insurance_policy.sql

BEGIN;

-- Must show exactly one row: id 9, SELF-TEST-1.
SELECT id, number, patient, company FROM gnuhealth_insurance WHERE id = 9 AND number = 'SELF-TEST-1';

DELETE FROM gnuhealth_insurance WHERE id = 9 AND number = 'SELF-TEST-1';

-- Must be 0.
SELECT count(*) AS remaining FROM gnuhealth_insurance WHERE id = 9;

ROLLBACK;  -- change to COMMIT; to apply
