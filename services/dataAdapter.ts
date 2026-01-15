console.log("ENV CHECK", {
  base: import.meta.env.VITE_AIRTABLE_BASE_ID,
  token: import.meta.env.VITE_AIRTABLE_TOKEN
});
import {
  User, Employee, Tool, ToolRequest, LeaveRequest, Attendance,
  Expense, SalaryTransfer, AuditLog, Role, VisibilityLevel, RequestStatus,
  ExpenseCategory, ToolPayment, LeaveRequestStatus
} from '../types';

export interface IDataAdapter {
  isMock: boolean;

  getUserByEmail(email: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  updateUser(userId: string, payload: Partial<User>): Promise<void>;
  createUser(payload: Partial<User>): Promise<User>;
  updateUserLastLogin(userId: string, timestamp: string): Promise<void>;

  listEmployees(): Promise<Employee[]>;
  createEmployee(payload: Partial<Employee>): Promise<Employee>;

  listTools(): Promise<Tool[]>;
  getToolById(toolId: string): Promise<Tool | null>;
  createTool(payload: Partial<Tool>): Promise<Tool>;

  listToolRequests(): Promise<ToolRequest[]>;
  createToolRequest(payload: Partial<ToolRequest>): Promise<ToolRequest>;
  updateToolRequestStatus(requestId: string, status: RequestStatus, approverId: string, notes: string): Promise<void>;

  listToolPayments(): Promise<ToolPayment[]>;
  createToolPayment(payload: Partial<ToolPayment>): Promise<ToolPayment>;

  listLeaveRequests(): Promise<LeaveRequest[]>;
  createLeaveRequest(payload: Partial<LeaveRequest>): Promise<LeaveRequest>;
  updateLeaveRequestStatus(leaveId: string, status: LeaveRequestStatus, approverId: string, notes: string): Promise<void>;

  listAttendance(startDate: string, endDate: string): Promise<Attendance[]>;
  upsertAttendance(payload: Attendance): Promise<void>;

  listExpenses(startDate: string, endDate: string): Promise<Expense[]>;
  createExpense(payload: Partial<Expense>): Promise<Expense>;

  createSalaryTransfer(payload: Partial<SalaryTransfer>): Promise<SalaryTransfer>;
  listSalaryTransfers(): Promise<SalaryTransfer[]>;

  listAuditLogs(): Promise<AuditLog[]>;
  writeAuditLog(log: Omit<AuditLog, 'logId' | 'timestamp'>): Promise<void>;

  resetDemoData(): Promise<void>;
}

/* ---------------------------
   AirtableAdapter (frontend validation)
   NOT secure for production — token is in browser.
---------------------------- */

const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID as string | undefined;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN as string | undefined;

type AirtableRecord<T> = { id: string; fields: T };

async function airtableGet<T>(table: string, query = ''): Promise<AirtableRecord<T>[]> {
  if (!AIRTABLE_BASE_ID || !AIRTABLE_TOKEN) return [];
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}${query}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${table} error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.records || []) as AirtableRecord<T>[];
}

class AirtableAdapter implements IDataAdapter {
  public isMock = false;

  async resetDemoData(): Promise<void> {}

  async getUserByEmail(email: string): Promise<User | null> {
    const emailNormalized = email.trim().toLowerCase().replace(/'/g, "\\'");
    const formula = encodeURIComponent(`LOWER({email})='${emailNormalized}'`);
    const records = await airtableGet<User>('Users', `?filterByFormula=${formula}&maxRecords=1`);
    return records[0]?.fields || null;
  }

  async listUsers(): Promise<User[]> {
    const records = await airtableGet<User>('Users');
    return records.map(r => r.fields);
  }

  async updateUser(): Promise<void> { throw new Error('Not implemented yet'); }
  async createUser(): Promise<User> { throw new Error('Not implemented yet'); }
  async updateUserLastLogin(): Promise<void> {}

  async listEmployees(): Promise<Employee[]> {
    const records = await airtableGet<Employee>('Employees');
    return records.map(r => r.fields);
  }

  async createEmployee(): Promise<Employee> { throw new Error('Not implemented yet'); }

  async listTools(): Promise<Tool[]> {
    const records = await airtableGet<Tool>('ToolsRegistry');
    return records.map(r => r.fields);
  }

  async getToolById(): Promise<Tool | null> { throw new Error('Not implemented yet'); }
  async createTool(): Promise<Tool> { throw new Error('Not implemented yet'); }

  async listToolRequests(): Promise<ToolRequest[]> {
    const records = await airtableGet<ToolRequest>('ToolRequests');
    return records.map(r => r.fields);
  }

  async createToolRequest(): Promise<ToolRequest> { throw new Error('Not implemented yet'); }
  async updateToolRequestStatus(): Promise<void> { throw new Error('Not implemented yet'); }

  async listToolPayments(): Promise<ToolPayment[]> {
    const records = await airtableGet<ToolPayment>('ToolPayments');
    return records.map(r => r.fields);
  }

  async createToolPayment(): Promise<ToolPayment> { throw new Error('Not implemented yet'); }

  async listLeaveRequests(): Promise<LeaveRequest[]> {
    const records = await airtableGet<LeaveRequest>('LeaveRequests');
    return records.map(r => r.fields);
  }

  async createLeaveRequest(): Promise<LeaveRequest> { throw new Error('Not implemented yet'); }
  async updateLeaveRequestStatus(): Promise<void> { throw new Error('Not implemented yet'); }

  async listAttendance(): Promise<Attendance[]> { return []; }
  async upsertAttendance(): Promise<void> {}

  async listExpenses(): Promise<Expense[]> {
    const records = await airtableGet<Expense>('Expenses');
    return records.map(r => r.fields);
  }

  async createExpense(): Promise<Expense> { throw new Error('Not implemented yet'); }

  async createSalaryTransfer(): Promise<SalaryTransfer> { throw new Error('Not implemented yet'); }
  async listSalaryTransfers(): Promise<SalaryTransfer[]> {
    const records = await airtableGet<SalaryTransfer>('SalaryTransfers');
    return records.map(r => r.fields);
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    const records = await airtableGet<AuditLog>('AuditLogs');
    return records.map(r => r.fields);
  }

  async writeAuditLog(): Promise<void> {}
}

/* ---------------------------
   MockAdapter (existing demo)
   Kept minimal here to avoid breaking your app.
---------------------------- */

class MockAdapter implements IDataAdapter {
  public isMock = true;

  async resetDemoData(): Promise<void> {}

  async getUserByEmail(): Promise<User | null> { return null; }
  async listUsers(): Promise<User[]> { return []; }
  async updateUser(): Promise<void> {}
  async createUser(): Promise<User> { throw new Error('Not implemented'); }
  async updateUserLastLogin(): Promise<void> {}

  async listEmployees(): Promise<Employee[]> { return []; }
  async createEmployee(): Promise<Employee> { throw new Error('Not implemented'); }

  async listTools(): Promise<Tool[]> { return []; }
  async getToolById(): Promise<Tool | null> { return null; }
  async createTool(): Promise<Tool> { throw new Error('Not implemented'); }

  async listToolRequests(): Promise<ToolRequest[]> { return []; }
  async createToolRequest(): Promise<ToolRequest> { throw new Error('Not implemented'); }
  async updateToolRequestStatus(): Promise<void> {}

  async listToolPayments(): Promise<ToolPayment[]> { return []; }
  async createToolPayment(): Promise<ToolPayment> { throw new Error('Not implemented'); }

  async listLeaveRequests(): Promise<LeaveRequest[]> { return []; }
  async createLeaveRequest(): Promise<LeaveRequest> { throw new Error('Not implemented'); }
  async updateLeaveRequestStatus(): Promise<void> {}

  async listAttendance(): Promise<Attendance[]> { return []; }
  async upsertAttendance(): Promise<void> {}

  async listExpenses(): Promise<Expense[]> { return []; }
  async createExpense(): Promise<Expense> { throw new Error('Not implemented'); }

  async createSalaryTransfer(): Promise<SalaryTransfer> { throw new Error('Not implemented'); }
  async listSalaryTransfers(): Promise<SalaryTransfer[]> { return []; }

  async listAuditLogs(): Promise<AuditLog[]> { return []; }
  async writeAuditLog(): Promise<void> {}
}

export const activeAdapter: IDataAdapter =
  (AIRTABLE_BASE_ID && AIRTABLE_TOKEN) ? new AirtableAdapter() : new MockAdapter();