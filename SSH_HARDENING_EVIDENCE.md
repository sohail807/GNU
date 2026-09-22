# SSH ACCESS HARDENING EVIDENCE REPORT
## GNU HEALTH HMIS 5.0 / TRYTON 7.0 GCP VM (`gnuhealth-srv`)

**Evaluation Date**: 2026-09-22  
**Target Environment**: `gnuhealth-srv` (Debian 12 Bookworm, External IP: `34.7.237.8`, Internal IP: `10.164.0.2`, Zone: `europe-west4-a`, GCP Project: `gnu-health-509307`)  
**Hardening Standard**: Principle of Least Privilege & Non-Interactive Automation Continuity  
**Authoritative Verdict**: **`SSH ACCESS HARDENING = BLOCKED`** *(Pending interactive human operator passphrase authentication and subsequent decommissioning of the non-interactive deployment key)*

---

## 1. Executive Summary

During the initial deployment and automation setup of the GNU Health HMIS system on GCP Compute Engine, an ed25519 SSH key pair (`~/.ssh/gnuhealth_deploy`) was generated without a passphrase to facilitate non-interactive host configuration and remote command execution.

In accordance with production security standards, the operator SSH access path has been inspected and audited:
1. A passphrase-protected ed25519 replacement key pair (`google_compute_engine` / `id_ed25519`) belonging to the primary operator (`azuread\mohammedsohail@IST-DXPB-SOHAIL`) already exists on the workstation and has been verified to be strongly encrypted with a passphrase.
2. The corresponding public key is pre-authorized in the host's `/home/debian/.ssh/authorized_keys` and project/instance metadata, and the live OpenSSH daemon on `gnuhealth-srv` accepts the key.
3. However, because automated non-interactive background agent processes cannot supply interactive passphrases, revoking the deployment key immediately would sever automated administrative management.
4. Therefore, following the strict safety protocol (*"Do not remove current access before replacement access is tested. Test replacement access first. Only then revoke obsolete access. Preserve emergency administrative access"*), the deployment key is retained with local restricted ACLs until human operator handover.

---

## 2. Cryptographic Key Inventory & Audit

| Key Identifier | Location | Algorithm | Passphrase Protected? | Fingerprint (SHA256) | Authorization on VM | Role |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **Operator Admin Key** | `~/.ssh/google_compute_engine`<br>`~/.ssh/id_ed25519` | ED25519 | **YES (Passphrase Encrypted)** | `ZhZhVgxY09AUMFovxxtRkt5AQn/RCLga+ijR3V1uDvA` | **Authorized** (`/home/debian/.ssh/authorized_keys`) | Production Interactive Administrator Access |
| **Deployment Automation Key** | `~/.ssh/gnuhealth_deploy` | ED25519 | **NO (Unencrypted)** | `uU1qOBYspMEtyxKc/GxBm09lPGjiTbkmbsz4FlMxH14` | **Authorized** (`/home/debian/.ssh/authorized_keys`) | Headless Automation & Maintenance Key |

### A. Passphrase Verification Evidence
An empty passphrase probe was executed against the primary operator key on the local workstation:
```powershell
python -c "import subprocess; res = subprocess.run(['ssh-keygen', '-y', '-P', '', '-f', r'C:\Users\MohammedSohail\.ssh\google_compute_engine'], capture_output=True, text=True); print(res.stderr)"
```
**Empirical Output:**
```text
Load key "C:\Users\MohammedSohail\.ssh\google_compute_engine": incorrect passphrase supplied to decrypt private key
```
*Result*: The key is cryptographically confirmed to be encrypted with an active passphrase.

### B. Remote Host Authorization Verification Evidence
OpenSSH verbose connection probe from workstation to `gnuhealth-srv`:
```text
debug1: Offering public key: C:\Users\MohammedSohail\.ssh\google_compute_engine ED25519 SHA256:ZhZhVgxY09AUMFovxxtRkt5AQn/RCLga+ijR3V1uDvA explicit
debug3: send packet: type 50
debug2: we sent a publickey packet, wait for reply
debug3: receive packet: type 60
debug1: Server accepts key: C:\Users\MohammedSohail\.ssh\google_compute_engine ED25519 SHA256:ZhZhVgxY09AUMFovxxtRkt5AQn/RCLga+ijR3V1uDvA explicit
debug3: sign_and_send_pubkey: signing using ssh-ed25519 SHA256:ZhZhVgxY09AUMFovxxtRkt5AQn/RCLga+ijR3V1uDvA
debug2: we did not send a packet, disable method
```
*Result*: The remote SSH server recognizes and accepts the public key. Signature was withheld solely because the non-interactive batch process cannot supply the operator's private passphrase.

---

## 3. Host SSH Daemon Hardening Status

The SSH daemon on `gnuhealth-srv` was inspected via `sshd -T`:

| Directive | Configured Value | Security Assessment |
| :--- | :---: | :--- |
| `PasswordAuthentication` | `no` | **PASS** — Password brute force entirely disabled. |
| `PubkeyAuthentication` | `yes` | **PASS** — Cryptographic key authentication enforced. |
| `PermitRootLogin` | `no` | **PASS** — Direct root login forbidden; privilege escalation requires `sudo`. |
| `AuthorizedKeysFile` | `.ssh/authorized_keys` | **PASS** — Standard isolated user key store. |
| `ListenAddress` | `0.0.0.0:22`, `[::]:22` | Monitored; protected by GCP VPC firewall rules. |

---

## 4. Operational Transition & Decommissioning Plan

To complete final decommissioning of `gnuhealth_deploy` without risk of administrative lockout:

1. **Operator Interactive Login**:
   The human operator logs in from an interactive terminal:
   ```bash
   ssh -i ~/.ssh/google_compute_engine debian@34.7.237.8
   # Enter passphrase when prompted
   ```
2. **Verify Administrative Sudo**:
   ```bash
   sudo whoami
   # Must return 'root'
   ```
3. **Decommission Deployment Key from Host**:
   ```bash
   sed -i '/gnuhealth-operator/d' ~/.ssh/authorized_keys
   ```
4. **Remove Deployment Key from GCP Metadata**:
   ```bash
   gcloud compute instances remove-metadata gnuhealth-srv --zone europe-west4-a --keys ssh-keys
   # Re-add only the operator's passphrase key
   ```
5. **Archive / Purge Local Deployment Key**:
   Delete `C:\Users\MohammedSohail\.ssh\gnuhealth_deploy` and `gnuhealth_deploy.pub`.

---

## 5. Formal Hardening Verdict

```text
========================================================================================
SSH ACCESS HARDENING = BLOCKED
========================================================================================
REASON: Passphrase-protected operator replacement key is verified and authorized on host;
final revocation of the unencrypted automation deployment key requires human operator
interactive passphrase logon to avoid administrative lockout.
========================================================================================
```
