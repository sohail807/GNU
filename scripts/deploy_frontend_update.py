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
    
    tar_bytes = tar_stream.getvalue()
    print(f"   Archive size: {len(tar_bytes):,} bytes.")

    print(f"\n2. Streaming update archive to {VM_HOST}:{REMOTE_DIR} via SSH...")
    cmd_upload = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo rm -rf {REMOTE_DIR}/src && sudo tar -xzf - -C {REMOTE_DIR} && sudo chown -R MohammedSohail:MohammedSohail {REMOTE_DIR}/src"
    ]
    p_upload = subprocess.run(cmd_upload, input=tar_bytes, capture_output=True)
    if p_upload.returncode != 0:
        print("Upload failed:", p_upload.stderr.decode("utf-8", errors="replace"))
        sys.exit(1)
    print("   Archive successfully extracted on VM.")

    print("\n2.1. Ensuring environment configuration on VM...")
    env_content = (
        "NODE_ENV=production\n"
        "PORT=3000\n"
        "GNUHEALTH_HOST=http://127.0.0.1:8000\n"
        "GNUHEALTH_DATABASE=gnuhealth\n"
        "GNUHEALTH_COMPANY_ID=2\n"
        "SESSION_ENCRYPTION_KEY=d7a96ef8b4382e753acbd2217c09c488319f3e4bc392815a\n"
    )
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

    print("\n4. Restarting Next.js service on VM...")
    restart_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo fuser -k 3000/tcp || true; sleep 2; cd {REMOTE_DIR} && sudo -u MohammedSohail nohup npm run start -- --port 3000 --hostname 127.0.0.1 > /tmp/next-server.log 2>&1 &"
    ]
    p_restart = subprocess.run(restart_cmd, capture_output=True)
    print("Restart executed.")

    print("\n5. Verifying server health...")
    health_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        "sleep 4; curl -I http://127.0.0.1:3000/login; sudo ss -tulpn | grep 3000"
    ]
    p_health = subprocess.run(health_cmd, capture_output=True)
    print(p_health.stdout.decode("utf-8", errors="replace"))

    print("\n[DEPLOYMENT COMPLETE] Updated frontend is LIVE on http://34.7.237.8/!")

if __name__ == "__main__":
    deploy()
