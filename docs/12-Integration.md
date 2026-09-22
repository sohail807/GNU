# 12. Integration & Interface Architecture

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Document**: `docs/12-Integration.md`  

---

## 1. Executive Summary

This document audits the integration and external communication interfaces of the GNU Health deployment, verifying implemented protocols and clarifying interfaces that do not exist.

---

## 2. Active Protocol: Tryton JSON-RPC

The system exposes a standard, native JSON-RPC 2.0 interface utilized by the Tryton SAO web client and administrative automation scripts:

- **Endpoint**: `http://34.7.237.8/gnuhealth/` (and root `/`)
- **Authentication**:
  1. `POST /gnuhealth/` with method `common.db.login`, parameters `["<username>", {"password": "<password>"}]`.
  2. Returns `[user_id, session_token]`.
  3. Subsequent requests pass HTTP header:  
     `Authorization: Session <base64("<username>:<user_id>:<session_token>")>`.
- **Method Signature**:
  ```json
  {
    "method": "model.<model_name>.<action>",
    "params": [
      [<arguments>],
      {
        "language": "en",
        "company": 2
      }
    ]
  }
  ```
- **Context Requirement**: In Tryton 7.0, the final positional parameter must always be the user's `context` dictionary. For accounting and multi-company models, `"company": <company_id>` is required.

---

## 3. External Integrations Audit Matrix

| Interface Domain | Intended Purpose | Current Implemented Status | Technical Reality in Codebase |
| :--- | :--- | :--- | :--- |
| **External REST API** | Custom mobile / web app integration | **NOT PRESENT** | No FastAPI, Flask, or REST controllers installed. |
| **Payment Gateway** | Online credit card processing | **NOT PRESENT** | No gateway SDK (QPay, Stripe, CyberSource) connected. Cash/Card POS recorded manually. |
| **Insurance Clearinghouse** | Real-time HL7 FHIR claims submission | **NOT PRESENT** | Claims tracked internally in Tryton; no live clearinghouse EDI connection. |
| **Laboratory Analyzers** | Direct LIS machine result polling | **NOT PRESENT** | No ASTM 1394 / HL7 LIS bridge running. Results entered via SAO UI. |
| **Radiology PACS / DICOM**| DICOM image archive & viewer | **NOT PRESENT** | No Orthanc / dcm4chee server connected. Reports stored as PDF attachments. |
| **SMS Notifications** | Appointment reminder SMS | **NOT PRESENT** | No Twilio or Ooredoo/Vodafone SMS API connected. |
| **Transactional Email** | Automated invoice/Rx email delivery | **NOT CONFIGURED** | SMTP credentials omitted in `trytond.conf`. |

---

## 4. Integration Roadmap & Recommendations

1. **Phase 1 (Production Launch)**:
   - Operate with native Tryton SAO web interface.
   - Cashier collects card payments via physical in-clinic bank POS terminals.
   - Lab technicians and radiographers enter findings directly into SAO.
2. **Phase 2 (Post-Launch Expansion)**:
   - **SMTP Configuration**: Configure internal clinic mail relay for email appointment confirmations.
   - **SMS Gateway**: Integrate local Qatar telecom SMS gateway for patient appointment reminders.
   - **Orthanc DICOM Bridge**: Activate optional `health_orthanc` module if a PACS server is procured.
