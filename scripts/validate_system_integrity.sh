#!/usr/bin/env bash
# ==============================================================================
# GNU Health HMIS — Automated Host & System Baseline Validation Script
# Target Host: Debian GNU/Linux 12 (Bookworm) / gnuhealth-srv
# Execution Mode: Strict Read-Only Introspection
# ==============================================================================

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================================================${NC}"
echo -e "${CYAN}GNU HEALTH HMIS — HOST SYSTEM BASELINE & INTEGRITY AUDIT${NC}"
echo -e "${CYAN}Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo -e "${CYAN}Host: $(hostname -f 2>/dev/null || hostname)${NC}"
echo -e "${CYAN}================================================================================${NC}"

# 1. Operating System
echo -e "\n${YELLOW}[1/8] Verifying Operating System...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "  OS: ${GREEN}${PRETTY_NAME}${NC}"
    echo -e "  Kernel: ${GREEN}$(uname -r)${NC}"
else
    echo -e "  ${RED}Cannot detect /etc/os-release${NC}"
fi

# 2. Service Supervision
echo -e "\n${YELLOW}[2/8] Checking Systemd Services...${NC}"
for svc in gnuhealth nginx postgresql; do
    if systemctl is-active --quiet "$svc"; then
        echo -e "  Service ${svc}: ${GREEN}ACTIVE (Running)${NC}"
    else
        echo -e "  Service ${svc}: ${RED}INACTIVE / FAILED${NC}"
    fi
done

# 3. Nginx Configuration & Syntax
echo -e "\n${YELLOW}[3/8] Testing Nginx Configuration Syntax...${NC}"
if nginx -t 2>/dev/null; then
    echo -e "  Nginx Syntax: ${GREEN}PASS (Configuration valid)${NC}"
else
    echo -e "  Nginx Syntax: ${RED}FAIL (Configuration error detected)${NC}"
fi

# 4. Network Socket Bindings
echo -e "\n${YELLOW}[4/8] Auditing Listening Sockets...${NC}"
if command -v ss &>/dev/null; then
    echo "  Active Listening TCP Sockets:"
    ss -tulpn | grep -E ':(80|443|8000|5432|22)\b' || true
else
    netstat -tulpn | grep -E ':(80|443|8000|5432|22)\b' || true
fi

# 5. Secrets & Config File Permissions
echo -e "\n${YELLOW}[5/8] Inspecting Configuration File Permissions...${NC}"
CONF_FILE="/home/gnuhealth/trytond.conf"
if [ -f "$CONF_FILE" ]; then
    PERMS=$(stat -c "%a" "$CONF_FILE")
    OWNER=$(stat -c "%U:%G" "$CONF_FILE")
    echo -e "  File: $CONF_FILE"
    echo -e "  Permissions: $PERMS (Expected: 600)"
    echo -e "  Owner: $OWNER (Expected: gnuhealth:gnuhealth)"
    if [ "$PERMS" = "600" ] && [ "$OWNER" = "gnuhealth:gnuhealth" ]; then
        echo -e "  ${GREEN}PASS: Secure configuration permissions enforced.${NC}"
    else
        echo -e "  ${YELLOW}WARNING: Permissions should be tightened to 600.${NC}"
    fi
else
    echo -e "  ${YELLOW}Notice: $CONF_FILE not found at standard path.${NC}"
fi

# 6. Legacy Provisioning Credential Check
echo -e "\n${YELLOW}[6/8] Checking Legacy Provisioning Text Artifact...${NC}"
LEGACY_PW="/home/gnuhealth/admin_password.txt"
if [ -f "$LEGACY_PW" ]; then
    echo -e "  ${RED}ALERT: $LEGACY_PW exists on disk. Credential rotation and file shredding required.${NC}"
else
    echo -e "  ${GREEN}PASS: No legacy admin_password.txt detected.${NC}"
fi

# 7. Backup Directory & Archives
echo -e "\n${YELLOW}[7/8] Auditing Backup Directory...${NC}"
BACKUP_DIR="/home/gnuhealth/backups"
if [ -d "$BACKUP_DIR" ]; then
    COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "*.dump" -o -name "*.sql" -o -name "*.gz" | wc -l)
    echo -e "  Backup Directory: ${GREEN}EXISTS ($BACKUP_DIR)${NC}"
    echo -e "  Backup Files Found: ${COUNT}"
    ls -lh "$BACKUP_DIR" 2>/dev/null || true
else
    echo -e "  ${YELLOW}Notice: Backup directory $BACKUP_DIR does not exist.${NC}"
fi

# 8. PostgreSQL Connection & Health Database Introspection
echo -e "\n${YELLOW}[8/8] Testing PostgreSQL Connectivity...${NC}"
if sudo -u postgres pg_isready &>/dev/null; then
    echo -e "  PostgreSQL Server: ${GREEN}READY (Listening on local socket)${NC}"
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw gnuhealth; then
        echo -e "  Database 'gnuhealth': ${GREEN}PRESENT${NC}"
        
        # Operational records count
        PAT_COUNT=$(sudo -u postgres psql -d gnuhealth -tAc "SELECT count(*) FROM gnuhealth_patient;" 2>/dev/null || echo "N/A")
        DOC_COUNT=$(sudo -u postgres psql -d gnuhealth -tAc "SELECT count(*) FROM gnuhealth_healthprofessional;" 2>/dev/null || echo "N/A")
        INV_COUNT=$(sudo -u postgres psql -d gnuhealth -tAc "SELECT count(*) FROM account_invoice;" 2>/dev/null || echo "N/A")
        FY_COUNT=$(sudo -u postgres psql -d gnuhealth -tAc "SELECT count(*) FROM account_fiscalyear;" 2>/dev/null || echo "N/A")
        
        echo -e "  Operational Tables Audit:"
        echo -e "    - Patients: $PAT_COUNT (Expected: 0)"
        echo -e "    - Doctors:  $DOC_COUNT (Expected: 0)"
        echo -e "    - Invoices: $INV_COUNT (Expected: 0)"
        echo -e "    - Fiscal Years: $FY_COUNT (Expected: 0)"
    fi
else
    echo -e "  ${RED}PostgreSQL Server is not accessible via local socket.${NC}"
fi

echo -e "\n${CYAN}================================================================================${NC}"
echo -e "${CYAN}AUDIT COMPLETE${NC}"
echo -e "${CYAN}================================================================================${NC}"
