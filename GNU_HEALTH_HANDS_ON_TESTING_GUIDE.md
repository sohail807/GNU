# GNU HEALTH HMIS — HANDS-ON OPERATIONAL TESTING GUIDE
## Step-by-Step E2E Clinical & Financial Transaction Walkthrough

**Target Environment:** `http://34.7.237.8/#gnuhealth`  
**Database:** `gnuhealth` (automatically selected)  
**System Version:** GNU Health HMIS 5.0.6 / Tryton 7.0.58  
**Standard Currency:** Qatari Riyal (`QAR`)  

---

## 🔑 Operational Credentials Quick Reference

> [!IMPORTANT]
> **Passwords are strictly case-sensitive!**  
> Notice that all passwords use **PascalCase** (Capital letters on each word) and end with an exclamation mark (`!`).  
> *Pay special attention to Front Desk:* **`FrontDesk2026!`** *(with a capital `D`)*.

| Department / Role | Username | Exact Password | Key Operational Scope |
| :--- | :--- | :--- | :--- |
| **Front Desk Reception** | `demo_frontdesk1` | **`FrontDesk2026!`** | Patient registration, scheduling, check-in |
| **Triage Nurse** | `demo_nurse1` | **`Nurse2026!`** | Triage queue, vital signs, anthropometry (BMI) |
| **Attending Doctor** | `demo_dr1` | **`Doctor2026!`** | Consultation, SOAP notes, ICD-10 diagnosis, e-Prescriptions |
| **Laboratory Tech** | `demo_lab1` | **`Lab2026!`** | Specimen analysis, CBC analytes, test validation |
| **Radiology Tech** | `demo_rad1` | **`Rad2026!`** | Imaging orders, Chest X-Ray execution & findings |
| **Cashier / Billing** | `demo_cashier1` | **`Cashier2026!`** | Service invoicing, cash collection, General Ledger |
| **System Administrator** | `admin` | **`Admin12345!`** | Full system configuration, accounting, user roles |

---

## 🧭 How to Log In & Navigate the UI

1. Open your browser to: **`http://34.7.237.8/#gnuhealth`**
2. In the login box, enter the **User name** $\rightarrow$ press **Enter** (or click **LOGIN**).
3. In the popup modal titled *"Password for `<user>`"*, enter the **Password** $\rightarrow$ press **Enter** (or click **OK**).
4. **Key UI Toolbar Icons:**
   - **`+` (New):** Creates a new blank record.
   - **💾 (Floppy Disk):** Saves the current record.
   - **⚡ / Action Buttons:** Text buttons located at the top or inside the form (e.g. `CHECK IN`, `DONE`, `CREATE`, `POST`, `PAY`).
   - **🔗 (Relate):** Shows all linked medical records for that patient.
   - **🚪 (Logout):** Located at the top-right corner to exit the session.

---

## STEP 1: Patient Registration (Front Desk)

*Goal: Register a new patient and verify automatic generation of the medical record number (PUID).*

1. **Log in:**
   - Username: `demo_frontdesk1`
   - Password: **`FrontDesk2026!`**
2. **Navigate:** Left sidebar menu $\rightarrow$ **Health** $\rightarrow$ **Patients** $\rightarrow$ **Patients**  
   *(Or type `Patients` in the top search bar).*
3. **Create Record:** Click the **`+` (New)** icon in the top toolbar.
4. **Fill In:**
   - **Patient:** Type your test patient's full name (e.g., `AHMED AL-MANSOORI`).
   - Press **Tab** (or click outside). A prompt will ask to create the new person. Click **Create** / **OK**.
   - **Gender:** Select `Male` or `Female`.
   - **Date of birth:** Enter `01/01/1990`.
5. **Save:** Click the **💾 (Save)** icon in the top toolbar.

> [!TIP]
> **Verification Checkpoint 1:** Notice that GNU Health instantly generates an official, unique Medical Record Number (**PUID**) like `KQI816APL`. Keep this patient's name in mind for the following steps.

> [!IMPORTANT]
> **Editing Patient Clinical Information & Focus Markers:**  
> In GNU Health, each person can only have **one** registered patient file (`Unique(party)`). Once saved, to enter additional clinical information (Critical info, blood type, allergies, or focus markers), **stay on the existing patient form**, enter or edit the fields on the form, and click **💾 (Save)**.  
> **Do NOT click `+` (New)** to add clinical details, as clicking `+` creates a blank new record; entering the same person's name will trigger the safety check: *"The Patient already exists !"*.

---

## STEP 2: Book Appointment & Check-In (Front Desk)

*Goal: Book an outpatient consultation slot and transition the patient to the active waiting queue.*

1. **Navigate:** Left sidebar $\rightarrow$ **Health** $\rightarrow$ **Appointments** $\rightarrow$ **Appointments**.
2. **Create Record:** Click the **`+` (New)** icon.
3. **Fill In:**
   - **Patient:** Type your patient's name and select them.
   - **Health Prof:** Type `Dr. DEMO Physician 01` and select.
   - **Specialty:** Type `Family Medicine` and select.
   - **Appointment Date:** Current date/time is populated automatically.
4. **Save:** Click the **💾 (Save)** icon.
5. **Check In:** With the appointment open, click the **`CHECK IN`** action button on the form.
6. **Log Out:** Click your username at the top right $\rightarrow$ click **Logout** (or click the door icon 🚪).

> [!TIP]
> **Verification Checkpoint 2:** The appointment status badge turns from **Free** to **Checked in**. The patient is now officially visible to the clinical nursing and doctor queues.

---

## STEP 3: Nursing Triage & Vital Signs (Triage Nurse)

*Goal: Record patient vital signs and verify real-time automated BMI calculation.*

1. **Log in:**
   - Username: `demo_nurse1`
   - Password: **`Nurse2026!`**
2. **Navigate:** Left sidebar menu $\rightarrow$ **Health** $\rightarrow$ **Patient Evaluations**  
   *(Or type `Patient Evaluations` in the top search bar).*
3. **Create Record:** Click the **`+` (New)** icon in the top toolbar.
4. **Fill In:**
   - **Patient:** Select your patient from the dropdown.
   - **Health Prof:** Select `Dr. DEMO Physician 01`.
5. **Vitals Tab:** Click the **Anthropometry & Vitals** sub-tab:
   - **Systolic:** `120`
   - **Diastolic:** `80`
   - **Heart Rate:** `72`
   - **Temperature:** `37.0`
   - **Weight:** `70`
   - **Height:** `175`
6. **Save:** Click the **💾 (Save)** icon.
7. **Log Out:** Exit session via the top-right menu.

> [!TIP]
> **Verification Checkpoint 3:** Notice the system auto-calculates **BMI to 22.86 kg/m²** (Normal weight) the moment Height and Weight are saved.
> *(Alternative access route: You can also open the patient in Health -> Patients -> Patients, click the 🔗 Relate icon -> Evaluations).*

---

## STEP 4: Physician Consultation & e-Prescription (Doctor)

*Goal: Complete SOAP consultation, assign ICD-10 diagnosis, and issue a verified e-prescription.*

1. **Log in:**
   - Username: `demo_dr1`
   - Password: **`Doctor2026!`**
2. **Navigate:** Left sidebar $\rightarrow$ **Health** $\rightarrow$ **Patient Evaluations**  
   *(Or type `Patient Evaluations` in the top search bar).*
3. **Open Evaluation:** Locate and double-click the evaluation created by the nurse in Step 3.
4. **Fill In (Main Info tab):**
   - **Subjective / Chief Complaint:** Type `Patient presents with mild cough and sore throat.`
   - **Main Condition (ICD-10):** Type `J06.9` and select `Acute upper respiratory infection, unspecified`.
   - **Discharge Reason:** Select `Home / Selfcare`.
5. **Save & Finalize:** Click **💾 (Save)**, then click the **`DONE`** action button at the top of the evaluation. *(State turns to **Done**).*
6. **Create Prescription:** Go to **Health** $\rightarrow$ **Prescriptions** $\rightarrow$ **Prescriptions**.
   - Click **`+` (New)**.
   - **Patient:** Select your patient.
   - Under **Prescription Lines**, click **`+` (New line)**:
     - **Medicament:** Type `Amoxicillin 500mg` and select it.
     - Click **OK**.
   - **Safety Rule:** Check the **`Verified`** checkbox `[x]`. *(This satisfies GNU Health's medical validation rule).*
   - Click **💾 (Save)**.
   - Click the action button **`CREATE`**.
7. **Log Out:** Exit doctor session.

> [!TIP]
> **Verification Checkpoint 4:** The prescription status changes to **Done** with an official prescription code (e.g., `RX014`).

---

## STEP 5: Laboratory Diagnostics (Lab Technician)

*Goal: Order a Complete Blood Count (CBC), auto-load analytes, and enter hematology results.*

1. **Log in:**
   - Username: `demo_lab1`
   - Password: **`Lab2026!`**
2. **Navigate:** Left sidebar $\rightarrow$ **Health** $\rightarrow$ **Laboratory** $\rightarrow$ **Lab Results**  
   *(Or type `Lab Results` in the top search bar).*
3. **Create Record:** Click the **`+` (New)** icon.
4. **Fill In:**
   - **Patient:** Select your patient.
   - **Test type:** Type `COMPLETE BLOOD` or `CBC` and select **`COMPLETE BLOOD COUNT`** from the autocomplete dropdown list.
   - **Health Prof (Requestor):** Select `Dr. DEMO Physician 01`.
5. **Load Template:** Click the **`LOAD ANALYTES CRITERIA`** action button in the form toolbar.
   - When the confirmation popup appears, click **OK**.
   - *(All 20 CBC hematology analytes like HGB, RBC, WBC, and Platelets populate instantly with normal reference ranges).*
6. **Enter Result:**
   - In the analytes table, select the row for **Hemoglobin (HGB)**.
   - Click the **Open folder / Edit** icon on the table toolbar (or double-click the row).
   - In the result modal, enter **`14.1`**, then click **`APPLY CHANGES`**.
7. **Save & Validate:** Click **💾 (Save)**, then click the **`DONE`** action button. Click **OK** when asked *"Are the results ready ?"*.
8. **Log Out:** Exit session.

> [!TIP]
> **Verification Checkpoint 5:** The laboratory order transitions to state **Done**, locking the diagnostic findings against unauthorized alteration.

---

## STEP 6: Radiology Diagnostics (Radiology Technician)

*Goal: Execute a diagnostic imaging request and generate finalized imaging results.*

1. **Log in:**
   - Username: `demo_rad1`
   - Password: **`Rad2026!`**
2. **Navigate:** Left sidebar $\rightarrow$ **Health** $\rightarrow$ **Medical Imaging** $\rightarrow$ **Medical Imaging Requests**.
3. **Create Record:** Click the **`+` (New)** icon.
4. **Fill In:**
   - **Patient:** Select your patient.
   - **Study:** Type `Chest X-Ray` and select it.
   - **Additional Information:** In the text area labeled **`Additional Information`** (which captures clinical findings and indications), type:  
     `Clear lung fields, normal cardiothoracic ratio.`
5. **Save & Process:**
   - Click **💾 (Save)**.
   - Click the **`REQUEST`** action button.
   - Click the **`GENERATE RESULTS`** action button.
6. **Log Out:** Exit session.

> [!TIP]
> **Verification Checkpoint 6:** A finalized **Medical Imaging Result** (e.g. `RAD-00012`) is generated with status **Done**.

---

## STEP 7: Service Billing & Cash Settlement (Cashier)

*Goal: Generate the patient invoice, post to General Ledger, and collect cash payment.*

1. **Log in:**
   - Username: `demo_cashier1`
   - Password: **`Cashier2026!`**
2. **Navigate:** **Financial** $\rightarrow$ **Invoices** $\rightarrow$ **Customer Invoices**.
3. **Create Record:** Click **`+` (New)**.
4. **Fill In:**
   - **Party:** Select your patient's name *(their billing address auto-populates)*.
   - Under **Lines**, click **`+` (New line)**:
     - **Product:** Type `Medical evaluation service` and select it.
     - **Unit Price:** `150.00`
     - **Account:** `401000 - Main Revenue` *(auto-filled)*.
     - Click **OK**.
5. **Post Invoice:**
   - Click **💾 (Save)**.
   - Click the **`POST`** action button in the form toolbar.
   - *(An official fiscal invoice number `INV-2026/000xx` is assigned and posted to the General Ledger).*
6. **Collect Payment:**
   - With the invoice open, click the **`PAY`** action button.
   - In the modal dialog:
     - **Payment Method:** Select `Cash Payment (QAR)`.
     - **Amount:** `150.00`
     - Click **OK**.
7. **Verify Paid Status:** Click the **All** filter tab in the invoices view and open your invoice. The state is now **Paid** with remaining amount `0.00 QAR`.

---

## STEP 8: Audit General Ledger Double-Entry Moves (Accountant / Auditor)

*Goal: Audit the double-entry accounting records created by the transaction.*

1. In the top search bar, type **`Account Moves`** and press **Enter**  
   *(Or navigate: **Financial** $\rightarrow$ **Entries** $\rightarrow$ **Account Moves**).*
2. Locate the journal moves generated for your invoice number (double-click each to view detailed Debit & Credit lines):
   - **Move 1 (Revenue Recognition):**
     - `110000 - Main Receivable`: **Debit 150.00 QAR**
     - `401000 - Main Revenue`: **Credit 150.00 QAR**
   - **Move 2 (Cash Settlement):**
     - `501000 - Cash`: **Debit 150.00 QAR**
     - `110000 - Main Receivable`: **Credit 150.00 QAR**
3. **Net Balance:** Total Debits = Total Credits = 300.00 QAR. The net Accounts Receivable balance = **0.00 QAR** (Fully settled and reconciled).
4. **Operational Role Note:** In standard clinic workflows, Cashiers handle Point-of-Sale cash collection, while General Ledger journal auditing is typically performed by the **Accountant** or **Financial Controller** (`admin` or Finance Manager).
5. **Log Out.**

---

## STEP 9: Reopen 360° Patient Medical Chart (Traceability)

*Goal: Verify that all clinical, laboratory, radiology, and billing records are permanently linked to the patient file.*

1. **Log in:**
   - Username: `demo_dr1`
   - Password: **`Doctor2026!`**
2. **Navigate:** **Health** $\rightarrow$ **Patients** $\rightarrow$ **Patients**.
3. **Open Patient:** Double-click your patient's record.
4. **Inspect Linked Records:** Click the **🔗 (Relate)** icon in the top toolbar:
   - Click **Appointments** $\rightarrow$ See Appointment record (`Checked in`).
   - Click **Evaluations** $\rightarrow$ See Consultation with ICD-10 `J06.9` and vitals (`Done`).
   - Click **Prescriptions** $\rightarrow$ See Amoxicillin 500mg prescription (`Done`).
   - Click **Lab: Results** $\rightarrow$ See CBC with Hemoglobin 14.1 (`Done`).
   - Click **Medical Imaging Results** $\rightarrow$ See Chest X-Ray findings (`Done`).

---

## 🛠️ Quick Troubleshooting Tips & Tester FAQ

| Issue Observed | Root Cause | Immediate Resolution |
| :--- | :--- | :--- |
| **"The Patient already exists !"** | Clicked `+` (New) to enter clinical data for an already saved patient | Each person can only have ONE patient record (`Unique(party)`). Once saved, **stay on the existing patient form**, enter clinical notes or focus markers, and click **💾 (Save)**. Do NOT click `+ (New)`. |
| **"Patient Evaluation Module not available"** | Looking for menu entry | Access directly via **Health $\rightarrow$ Patient Evaluations** on the left menu (or search `Patient Evaluations` in the top search bar). Alternatively, open patient and click **🔗 Relate $\rightarrow$ Evaluations**. |
| **"COMPLETE BLOOD COUNT-Test Not Found"** | Navigated to batch order wizard instead of test results | Go to **Health $\rightarrow$ Laboratory $\rightarrow$ Lab Results**. Click `+` (New). In the **Test type** field, type `CBC` or `COMPLETE` to see the autocomplete dropdown, and click **`COMPLETE BLOOD COUNT`**. |
| **"No feature to add Clinical Findings" in Radiology** | Looking for label "Clinical findings" | On the Medical Imaging Request form, clinical findings and indications are entered into the large text area labeled **`Additional Information`**. |
| **Cashier auditing Account Moves ("Need Discussion")** | Segregation of duties | `demo_cashier1` has read access to the GL. Double-click the move from `Financial -> Entries -> Account Moves` to view debit/credit lines. Full GL administration belongs to the Accountant (`admin`). |
| **Password prompt loops repeatedly** | Typing mistake or wrong casing | Re-type carefully. Remember: `FrontDesk2026!` has **both Capital F and Capital D**, and ends with `!`. |
| **Database name empty or wrong** | Accessed bare URL without hash | Always use **`http://34.7.237.8/#gnuhealth`** to auto-select `gnuhealth`. |
| **Cannot find patient in list** | Filter set to active/today | Click the **All** tab at the top of the table view. |
| **"Verified" missing on Prescription** | Form scrolled down | Scroll down the prescription form to locate the `Verified [x]` checkbox before clicking `CREATE`. |
| **Browser auto-fill wrong password** | Chrome autofill overwriting field | Clear the field manually and type the exact role password. |
