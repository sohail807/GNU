import subprocess

ssh_key = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
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

    # Next.js Immutable Static Chunks
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # IST Health Enterprise Frontend Application (No-Cache on HTML pages to ensure instantaneous updates)
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

        # Always serve fresh HTML pages and dynamic application routes
        proxy_hide_header Cache-Control;
        proxy_ignore_headers Cache-Control;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
}
"""

cmd_write = [
    "ssh", "-i", ssh_key, "-o", "StrictHostKeyChecking=no", "debian@34.7.237.8",
    "sudo tee /etc/nginx/sites-available/gnuhealth > /dev/null && sudo nginx -t && sudo systemctl reload nginx"
]

p = subprocess.run(cmd_write, input=nginx_conf, capture_output=True, text=True)
print("Return code:", p.returncode)
print("Stdout:", p.stdout)
print("Stderr:", p.stderr)
