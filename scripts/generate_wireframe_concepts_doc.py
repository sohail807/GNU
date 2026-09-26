import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_OUT = os.path.abspath("design/frontend_wireframes/FRONTEND_WIREFRAME_CONCEPTS.docx")
PDF_OUT = os.path.abspath("design/frontend_wireframes/FRONTEND_WIREFRAME_CONCEPTS.pdf")
IMG_DIR = os.path.abspath("design/frontend_wireframes")

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout(doc, text, title="DESIGN NOTE", bg_color="F8F9F5", border_color="8A1538"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_title = p.add_run(f"[{title}] ")
    run_title.bold = True
    run_title.font.name = "Arial"
    run_title.font.size = Pt(9.5)
    run_title.font.color.rgb = RGBColor(138, 21, 56) if border_color == "8A1538" else RGBColor(19, 93, 79)
    
    run_text = p.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(50, 50, 50)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_row(row, heights=None, bg_color=None):
    for cell in row.cells:
        if bg_color:
            set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

def build_document():
    doc = docx.Document()
    
    # Page setup - Standard Letter, 0.75" margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("GNU HEALTH HMIS · OUTPATIENT CLINIC FRONTEND UX PROPOSAL")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = RGBColor(140, 140, 140)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        frun1 = fp.add_run("CONFIDENTIAL & PROPRIETARY — DOHA, QATAR CLINIC DESIGN PROPOSAL")
        frun1.font.name = "Arial"
        frun1.font.size = Pt(8)
        frun1.font.color.rgb = RGBColor(150, 150, 150)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)
    
    # -------------------------------------------------------------------------
    # COVER / TITLE BLOCK
    # -------------------------------------------------------------------------
    p_kicker = doc.add_paragraph()
    p_kicker.paragraph_format.space_before = Pt(30)
    p_kicker.paragraph_format.space_after = Pt(4)
    run_kicker = p_kicker.add_run("PHASE 10 UX DESIGN DELIVERABLE · VISUAL PROPOSAL & WIREFRAME CONCEPTS")
    run_kicker.font.name = "Arial"
    run_kicker.font.size = Pt(9.5)
    run_kicker.font.bold = True
    run_kicker.font.color.rgb = RGBColor(138, 21, 56) # Qatari Maroon
    
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("GNU Health HMIS — Outpatient Clinic")
    run_title.font.name = "Georgia"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(17, 24, 21)
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(18)
    run_sub = p_sub.add_run("Next-Generation Frontend Experience: Three High-Fidelity Visual Directions Inspired by TFSF Ventures Editorial Aesthetics, Adapted for Qatari Private Healthcare Usability")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(80, 95, 88)
    
    # Meta table
    meta_tbl = doc.add_table(rows=4, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    meta_tbl.columns[0].width = Inches(2.2)
    meta_tbl.columns[1].width = Inches(4.3)
    
    meta_data = [
        ("Project Scope:", "Phase 1 - 10 Design Proposal (Strictly Design; Zero Frontend Code)"),
        ("Target Facility:", "Sophisticated Private Outpatient Clinic (Doha, Qatar)"),
        ("Backend System of Record:", "GNU Health 7.0 / Tryton ERP (PostgreSQL Native JSON-RPC)"),
        ("Status / Gate:", "Awaiting Stakeholder Decision on Visual Direction (Concept A, B, or C)")
    ]
    for idx, (lbl, val) in enumerate(meta_data):
        row = meta_tbl.rows[idx]
        format_row(row, bg_color="F8F9F5" if idx % 2 == 0 else "FFFFFF")
        p0 = row.cells[0].paragraphs[0]
        r0 = p0.add_run(lbl)
        r0.font.bold = True
        r0.font.size = Pt(9)
        p1 = row.cells[1].paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(9)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(16)
    
    add_callout(
        doc,
        "This deliverable presents three distinct, fully rendered visual directions for the outpatient clinic frontend, including full desktop high-fidelity mockups of the four foundational workflows: Authentication, Front Desk Reception, Patient Registration, and Physician Clinical Consultation. In accordance with Phase 10 directives, implementation remains frozen until explicit stakeholder direction is selected.",
        title="DESIGN PHASE DIRECTIVE & APPROVAL GATE",
        bg_color="FBEBED",
        border_color="8A1538"
    )
    
    doc.add_page_break()
    
    # -------------------------------------------------------------------------
    # SECTION 1: DESIGN REFERENCE SYNTHESIS (TFSF VENTURES)
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("1. Design Reference Synthesis & Architectural Translation")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(17, 24, 21)
    
    p = doc.add_paragraph()
    p.add_run(
        "A live technical inspection of TFSF Ventures (https://www.tfsfventures.com/#home) was conducted via Chrome DevTools Protocol. TFSF exhibits a world-class editorial aesthetic characterized by a bespoke limestone ivory canvas, crisp obsidian typography, high-contrast serif display typography, monospace metadata kickers, and strict 0px border-radii. Below is the architectural translation matrix showing how these luxury venture capital elements are rigorously adapted to meet the clinical safety, contrast, and high-throughput demands of an outpatient hospital in Qatar:"
    )
    p.paragraph_format.space_after = Pt(10)
    
    # Matrix Table
    tbl = doc.add_table(rows=6, cols=3)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(1.8)
    tbl.columns[1].width = Inches(2.3)
    tbl.columns[2].width = Inches(2.4)
    
    headers = ["Design Element", "TFSF Ventures Live Finding", "Outpatient Clinic Adaptation"]
    for i, h in enumerate(headers):
        cell = tbl.cell(0, i)
        set_cell_background(cell, "121916")
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    rows_data = [
        ("Background Canvas", "Soft ivory/limestone (#F4F6F1, rgb(244,246,241))", "Alabaster Ivory (#F8F9F5 / #FFFFFF cards). Eliminates clinical glare while maintaining sterile cleanliness."),
        ("Typography & Display", "Serif Bodoni Moda headline + Geist Sans + Geist Mono", "Dual-font system: Geist / Geist Mono for clinical telemetry + Bodoni Moda for executive headers."),
        ("Accents & Palette", "Deep forest jade (#135D4F) + Pale mint (#E7F0ED)", "Qatari Maroon (#8A1538) primary + Restrained Desert Gold (#C5A880) + Obsidian (#111815)."),
        ("Border Radii & Structure", "Strict 0px rectangular edges, hairline 1px borders", "Concept A retains 0px. Concepts B & C adopt 2px-4px micro-radii to optimize touch targets on medical tablets."),
        ("Information Density", "Generous whitespace, single-column prose", "Dense multi-column clinical cards with monospace tabular numerals for rapid vital sign triage.")
    ]
    
    for row_idx, rdata in enumerate(rows_data):
        row = tbl.rows[row_idx + 1]
        format_row(row, bg_color="F8F9F5" if row_idx % 2 == 0 else "FFFFFF")
        for col_idx, text in enumerate(rdata):
            p = row.cells[col_idx].paragraphs[0]
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            if col_idx == 0:
                r.font.bold = True
                
    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    doc.add_page_break()
    
    # -------------------------------------------------------------------------
    # SECTION 2: THE THREE VISUAL DIRECTIONS OVERVIEW
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r = h1.add_run("2. Executive Overview of the Three Visual Directions")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(17, 24, 21)
    
    p = doc.add_paragraph()
    p.add_run(
        "To provide executive leadership with a clear architectural choice before committing to the full 30+ screen specification, three distinct concepts have been formulated, each addressing the clinic's workflow from a unique perspective:"
    )
    p.paragraph_format.space_after = Pt(10)
    
    c_overview = [
        ("Concept A — Editorial Minimalism", "Closest direct translation of the TFSF Ventures digital identity. Features sharp 0px corners, high-contrast Bodoni Moda display serifs, deep forest obsidian and jade accents (#135D4F), and generous whitespace. Ideal for high-end boutique concierge practices desiring an avant-garde aesthetic."),
        ("Concept B — Qatari Contemporary (RECOMMENDED)", "Harmonizes TFSF's editorial layout rhythm with the national prestige and warmth of Qatar. Built on a tailored Alabaster Ivory canvas (#F8F9F5), official Qatari Maroon accents (#8A1538), subtle Desert Gold borders (#C5A880), and ergonomic 3px micro-radii. Engineered specifically for bilingual English/Arabic outpatient healthcare."),
        ("Concept C — Clinical Executive", "Optimized for high-volume, multi-specialty clinical throughput. Employs a crisp cool-pearl canvas (#F4F6FA), slate navy navigation (#16202C), subtle maroon badges, 4px micro-radii, and maximized tabular density. Provides the highest data-per-pixel ratio for intense clinical environments.")
    ]
    
    for title, desc in c_overview:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(f"• {title}: ")
        r_t.font.bold = True
        r_t.font.color.rgb = RGBColor(138, 21, 56) if "RECOMMENDED" in title else RGBColor(17, 24, 21)
        r_d = p.add_run(desc)
        r_d.font.size = Pt(9.5)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # -------------------------------------------------------------------------
    # SECTION 3: CONCEPT A SCREENS
    # -------------------------------------------------------------------------
    doc.add_page_break()
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Concept A — Editorial Minimalism (TFSF Heritage)")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(19, 93, 79)
    
    p = doc.add_paragraph()
    p.add_run("Palette: Canvas #F4F6F1 · Text #071512 · Accent #135D4F · Radius 0px · Display: Bodoni Moda Serif")
    p.paragraph_format.space_after = Pt(12)
    
    concept_a_screens = [
        ("01_login.png", "A.1 Authentication Portal — Minimalist Split Layout", 
         "Features an editorial split-screen with Bodoni Moda headlines, a live Tryton JSON-RPC endpoint indicator, role badges, and zero-radius form controls.",
         [("1. Clinic Branding", "Bodoni Moda serif typography establishing private healthcare luxury."),
          ("2. Role Selector Tabs", "Direct role switcher mapped to GNU Health access profiles."),
          ("3. Security Indicators", "Clear session expiry and SSL/TLS verification telemetry.")]),
         
        ("02_frontdesk_dashboard.png", "A.2 Front Desk Reception Dashboard — High-Whitespace Layout",
         "Presents clean daily operational metrics, quick check-in queues, and patient intake actions framed by hairline obsidian borders.",
         [("1. Monospace Kickers", "Geist Mono uppercase badges identifying clinic context."),
          ("2. Quick Check-In Queue", "Direct action buttons invoking native apt_checkin methods."),
          ("3. Today's Statistics", "Clean numerical cards without heavy drop-shadows or clutter.")]),
          
        ("03_patient_registration.png", "A.3 Patient Registration — Structured Data Entry Grid",
         "Strict, clean multi-column form respecting party and patient relational uniqueness constraints (gnuhealth_patient_name_uniq).",
         [("1. PUID Auto-Sequence", "Live backend PUID issuance display (e.g., P00088)."),
          ("2. Civil Identity Group", "Validated Qatar ID (QID) entry with 11-digit mask."),
          ("3. Action Bar", "Direct 'Register & Create Appointment' Tryton atomic transaction.")]),
          
        ("04_physician_consultation.png", "A.4 Physician Clinical Consultation — SOAP Cockpit",
         "Integrated consultation workspace uniting patient banner telemetry, SOAP clinical documentation, ICD-10 diagnosis picker, and prescription ordering.",
         [("1. Patient Banner", "Immediate vital sign chips with clinical threshold warnings."),
          ("2. SOAP Note Fields", "Structured subjective and objective physical exam capture."),
          ("3. E-Prescription Line", "Integrated medicament ordering linked to pharmacy inventory.")])
    ]
    
    for fn, screen_title, screen_desc, annotations in concept_a_screens:
        h2 = doc.add_heading(level=2)
        h2.paragraph_format.space_before = Pt(8)
        h2.paragraph_format.space_after = Pt(4)
        r = h2.add_run(screen_title)
        r.font.name = "Georgia"
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(17, 24, 21)
        
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        r_desc = p.add_run(screen_desc)
        r_desc.font.size = Pt(9)
        r_desc.font.italic = True
        
        img_path = os.path.join(IMG_DIR, "concept_a", fn)
        if os.path.exists(img_path):
            doc.add_picture(img_path, width=Inches(6.5))
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(8)
            rcap = p_cap.add_run(f"Figure: High-Fidelity Mockup — {screen_title} (Concept A · 1600x1000 Native)")
            rcap.font.size = Pt(8)
            rcap.font.italic = True
            rcap.font.color.rgb = RGBColor(100, 100, 100)
            
        # Annotation Table
        tbl = doc.add_table(rows=len(annotations)+1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(2.2)
        tbl.columns[1].width = Inches(4.3)
        format_row(tbl.rows[0], bg_color="135D4F")
        r0 = tbl.rows[0].cells[0].paragraphs[0].add_run("Key Interface Component")
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = RGBColor(255, 255, 255)
        r1 = tbl.rows[0].cells[1].paragraphs[0].add_run("Functional Specification & Tryton Backend Mapping")
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(255, 255, 255)
        
        for idx, (comp, spec) in enumerate(annotations):
            row = tbl.rows[idx+1]
            format_row(row, bg_color="F4F6F1" if idx % 2 == 0 else "FFFFFF")
            rc = row.cells[0].paragraphs[0].add_run(comp)
            rc.font.bold = True
            rc.font.size = Pt(8)
            rs = row.cells[1].paragraphs[0].add_run(spec)
            rs.font.size = Pt(8)
            
        doc.add_paragraph().paragraph_format.space_after = Pt(12)
        doc.add_page_break()
        
    # -------------------------------------------------------------------------
    # SECTION 4: CONCEPT B SCREENS (RECOMMENDED)
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Concept B — Qatari Contemporary (RECOMMENDED DIRECTION)")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(138, 21, 56)
    
    p = doc.add_paragraph()
    p.add_run("Palette: Canvas #F8F9F5 · Text #111815 · Accent #8A1538 (Qatari Maroon) · Gold #C5A880 · Radius 3px · Bilingual Ready")
    p.paragraph_format.space_after = Pt(12)
    
    add_callout(
        doc,
        "CONCEPT B RATIONALE: Concept B represents the most culturally aligned and clinically balanced interface for a premier outpatient facility in Qatar. It infuses authentic Qatari maroon (#8A1538) and subtle desert gold (#C5A880) into the clean typography and spatial discipline of the TFSF reference. Micro-radii of 3px improve touch ergonomics on clinical tablets without compromising architectural elegance.",
        title="PRIMARY RECOMMENDATION FOR STAKEHOLDER APPROVAL",
        bg_color="FBEBED",
        border_color="8A1538"
    )
    
    concept_b_screens = [
        ("01_login.png", "B.1 Authentication Portal — Qatari Luxury Identity", 
         "Features an authentic Qatari maroon and gold identity badge, clear bilingual Arabic/English role switchers, and high-visibility secure credential input.",
         [("1. Qatari Emblem Badge", "Hexagonal gold and maroon crest with bilingual Arabic typography."),
          ("2. Outpatient Clinic Subtitle", "Arabic clinical subtitle 'العيادات الخارجية' alongside English text."),
          ("3. Role Gateway Badges", "Pre-configured role profiles for Reception, Nursing, Doctors, Lab, Imaging, Cashier.")]),
         
        ("02_frontdesk_dashboard.png", "B.2 Front Desk Reception Dashboard — Qatari Contemporary",
         "Delivers warm alabaster surfaces with maroon accents, rapid patient check-in workflows, and real-time waiting room telemetry.",
         [("1. Daily Clinic KPIs", "Patient volume, pending arrivals, and cashier collection counters."),
          ("2. Arabic Bilingual Headers", "Subtle Arabic labels for clinic wings and reception stations."),
          ("3. Quick Check-In CTA", "High-visibility primary action button styled in official maroon.")]),
          
        ("03_patient_registration.png", "B.3 Patient Registration — QID & Civil Registry Standards",
         "Spacious, highly legible demographic intake form engineered for Qatari citizens and residents, with QID formatting and emergency contacts.",
         [("1. Legal Identity Card", "Official Qatar ID Number with validation checksum styling."),
          ("2. Bilingual Patient Name", "English Romanized full name paired with Arabic legal name."),
          ("3. Insurance Integration", "Direct linkage to national healthcare schemes and private carriers.")]),
          
        ("04_physician_consultation.png", "B.4 Physician Clinical Consultation — Qatar Outpatient Cockpit",
         "Comprehensive clinical workstation featuring instant patient history, abnormal lab alerts, interactive SOAP documentation, and ICD-10 diagnosis picker.",
         [("1. Clinical Header Banner", "Alexander Wright (PUID: P00088), Age 42, Allergy Alerts."),
          ("2. Vitals Telemetry Row", "Heart rate, BP (122/78), Temp (38.1°C alert), SpO2 with status tags."),
          ("3. Prescription Action Bar", "Tryton-backed e-Prescription with dosage frequency and duration.")])
    ]
    
    for fn, screen_title, screen_desc, annotations in concept_b_screens:
        h2 = doc.add_heading(level=2)
        h2.paragraph_format.space_before = Pt(8)
        h2.paragraph_format.space_after = Pt(4)
        r = h2.add_run(screen_title)
        r.font.name = "Georgia"
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(17, 24, 21)
        
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        r_desc = p.add_run(screen_desc)
        r_desc.font.size = Pt(9)
        r_desc.font.italic = True
        
        img_path = os.path.join(IMG_DIR, "concept_b", fn)
        if os.path.exists(img_path):
            doc.add_picture(img_path, width=Inches(6.5))
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(8)
            rcap = p_cap.add_run(f"Figure: High-Fidelity Mockup — {screen_title} (Concept B · 1600x1000 Native)")
            rcap.font.size = Pt(8)
            rcap.font.italic = True
            rcap.font.color.rgb = RGBColor(100, 100, 100)
            
        # Annotation Table
        tbl = doc.add_table(rows=len(annotations)+1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(2.2)
        tbl.columns[1].width = Inches(4.3)
        format_row(tbl.rows[0], bg_color="8A1538")
        r0 = tbl.rows[0].cells[0].paragraphs[0].add_run("Key Interface Component")
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = RGBColor(255, 255, 255)
        r1 = tbl.rows[0].cells[1].paragraphs[0].add_run("Functional Specification & Tryton Backend Mapping")
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(255, 255, 255)
        
        for idx, (comp, spec) in enumerate(annotations):
            row = tbl.rows[idx+1]
            format_row(row, bg_color="F8F9F5" if idx % 2 == 0 else "FFFFFF")
            rc = row.cells[0].paragraphs[0].add_run(comp)
            rc.font.bold = True
            rc.font.size = Pt(8)
            rs = row.cells[1].paragraphs[0].add_run(spec)
            rs.font.size = Pt(8)
            
        doc.add_paragraph().paragraph_format.space_after = Pt(12)
        doc.add_page_break()
        
    # -------------------------------------------------------------------------
    # SECTION 5: CONCEPT C SCREENS
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Concept C — Clinical Executive (High-Density Enterprise)")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(22, 32, 44)
    
    p = doc.add_paragraph()
    p.add_run("Palette: Canvas #F4F6FA · Text #0F172A · Header #16202C · Accent #8A1538 · Radius 4px · Enterprise Density")
    p.paragraph_format.space_after = Pt(12)
    
    concept_c_screens = [
        ("01_login.png", "C.1 Authentication Portal — Clinical Enterprise Login", 
         "Presents a high-security, dark-accented enterprise shell with department telemetry and direct Tryton database selector.",
         [("1. Department Hubs", "Instant visual badges for Outpatient, Inpatient, Diagnostics."),
          ("2. Authentication Telemetry", "Tryton 7.0 session verification badge and SSL fingerprint."),
          ("3. Dense Layout", "Minimal decorative margin; maximized input focus.")]),
         
        ("02_frontdesk_dashboard.png", "C.2 Front Desk Reception Dashboard — Dense Telemetry Grid",
         "High-throughput reception console with multi-counter metrics, active queue tables, and fast-action patient routing buttons.",
         [("1. Metric Telemetry Cards", "Compact, high-contrast numerical stats for wait times and queues."),
          ("2. Multi-Column Patient Table", "Sortable, searchable queue with instant Check-In triggers."),
          ("3. Status Filtering", "One-click toggles for Arrived, Triage, Waiting Doctor, Completed.")]),
          
        ("03_patient_registration.png", "C.3 Patient Registration — Compact High-Density Grid",
         "Single-screen unified intake layout maximizing form field visibility to reduce physician and reception scrolling.",
         [("1. Grid Layout", "Optimized 2-column compact form with 4px rounded borders."),
          ("2. Inline Validation", "Instant visual green/red feedback on QID and DOB fields."),
          ("3. Direct Relational Save", "Direct execution of party and patient Tryton models.")]),
          
        ("04_physician_consultation.png", "C.4 Physician Clinical Consultation — 3-Panel Cockpit",
         "Clinical cockpit displaying vital sign history, physical exam documentation, ICD-10 search, and electronic prescription lines.",
         [("1. High-Density Banner", "Compact patient header with real-time triage vitals values."),
          ("2. Dual-Panel Documentation", "Simultaneous display of Subjective history and Objective exam."),
          ("3. Prescription Ledger", "Direct Tryton prescription line item list with instant dosage edit.")])
    ]
    
    for fn, screen_title, screen_desc, annotations in concept_c_screens:
        h2 = doc.add_heading(level=2)
        h2.paragraph_format.space_before = Pt(8)
        h2.paragraph_format.space_after = Pt(4)
        r = h2.add_run(screen_title)
        r.font.name = "Georgia"
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(17, 24, 21)
        
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        r_desc = p.add_run(screen_desc)
        r_desc.font.size = Pt(9)
        r_desc.font.italic = True
        
        img_path = os.path.join(IMG_DIR, "concept_c", fn)
        if os.path.exists(img_path):
            doc.add_picture(img_path, width=Inches(6.5))
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(8)
            rcap = p_cap.add_run(f"Figure: High-Fidelity Mockup — {screen_title} (Concept C · 1600x1000 Native)")
            rcap.font.size = Pt(8)
            rcap.font.italic = True
            rcap.font.color.rgb = RGBColor(100, 100, 100)
            
        # Annotation Table
        tbl = doc.add_table(rows=len(annotations)+1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(2.2)
        tbl.columns[1].width = Inches(4.3)
        format_row(tbl.rows[0], bg_color="16202C")
        r0 = tbl.rows[0].cells[0].paragraphs[0].add_run("Key Interface Component")
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = RGBColor(255, 255, 255)
        r1 = tbl.rows[0].cells[1].paragraphs[0].add_run("Functional Specification & Tryton Backend Mapping")
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(255, 255, 255)
        
        for idx, (comp, spec) in enumerate(annotations):
            row = tbl.rows[idx+1]
            format_row(row, bg_color="F4F6FA" if idx % 2 == 0 else "FFFFFF")
            rc = row.cells[0].paragraphs[0].add_run(comp)
            rc.font.bold = True
            rc.font.size = Pt(8)
            rs = row.cells[1].paragraphs[0].add_run(spec)
            rs.font.size = Pt(8)
            
        doc.add_paragraph().paragraph_format.space_after = Pt(12)
        doc.add_page_break()
        
    # -------------------------------------------------------------------------
    # SECTION 6: COMPARATIVE MATRIX & SELECTION RATIONALE
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Side-by-Side Architectural Comparison")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(17, 24, 21)
    
    p = doc.add_paragraph()
    p.add_run("The following comparative evaluation assesses the three concepts against critical aesthetic, clinical, and technical parameters:")
    p.paragraph_format.space_after = Pt(10)
    
    comp_tbl = doc.add_table(rows=8, cols=4)
    comp_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_tbl.autofit = False
    comp_tbl.columns[0].width = Inches(1.8)
    comp_tbl.columns[1].width = Inches(1.5)
    comp_tbl.columns[2].width = Inches(1.6)
    comp_tbl.columns[3].width = Inches(1.6)
    
    format_row(comp_tbl.rows[0], bg_color="111815")
    chdrs = ["Evaluation Dimension", "Concept A (Editorial)", "Concept B (Qatari Contemp.)", "Concept C (Clinical Exec.)"]
    for c_i, ch in enumerate(chdrs):
        p = comp_tbl.rows[0].cells[c_i].paragraphs[0]
        r = p.add_run(ch)
        r.font.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    comp_rows = [
        ("TFSF Ventures Fidelity", "Highest (Exact 0px, Jade)", "High (Adapted for Qatar)", "Moderate (Dense Enterprise)"),
        ("Qatari Cultural Alignment", "Moderate (Venture aesthetic)", "Highest (Maroon & Gold)", "Moderate (Neutral Slate)"),
        ("Clinical Touch Ergonomics", "Fair (Strict 0px borders)", "Superior (3px micro-radii)", "Good (4px rounded corners)"),
        ("Visual Fatigue (8h Shift)", "Low (Warm limestone)", "Lowest (Alabaster ivory)", "Low-Moderate (Cool slate)"),
        ("Data Density / Screen", "Moderate (Generous space)", "Balanced (High legibility)", "Maximum (Dense compact)"),
        ("Bilingual English/Arabic", "English-centric typography", "Native bilingual balance", "Bilingual capable"),
        ("Recommendation Status", "Viable Alternative", "STRONGLY RECOMMENDED", "Viable Alternative")
    ]
    
    for r_idx, rvals in enumerate(comp_rows):
        row = comp_tbl.rows[r_idx + 1]
        is_rec = "RECOMMENDED" in rvals[2]
        bg = "FBEBED" if is_rec else ("F8F9F5" if r_idx % 2 == 0 else "FFFFFF")
        format_row(row, bg_color=bg)
        for col_idx, val in enumerate(rvals):
            p = row.cells[col_idx].paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8)
            if col_idx == 0 or (col_idx == 2 and is_rec):
                r.font.bold = True
                if col_idx == 2 and is_rec:
                    r.font.color.rgb = RGBColor(138, 21, 56)
                    
    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    
    # -------------------------------------------------------------------------
    # SECTION 7: APPROVAL GATE & NEXT STEPS
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. Stakeholder Sign-Off & Phase 5 Execution Roadmap")
    r.font.name = "Georgia"
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(138, 21, 56)
    
    p = doc.add_paragraph()
    p.add_run(
        "Upon stakeholder selection and sign-off on the preferred visual direction (Concept A, Concept B, or Concept C), the design lifecycle immediately expands into Phase 5 through Phase 9 without any delay:"
    )
    p.paragraph_format.space_after = Pt(8)
    
    steps = [
        ("Step 1: Visual Direction Selection", "Stakeholder selects Concept A, B, or C as the binding visual foundation."),
        ("Step 2: Complete Screen Collection (Phase 5)", "Generation of the full 30+ desktop screens covering Reception, Nursing Triage, Physician Consultation, Laboratory Diagnostics, Radiology Imaging, Cashier Billing, and Administration."),
        ("Step 3: Component-Level Annotated Wireframes (Phase 6)", "Numbered component callouts, exact Tryton data bindings, and role permission matrices for every single screen."),
        ("Step 4: End-to-End Workflow Diagramming (Phase 7)", "Visual sequence flows tracking Alexander Wright (P00088) across all 7 outpatient clinical and financial stations."),
        ("Step 5: Responsive Adaptations (Phase 8)", "Tablet (1024x768) and Mobile (390x844) responsive layouts for nursing triage tablets and mobile physician on-call views.")
    ]
    for s_title, s_desc in steps:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        r0 = p.add_run(f"• {s_title}: ")
        r0.font.bold = True
        r1 = p.add_run(s_desc)
        r1.font.size = Pt(9)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(16)
    
    add_callout(
        doc,
        "STAKEHOLDER ACTION REQUIRED: Please review the three directions presented in this document and state your chosen concept (Concept A, Concept B, or Concept C). Upon receipt of your approval, Phase 5 generation will commence.",
        title="STOP DIRECTIVE — AWAITING STAKEHOLDER APPROVAL",
        bg_color="FBEBED",
        border_color="8A1538"
    )
    
    print(f"Saving compiled DOCX to: {DOCX_OUT}")
    doc.save(DOCX_OUT)
    print("DOCX successfully saved!")

if __name__ == "__main__":
    build_document()
