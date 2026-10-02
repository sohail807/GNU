-- Hide obviously synthetic test patients from the Qatar Central Campus database (gnuhealth) WITHOUT deleting anything.
--
-- Hiding = marking the patient's party inactive, so the patient pickers stop offering them. Every clinical record,
-- invoice and ledger move stays in the database and can be shown again by setting active back to true.
--
-- Kept on purpose (used by the demo): ALEXANDER WRIGHT (ids 81, 83) and DEMO PATIENT 001/002/003 (ids 52, 53, 54).
-- Not touched: every real-looking name (Sanjay, Liora, Tasmiya Shaik, Farida, Rishma, Flori, MSS, MS, Shayana, MATHEW,
-- AHMED AL-MANSOORI). Add them yourself only if you confirm they are test records.
--
-- Run from your terminal in TWO steps. Step 1 only reads. Step 2 changes data inside a transaction you confirm.
--   1) preview:  ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "sudo -u postgres psql -d gnuhealth" < scripts/hide_test_patients.sql   (with the COMMIT line left as ROLLBACK, as shipped)
--   2) apply:    change the final ROLLBACK; to COMMIT; and run the same command again.

BEGIN;

CREATE TEMP TABLE test_patients AS
SELECT p.id AS patient_id, p.party AS party_id, pa.name
FROM gnuhealth_patient p
JOIN party_party pa ON pa.id = p.party
WHERE p.id IN (
    58, 59, 60, 61, 62, 63, 64, 65, 66,        -- FINAL-VALIDATION-DEMO, FE-UAT, E2E-CERT, E2E-CERT-FINAL, LIVE E2E TEST
    76, 78, 79, 80,                            -- DEMO CERTIFICATION PATIENT, TEST QA PATIENT, HAMAD AL-KUWARI (QA AUTO) x2
    84, 85, 86, 87, 88, 89, 90, 91, 92,        -- ALEXANDER WRIGHT ACCEPTANCE ... and Alexander Wright E2E Cert
    93, 94, 95, 96, 97, 98, 99, 100,           -- ALEXANDER WRIGHT ACCEPTANCE ...
    107, 109,                                  -- Workflow Chain Test Patient, Workflow Chain Test Patient Two
    114, 117                                   -- QA RETEST PATIENT ONE / TWO (created during the 2026-10-02 retest)
)
-- Priya Allergytest: registered while testing a front desk allergy field that was later removed (matched by her
-- synthetic national ID because her patient id was not recorded).
OR pa.ref = '29900000123';

-- What is about to be hidden. Read this list before applying.
SELECT patient_id, party_id, name FROM test_patients ORDER BY patient_id;

-- Safety check: nothing real-looking is in the list.
SELECT 'UNEXPECTED NAME' AS warning, name FROM test_patients
WHERE name !~* '(ALEXANDER WRIGHT|E2E|QA|TEST|DEMO|FE-UAT|WORKFLOW CHAIN|FINAL-VALIDATION|ALLERGYTEST)';

UPDATE party_party SET active = false WHERE id IN (SELECT party_id FROM test_patients);

-- Junk left by an over-long input test: a patient whose national ID or name is absurdly long (for example "A" with a
-- 100,000-character ID) stretches every patient dropdown. Preview first; these are hidden, not deleted.
SELECT pa.id AS party_id, left(pa.name, 40) AS name, length(pa.ref) AS ref_length FROM party_party pa
WHERE pa.is_patient AND (length(pa.ref) > 64 OR length(pa.name) > 200);
UPDATE party_party SET active = false WHERE is_patient AND (length(ref) > 64 OR length(name) > 200);

SELECT count(*) AS hidden_patients FROM party_party WHERE id IN (SELECT party_id FROM test_patients) AND active = false;

ROLLBACK;  -- change to COMMIT; for step 2
