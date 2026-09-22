#!/usr/bin/env bash
# ==============================================================================
# GNU Health HMIS 5.0 Automated Cloud Deployment on Google Cloud Platform (GCP)
# Project: gnu-health-509307
# Optimized for Dubai (GMT +4): Cheapest Tier 1 Pricing + Low Latency (europe-west4)
# Reference: https://docs.gnuhealth.org/his/techguide/installation/vanilla.html
# ==============================================================================

set -euo pipefail

PROJECT_ID="gnu-health-509307"
# europe-west4 (Eemshaven) is in the lowest pricing tier on GCP (Tier 1)
# and offers fast low-latency direct connectivity (~85-95ms) to Dubai / UAE.
REGION="europe-west4"
ZONE="europe-west4-a"
INSTANCE_NAME="gnuhealth-srv"
MACHINE_TYPE="e2-standard-2"   # 2 vCPUs, 8 GB RAM (Optimal for HIS 5.0 + PostgreSQL)
DISK_SIZE="50GB"

echo "========================================================================="
echo " Starting GNU Health 5.0 Deployment on GCP Project: ${PROJECT_ID}"
echo " Region: ${ZONE} (Cheapest Tier 1 pricing with low latency to Dubai)"
echo "========================================================================="

# 1. Set Active Project
gcloud config set project "${PROJECT_ID}"

# 2. Enable Required GCP APIs
echo "--> [1/4] Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com

# 3. Create VPC Firewall Rules for Web Access (Port 80 HTTP, 443 HTTPS, 8000 Trytond)
echo "--> [2/4] Configuring Firewall Rules for HTTP/HTTPS..."
if ! gcloud compute firewall-rules describe allow-gnuhealth-web --project="${PROJECT_ID}" &>/dev/null; then
    gcloud compute firewall-rules create allow-gnuhealth-web \
        --project="${PROJECT_ID}" \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:80,tcp:443,tcp:8000 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=gnuhealth-server \
        --description="Allow HTTP, HTTPS, and Trytond web traffic for GNU Health HMIS"
    echo "--> Firewall rule 'allow-gnuhealth-web' created."
else
    echo "--> Firewall rule 'allow-gnuhealth-web' already exists."
fi

# 4. Generate VM Startup Script for Debian 12 (Bookworm)
cat << 'EOF' > /tmp/startup_gnuhealth.sh
#!/bin/bash
set -euo pipefail

LOG_FILE="/var/log/gnuhealth_install.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "================================================================="
echo " Starting GNU Health HMIS 5.0 Provisioning: $(date)"
echo "================================================================="

echo "==> [1/6] Installing System Dependencies & PostgreSQL..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
    postgresql postgresql-contrib \
    python3-venv python3-pip python3-dev \
    libxml2-dev libxslt1-dev libpq-dev libldap2-dev libsasl2-dev \
    build-essential pkg-config libgeos-dev \
    libjpeg-dev zlib1g-dev poppler-utils graphviz \
    git curl wget unzip nginx nodejs npm

echo "==> [2/6] Configuring PostgreSQL Service and Database..."
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='gnuhealth'" | grep -q 1 || \
    sudo -u postgres createuser --createdb gnuhealth

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='gnuhealth'" | grep -q 1 || \
    sudo -u postgres createdb -O gnuhealth -E UTF8 gnuhealth

echo "==> [3/6] Setting up gnuhealth User & Python Virtual Environment..."
id -u gnuhealth &>/dev/null || useradd -m -s /bin/bash gnuhealth

GH_HOME="/home/gnuhealth"
mkdir -p "${GH_HOME}/etc" "${GH_HOME}/attach" "${GH_HOME}/sao"

if [ ! -d "${GH_HOME}/venv" ]; then
    python3 -m venv "${GH_HOME}/venv"
fi

# Upgrade pip and install Tryton 7.0 stack & dependencies
"${GH_HOME}/venv/bin/pip" install --upgrade pip setuptools wheel
"${GH_HOME}/venv/bin/pip" install \
    psycopg2-binary pillow matplotlib pytz qrcode cryptography bcrypt \
    "trytond>=7.0,<7.1" \
    "trytond-company>=7.0,<7.1" \
    "trytond-currency>=7.0,<7.1" \
    "trytond-party>=7.0,<7.1" \
    "trytond-product>=7.0,<7.1" \
    "gnuhealth-control>=5.0.0,<5.1" \
    "gnuhealth>=5.0.0,<5.1"

# Install core clinical & hospital management packages
"${GH_HOME}/venv/bin/pip" install \
    gnuhealth-inpatient \
    gnuhealth-lab \
    gnuhealth-imaging \
    gnuhealth-pediatrics \
    gnuhealth-surgery \
    gnuhealth-gyneco \
    gnuhealth-insurance \
    gnuhealth-socioeconomics \
    gnuhealth-lifestyle \
    gnuhealth-genetics \
    gnuhealth-icd10 \
    gnuhealth-nursing || true

echo "==> [4/6] Setting up Tryton SAO (Web Client)..."
cd "${GH_HOME}/sao"
curl -sL https://downloads.tryton.org/7.0/tryton-sao-last.tgz | tar -xz --strip-components=1
npm install --production --silent || true

echo "==> [5/6] Creating Configuration & Initializing Database..."
ADMIN_PASS=$(openssl rand -hex 12)
echo "${ADMIN_PASS}" > "${GH_HOME}/admin_password.txt"
chmod 600 "${GH_HOME}/admin_password.txt"

cat << CONF > "${GH_HOME}/trytond.conf"
[database]
uri = postgresql://gnuhealth@/
path = ${GH_HOME}/attach

[web]
listen = 0.0.0.0:8000
root = ${GH_HOME}/sao

[web.cors]
origins = *
CONF

chown -R gnuhealth:gnuhealth "${GH_HOME}"

# Initialize Trytond Database with admin password and all installed modules
TRYTONPASS="${ADMIN_PASS}" sudo -u gnuhealth -E "${GH_HOME}/venv/bin/trytond-admin" \
    -c "${GH_HOME}/trytond.conf" \
    -d gnuhealth \
    --all \
    -p

echo "==> [6/6] Configuring Nginx Reverse Proxy & Systemd Service..."
cat << NGINX_CONF > /etc/nginx/sites-available/gnuhealth
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/gnuhealth /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create Systemd service
cat << SERVICE > /etc/systemd/system/gnuhealth.service
[Unit]
Description=GNU Health / Tryton Application Server
After=syslog.target network.target postgresql.service

[Service]
Type=simple
User=gnuhealth
Group=gnuhealth
ExecStart=${GH_HOME}/venv/bin/trytond -c ${GH_HOME}/trytond.conf -d gnuhealth
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable gnuhealth
systemctl start gnuhealth

echo "================================================================="
echo " GNU Health HMIS 5.0 Installation Finished Successfully: $(date)"
echo " Admin Password: ${ADMIN_PASS}"
echo "================================================================="
EOF

# 5. Provision Compute Engine VM in europe-west4-a
echo "--> [3/4] Creating Compute Engine VM (${INSTANCE_NAME}) in ${ZONE}..."
if ! gcloud compute instances describe "${INSTANCE_NAME}" --zone="${ZONE}" --project="${PROJECT_ID}" &>/dev/null; then
    gcloud compute instances create "${INSTANCE_NAME}" \
        --project="${PROJECT_ID}" \
        --zone="${ZONE}" \
        --machine-type="${MACHINE_TYPE}" \
        --network-interface="network=default,network-tier=PREMIUM" \
        --maintenance-policy="MIGRATE" \
        --provisioning-model="STANDARD" \
        --tags="http-server,https-server,gnuhealth-server" \
        --image-family="debian-12" \
        --image-project="debian-cloud" \
        --boot-disk-size="${DISK_SIZE}" \
        --boot-disk-type="pd-balanced" \
        --metadata-from-file="startup-script=/tmp/startup_gnuhealth.sh"
    echo "--> VM created successfully with automated provisioning."
else
    echo "--> VM ${INSTANCE_NAME} already exists in ${ZONE}."
fi

# 6. Retrieve External IP
echo "--> [4/4] Retrieving Instance IP Address..."
EXT_IP=$(gcloud compute instances describe "${INSTANCE_NAME}" \
    --zone="${ZONE}" \
    --project="${PROJECT_ID}" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "========================================================================="
echo " DEPLOYMENT TRIGGERED SUCCESSFULLY ON GCP"
echo "========================================================================="
echo " Server Web URL     : http://${EXT_IP}"
echo " GCP Instance Name  : ${INSTANCE_NAME}"
echo " Region / Zone      : ${ZONE} (Lowest Tier 1 Pricing + Fast Dubai Latency)"
echo " Database Name      : gnuhealth"
echo " Web User           : admin"
echo ""
echo " The initial setup and database initialization will complete in ~3-4 minutes."
echo " To monitor setup progress in real time, run:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='sudo tail -f /var/log/gnuhealth_install.log'"
echo ""
echo " To retrieve the generated Admin password:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='sudo cat /home/gnuhealth/admin_password.txt'"
echo "========================================================================="
