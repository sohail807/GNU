import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_sql(sql_text):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sudo -u postgres psql -d gnuhealth"
    ]
    proc = subprocess.run(cmd, input=sql_text, capture_output=True, text=True, timeout=30)
    return proc.stdout, proc.stderr

print("=== ALL MENUS UNDER HEALTH ===")
out, err = run_sql("""
WITH RECURSIVE menu_tree AS (
    SELECT id, name, parent, 1 as level, name::text as path
    FROM ir_ui_menu
    WHERE parent IS NULL AND name = 'Health'
    UNION ALL
    SELECT m.id, m.name, m.parent, mt.level + 1, mt.path || ' -> ' || m.name
    FROM ir_ui_menu m
    JOIN menu_tree mt ON m.parent = mt.id
)
SELECT level, path, id FROM menu_tree ORDER BY path;
""")
print(out)
