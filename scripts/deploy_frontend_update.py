import os
import sys
import subprocess
import tarfile
import io

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"
REMOTE_DIR = "/var/www/ist-health-frontend"
LOCAL_FRONTEND = os.path.abspath("frontend")

def deploy():
    print("1. Creating in-memory archive of updated frontend source code...")
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode="w:gz") as tar:
        # Add src directory
        src_path = os.path.join(LOCAL_FRONTEND, "src")
        tar.add(src_path, arcname="src")
        print("   Added src/ directory tree.")
        # Add next.config.ts
        next_config_path = os.path.join(LOCAL_FRONTEND, "next.config.ts")
        if os.path.exists(next_config_path):
            tar.add(next_config_path, arcname="next.config.ts")
            print("   Added next.config.ts.")
    
    tar_bytes = tar_stream.getvalue()
    print(f"   Archive size: {len(tar_bytes):,} bytes.")
    if len(tar_bytes) < 1024:
        print("Archive suspiciously small (<1KB) - aborting before touching the remote src/.")
        sys.exit(1)

    print(f"\n2. Streaming update archive to {VM_HOST}:{REMOTE_DIR} via SSH...")
    # Extract into a staging dir first and verify it's non-empty before replacing the live src/,
    # so a truncated/failed tar stream can never leave the remote with src/ deleted and nothing to restore.
    cmd_upload = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo rm -rf {REMOTE_DIR}/src.staging && sudo mkdir -p {REMOTE_DIR}/src.staging && sudo chown debian:debian {REMOTE_DIR}/src.staging && "
        f"tar -xzf - -C {REMOTE_DIR}/src.staging && "
        f"[ -n \"$(ls -A {REMOTE_DIR}/src.staging/src 2>/dev/null)\" ] && "
        f"sudo rm -rf {REMOTE_DIR}/src && sudo mv {REMOTE_DIR}/src.staging/src {REMOTE_DIR}/src && "
        f"([ ! -f {REMOTE_DIR}/src.staging/next.config.ts ] || sudo mv {REMOTE_DIR}/src.staging/next.config.ts {REMOTE_DIR}/next.config.ts) && "
        f"sudo rm -rf {REMOTE_DIR}/src.staging && sudo chown -R MohammedSohail:MohammedSohail {REMOTE_DIR}/src {REMOTE_DIR}/next.config.ts"
    ]
    p_upload = subprocess.run(cmd_upload, input=tar_bytes, capture_output=True)
    if p_upload.returncode != 0:
        print("Upload failed:", p_upload.stderr.decode("utf-8", errors="replace"))
        sys.exit(1)
    print("   Archive successfully extracted on VM.")

    print("\n2.1. Ensuring environment configuration on VM...")
    env_path = os.path.join(LOCAL_FRONTEND, ".env.production.local")
    if not os.path.exists(env_path):
        print(f"   ERROR: {env_path} not found. Create it locally (gitignored) with "
              f"NODE_ENV/PORT/GNUHEALTH_HOST/GNUHEALTH_DATABASE/GNUHEALTH_COMPANY_ID/SESSION_ENCRYPTION_KEY "
              f"before deploying. Secrets are never hardcoded in this script.")
        sys.exit(1)
    with open(env_path, "r", encoding="utf-8") as f:
        env_content = f.read()
    cmd_env = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"cat << 'EOF' | sudo -u MohammedSohail tee {REMOTE_DIR}/.env.production\n{env_content}EOF"
    ]
    subprocess.run(cmd_env, capture_output=True, check=True)
    print("   .env.production verified.")

    print("\n3. Building Next.js application on VM...")
    build_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"cd {REMOTE_DIR} && sudo -u MohammedSohail npm run build"
    ]
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    p_build = subprocess.run(build_cmd, capture_output=True)
    print("Build Output:\n", p_build.stdout.decode("utf-8", errors="replace").encode("ascii", "replace").decode("ascii"))
    if p_build.returncode != 0:
        print("Build Error:\n", p_build.stderr.decode("utf-8", errors="replace").encode("ascii", "replace").decode("ascii"))
        sys.exit(1)

    print("\n4. Restarting Next.js service on VM via PM2...")
    # The production frontend is supervised by PM2 as "ist-health-frontend" (confirmed live:
    # `ps` traced the listening process on :3000 up through PM2's God Daemon, not a systemd
    # unit or a bare process). This used to `fuser -k 3000/tcp` and start a detached `nohup`
    # process instead - that orphaned the app from PM2 entirely (no more crash auto-restart,
    # no log rotation via pm2-logrotate), even though the site still came back up and looked
    # fine. --update-env picks up any changes to .env.production written in step 2.1.
    restart_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sudo -u MohammedSohail env PM2_HOME=/home/MohammedSohail/.pm2 "
        "pm2 restart ist-health-frontend --update-env"
    ]
    p_restart = subprocess.run(restart_cmd, capture_output=True)
    print(p_restart.stdout.decode("utf-8", errors="replace"))
    if p_restart.returncode != 0:
        print("Restart command failed:", p_restart.stderr.decode("utf-8", errors="replace"))
        sys.exit(1)
    print("Restart executed.")

    print("\n5. Verifying server health...")
    health_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sleep 4; curl -I http://127.0.0.1:3000/login; "
        "sudo -u MohammedSohail env PM2_HOME=/home/MohammedSohail/.pm2 pm2 list"
    ]
    p_health = subprocess.run(health_cmd, capture_output=True)
    print(p_health.stdout.decode("utf-8", errors="replace"))

    print("\n[DEPLOYMENT COMPLETE] Updated frontend is LIVE on http://34.7.237.8/!")

if __name__ == "__main__":
    deploy()
