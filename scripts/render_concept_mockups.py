import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE_DIR = os.path.abspath("design/frontend_wireframes")
SCRATCH_DIR = os.path.abspath("scratch/mockup_html")
os.makedirs(SCRATCH_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# HTML Template Generators
# -----------------------------------------------------------------------------

def get_base_css(theme):
    if theme == "concept_a":
        # Editorial Minimalism (TFSF-inspired: limestone ivory, obsidian, jade accent, 0px radius)
        return """
        :root {
            --bg-canvas: #F4F6F1;
            --bg-surface: #FFFFFF;
            --bg-subtle: #ECEFE8;
            --bg-sidebar: #0D1411;
            --text-primary: #071512;
            --text-secondary: #405B50;
            --text-tertiary: #6E877C;
            --accent: #135D4F;
            --accent-light: #E7F0ED;
            --border: 1px solid rgba(7, 21, 18, 0.14);
            --radius: 0px;
            --font-display: 'Bodoni Moda', serif;
            --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'Geist Mono', monospace;
        }
        """
    elif theme == "concept_b":
        # Qatari Contemporary (Alabaster ivory, Qatari Maroon, desert gold, 3px radius, bilingual touches)
        return """
        :root {
            --bg-canvas: #F8F9F5;
            --bg-surface: #FFFFFF;
            --bg-subtle: #F1F3ED;
            --bg-sidebar: #121916;
            --text-primary: #111815;
            --text-secondary: #4A5B53;
            --text-tertiary: #7D8E86;
            --accent: #8A1538; /* Qatari Maroon */
            --accent-hover: #72112E;
            --accent-light: #FBEBED;
            --gold: #C5A880;
            --gold-light: #F9F6F0;
            --border: 1px solid #E1E5DC;
            --radius: 3px;
            --font-display: 'Bodoni Moda', serif;
            --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'Geist Mono', monospace;
        }
        """
    else:
        # Clinical Executive (Cool pearl, slate navy header, dense telemetry, task-focused)
        return """
        :root {
            --bg-canvas: #F4F6FA;
            --bg-surface: #FFFFFF;
            --bg-subtle: #E9EDF4;
            --bg-sidebar: #16202C;
            --text-primary: #0F172A;
            --text-secondary: #475569;
            --text-tertiary: #64748B;
            --accent: #8A1538;
            --accent-light: #FBEBED;
            --info: #0284C7;
            --border: 1px solid #CBD5E1;
            --radius: 4px;
            --font-display: 'Geist', sans-serif;
            --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'Geist Mono', monospace;
        }
        """

def html_wrapper(title, theme, content):
    css_theme = get_base_css(theme)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..800&family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{css_theme}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    background-color: var(--bg-canvas);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    width: 1600px;
    height: 1000px;
    overflow: hidden;
}}
.mono {{ font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.8px; font-size: 11px; }}
.badge {{
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: var(--radius);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
}}
.badge-green {{ background: #EAF7F1; color: #1B7A58; border: 1px solid #C4EBD8; }}
.badge-amber {{ background: #FDF6E9; color: #C88728; border: 1px solid #F6DFBA; }}
.badge-red {{ background: #FBEBED; color: #8A1538; border: 1px solid #F3C7CF; }}
.badge-blue {{ background: #EEF6F8; color: #2B6C80; border: 1px solid #CBE4EC; }}
.btn {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    text-decoration: none;
    gap: 6px;
}}
.btn-primary {{
    background: var(--accent);
    color: #FFFFFF;
}}
.btn-outline {{
    background: transparent;
    color: var(--text-primary);
    border: var(--border);
}}
.btn-dark {{
    background: var(--bg-sidebar);
    color: #FFFFFF;
}}
.layout-shell {{
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 64px 1fr 32px;
    height: 1000px;
}}
.top-header {{
    grid-column: 1 / -1;
    background: var(--bg-surface);
    border-bottom: var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
}}
.sidebar {{
    background: var(--bg-sidebar);
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 0;
}}
.main-content {{
    padding: 28px 32px;
    overflow-y: auto;
    background: var(--bg-canvas);
}}
.footer-bar {{
    grid-column: 1 / -1;
    background: var(--bg-surface);
    border-top: var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    font-size: 11px;
    color: var(--text-tertiary);
}}
.card {{
    background: var(--bg-surface);
    border: var(--border);
    border-radius: var(--radius);
    padding: 20px;
}}
table.dense-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}}
table.dense-table th {{
    background: var(--bg-subtle);
    padding: 10px 14px;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    border-bottom: var(--border);
}}
table.dense-table td {{
    padding: 12px 14px;
    border-bottom: 1px solid var(--bg-subtle);
    color: var(--text-primary);
}}
table.dense-table tr:hover td {{
    background: var(--bg-subtle);
}}
.form-group {{
    margin-bottom: 16px;
}}
.form-group label {{
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-secondary);
}}
.form-control {{
    width: 100%;
    height: 38px;
    padding: 0 12px;
    border: var(--border);
    border-radius: var(--radius);
    font-family: var(--font-ui);
    font-size: 13.5px;
    background: #FFFFFF;
    color: var(--text-primary);
}}
.form-control:focus {{
    outline: none;
    border-color: var(--accent);
}}
</style>
</head>
<body>
{content}
</body>
</html>
"""

# -----------------------------------------------------------------------------
# Screen Mockup Renderers
# -----------------------------------------------------------------------------

def build_login_screen(theme):
    if theme == "concept_a":
        # Editorial Minimalism: Left branding slab, right minimal login
        body = """
        <div style="display: grid; grid-template-columns: 55% 45%; height: 1000px;">
            <div style="background: #071512; color: #F4F6F1; padding: 80px 100px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <p class="mono" style="color: #197C70; margin-bottom: 24px;">GNU HEALTH HMIS / CLINICAL INTELLIGENCE</p>
                    <h1 style="font-family: 'Bodoni Moda', serif; font-size: 64px; font-weight: 400; line-height: 1.1; margin-bottom: 20px;">
                        EXCELLENCE.<br><em style="font-style: italic; color: #197C70;">DELIVERED IN DOHA.</em>
                    </h1>
                    <p style="font-size: 18px; color: #8BA89D; max-width: 500px; line-height: 1.6;">
                        A client-sovereign outpatient management platform engineered on Tryton 7.0. Single source of clinical and financial truth.
                    </p>
                </div>
                <div style="border-top: 1px solid rgba(244, 246, 241, 0.15); padding-top: 30px; display: flex; justify-content: space-between;">
                    <div><span class="mono" style="color: #6E877C;">LOCATION</span><p style="font-size: 13px;">Lusail Pavilion, Qatar</p></div>
                    <div><span class="mono" style="color: #6E877C;">SECURITY</span><p style="font-size: 13px;">Session Cryptographic Token</p></div>
                    <div><span class="mono" style="color: #6E877C;">DATABASE</span><p style="font-size: 13px;">gnuhealth (PostgreSQL 15)</p></div>
                </div>
            </div>
            <div style="background: #F4F6F1; padding: 120px 100px; display: flex; flex-direction: column; justify-content: center;">
                <p class="mono" style="color: #135D4F; margin-bottom: 12px;">01 / AUTHENTICATION GATEWAY</p>
                <h2 style="font-family: 'Bodoni Moda', serif; font-size: 32px; font-weight: 500; margin-bottom: 36px; color: #071512;">Sign in to Portal</h2>
                <div class="form-group">
                    <label class="mono">DATABASE</label>
                    <select class="form-control" style="border-radius: 0px;"><option>gnuhealth (Active Production)</option></select>
                </div>
                <div class="form-group">
                    <label class="mono">USERNAME</label>
                    <input type="text" class="form-control" value="demo_frontdesk1" style="border-radius: 0px;">
                </div>
                <div class="form-group">
                    <label class="mono">PASSWORD</label>
                    <input type="password" class="form-control" value="••••••••••••" style="border-radius: 0px;">
                </div>
                <div class="form-group" style="margin-top: 24px;">
                    <button class="btn btn-primary" style="width: 100%; height: 46px; border-radius: 0px; background: #071512; font-family: 'Geist Mono', monospace; font-size: 12px; letter-spacing: 1px;">
                        ENTER WORKSPACE ↗
                    </button>
                </div>
                <p style="font-size: 12px; color: #6E877C; margin-top: 40px; text-align: center;">
                    Encrypted Session Auth · Role-Based Access Control Protected
                </p>
            </div>
        </div>
        """
    elif theme == "concept_b":
        # Qatari Contemporary: Luxury ivory card, Qatari maroon accents, bilingual header
        body = """
        <div style="background: radial-gradient(circle at 50% 30%, #FFFFFF, #F8F9F5 70%); height: 1000px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 520px; background: #FFFFFF; border: 1px solid #E1E5DC; border-radius: 4px; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,0.03);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; width: 44px; height: 44px; background: #8A1538; border-radius: 50%; color: #FFFFFF; line-height: 44px; font-family: 'Bodoni Moda', serif; font-size: 20px; margin-bottom: 12px;">ق</div>
                    <h1 style="font-family: 'Bodoni Moda', serif; font-size: 24px; color: #111815; font-weight: 600;">GNU HEALTH HMIS</h1>
                    <p style="font-size: 13px; color: #7D8E86; font-family: 'Noto Sans Arabic', sans-serif;">العيادات الخارجية — الدوحة، قطر</p>
                    <p class="mono" style="color: #8A1538; font-size: 10.5px; margin-top: 4px;">OUTPATIENT CLINIC · DOHA, QATAR</p>
                </div>
                <div style="border-top: 1px solid #ECEFE7; padding-top: 24px;">
                    <div class="form-group">
                        <label>DATABASE</label>
                        <select class="form-control"><option>gnuhealth (Enterprise Cloud)</option></select>
                    </div>
                    <div class="form-group">
                        <label>USER ROLE / LOGIN</label>
                        <input type="text" class="form-control" value="demo_dr1 (Attending Physician)">
                    </div>
                    <div class="form-group">
                        <label>PASSWORD</label>
                        <input type="password" class="form-control" value="••••••••••••">
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0 24px; font-size: 12px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: #4A5B53;">
                            <input type="checkbox" checked style="accent-color: #8A1538;"> Remember session
                        </label>
                        <a href="#" style="color: #8A1538; text-decoration: none;">Forgot password?</a>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; height: 42px; background: #8A1538; font-size: 13.5px; font-weight: 600;">
                        Secure Login
                    </button>
                    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #ECEFE7; display: flex; justify-content: space-between; align-items: center;">
                        <span class="mono" style="font-size: 10px; color: #7D8E86;">SYSTEM STATUS</span>
                        <span class="badge badge-green">ONLINE (Tryton 7.0.58)</span>
                    </div>
                </div>
            </div>
        </div>
        """
    else:
        # Clinical Executive: High density, dark navy top slab, enterprise split
        body = """
        <div style="background: #F4F6FA; height: 1000px; display: flex; flex-direction: column;">
            <div style="background: #16202C; height: 80px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #8A1538;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="background: #8A1538; color: #FFF; padding: 6px 12px; border-radius: 3px; font-weight: 700; font-size: 14px;">QATAR HMIS</div>
                    <div>
                        <h1 style="color: #FFF; font-size: 16px; font-weight: 600;">OUTPATIENT CLINICAL COMMAND PORTAL</h1>
                        <p style="color: #94A3B8; font-size: 11px;" class="mono">ENTERPRISE SYSTEM OF RECORD · TRYTON 7.0</p>
                    </div>
                </div>
                <div class="badge badge-green" style="background: rgba(34, 197, 94, 0.15); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.3);">
                    SECURE SSL · HOST 34.7.237.8
                </div>
            </div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                <div style="width: 440px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 4px; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Sign In</h2>
                    <p style="font-size: 13px; color: #64748B; margin-bottom: 24px;">Enter department credentials to access clinical tools.</p>
                    <div class="form-group">
                        <label>DATABASE</label>
                        <select class="form-control"><option>gnuhealth (Production Cluster)</option></select>
                    </div>
                    <div class="form-group">
                        <label>USERNAME</label>
                        <input type="text" class="form-control" value="demo_nurse1">
                    </div>
                    <div class="form-group">
                        <label>PASSWORD</label>
                        <input type="password" class="form-control" value="••••••••••••">
                    </div>
                    <button class="btn btn-primary" style="width: 100%; height: 40px; margin-top: 10px; background: #16202C;">
                        Authenticate Session →
                    </button>
                    <div style="margin-top: 24px; background: #F8FAFC; padding: 12px; border-radius: 3px; border: 1px solid #E2E8F0; font-size: 11.5px; color: #64748B;">
                        <strong>Department Accounts:</strong> Front Desk, Nurse, Doctor, Lab, Radiology, Cashier.
                    </div>
                </div>
            </div>
        </div>
        """
    return html_wrapper("Login Screen", theme, body)

def build_frontdesk_dashboard(theme):
    accent_bar = "#8A1538" if theme != "concept_a" else "#135D4F"
    body = f"""
    <div class="layout-shell">
        <header class="top-header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <span style="font-family: 'Bodoni Moda', serif; font-size: 20px; font-weight: 700; color: {accent_bar};">GNU HEALTH</span>
                <span class="mono" style="color: var(--text-tertiary);">| DOHA PAVILION</span>
                <span class="badge badge-blue">FRONT DESK WORKSPACE</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <input type="text" placeholder="Search Patient, PUID, Qatar ID (Ctrl+K)..." style="width: 320px; height: 34px; padding: 0 12px; border: var(--border); border-radius: var(--radius); font-size: 12.5px; background: #FAFAF8;">
                <span class="badge badge-green">ONLINE</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; background: {accent_bar}; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">FD</div>
                    <span style="font-size: 13px; font-weight: 500;">Fatima Al-Kuwari</span>
                </div>
            </div>
        </header>
        
        <aside class="sidebar">
            <div>
                <p class="mono" style="padding: 0 20px 16px; color: #6E877C; border-bottom: 1px solid rgba(255,255,255,0.1);">NAVIGATION</p>
                <div style="padding-top: 12px;">
                    <a href="#" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; color: #FFF; background: rgba(255,255,255,0.06); text-decoration: none; border-left: 3px solid {accent_bar}; font-size: 13px;">
                        <span>01 / Today's Queue</span>
                        <span class="badge badge-red" style="font-size: 10px;">18</span>
                    </a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">02 / Patient Directory</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">03 / New Registration</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">04 / Appointment Scheduler</a>
                </div>
            </div>
            <div style="padding: 0 20px;">
                <p class="mono" style="color: #6E877C; font-size: 10px;">SERVER TELEMETRY</p>
                <p style="font-size: 11px; color: #8BA89D; margin-top: 4px;">Host: 34.7.237.8 (GCP)<br>DB: gnuhealth</p>
            </div>
        </aside>
        
        <main class="main-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <p class="mono" style="color: {accent_bar};">RECEPTION DESK / OUTPATIENT ADMISSIONS</p>
                    <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary);">Today's Patient Queue</h1>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-outline">+ Schedule Appointment</button>
                    <button class="btn btn-primary">+ Register New Patient</button>
                </div>
            </div>
            
            <!-- KPI Summary Strip -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="card" style="padding: 16px;">
                    <p class="mono" style="color: var(--text-tertiary);">TOTAL SCHEDULED TODAY</p>
                    <p style="font-size: 28px; font-weight: 700; margin-top: 4px;">42</p>
                    <span class="badge badge-blue" style="margin-top: 6px;">100% Slot Capacity</span>
                </div>
                <div class="card" style="padding: 16px;">
                    <p class="mono" style="color: var(--text-tertiary);">CHECKED IN (ARRIVED)</p>
                    <p style="font-size: 28px; font-weight: 700; color: #1B7A58; margin-top: 4px;">18</p>
                    <span class="badge badge-green" style="margin-top: 6px;">Ready for Triage</span>
                </div>
                <div class="card" style="padding: 16px;">
                    <p class="mono" style="color: var(--text-tertiary);">IN CLINICAL TRIAGE</p>
                    <p style="font-size: 28px; font-weight: 700; color: #C88728; margin-top: 4px;">6</p>
                    <span class="badge badge-amber" style="margin-top: 6px;">Nurse Evaluation</span>
                </div>
                <div class="card" style="padding: 16px;">
                    <p class="mono" style="color: var(--text-tertiary);">WITH PHYSICIAN</p>
                    <p style="font-size: 28px; font-weight: 700; color: {accent_bar}; margin-top: 4px;">8</p>
                    <span class="badge badge-red" style="margin-top: 6px;">Active Consultation</span>
                </div>
            </div>
            
            <!-- Patient Table -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 14px 20px; border-bottom: var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span class="mono" style="font-weight: 600;">ACTIVE OUTPATIENT APPOINTMENT QUEUE (SEPTEMBER 2026)</span>
                    <span style="font-size: 12px; color: var(--text-tertiary);">Showing 5 of 18 checked-in patients</span>
                </div>
                <table class="dense-table">
                    <thead>
                        <tr>
                            <th>TIME</th>
                            <th>PUID</th>
                            <th>PATIENT NAME</th>
                            <th>PHYSICIAN</th>
                            <th>SPECIALTY</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #FFF9FA;">
                            <td class="mono"><strong>09:00</strong></td>
                            <td class="mono" style="color: {accent_bar}; font-weight: 600;">P00088</td>
                            <td><strong>Alexander Wright</strong> <span class="badge badge-red" style="font-size: 9px; margin-left: 4px;">Penicillin Allergic</span></td>
                            <td>Dr. Gregory House</td>
                            <td>General Practice</td>
                            <td><span class="badge badge-green">Checked In</span></td>
                            <td><button class="btn btn-outline" style="padding: 4px 10px; font-size: 11px;">View Chart ↗</button></td>
                        </tr>
                        <tr>
                            <td class="mono"><strong>09:15</strong></td>
                            <td class="mono">P00089</td>
                            <td>Mariam Al-Thani</td>
                            <td>Dr. Sarah Jenkins</td>
                            <td>Cardiology</td>
                            <td><span class="badge badge-amber">In Triage</span></td>
                            <td><button class="btn btn-outline" style="padding: 4px 10px; font-size: 11px;">View Chart ↗</button></td>
                        </tr>
                        <tr>
                            <td class="mono"><strong>09:30</strong></td>
                            <td class="mono">P00090</td>
                            <td>Tariq Mansoor</td>
                            <td>Dr. Gregory House</td>
                            <td>General Practice</td>
                            <td><span class="badge badge-blue">Confirmed</span></td>
                            <td><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: {accent_bar};">CHECK IN</button></td>
                        </tr>
                        <tr>
                            <td class="mono"><strong>09:45</strong></td>
                            <td class="mono">P00091</td>
                            <td>Nouf Al-Marri</td>
                            <td>Dr. Gregory House</td>
                            <td>General Practice</td>
                            <td><span class="badge badge-blue">Confirmed</span></td>
                            <td><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: {accent_bar};">CHECK IN</button></td>
                        </tr>
                        <tr>
                            <td class="mono"><strong>10:00</strong></td>
                            <td class="mono">P00092</td>
                            <td>James Mitchell</td>
                            <td>Dr. Sarah Jenkins</td>
                            <td>Cardiology</td>
                            <td><span class="badge badge-blue">Confirmed</span></td>
                            <td><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px; background: {accent_bar};">CHECK IN</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
        
        <footer class="footer-bar">
            <span>Tryton 7.0.58 / GNU Health 5.0.6 Backend Active · PostgreSQL 15</span>
            <span class="mono">SESSION: demo_frontdesk1 (TOKEN: 681e3e65...)</span>
        </footer>
    </div>
    """
    return html_wrapper("Front Desk Dashboard", theme, body)

def build_patient_registration(theme):
    accent_bar = "#8A1538" if theme != "concept_a" else "#135D4F"
    body = f"""
    <div class="layout-shell">
        <header class="top-header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <span style="font-family: 'Bodoni Moda', serif; font-size: 20px; font-weight: 700; color: {accent_bar};">GNU HEALTH</span>
                <span class="mono" style="color: var(--text-tertiary);">| DOHA PAVILION</span>
                <span class="badge badge-blue">PATIENT ADMISSIONS</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span class="mono">MODE: SYNTHETIC DEMO REGISTRATION</span>
                <div style="width: 32px; height: 32px; background: {accent_bar}; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">FD</div>
            </div>
        </header>
        
        <aside class="sidebar">
            <div>
                <p class="mono" style="padding: 0 20px 16px; color: #6E877C; border-bottom: 1px solid rgba(255,255,255,0.1);">NAVIGATION</p>
                <div style="padding-top: 12px;">
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">01 / Today's Queue</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">02 / Patient Directory</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #FFF; background: rgba(255,255,255,0.06); text-decoration: none; border-left: 3px solid {accent_bar}; font-size: 13px;">
                        <span>03 / New Registration</span>
                    </a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">04 / Appointment Scheduler</a>
                </div>
            </div>
        </aside>
        
        <main class="main-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <p class="mono" style="color: {accent_bar};">MASTER PATIENT REGISTRY / TWO-STEP ENROLLMENT</p>
                    <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary);">Register New Patient</h1>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-outline">Cancel</button>
                    <button class="btn btn-primary" style="background: {accent_bar};">Save & Generate PUID</button>
                </div>
            </div>
            
            <!-- Warning Banner on Party Uniqueness -->
            <div style="background: #FFF5F5; border-left: 4px solid #8A1538; padding: 12px 18px; margin-bottom: 24px; border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #8A1538; font-size: 13px;">Important: Unique Person Constraint (gnuhealth_patient_name_uniq)</strong>
                    <p style="font-size: 12px; color: #4A5B53; margin-top: 2px;">The system checks existing records. If the person is already registered, update their existing file instead of creating a duplicate.</p>
                </div>
                <button class="btn btn-outline" style="font-size: 11px; padding: 4px 10px;">Search Master Directory</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <!-- Left Form: Demographics -->
                <div class="card">
                    <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 16px; border-bottom: var(--border); padding-bottom: 8px;">1. Person & Demographic Details</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>FULL LEGAL NAME (ENGLISH) *</label>
                            <input type="text" class="form-control" value="Alexander Wright">
                        </div>
                        <div class="form-group">
                            <label>FULL LEGAL NAME (ARABIC)</label>
                            <input type="text" class="form-control" value="ألكسندر رايت" style="font-family: 'Noto Sans Arabic', sans-serif;">
                        </div>
                        <div class="form-group">
                            <label>QATAR NATIONAL ID / PASSPORT *</label>
                            <input type="text" class="form-control" value="28863401928">
                        </div>
                        <div class="form-group">
                            <label>GENDER *</label>
                            <select class="form-control"><option selected>Male</option><option>Female</option></select>
                        </div>
                        <div class="form-group">
                            <label>DATE OF BIRTH *</label>
                            <input type="date" class="form-control" value="1988-04-14">
                        </div>
                        <div class="form-group">
                            <label>BLOOD GROUP</label>
                            <select class="form-control"><option selected>A+ (Positive)</option></select>
                        </div>
                    </div>
                    
                    <h3 style="font-size: 15px; font-weight: 600; margin: 20px 0 16px; border-bottom: var(--border); padding-bottom: 8px;">2. Contact Information</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>MOBILE NUMBER (QATAR +974)</label>
                            <input type="text" class="form-control" value="+974 5512 3456">
                        </div>
                        <div class="form-group">
                            <label>PRIMARY EMAIL ADDRESS</label>
                            <input type="email" class="form-control" value="alexander.wright@qatar-example.com">
                        </div>
                    </div>
                </div>
                
                <!-- Right Side: Critical Clinical Warnings -->
                <div>
                    <div class="card" style="margin-bottom: 20px;">
                        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #8A1538;">3. Critical Information & Safety</h3>
                        <div class="form-group">
                            <label>KNOWN DRUG ALLERGIES</label>
                            <textarea class="form-control" style="height: 70px; padding: 8px 12px;">Penicillin (causes mild cutaneous rash)</textarea>
                        </div>
                        <div class="form-group">
                            <label>CHRONIC CONDITIONS / NOTES</label>
                            <textarea class="form-control" style="height: 70px; padding: 8px 12px;">Mild seasonal rhinitis. No cardiac or diabetic history.</textarea>
                        </div>
                    </div>
                    
                    <div class="card" style="background: var(--bg-subtle);">
                        <p class="mono" style="color: var(--text-tertiary);">SYSTEM ALLOCATION</p>
                        <p style="font-size: 13px; font-weight: 600; margin: 6px 0;">PUID ASSIGNMENT: AUTO</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">Upon clicking Save, Tryton will allocate next medical record number: <strong>P00088</strong>.</p>
                    </div>
                </div>
            </div>
        </main>
        
        <footer class="footer-bar">
            <span>Model: gnuhealth.patient / party.party · Constraint Verified</span>
            <span class="mono">STATUS: DRAFT FORM</span>
        </footer>
    </div>
    """
    return html_wrapper("Patient Registration", theme, body)

def build_physician_consultation(theme):
    accent_bar = "#8A1538" if theme != "concept_a" else "#135D4F"
    body = f"""
    <div class="layout-shell">
        <header class="top-header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <span style="font-family: 'Bodoni Moda', serif; font-size: 20px; font-weight: 700; color: {accent_bar};">GNU HEALTH</span>
                <span class="mono" style="color: var(--text-tertiary);">| DOHA PAVILION</span>
                <span class="badge badge-red">PHYSICIAN CONSULTATION HUB</span>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 13px;"><strong>Dr. Gregory House, MD</strong> (General Practice)</span>
                <div style="width: 32px; height: 32px; background: {accent_bar}; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px;">GH</div>
            </div>
        </header>
        
        <aside class="sidebar">
            <div>
                <p class="mono" style="padding: 0 20px 16px; color: #6E877C; border-bottom: 1px solid rgba(255,255,255,0.1);">CLINICAL SUITE</p>
                <div style="padding-top: 12px;">
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">01 / Patient Worklist</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #FFF; background: rgba(255,255,255,0.06); text-decoration: none; border-left: 3px solid {accent_bar}; font-size: 13px;">
                        <span>02 / Active Consultation</span>
                    </a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">03 / Prescriptions Hub</a>
                    <a href="#" style="display: flex; align-items: center; padding: 12px 20px; color: #8BA89D; text-decoration: none; font-size: 13px;">04 / Lab & Imaging Hub</a>
                </div>
            </div>
            <div style="padding: 0 20px;">
                <button class="btn btn-outline" style="width: 100%; color: #FFF; border-color: rgba(255,255,255,0.2); font-size: 11px;">RELATE 360° EHR ↗</button>
            </div>
        </aside>
        
        <main class="main-content">
            <!-- Patient Header Banner -->
            <div class="card" style="padding: 16px 24px; margin-bottom: 20px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid {accent_bar};">
                <div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h2 style="font-size: 20px; font-weight: 700;">Alexander Wright</h2>
                        <span class="mono" style="font-weight: 600; color: {accent_bar};">PUID: P00088</span>
                        <span class="badge badge-green">Checked In</span>
                        <span class="badge badge-red">Allergy: Penicillin</span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Male · 38 Years (1988-04-14) · Qatar ID: 28863401928 · Encounter: EVAL-2026-0038</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-outline">Order Lab / Imaging</button>
                    <button class="btn btn-primary" style="background: {accent_bar};">Complete Evaluation & Sign</button>
                </div>
            </div>
            
            <!-- Vitals Summary Strip from Nurse Triage -->
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px;">
                <div class="card" style="padding: 10px 14px;">
                    <span class="mono" style="font-size: 10px; color: var(--text-tertiary);">BLOOD PRESSURE</span>
                    <p style="font-size: 18px; font-weight: 700; margin-top: 2px;">120/80 <small style="font-size: 10px;">mmHg</small></p>
                </div>
                <div class="card" style="padding: 10px 14px;">
                    <span class="mono" style="font-size: 10px; color: var(--text-tertiary);">HEART RATE</span>
                    <p style="font-size: 18px; font-weight: 700; margin-top: 2px;">72 <small style="font-size: 10px;">bpm</small></p>
                </div>
                <div class="card" style="padding: 10px 14px;">
                    <span class="mono" style="font-size: 10px; color: var(--text-tertiary);">TEMPERATURE</span>
                    <p style="font-size: 18px; font-weight: 700; margin-top: 2px;">37.0 <small style="font-size: 10px;">°C</small></p>
                </div>
                <div class="card" style="padding: 10px 14px;">
                    <span class="mono" style="font-size: 10px; color: var(--text-tertiary);">WEIGHT</span>
                    <p style="font-size: 18px; font-weight: 700; margin-top: 2px;">70 <small style="font-size: 10px;">kg</small></p>
                </div>
                <div class="card" style="padding: 10px 14px;">
                    <span class="mono" style="font-size: 10px; color: var(--text-tertiary);">HEIGHT</span>
                    <p style="font-size: 18px; font-weight: 700; margin-top: 2px;">175 <small style="font-size: 10px;">cm</small></p>
                </div>
                <div class="card" style="padding: 10px 14px; background: #EAF7F1; border-color: #C4EBD8;">
                    <span class="mono" style="font-size: 10px; color: #1B7A58;">CALCULATED BMI</span>
                    <p style="font-size: 18px; font-weight: 700; color: #1B7A58; margin-top: 2px;">22.86 <small style="font-size: 10px;">Normal</small></p>
                </div>
            </div>
            
            <!-- Consultation Clinical Tabs -->
            <div class="card">
                <div style="display: flex; gap: 24px; border-bottom: var(--border); padding-bottom: 12px; margin-bottom: 18px;">
                    <a href="#" style="font-weight: 600; color: {accent_bar}; text-decoration: none; border-bottom: 2px solid {accent_bar}; padding-bottom: 10px;">1. Clinical Assessment (SOAP)</a>
                    <a href="#" style="font-weight: 500; color: var(--text-secondary); text-decoration: none;">2. ICD-10 Diagnoses (J06.9)</a>
                    <a href="#" style="font-weight: 500; color: var(--text-secondary); text-decoration: none;">3. Prescriptions (Amoxicillin 500mg)</a>
                    <a href="#" style="font-weight: 500; color: var(--text-secondary); text-decoration: none;">4. Diagnostic Orders (CBC, X-Ray)</a>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div class="form-group">
                            <label>CHIEF COMPLAINT (SUBJECTIVE)</label>
                            <textarea class="form-control" style="height: 70px; padding: 8px 12px;">Acute sore throat, non-productive cough, and mild malaise for 3 days.</textarea>
                        </div>
                        <div class="form-group">
                            <label>PHYSICAL EXAMINATION FINDINGS (OBJECTIVE)</label>
                            <textarea class="form-control" style="height: 70px; padding: 8px 12px;">Pharyngeal erythema present. Tonsils non-hypertrophic without purulent exudate. Bilateral breath sounds clear, no wheezes or rales.</textarea>
                        </div>
                    </div>
                    <div>
                        <div class="form-group">
                            <label>PRIMARY PATHOLOGY DIAGNOSIS (ICD-10) *</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" class="form-control" value="J06.9 — Acute upper respiratory infection, unspecified" readonly style="background: #FAFAF8;">
                                <button class="btn btn-outline" style="padding: 0 12px;">Search</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>ACTIVE PRESCRIPTION ORDER (RX-2026-0029)</label>
                            <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius); border: var(--border);">
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>Amoxicillin 500mg capsule</strong>
                                    <span class="badge badge-green">Approved</span>
                                </div>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Dose: 500 mg · Route: Oral · Frequency: TID (3x daily) · Duration: 7 Days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <footer class="footer-bar">
            <span>Evaluation: gnuhealth.patient.evaluation (EVAL-2026-0038) · Status: In Progress</span>
            <span class="mono">PHYSICIAN: demo_dr1</span>
        </footer>
    </div>
    """
    return html_wrapper("Physician Consultation", theme, body)

# -----------------------------------------------------------------------------
# Main Execution Runner
# -----------------------------------------------------------------------------

def generate_all_mockups():
    print("Generating HTML templates and rendering 12 high-fidelity mockups via Chrome...")
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1600,1000")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=opts)
    
    concepts = [
        ("concept_a", "design/frontend_wireframes/concept_a"),
        ("concept_b", "design/frontend_wireframes/concept_b"),
        ("concept_c", "design/frontend_wireframes/concept_c")
    ]
    
    screens = [
        ("01_login", build_login_screen),
        ("02_frontdesk_dashboard", build_frontdesk_dashboard),
        ("03_patient_registration", build_patient_registration),
        ("04_physician_consultation", build_physician_consultation)
    ]
    
    try:
        for c_key, c_dir in concepts:
            dest_dir = os.path.abspath(c_dir)
            os.makedirs(dest_dir, exist_ok=True)
            print(f"\n--- RENDERING {c_key.upper()} ---")
            for s_name, s_builder in screens:
                html_content = s_builder(c_key)
                html_file = os.path.join(SCRATCH_DIR, f"{c_key}_{s_name}.html")
                with open(html_file, "w", encoding="utf-8") as f:
                    f.write(html_content)
                    
                driver.get(f"file:///{html_file.replace(os.sep, '/')}")
                time.sleep(2) # Allow web fonts to load
                out_png = os.path.join(dest_dir, f"{s_name}.png")
                driver.save_screenshot(out_png)
                print(f"Rendered: {out_png}")
                
        print("\nALL 12 HIGH-FIDELITY MOCKUPS SUCCESSFULLY RENDERED!")
    finally:
        driver.quit()

if __name__ == "__main__":
    generate_all_mockups()
