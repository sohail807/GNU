import os
import re
import json

WORKSPACE = r"c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health"

TODO_PATTERN = re.compile(r'\b(TODO|FIXME|XXX|HACK|TEMPORARY)\b', re.IGNORECASE)
SECRET_PATTERNS = [
    ("Private Key", re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')),
    ("AWS Key", re.compile(r'(AKIA[0-9A-Z]{16})')),
    ("Generic Secret Assignment", re.compile(r'(api_key|secret_key|private_key)\s*=\s*[\'"][^\'"]{8,}[\'"]', re.IGNORECASE)),
    ("Hardcoded Password Assignment", re.compile(r'(password|passwd|pwd)\s*=\s*[\'"][^\'"]{6,}[\'"]', re.IGNORECASE)),
]

IGNORE_DIRS = {'.git', '__pycache__', 'node_modules', '.vscode', '.idea'}
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.docx', '.pptx', '.xlsx', '.dump', '.tar.gz', '.gz', '.zip'}

def scan():
    print("=== STARTING REPOSITORY FORENSIC & SECURITY SCAN ===")
    todos = []
    secrets = []
    scanned_files = 0

    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in IGNORE_EXTS:
                continue
            path = os.path.join(root, f)
            rel_path = os.path.relpath(path, WORKSPACE)
            scanned_files += 1

            try:
                with open(path, 'r', encoding='utf-8', errors='replace') as file_obj:
                    for line_num, line in enumerate(file_obj, 1):
                        # 1. Scan for TODO/FIXME
                        m_todo = TODO_PATTERN.search(line)
                        if m_todo:
                            todos.append({
                                "file": rel_path,
                                "line": line_num,
                                "match": m_todo.group(0),
                                "snippet": line.strip()[:100]
                            })

                        # 2. Scan for Secrets
                        for stype, spat in SECRET_PATTERNS:
                            m_sec = spat.search(line)
                            if m_sec:
                                # Redact the actual secret in reporting
                                secrets.append({
                                    "file": rel_path,
                                    "line": line_num,
                                    "type": stype,
                                    "match_redacted": "[REDACTED_SECRET_OCCURRENCE]"
                                })
            except Exception as e:
                pass

    out_dir = os.path.join("reports", "final_backend_audit")
    os.makedirs(out_dir, exist_ok=True)
    scan_results = {
        "scanned_files_count": scanned_files,
        "todo_count": len(todos),
        "todos": todos,
        "secret_findings_count": len(secrets),
        "secret_findings": secrets
    }
    with open(os.path.join(out_dir, "forensic_scan_results.json"), "w") as out:
        json.dump(scan_results, out, indent=2)

    print(f"Scanned {scanned_files} files.")
    print(f"Found {len(todos)} TODO/FIXME occurrences.")
    print(f"Found {len(secrets)} potential credential/secret patterns in test/scripts.")
    print("Results saved to reports/final_backend_audit/forensic_scan_results.json")

if __name__ == "__main__":
    scan()
