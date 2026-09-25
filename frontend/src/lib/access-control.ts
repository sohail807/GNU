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
  | "laboratory"
  | "radiology"
  | "billing"
  | "ledger"
  | "patient_chart"
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
  { key: "laboratory", label: "Diagnostic Laboratory", category: "Clinical", description: "CBC validation, analyte criteria and pathology reports" },
  { key: "radiology", label: "Digital Radiology & PACS", category: "Clinical", description: "Imaging requisitions, findings reporting & PACS" },
  { key: "billing", label: "Cashier Invoicing & Payments", category: "Financial", description: "Patient invoicing, line items and cash collection" },
  { key: "ledger", label: "General Ledger Double-Entry Audit", category: "Financial", description: "Account moves audit, journal reconciliation & ledger audit" },
  { key: "patient_chart", label: "Unified Patient Medical Record", category: "Clinical", description: "360 longitudinal electronic health record audit" },
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
    laboratory: true,
    radiology: true,
    billing: true,
    ledger: true,
    patient_chart: true,
    admin: true,
  },
  reception: {
    frontdesk: true,
    patient_register: true,
    appointments: true,
    nursing: false,
    physician: false,
    laboratory: false,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
  nursing: {
    frontdesk: true, // read-only arrival queue
    patient_register: false,
    appointments: false,
    nursing: true,
    physician: false,
    laboratory: true, // view lab worklist
    radiology: true, // view radiology worklist
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
  physician: {
    frontdesk: true,
    patient_register: false,
    appointments: true,
    nursing: true, // review vitals
    physician: true,
    laboratory: true, // order labs
    radiology: true, // order radiology
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
  lab: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    laboratory: true,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
  radiology: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    laboratory: false,
    radiology: true,
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
  cashier: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    laboratory: false,
    radiology: false,
    billing: true,
    ledger: false, // Strictly segregated: Cashiers cannot edit or audit GL moves
    patient_chart: true,
    admin: false,
  },
  accountant: {
    frontdesk: false,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    laboratory: false,
    radiology: false,
    billing: true,
    ledger: true,
    patient_chart: true,
    admin: false,
  },
  general: {
    frontdesk: true,
    patient_register: false,
    appointments: false,
    nursing: false,
    physician: false,
    laboratory: false,
    radiology: false,
    billing: false,
    ledger: false,
    patient_chart: true,
    admin: false,
  },
};

/**
 * Default Initial Hospital Staff Directory
 */
export const INITIAL_STAFF_USERS: UserAccessProfile[] = [
  {
    id: 1,
    username: "admin",
    name: "System Administrator",
    role: "admin",
    roleTitle: "Enterprise Medical Director & Admin",
    department: "Hospital Administration & IT Governance",
    email: "admin@ist-health.qa",
    phone: "+974 4400 1000",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.admin },
    lastLogin: "Active Now",
  },
  {
    id: 149,
    username: "demo_frontdesk1",
    name: "Mariam Al-Kuwari",
    role: "reception",
    roleTitle: "Senior Reception & Intake Officer",
    department: "Outpatient Front Desk & Registration",
    email: "frontdesk@ist-health.qa",
    phone: "+974 4400 1010",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.reception },
    lastLogin: "10 mins ago",
  },
  {
    id: 148,
    username: "demo_nurse1",
    name: "Sarah Jenkins, RN",
    role: "nursing",
    roleTitle: "Charge Triage Nurse",
    department: "Clinical Nursing & Triage Telemetry",
    email: "nurse1@ist-health.qa",
    phone: "+974 4400 1020",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.nursing },
    lastLogin: "25 mins ago",
  },
  {
    id: 146,
    username: "demo_dr1",
    name: "Dr. Alexander Wright, MD",
    role: "physician",
    roleTitle: "Attending Physician — Internal Medicine",
    department: "Outpatient Clinic Room 04",
    email: "dr.wright@ist-health.qa",
    phone: "+974 4400 1030",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.physician },
    lastLogin: "5 mins ago",
  },
  {
    id: 147,
    username: "demo_dr2",
    name: "Dr. Fatima Al-Sulaiti, MD",
    role: "physician",
    roleTitle: "Attending Cardiologist",
    department: "Cardiology & Vascular Suite",
    email: "dr.fatima@ist-health.qa",
    phone: "+974 4400 1031",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.physician },
    lastLogin: "1 hour ago",
  },
  {
    id: 150,
    username: "demo_lab1",
    name: "Zainab Al-Hassan",
    role: "lab",
    roleTitle: "Senior Pathology Technologist",
    department: "Diagnostic Laboratory & Hematology",
    email: "lab1@ist-health.qa",
    phone: "+974 4400 1040",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.lab },
    lastLogin: "40 mins ago",
  },
  {
    id: 151,
    username: "demo_rad1",
    name: "Tariq Mansoor, RT",
    role: "radiology",
    roleTitle: "Radiology & Imaging Specialist",
    department: "Digital Imaging & PACS Suite",
    email: "rad1@ist-health.qa",
    phone: "+974 4400 1050",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.radiology },
    lastLogin: "15 mins ago",
  },
  {
    id: 152,
    username: "demo_cashier1",
    name: "Hassan Al-Nuaimi",
    role: "cashier",
    roleTitle: "Outpatient Billing & Cashier Officer",
    department: "Patient Accounts & Fiscal Billing",
    email: "cashier1@ist-health.qa",
    phone: "+974 4400 1060",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.cashier },
    lastLogin: "30 mins ago",
  },
  {
    id: 153,
    username: "demo_auditor1",
    name: "Khalid Al-Kandari, CPA",
    role: "accountant",
    roleTitle: "Senior Financial Auditor & Comptroller",
    department: "Hospital General Ledger & Audit",
    email: "auditor@ist-health.qa",
    phone: "+974 4400 1070",
    status: "active",
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.accountant },
    lastLogin: "2 hours ago",
  },
];

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

/**
 * Dynamically resolves an IST Health role, title, and initial redirect path from Tryton security groups.
 */
export function resolveRoleFromTrytonGroups(groups: number[] = []): {
  role: HospitalRole;
  roleTitle: string;
  redirect: string;
} {
  const gSet = new Set(groups);
  // Group 1: Administration, Group 11: Health Administration
  if (gSet.has(1) || gSet.has(11)) {
    return { role: "admin", roleTitle: "System Administrator", redirect: "/admin" };
  }
  // Group 15: Health Doctor
  if (gSet.has(15)) {
    return { role: "physician", roleTitle: "Attending Physician", redirect: "/physician" };
  }
  // Group 13: Health Nurse, Group 12: Health Nurse Administration
  if (gSet.has(13) || gSet.has(12)) {
    return { role: "nursing", roleTitle: "Triage Charge Nurse", redirect: "/nursing" };
  }
  // Group 14: Health Front Desk
  if (gSet.has(14)) {
    return { role: "reception", roleTitle: "Front Desk Intake Officer", redirect: "/frontdesk" };
  }
  // Group 23: Health Lab, Group 22: Health lab Administration
  if (gSet.has(23) || gSet.has(22)) {
    return { role: "lab", roleTitle: "Laboratory Technologist", redirect: "/laboratory" };
  }
  // Group 20: Health Imaging, Group 21: Health Imaging Administration
  if (gSet.has(20) || gSet.has(21)) {
    return { role: "radiology", roleTitle: "Radiology Specialist", redirect: "/radiology" };
  }
  // Group 8: Account Administration, Group 7: Accounting Party
  if (gSet.has(8) || gSet.has(7)) {
    return { role: "accountant", roleTitle: "Financial Comptroller & Auditor", redirect: "/billing?tab=ledger" };
  }
  // Group 6: Account
  if (gSet.has(6)) {
    return { role: "cashier", roleTitle: "Outpatient Billing Cashier", redirect: "/billing" };
  }
  return { role: "general", roleTitle: "Clinical Healthcare Professional", redirect: "/frontdesk" };
}

