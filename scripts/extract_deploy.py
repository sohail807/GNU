import os
import tarfile

tar_path = "/var/www/ist-health-frontend/frontend-deploy.tar.gz"
dest_path = "/var/www/ist-health-frontend"

with tarfile.open(tar_path, "r:gz") as t:
    for m in t.getmembers():
        m.mode = 0o755 if m.isdir() else 0o644
        t.extract(m, dest_path)

print("Extracted successfully!")
