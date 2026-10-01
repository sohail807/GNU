<#
.SYNOPSIS
  Deploys the IST Health frontend to Cloud Run (served at https://isthealth.irisstar.tech via Firebase Hosting).

.DESCRIPTION
  Builds frontend/ from source with its Dockerfile and deploys service `ist-health-frontend`
  in project ist-health-hmis-21722 (europe-west4). Secrets are never passed on the command line:
  SESSION_ENCRYPTION_KEY comes from Secret Manager (`ist-session-key`).
  Firebase Hosting only rewrites to this service (firebase.json); redeploy Hosting only when
  firebase.json changes:  firebase deploy --only hosting --project ist-health-hmis-21722

.PARAMETER Account
  gcloud account with deploy rights on the project (default praveen@irisstar.tech).
#>
param(
  [string]$Account = "praveen@irisstar.tech",
  [string]$Project = "ist-health-hmis-21722",
  [string]$Region  = "europe-west4"
)
$ErrorActionPreference = "Stop"
$frontend = Join-Path $PSScriptRoot "..\frontend"

$envVars = @(
  "GNUHEALTH_HOST=https://api.isthealth.irisstar.tech",   # nginx site api443-domain on the VM (Tryton RPC only)
  "GNUHEALTH_DATABASE=gnuhealth",
  "GNUHEALTH_COMPANY_ID=2",
  "SUPER_ADMIN_USERNAMES=irisstar_admin",
  "SESSION_COOKIE_NAME=__session",                 # Firebase Hosting only forwards __session to Cloud Run
  "SESSION_REVOCATION_DIR=/mnt/state/tokens",
  "TENANT_REGISTRY_DIR=/mnt/state/data",
  "APP_BASE_DOMAIN=isthealth.irisstar.tech",       # <hospital>.isthealth.irisstar.tech resolves to that hospital
  "TENANT_PROVISIONING=manual"                     # databases are created by an operator on the VM (docs/TENANT_ONBOARDING.md)
) -join "@"

Push-Location $frontend
try {
  gcloud run deploy ist-health-frontend --source . --region $Region --project $Project --account $Account `
    --allow-unauthenticated `
    --service-account "ist-health-run@$Project.iam.gserviceaccount.com" `
    --execution-environment gen2 --min-instances 1 --max-instances 3 --memory 1Gi --cpu 1 `
    --add-volume "name=state,type=cloud-storage,bucket=$Project-state,mount-options=uid=1000;gid=1000;file-mode=660;dir-mode=770" `
    --add-volume-mount "volume=state,mount-path=/mnt/state" `
    --set-env-vars "^@^$envVars" `
    --set-secrets "SESSION_ENCRYPTION_KEY=ist-session-key:latest" `
    --quiet
  if ($LASTEXITCODE -ne 0) { throw "Cloud Run deploy failed." }
} finally { Pop-Location }

Write-Host "Smoke test..."
$r = Invoke-WebRequest "https://isthealth.irisstar.tech/login" -UseBasicParsing
if ($r.StatusCode -ne 200) { throw "Smoke test failed: HTTP $($r.StatusCode)" }
Write-Host "OK: https://isthealth.irisstar.tech/login -> 200"
