/**
 * IST Health — Centralized Access Control (RBAC) System
 * Defines hospital roles, functional module permissions, and dynamic user-level overrides.
 */

export type HospitalRole =
  | "admin"
  | "reception"
  | "nursing"
  | "physician"
  | "lab"
  | "radiology"
  | "cashier"
  | "accountant"
  | "general";

export type AppModule =
  | "frontdesk"
  | "patient_register"
  | "appointments"
  | "nursing"
  | "physician"
  | "inpatient"
  | "surgery"
  | "pharmacy"
  | "laboratory"
  | "radiology"
  | "billing"
  | "ledger"
  | "patient_chart"
  | "immunizations"
  | "family"
  | "insurance"
  | "obstetrics"
  | "lifestyle"
  | "ambulatory"
  | "socioeconomics"
  | "womens_health"
  | "facilities"
  | "staff_directory"
  | "admin";

export interface ModulePermission {
  key: AppModule;
  label: string;
  category: "Clinical" | "Administrative" | "Financial" | "Governance";
  description: string;
}

export const APP_MODULES: ModulePermission[] = [
  { key: "frontdesk", label: "Front Desk & Intake Queue", category: "Administrative", description: "Patient arrival queue and intake check-in" },
  { key: "patient_register", label: "Patient Registration", category: "Administrative", description: "New demographic and civil ID onboarding" },
  { key: "appointments", label: "Appointment Desk", category: "Administrative", description: "Encounter booking and calendar scheduling" },
  { key: "nursing", label: "Nursing Triage & Vitals", category: "Clinical", description: "Anthropometry, vital signs and acuity triage" },
  { key: "physician", label: "Physician Consultation Cockpit", category: "Clinical", description: "Clinical assessment, ICD-10 diagnoses & prescriptions" },
  { key: "inpatient", label: "Inpatient Care & Ward Census", category: "Clinical", description: "Bed allocation, hospital admissions, and ward care plans" },
  { key: "surgery", label: "Operating Theatre & Surgeries", category: "Clinical", description: "Surgical case scheduling, sterile theatre suites, and operative notes" },
  { key: "pharmacy", label: "Hospital Pharmacy & Dispensing", category: "Clinical", description: "Prescription fulfillment, drug verification, and formulary inventory" },
  { key: "laboratory", label: "Diagnostic Laboratory", category: "Clinical", description: "CBC validation, analyte criteria and pathology reports" },
  { key: "radiology", label: "Digital Radiology & PACS", category: "Clinical", description: "Imaging requisitions, findings reporting & PACS" },
  { key: "billing", label: "Cashier Invoicing & Payments", category: "Financial", description: "Patient invoicing, line items and cash collection" },
  { key: "ledger", label: "General Ledger Double-Entry Audit", category: "Financial", description: "Account moves audit, journal reconciliation & ledger audit" },
  { key: "patient_chart", label: "Unified Patient Medical Record", category: "Clinical", description: "360 longitudinal electronic health record audit" },
  { key: "immunizations", label: "Immunizations & Vaccine Schedule", category: "Clinical", description: "Vaccination administration, dose tracking and next-dose scheduling" },
  { key: "family", label: "Family & Household Registry", category: "Administrative", description: "Household grouping, family members and social context" },
  { key: "insurance", label: "Patient Insurance & Coverage", category: "Administrative", description: "Insurance plan enrollment and coverage records" },
  { key: "obstetrics", label: "Obstetrics & Pregnancy Tracking", category: "Clinical", description: "Gravida/pregnancy history, LMP tracking and outcome recording" },
  { key: "lifestyle", label: "Lifestyle & Social History", category: "Clinical", description: "Diet, exercise, tobacco/alcohol/substance use, CAGE screening and sexual health history" },
  { key: "ambulatory", label: "Ambulatory Procedures & ECG", category: "Clinical", description: "In-clinic minor procedures, ECG ordering and cardiac risk assessment" },
  { key: "socioeconomics", label: "Socioeconomic Assessment", category: "Clinical", description: "Family functionality, occupation, ethnicity and housing/domiciliary assessment" },
  { key: "womens_health", label: "Women's Health Screening", category: "Clinical", description: "Menstrual, PAP, colposcopy and mammography screening history" },
  { key: "facilities", label: "Ward & Facility Management", category: "Governance", description: "Hospital ward setup, bed capacity planning and institution facilities" },
  { key: "staff_directory", label: "Clinical Staff Directory", category: "Governance", description: "Health professional roster and specialty assignment" },
  { key: "admin", label: "Administration & User Governance", category: "Governance", description: "User directory, RBAC matrix, and system security" },
];

export interface UserAccessProfile {
  id: number;
  username: string;
  name: string;
  role: HospitalRole;
  roleTitle: string;
  department: string;
  email: string;
  phone: string;
  status: "active" | "suspended";
  permissions: Record<AppModule, boolean>;
  lastLogin?: string;
}

/**
 * Standard baseline permissions by hospital role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<HospitalRole, Record<AppModule, boolean>> = {
  admin: {
    frontdesk: true,
    patient_register: true,
    appointments: true,
    nursing: true,
    physician: true,
    inpatient: true,
    surgery: true,
    pharmacy: true,
    laboratory: true,
    radiology: true,
    billing: true,
    ledger: true,
    patient_chart: true,
    immunizations: true,
    obstetrics: true,
    lifestyle: true,
    ambulatory: true,
    socioeconomics: true,
    womens_health: true,
    facilities: true,
    staff_directory: true,
    family: true,
    insurance: true,
    admin: true,
  },
  reception: {
    frontdesk: true,
    patient_register: true,
    appointments: true,
    nursing: false,
    physician: false,
    inpatient: true, // read-only bed census
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: true,
    insurance: true,
    admin: false,
  },
  nursing: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: true,
    physician: false,
    inpatient: true, // ward vitals & admissions
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: true,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: false,
    admin: false,
  },
  physician: {
    frontdesk: false,
    patient_register: false,
    appointments: true,
    nursing: false,
    physician: true,
    inpatient: true,
    surgery: false,
    pharmacy: false,
    laboratory: true,
    radiology: true,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: false,
    admin: false,
  },
  lab: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    inpatient: false,
    surgery: false,
    pharmacy: false,
    laboratory: true,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: false,
    admin: false,
  },
  radiology: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    inpatient: false,
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: true,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: false,
    admin: false,
  },
  cashier: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    inpatient: false,
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: false,
    billing: true,
    ledger: false, // Strictly segregated: Cashiers cannot edit or audit GL moves
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: true,
    admin: false,
  },
  accountant: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    inpatient: false,
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: false,
    billing: true,
    ledger: true,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: false,
    insurance: true,
    admin: false,
  },
  general: {
    frontdesk: true,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    inpatient: true,
    surgery: false,
    pharmacy: false,
    laboratory: false,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    immunizations: false,
    obstetrics: false,
    lifestyle: false,
    ambulatory: false,
    socioeconomics: false,
    womens_health: false,
    facilities: false,
    staff_directory: false,
    family: true,
    insurance: false,
    admin: false,
  },
};

/**
 * Checks if a role or user profile has access to a specific module
 */
export function hasModuleAccess(
  userRole: string,
  moduleKey: AppModule,
  userCustomPermissions?: Record<AppModule, boolean>
): boolean {
  if (userCustomPermissions && typeof userCustomPermissions[moduleKey] === "boolean") {
    return userCustomPermissions[moduleKey];
  }
  const role = (userRole as HospitalRole) || "general";
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.general;
  return !!rolePerms[moduleKey];
}

/** Resolve the UI persona from actual Tryton group names returned by the server. */
export function resolveRoleFromTrytonGroupNames(groupNames: string[] = []): {
  role: HospitalRole;
  roleTitle: string;
  redirect: string;
} {
  const groups = new Set(groupNames.map((name) => name.trim().toLowerCase()));
  if (groups.has("administration") || groups.has("health administration")) {
    return { role: "admin", roleTitle: "System Administrator", redirect: "/admin" };
  }
  if (groups.has("health doctor")) {
    return { role: "physician", roleTitle: "Attending Physician", redirect: "/physician" };
  }
  if (groups.has("health nurse") || groups.has("health nurse administration")) {
    return { role: "nursing", roleTitle: "Triage Charge Nurse", redirect: "/nursing" };
  }
  if (groups.has("health front desk")) {
    return { role: "reception", roleTitle: "Front Desk Intake Officer", redirect: "/frontdesk" };
  }
  if (groups.has("health lab") || groups.has("health lab administration")) {
    return { role: "lab", roleTitle: "Laboratory Technologist", redirect: "/laboratory" };
  }
  if (groups.has("health imaging") || groups.has("health imaging administration")) {
    return { role: "radiology", roleTitle: "Radiology Specialist", redirect: "/radiology" };
  }
  if (groups.has("account administration") || groups.has("accounting party")) {
    return { role: "accountant", roleTitle: "Financial Comptroller & Auditor", redirect: "/billing?tab=ledger" };
  }
  if (groups.has("account")) {
    return { role: "cashier", roleTitle: "Outpatient Billing Cashier", redirect: "/billing" };
  }
  return { role: "general", roleTitle: "Clinical Healthcare Professional", redirect: "/frontdesk" };
}
