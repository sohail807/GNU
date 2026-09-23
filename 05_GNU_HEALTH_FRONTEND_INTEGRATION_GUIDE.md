# GNU Health HMIS — Frontend Developer Implementation Guide
## Architecture Patterns, Client Services & Step-by-Step Developer Recipes

**Document Reference:** `GH-FE-GUIDE-005`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57  
**API Transport:** JSON-RPC 2.0 (`http://34.7.237.8/gnuhealth/`)  
**Audience:** Frontend Software Engineers, UI Developers, Integration Specialists

---

## 1. Frontend Integration Philosophy

The custom clinic frontend is strictly a presentation and user interaction tier. The architecture follows a strict separation of concerns:

```
[ CLINIC CUSTOM FRONTEND ]
  - User Interface Components (Forms, Tables, Dashboards)
  - Client-Side Validation UX (Instant Feedback)
  - Local State Management & Navigation
         |
         | Internal Method Calls
         v
[ FRONTEND API SERVICE LAYER ]
  - Centralized JSON-RPC Client
  - Session Token Storage & Header Injection
  - Error Interception & User Notification
         |
         | Authenticated JSON-RPC 2.0 (HTTP/HTTPS)
         v
[ GNU HEALTH HMIS / TRYTON SERVER ]
  - Authoritative System of Record
  - Medical Rules, Drug Interactions, Diagnostic Validation
  - Native General Ledger Accounting & Double-Entry Moves
  - Security & Role-Based Access Enforcement
```

---

## 2. Frontend ↔ Backend Responsibility Matrix

| Clinical / Financial Function | Frontend Responsibility | Backend Responsibility |
| :--- | :--- | :--- |
| **User Authentication** | Collects username & password; stores session token securely. | Validates credentials against scrypt hash; issues cryptographic session token. |
| **Patient Registration** | Renders demographic form; enforces required fields (Name, DoB, QID). | Enforces unique QID; auto-generates permanent medical record PUID. |
| **Appointment Booking** | Displays available calendar slots; submits booking request. | Validates clinician schedule; updates appointment state machine to `confirmed`. |
| **Patient Check-In** | Triggers arrival button when patient arrives at clinic. | Validates appointment presence; transitions state to `checked_in`. |
| **Nursing Triage** | Renders anthropometric vitals form (BP, HR, Temp, BMI). | Stores vitals in evaluation; attaches to patient medical record. |
| **Clinical Consultation** | Renders SOAP form; provides ICD-10 searchable diagnostic dropdown. | Validates attending clinician; permanently locks record upon `signed` action. |
| **Electronic Prescriptions**| Renders drug selection, dosage, route, frequency, and duration. | Validates drug formulations; checks safety warnings; generates `RX` sequence. |
| **Diagnostic Requisitions** | Displays available laboratory panels (CBC) and imaging studies (X-Ray).| Manages lab criteria expansion; tracks diagnostic specimen and report states. |
| **Billing & Invoicing** | Displays billable services and agreed tariffs. | Calculates invoice lines; generates balanced general ledger debit/credit moves. |
| **Cash Settlement** | Collects payment method (Cash QAR) via cashier payment wizard. | Reconciles Accounts Receivable; posts cash receipt move; sets state to `Paid`. |
| **Role-Based Access** | Hides unavailable buttons and navigation links based on user role. | Authoritatively verifies permissions on every RPC call; raises `AccessError`. |

---

## 3. Step-by-Step Developer Implementation Recipes

### Recipe 1: Authenticating & Obtaining a Session Token
```typescript
interface LoginResponse {
  id: number;
  result: [number, string] | false;
  error: any;
}

async function loginUser(username: string, password: string): Promise<{ userId: number; sessionToken: string }> {
  const payload = {
    id: Date.now(),
    method: "common.db.login",
    params: [username, password]
  };

  const response = await fetch("http://34.7.237.8/gnuhealth/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data: LoginResponse = await response.json();
  if (!data.result) {
    throw new Error("Invalid username or password.");
  }

  const [userId, sessionToken] = data.result;
  return { userId, sessionToken };
}
```

### Recipe 2: Constructing the Authorization Header
```typescript
function buildAuthHeader(userId: number, sessionToken: string): string {
  // Format: "Session base64(userId:sessionToken)"
  const rawToken = `${userId}:${sessionToken}`;
  const encodedToken = btoa(rawToken);
  return `Session ${encodedToken}`;
}
```

### Recipe 3: Universal JSON-RPC API Client
```typescript
async function callGnuHealth<T = any>(
  method: string,
  params: any[],
  authHeader?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch("http://34.7.237.8/gnuhealth/", {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: Date.now(),
      method,
      params
    })
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  const data = await response.json();
  if (data.error) {
    const [errorClass, errorMessage] = data.error;
    throw new Error(`[${errorClass}] ${errorMessage}`);
  }

  return data.result;
}
```

### Recipe 4: Searching and Reading Patients (`search_read`)
```typescript
async function searchPatients(searchTerm: string, authHeader: string) {
  const domain = [
    ["party.name", "ilike", `%${searchTerm}%`]
  ];
  const fields = ["id", "puid", "party", "blood_type", "rh"];
  const context = { company: 1 };

  return await callGnuHealth(
    "model.gnuhealth.patient.search_read",
    [domain, 0, 20, [["party.name", "ASC"]], fields, context],
    authHeader
  );
}
```

### Recipe 5: Registering a New Patient (Party + Patient)
```typescript
async function registerPatient(patientData: {
  name: string;
  gender: "m" | "f";
  dob: string;
  qid: string;
}, authHeader: string) {
  const context = { company: 1 };

  // Step 1: Create party.party record
  const partyPayload = [{
    name: patientData.name,
    is_person: true,
    is_patient: true,
    gender: patientData.gender,
    dob: patientData.dob,
    fed_country: 178, // QAT Country ID
    ref: patientData.qid
  }];

  const partyIds = await callGnuHealth<number[]>(
    "model.party.party.create",
    [partyPayload, context],
    authHeader
  );
  const partyId = partyIds[0];

  // Step 2: Create gnuhealth.patient record
  const patientPayload = [{
    party: partyId
  }];

  const patientIds = await callGnuHealth<number[]>(
    "model.gnuhealth.patient.create",
    [patientPayload, context],
    authHeader
  );

  return { patientId: patientIds[0], partyId };
}
```

### Recipe 6: Signing a Clinical Evaluation (Workflow Action)
```typescript
async function signClinicalEvaluation(evaluationId: number, authHeader: string) {
  const context = { company: 1 };

  // Executes the native workflow transition method: end_evaluation
  return await callGnuHealth(
    "model.gnuhealth.patient.evaluation.end_evaluation",
    [[evaluationId], context],
    authHeader
  );
}
```

### Recipe 7: Posting an Invoice & Executing Cash Settlement
```typescript
async function settlePatientBill(invoiceId: number, paymentMethodId: number, authHeader: string) {
  const context = { company: 1 };

  // Step 1: Post the invoice (locks lines and generates general ledger move)
  await callGnuHealth(
    "model.account.invoice.post",
    [[invoiceId], context],
    authHeader
  );

  // Step 2: Execute cash settlement wizard
  await callGnuHealth(
    "wizard.account.invoice.pay.execute",
    [
      {
        invoice: invoiceId,
        payment_method: paymentMethodId
      },
      context
    ],
    authHeader
  );

  return { status: "PAID" };
}
```

---

## 4. Frontend Error Handling & User Guidance

| Backend Error Class | Trigger Scenario | Recommended Frontend UX Handling |
| :--- | :--- | :--- |
| `AccessError` | Role lacks model permission (e.g., Cashier accessing Clinical Evaluations). | Display: *"Access Restricted: Your departmental role does not permit access to this module."* |
| `AccessError` (Locked) | Attempting to edit a signed evaluation or posted invoice. | Display: *"Record Locked: This record has been finalized and cannot be modified."* |
| `UserError` | Missing required field or invalid state transition. | Display specific backend message in an alert banner; highlight offending form input. |
| `SQLConstraintError` | Duplicate QID / National ID entered. | Display: *"A patient with this National ID already exists in the system."* |
| `SESSION_EXPIRED` | Inactivity timeout or invalid token. | Save current form state to memory; present re-login modal; resume after authentication. |

---

## 5. Security & Sanitization Invariants

- **Zero Hardcoded Secrets:** Never store service accounts or admin passwords in frontend code.
- **Sanitized Placeholders:** In documentation and configs, always use placeholders (`<USERNAME>`, `<PASSWORD>`, `<SESSION_ID>`).
- **Memory-Only Session:** Store the cryptographic session token in reactive state or memory. Avoid writing raw tokens to unencrypted `localStorage`.
- **HTTPS Enforcement:** Configure production deployments to reject plain HTTP connections.
