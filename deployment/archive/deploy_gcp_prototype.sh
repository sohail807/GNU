#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="gnu-health-509307"
ZONE="europe-west4-a"
INSTANCE_NAME="gnuhealth-srv"
MACHINE_TYPE="e2-standard-2"
DISK_SIZE="50GB"

echo "==> [1/3] Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com

echo "==> [2/3] Creating Firewall Rules..."
gcloud compute firewall-rules create allow-gnuhealth-web \
    --project="${PROJECT_ID}" \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80,tcp:443,tcp:8000 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=gnuhealth-server 2>/dev/null || echo "Firewall rule already exists."

echo "==> [3/3] Launching Compute Engine VM (${INSTANCE_NAME}) in ${ZONE}..."
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
    --metadata-from-file="startup-script=startup_gnuhealth.sh"

EXT_IP=$(gcloud compute instances describe "${INSTANCE_NAME}" \
    --zone="${ZONE}" \
    --project="${PROJECT_ID}" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "========================================================================="
echo " VM CREATED SUCCESSFULLY"
echo " Web URL            : http://${EXT_IP}"
echo " Instance           : ${INSTANCE_NAME} in ${ZONE}"
echo " Database           : gnuhealth"
echo " Web User           : admin"
echo "========================================================================="
echo " The initial setup finishes in ~3-4 minutes."
echo " To monitor setup progress in real time:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='sudo tail -f /var/log/gnuhealth_install.log'"
echo ""
echo " To retrieve the generated Admin password:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='sudo cat /home/gnuhealth/admin_password.txt'"
echo "========================================================================="
