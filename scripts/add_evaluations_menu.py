import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

migration_sql = """
BEGIN;

-- 1. Create action
INSERT INTO ir_action (id, create_uid, create_date, write_uid, write_date, name, type)
VALUES (
    nextval('ir_action_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    'Patient Evaluations',
    'ir.action.act_window'
);

-- 2. Create act_window
INSERT INTO ir_action_act_window (id, create_uid, create_date, write_uid, write_date, action, res_model, "limit", "order", context)
VALUES (
    currval('ir_action_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    currval('ir_action_id_seq'),
    'gnuhealth.patient.evaluation',
    80,
    NULL,
    '{}'
);

-- 3. Attach tree and form views
INSERT INTO ir_action_act_window_view (id, create_uid, create_date, write_uid, write_date, sequence, view, act_window)
VALUES (
    nextval('ir_action_act_window_view_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    10, 418, currval('ir_action_id_seq')
);

INSERT INTO ir_action_act_window_view (id, create_uid, create_date, write_uid, write_date, sequence, view, act_window)
VALUES (
    nextval('ir_action_act_window_view_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    20, 417, currval('ir_action_id_seq')
);

-- 4. Create Menu item under Health (135)
INSERT INTO ir_ui_menu (id, create_uid, create_date, write_uid, write_date, name, sequence, parent, active, icon)
VALUES (
    nextval('ir_ui_menu_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    'Patient Evaluations',
    25,
    135,
    true,
    'gnuhealth-nurse'
);

-- 5. Link menu to action via ir_action_keyword
INSERT INTO ir_action_keyword (id, create_uid, create_date, write_uid, write_date, keyword, model, action)
VALUES (
    nextval('ir_action_keyword_id_seq'),
    1, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP,
    'tree_open',
    'ir.ui.menu,' || currval('ir_ui_menu_id_seq'),
    currval('ir_action_id_seq')
);

-- 6. Grant menu access to Health groups (11: Admin, 12: Nurse Admin, 13: Nurse, 15: Doctor)
INSERT INTO "ir_ui_menu-res_group" ("menu", "group") VALUES (currval('ir_ui_menu_id_seq'), 11);
INSERT INTO "ir_ui_menu-res_group" ("menu", "group") VALUES (currval('ir_ui_menu_id_seq'), 12);
INSERT INTO "ir_ui_menu-res_group" ("menu", "group") VALUES (currval('ir_ui_menu_id_seq'), 13);
INSERT INTO "ir_ui_menu-res_group" ("menu", "group") VALUES (currval('ir_ui_menu_id_seq'), 15);

COMMIT;
"""

cmd = ['ssh', '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', VM_HOST, 'sudo -u postgres psql -d gnuhealth']
proc = subprocess.run(cmd, input=migration_sql, capture_output=True, text=True)
print("STDOUT:", proc.stdout)
print("STDERR:", proc.stderr)
