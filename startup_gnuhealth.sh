#!/bin/bash
set -euo pipefail
exec > >(tee -a /var/log/gnuhealth_install.log) 2>&1

echo "================================================================="
echo " Starting GNU Health HMIS 5.0 Provisioning: $(date)"
echo "================================================================="

echo "==> [1/5] Installing Prerequisites..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y postgresql postgresql-contrib python3-venv python3-pip python3-dev \
    libxml2-dev libxslt1-dev libpq-dev libldap2-dev libsasl2-dev build-essential pkg-config \
    libgeos-dev libjpeg-dev zlib1g-dev poppler-utils graphviz git curl wget unzip nginx nodejs npm

echo "==> [2/5] Configuring PostgreSQL..."
systemctl enable postgresql && systemctl start postgresql
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='gnuhealth'" | grep -q 1 || \
    sudo -u postgres createuser --createdb gnuhealth
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='gnuhealth'" | grep -q 1 || \
    sudo -u postgres createdb -O gnuhealth -E UTF8 gnuhealth

echo "==> [3/5] Setting up GNU Health 5.0 & Tryton 7.0 Stack..."
id -u gnuhealth &>/dev/null || useradd -m -s /bin/bash gnuhealth
GH_HOME="/home/gnuhealth"
mkdir -p "${GH_HOME}/etc" "${GH_HOME}/attach" "${GH_HOME}/sao"
python3 -m venv "${GH_HOME}/venv"
"${GH_HOME}/venv/bin/pip" install --upgrade pip setuptools wheel
"${GH_HOME}/venv/bin/pip" install psycopg2-binary pillow matplotlib pytz qrcode cryptography bcrypt \
    "trytond>=7.0,<7.1" "trytond-company>=7.0,<7.1" "trytond-currency>=7.0,<7.1" \
    "trytond-party>=7.0,<7.1" "trytond-product>=7.0,<7.1" \
    "gnuhealth-control>=5.0.0,<5.1" "gnuhealth>=5.0.0,<5.1" \
    gnuhealth-inpatient gnuhealth-lab gnuhealth-imaging gnuhealth-pediatrics gnuhealth-surgery \
    gnuhealth-gyneco gnuhealth-insurance gnuhealth-socioeconomics gnuhealth-lifestyle \
    gnuhealth-genetics gnuhealth-icd10 gnuhealth-nursing || true

echo "==> [4/5] Setting up SAO Web Client & Initializing DB..."
cd "${GH_HOME}/sao"
curl -sL https://downloads.tryton.org/7.0/tryton-sao-last.tgz | tar -xz --strip-components=1
npm install --production --silent || true

ADMIN_PASS=$(openssl rand -hex 12)
echo "${ADMIN_PASS}" > "${GH_HOME}/admin_password.txt"
chmod 600 "${GH_HOME}/admin_password.txt"

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
TRYTONPASS="${ADMIN_PASS}" sudo -u gnuhealth -E "${GH_HOME}/venv/bin/trytond-admin" \
    -c "${GH_HOME}/trytond.conf" -d gnuhealth --all -p

echo "==> [5/5] Configuring Nginx & Systemd Service..."
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
systemctl start gnuhealth
echo "================================================================="
echo " GNU Health HMIS 5.0 is online! Admin Password: ${ADMIN_PASS}"
echo "================================================================="
