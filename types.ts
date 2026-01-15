
export enum Role {
  Admin = 'Admin',
  Finance = 'Finance',
  OpsHR = 'Ops/HR',
  Employee = 'Employee',
  Intern = 'Intern'
}

export enum VisibilityLevel {
  CompanyShared = 'company_shared',
  TeamShared = 'team_shared',
  PrivateAdmin = 'private_admin',
  RoleBased = 'role_based'
}

export enum RequestStatus {
  Requested = 'requested',
  Approved = 'approved',
  Rejected = 'rejected',
  NeedInfo = 'need_info',
  Procured = 'procured',
  AccessGranted = 'access_granted',
  Closed = 'closed'
}

export enum LeaveRequestStatus {
  Requested = 'requested',
  Approved = 'approved',
  Rejected = 'rejected',
  NeedInfo = 'need_info'
}

export enum AttendanceStatus {
  WFH = 'WFH',
  WFO = 'WFO',
  Client = 'Client',
  Leave = 'Leave'
}

export enum ExpenseCategory {
  Salaries = 'Salaries',
  Tools = 'Tools',
  Marketing = 'Marketing',
  Travel = 'Travel',
  Office = 'Office',
  Contractors = 'Contractors',
  Misc = 'Misc'
}

export interface User {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: 'active' | 'inactive' | 'active_temp_password';
  lastLoginAt: string;
}

export interface Employee {
  employeeId: string;
  userId: string;
  department: string;
  managerId: string | null;
  joiningDate: string;
  employmentType: 'full_time' | 'contract' | 'intern';
  workLocation: string;
  timezone: string;
  birthday: string;
}

export interface Tool {
  toolId: string;
  name: string;
  category: string;
  billingCycle: 'monthly' | 'yearly';
  cost: number;
  currency: string;
  renewalDate: string;
  ownerRole: Role;
  visibilityLevel: VisibilityLevel;
  seatsTotal: number;
  status: 'active' | 'trial' | 'cancelled';
  vendor: string;
  notes: string;
}

export interface ToolRequest {
  requestId: string;
  userId: string;
  toolName: string;
  justification: string;
  expectedUsers: number;
  urgency: 'low' | 'medium' | 'high';
  status: RequestStatus;
  approverId: string | null;
  notes: string;
  createdAt: string;
}

export interface ToolPayment {
  paymentId: string;
  toolId: string;
  paymentDate: string;
  monthFor: string; // YYYY-MM
  amount: number;
  currency: string;
  paidByUserId: string;
  method: string;
  referenceId: string;
  invoiceLink: string;
  notes: string;
  createdAt: string;
}

export interface LeaveRequest {
  leaveId: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: LeaveRequestStatus;
  approverId: string | null;
  notes: string;
  createdAt: string;
}

export interface Attendance {
  date: string;
  userId: string;
  status: AttendanceStatus;
  location: string;
  checkIn: string;
  checkOut: string | null;
  notes: string;
}

export interface Expense {
  expenseId: string;
  date: string;
  vendor: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  recurring: 'Y' | 'N';
  linkedToolId: string | null;
  notes: string;
}

export interface SalaryTransfer {
  transferId: string;
  date: string;
  paidToUserId: string;
  paidToName: string;
  amount: number;
  currency: string;
  monthFor: string;
  method: string;
  referenceId: string;
  notes: string;
  createdByUserId: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  action: string;
  performedBy: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  detailsJson: string;
}
