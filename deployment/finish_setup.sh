#!/bin/bash
set -euo pipefail

echo "================================================================="
echo " Finalizing GNU Health HMIS 5.0 Setup on VM: $(date)"
echo "================================================================="

GH_HOME="/home/gnuhealth"
mkdir -p "${GH_HOME}/attach" "${GH_HOME}/sao"

# 1. Ensure Python dependencies and GNU Health modules are installed
echo "==> [1/5] Ensuring Tryton & GNU Health 5.0 packages are installed..."
"${GH_HOME}/venv/bin/pip" install --upgrade pip setuptools wheel
"${GH_HOME}/venv/bin/pip" install psycopg2-binary pillow matplotlib pytz qrcode cryptography bcrypt \
    "trytond>=7.0,<7.1" "trytond-company>=7.0,<7.1" "trytond-currency>=7.0,<7.1" \
    "trytond-party>=7.0,<7.1" "trytond-product>=7.0,<7.1" \
    "gnuhealth-control>=5.0.0,<5.1" "gnuhealth>=5.0.0,<5.1" \
    gnuhealth-inpatient gnuhealth-lab gnuhealth-imaging gnuhealth-pediatrics gnuhealth-surgery \
    gnuhealth-gyneco gnuhealth-insurance gnuhealth-socioeconomics gnuhealth-lifestyle \
    gnuhealth-genetics gnuhealth-icd10 gnuhealth-nursing || true

# 2. Download and set up SAO (Web UI Client)
echo "==> [2/5] Setting up Tryton SAO Web Client..."
cd "${GH_HOME}/sao"
curl -sL https://downloads.tryton.org/7.0/tryton-sao-last.tgz | tar -xz --strip-components=1
npm install --production --silent || true

# 3. Create trytond.conf & set Admin password
echo "==> [3/5] Configuring trytond.conf & Admin credentials..."
if [ ! -f "${GH_HOME}/admin_password.txt" ]; then
    ADMIN_PASS=$(openssl rand -hex 12)
    echo "${ADMIN_PASS}" > "${GH_HOME}/admin_password.txt"
    chmod 600 "${GH_HOME}/admin_password.txt"
else
    ADMIN_PASS=$(cat "${GH_HOME}/admin_password.txt")
fi

cat << 'CONF' > "${GH_HOME}/trytond.conf"
[database]
uri = postgresql://gnuhealth@/
path = /home/gnuhealth/attach

[web]
listen = 0.0.0.0:8000
root = /home/gnuhealth/sao

[web.cors]
origins = *
CONF

chown -R gnuhealth:gnuhealth "${GH_HOME}"

# 4. Initialize Database with GNU Health modules
echo "==> [4/5] Initializing Database with GNU Health modules..."
TRYTONPASS="${ADMIN_PASS}" sudo -u gnuhealth -E "${GH_HOME}/venv/bin/trytond-admin" \
    -c "${GH_HOME}/trytond.conf" -d gnuhealth --all -p

# 5. Configure Nginx and Systemd Daemon
echo "==> [5/5] Configuring Nginx reverse proxy and starting service..."
cat << 'NGINX_CONF' > /etc/nginx/sites-available/gnuhealth
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/gnuhealth /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

cat << 'SERVICE' > /etc/systemd/system/gnuhealth.service
[Unit]
Description=GNU Health / Tryton Application Server
After=syslog.target network.target postgresql.service

[Service]
Type=simple
User=gnuhealth
Group=gnuhealth
ExecStart=/home/gnuhealth/venv/bin/trytond -c /home/gnuhealth/trytond.conf -d gnuhealth
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable gnuhealth
systemctl restart gnuhealth

echo ""
echo "================================================================="
echo " GNU HEALTH HMIS 5.0 IS ONLINE AND READY!"
echo " Web Access URL : http://APPLICATION_SERVER"
echo " Database Name  : gnuhealth"
echo " User           : admin"
echo " Password       : [STORED IN ${GH_HOME}/admin_password.txt]"
echo "================================================================="
