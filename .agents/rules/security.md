# Security Rules

## Zero-Trust Credential & Secret Management
- **No Hardcoded Passwords:** Never write plaintext user passwords, database passwords, or session tokens into script files, documentation, markdown reports, or Git commits.
- **Approved Secret Retrieval:**
  - Retrieve passwords from local encrypted credential stores, environment variables, or secure command-line parameters.
  - Test scripts must accept credentials via parameters or environment variables rather than hardcoded string literals.
- **Masking Directives:**
  - All screenshots captured for documentation, manuals, or audits must mask user passwords using input password field masking (`••••••••`) or callout banners marked `[SECURE]`.
  - HTTP request/response logs in reports must redact `Authorization`, `Cookie`, `Set-Cookie`, and JSON-RPC password arguments.
- **SSH & Infrastructure Protection:**
  - Never commit SSH private keys (`id_rsa`, `*.pem`, `*.key`).
  - Never modify SSH daemon configurations (`sshd_config`) or firewall rules (`ufw`, GCP VPC rules) without explicit user authorization.
- **Role Isolation:**
  - Execute tests strictly using authorized role accounts (`demo_frontdesk1`, `demo_nurse1`, `demo_dr1`, `demo_lab1`, `demo_rad1`, `demo_cashier1`).
  - Never grant temporary superuser (`admin`) privileges to standard departmental roles to bypass testing hurdles.
