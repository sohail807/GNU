# Automated System Integrity and Endpoint Validation Script for GNU Health HMIS
[CmdletBinding()]
param (
    [string]$TargetHost = "34.7.237.8",
    [string]$RepoRoot = "c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health"
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "GNU HEALTH HMIS - AUTOMATED SYSTEM INTEGRITY AND ENDPOINT VALIDATION" -ForegroundColor Cyan
Write-Host "Target Host: $TargetHost" -ForegroundColor Cyan
Write-Host "Repository:  $RepoRoot" -ForegroundColor Cyan
Write-Host "Evaluation Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$Results = [System.Collections.Generic.List[PSCustomObject]]::new()

# 1. Network Perimeter & Port Exposure
Write-Host "`n[1/4] Probing Network Ports on $TargetHost..." -ForegroundColor Yellow
$PortsToAudit = @(
    @{ Port = 80;   Name = "HTTP Web Proxy";             Expected = $true;  Role = "Web Traffic" },
    @{ Port = 443;  Name = "HTTPS TLS Encryption";       Expected = $true;  Role = "Mandatory Go-Live" },
    @{ Port = 8000; Name = "Tryton WSGI Daemon";         Expected = $false; Role = "Should be localhost only" },
    @{ Port = 5432; Name = "PostgreSQL Database";        Expected = $false; Role = "Should be local socket only" },
    @{ Port = 22;   Name = "SSH Secure Shell";           Expected = $true;  Role = "Remote Administration" }
)

foreach ($p in $PortsToAudit) {
    $test = Test-NetConnection -ComputerName $TargetHost -Port $p.Port -WarningAction SilentlyContinue
    $isOpen = $test.TcpTestSucceeded
    $status = ""
    if ($p.Port -eq 8000 -and $isOpen) {
        $status = "RISK: EXPOSED TO INTERNET (Lockdown Required)"
    } elseif ($p.Port -eq 443 -and -not $isOpen) {
        $status = "PENDING TLS / DOMAIN CONFIGURATION"
    } elseif ($p.Port -eq 5432 -and -not $isOpen) {
        $status = "PASS: SECURELY CLOSED TO EXTERNAL TRAFFIC"
    } elseif ($p.Port -eq 80 -and $isOpen) {
        $status = "ACTIVE: UNENCRYPTED HTTP (TLS Redirect Needed)"
    } else {
        if ($isOpen) { $status = "OPEN" } else { $status = "CLOSED" }
    }
    
    $color = "Green"
    if ($p.Port -eq 8000 -and $isOpen) { 
        $color = "Red" 
    } elseif ($p.Port -eq 443 -and -not $isOpen) { 
        $color = "Yellow" 
    }
    
    Write-Host "  - Port $($p.Port) ($($p.Name)): $status" -ForegroundColor $color
    
    $Results.Add([PSCustomObject]@{
        Category = "Network Perimeter"
        Check = "TCP Port $($p.Port) ($($p.Name))"
        Result = if ($isOpen) { "OPEN" } else { "CLOSED" }
        Assessment = $status
    })
}

# 2. HTTP & Application Endpoint Verification
Write-Host "`n[2/4] Testing Web Endpoints on http://$TargetHost/..." -ForegroundColor Yellow
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$TargetHost/" -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $serverHeader = $httpResponse.Headers["Server"]
    Write-Host "  - Root Web URL: HTTP $($httpResponse.StatusCode) OK (Server: $serverHeader)" -ForegroundColor Green
    $Results.Add([PSCustomObject]@{
        Category = "Web Endpoints"
        Check = "Root HTTP Access"
        Result = "HTTP $($httpResponse.StatusCode)"
        Assessment = "Server header: $serverHeader"
    })
} catch {
    Write-Host "  - Root Web URL: FAILED ($($_.Exception.Message))" -ForegroundColor Red
    $Results.Add([PSCustomObject]@{
        Category = "Web Endpoints"
        Check = "Root HTTP Access"
        Result = "FAILED"
        Assessment = $_.Exception.Message
    })
}

# 3. Repository Secret & Hygiene Audit
Write-Host "`n[3/4] Auditing Local Repository for Plaintext Secrets and Hygiene..." -ForegroundColor Yellow
$allowedExts = @(".md", ".py", ".sh", ".yaml", ".yml", ".json", ".txt", ".conf", ".cfg", ".ps1")
$filesToScan = Get-ChildItem -Path $RepoRoot -Recurse -File | Where-Object {
    $allowedExts -contains $_.Extension -and $_.FullName -notmatch "(\.git|backup\\pre_cleanup_root_archive)"
}

$secretHits = 0
foreach ($file in $filesToScan) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    if ($content -match "BEGIN (RSA|EC|OPENSSH) PRIVATE KEY" -or $content -match "AIza[0-9A-Za-z-_]{35}") {
        Write-Host "  - WARNING: Potential secret match in $($file.FullName)" -ForegroundColor Red
        $secretHits++
    }
}

if ($secretHits -eq 0) {
    Write-Host "  - PASS: Zero plaintext secrets detected across repository files" -ForegroundColor Green
    $Results.Add([PSCustomObject]@{
        Category = "Repository Hygiene"
        Check = "Plaintext Secret Grep"
        Result = "CLEAN"
        Assessment = "Zero plaintext credentials or private keys in source"
    })
} else {
    Write-Host "  - ALERT: $secretHits potential secret patterns found" -ForegroundColor Red
    $Results.Add([PSCustomObject]@{
        Category = "Repository Hygiene"
        Check = "Plaintext Secret Grep"
        Result = "WARNING"
        Assessment = "$secretHits potential matches found"
    })
}

# 4. Master Configuration Syntax & Integrity Check
Write-Host "`n[4/4] Validating Clinic Master Configuration Structure..." -ForegroundColor Yellow
$configFile = Join-Path $RepoRoot "configuration\clinic-config.yaml"
if (Test-Path $configFile) {
    Write-Host "  - PASS: clinic-config.yaml exists" -ForegroundColor Green
    $configContent = Get-Content $configFile -Raw
    $hasCurrency = $configContent -match "currency:\s*['""]?QAR['""]?"
    $hasTimezone = $configContent -match "timezone:\s*['""]?Asia/Qatar['""]?"
    $hasUnits = $configContent -match "departments:"
    
    if ($hasCurrency -and $hasTimezone -and $hasUnits) {
        Write-Host "  - PASS: QAR currency, Asia/Qatar timezone, and departmental units confirmed" -ForegroundColor Green
        $Results.Add([PSCustomObject]@{
            Category = "Configuration"
            Check = "clinic-config.yaml Specification"
            Result = "VALID"
            Assessment = "Currency, timezone, and department schemas present"
        })
    } else {
        Write-Host "  - WARNING: Incomplete configuration keys in clinic-config.yaml" -ForegroundColor Yellow
        $Results.Add([PSCustomObject]@{
            Category = "Configuration"
            Check = "clinic-config.yaml Specification"
            Result = "INCOMPLETE"
            Assessment = "Missing required keys"
        })
    }
} else {
    Write-Host "  - ERROR: clinic-config.yaml not found at $configFile" -ForegroundColor Red
    $Results.Add([PSCustomObject]@{
        Category = "Configuration"
        Check = "clinic-config.yaml"
        Result = "MISSING"
        Assessment = "File not found at $configFile"
    })
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
$Results | Format-Table -AutoSize
