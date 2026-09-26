import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

def run_ssh(cmd_str):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return proc.stdout + "\n" + proc.stderr

def run_sql(database, sql):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo -u postgres psql -d {database}"
    ]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True, timeout=30)
    return proc.stdout + "\n" + proc.stderr

print("=== 1. Fix PostgreSQL permissions for gnuhealth_test_alpha and gnuhealth_test_beta ===")
sql_fix = """
REASSIGN OWNED BY postgres TO gnuhealth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gnuhealth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gnuhealth;
GRANT ALL ON ALL TABLES IN SCHEMA public TO gnuhealth;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gnuhealth;
"""
print("Fixing gnuhealth_test_alpha permissions:")
print(run_sql("gnuhealth_test_alpha", sql_fix))

print("Fixing gnuhealth_test_beta permissions:")
print(run_sql("gnuhealth_test_beta", sql_fix))

print("=== 2. Deploy updated Nginx config to /etc/nginx/sites-available/gnuhealth ===")
nginx_conf = """server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;
    server_tokens off;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Authoritative Tryton / GNU Health multi-tenant routing (supports any database)
    location ~ ^/(gnuhealth[a-z0-9_]*)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # IST Health Enterprise Frontend Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
"""

cmd = f"cat << 'EOF' | sudo tee /etc/nginx/sites-available/gnuhealth > /dev/null\n{nginx_conf}\nEOF\n"
print(run_ssh(cmd))
print(run_ssh("sudo nginx -t && sudo systemctl reload nginx"))
