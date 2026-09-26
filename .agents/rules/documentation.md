# Documentation Rules

## Runtime Fidelity & Standard Formatting
- **Runtime Accuracy:**
  - Document only the actual verified runtime behavior of the deployed system.
  - Never invent hypothetical REST endpoints, hallucinated Tryton menu paths, or non-existent model attributes.
- **Menu Path Precision:**
  - All navigation instructions must specify the exact sequential menu traversal:
    - Patient Registration: `Health -> Patients -> Patients` (Menu ID 136)
    - Appointments: `Health -> Appointments` (Menu ID 156)
    - Patient Evaluations: `Health -> Patient Evaluations` (Menu ID 252, Sequence 25)
    - Prescriptions: `Health -> Prescriptions` (Menu ID 169)
    - Lab Results: `Health -> Laboratory -> Lab Results` (Menu ID 229)
    - Radiology Requests: `Health -> Imaging -> Medical Imaging Requests` (Menu ID 242)
    - Customer Invoices: `Financial -> Invoices -> Customer Invoices` (Menu ID 83)
    - Account Moves: `Financial -> Entries -> Account Moves` (Menu ID 98)
- **UI Label vs Data Field Mapping:**
  - When screen labels differ from model field names, explicitly document both:
    - Example: Field `comment` in `gnuhealth.imaging.test.request` is displayed on screen as `Additional Information`.
- **Screenshot Standards:**
  - All documentation figures must include clear captions, sequential step numbers, and visual annotations (red boxes, numbered badges, and callouts).
  - Screenshots must be placed inline directly beside or immediately beneath the relevant step instructions.
