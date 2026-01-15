
import React, { useEffect, useState } from 'react';
import { activeAdapter } from '../services/dataAdapter';
import { Expense, ExpenseCategory, Tool, ToolPayment, Role, SalaryTransfer } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
// Fix: Added PieChart as PieChartIcon, Wrench, and Users to the lucide-react imports to resolve missing icons and naming conflicts.
import { 
  DollarSign, ArrowDown, ArrowUp, Plus, Download, X, 
  Link as LinkIcon, Calendar, Filter, History,
  PieChart as PieChartIcon, Wrench, Users 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { downloadCSV } from '../services/csvExport';

type PaymentType = "tool_payment" | "salary_transfer" | "expense";

interface FinanceLogForm {
  paymentType: PaymentType;
  // common
  amount: number;
  currency: string;
  method: string;
  referenceId: string;
  notes: string;
  paymentDate: string; // yyyy-mm-dd
  monthFor: string;    // yyyy-mm

  // tool payment
  toolId: string;

  // salary transfer
  paidToUserId: string;

  // expense
  vendor: string;
  category: ExpenseCategory;
  recurring: 'Y' | 'N';
  linkedToolId: string;
  invoiceLink: string;
}

const Finance: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<ToolPayment[]>([]);
  const [salaries, setSalaries] = useState<SalaryTransfer[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [users, setUsers] = useState<{userId: string, name: string}[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialFormState: FinanceLogForm = {
    paymentType: 'tool_payment',
    amount: 0,
    currency: 'USD',
    method: 'Bank Transfer',
    referenceId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
    monthFor: new Date().toISOString().slice(0, 7),
    toolId: '',
    paidToUserId: '',
    vendor: '',
    category: ExpenseCategory.Misc,
    recurring: 'N',
    linkedToolId: '',
    invoiceLink: ''
  };

  const [form, setForm] = useState<FinanceLogForm>(initialFormState);

  const loadFinanceData = async () => {
    const [exps, pmts, tls, sls, usrs] = await Promise.all([
      activeAdapter.listExpenses('', ''),
      activeAdapter.listToolPayments(),
      activeAdapter.listTools(),
      activeAdapter.listSalaryTransfers(),
      activeAdapter.listUsers()
    ]);
    
    setExpenses(exps);
    setPayments(pmts);
    setTools(tls);
    setSalaries(sls);
    setUsers(usrs.map(u => ({ userId: u.userId, name: u.name })));

    // Category distribution for expenses
    const byCat = exps.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    setCategoryData(Object.entries(byCat).map(([name, value]) => ({ name, value })));

    // Merged Activity Feed
    const feed = [
      ...exps.map(e => ({ type: 'Expense', vendor: e.vendor, amount: e.amount, date: e.date, category: e.category })),
      ...sls.map(s => ({ type: 'Salary', vendor: s.paidToName, amount: s.amount, date: s.date, category: 'Salaries' })),
      ...pmts.map(p => ({ 
        type: 'Tool', 
        vendor: tls.find(t => t.toolId === p.toolId)?.name || 'Tool', 
        amount: p.amount, 
        date: p.paymentDate, 
        category: 'Tools' 
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    setActivityFeed(feed);
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyBurn = [
    ...expenses.filter(e => e.date.startsWith(currentMonth)),
    ...salaries.filter(s => s.monthFor === currentMonth),
    ...payments.filter(p => p.monthFor === currentMonth)
  ].reduce((a, c) => a + c.amount, 0);

  const handleExport = () => {
    const headers = ['Type', 'Date', 'Entity/Vendor', 'Amount', 'Currency', 'Notes'];
    const rows = [
      ...expenses.map(e => ['Expense', e.date, e.vendor, e.amount, e.currency, e.notes]),
      ...payments.map(p => ['Tool Payment', p.paymentDate, tools.find(t => t.toolId === p.toolId)?.name || 'Tool', p.amount, p.currency, p.notes]),
      ...salaries.map(s => ['Salary Transfer', s.date, s.paidToName, s.amount, s.currency, s.notes])
    ];
    downloadCSV(`creoo_finance_report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (form.paymentType === 'tool_payment') {
        await activeAdapter.createToolPayment({
          toolId: form.toolId,
          paymentDate: form.paymentDate,
          monthFor: form.monthFor,
          amount: form.amount,
          currency: form.currency,
          method: form.method,
          referenceId: form.referenceId,
          notes: form.notes,
          paidByUserId: user.userId,
          invoiceLink: form.invoiceLink
        });
      } else if (form.paymentType === 'salary_transfer') {
        const recipient = users.find(u => u.userId === form.paidToUserId);
        await activeAdapter.createSalaryTransfer({
          paidToUserId: form.paidToUserId,
          paidToName: recipient?.name || 'Unknown',
          amount: form.amount,
          currency: form.currency,
          monthFor: form.monthFor,
          method: form.method,
          referenceId: form.referenceId,
          notes: form.notes,
          createdByUserId: user.userId,
          date: form.paymentDate
        });
      } else {
        await activeAdapter.createExpense({
          date: form.paymentDate,
          vendor: form.vendor,
          category: form.category,
          amount: form.amount,
          currency: form.currency,
          recurring: form.recurring,
          notes: form.notes,
          linkedToolId: form.linkedToolId || null
        });
      }
      setShowLogModal(false);
      setForm(initialFormState);
      await loadFinanceData();
    } catch (err) {
      console.error(err);
      alert('Failed to log payment. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finance & Payroll</h2>
          <p className="text-slate-500">Track burn rate, expenses, and monthly payouts.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLogModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-100"><Plus size={18} />Log Payment</button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium"><Download size={18} />Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
          <p className="text-indigo-100 text-sm font-medium">Monthly Operational Burn</p>
          <h3 className="text-3xl font-black mt-1">${monthlyBurn.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Salaries Paid (YTD)</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">${salaries.reduce((a,c)=>a+c.amount,0).toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Active Subscriptions</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{tools.filter(t=>t.status==='active').length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            {/* Fix: Used the aliased PieChartIcon from lucide-react instead of the Recharts component to fix the 'size' property error. */}
            <PieChartIcon size={18} className="text-indigo-600" />
            Spending Distribution
          </h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <History size={18} className="text-indigo-600" />
            Recent Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {activityFeed.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <History size={32} className="opacity-10 mb-2" />
                <p className="text-xs">No activity yet</p>
              </div>
            ) : (
              activityFeed.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                      {/* Fix: Added Wrench and Users to lucide-react imports to resolve missing name errors. */}
                      {item.type === 'Tool' ? <Wrench size={16} /> : item.type === 'Salary' ? <Users size={16} /> : <DollarSign size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.vendor}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-medium">{item.category} • {item.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${item.type === 'Salary' ? 'text-red-500' : 'text-slate-900'}`}>
                    -${item.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Payment Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Log Payment</h3>
              <button onClick={() => { setShowLogModal(false); setForm(initialFormState); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleLog} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Payment Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" 
                  value={form.paymentType} 
                  onChange={e => setForm(s => ({ ...s, paymentType: e.target.value as PaymentType }))}
                >
                  <option value="tool_payment">Tool Subscription</option>
                  <option value="salary_transfer">Salary Transfer</option>
                  <option value="expense">General Expense</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {form.paymentType === 'tool_payment' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tool</label>
                    <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.toolId} onChange={e => setForm({...form, toolId: e.target.value})}>
                      <option value="">Select Tool...</option>
                      {tools.map(t => <option key={t.toolId} value={t.toolId}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                {form.paymentType === 'salary_transfer' && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Employee</label>
                    <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.paidToUserId} onChange={e => setForm({...form, paidToUserId: e.target.value})}>
                      <option value="">Select Employee...</option>
                      {users.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
                    </select>
                  </div>
                )}
                {form.paymentType === 'expense' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" 
                        value={form.category} 
                        onChange={e => setForm(s => ({ ...s, category: e.target.value as ExpenseCategory }))}
                      >
                        {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Recurring Expense?</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" 
                        value={form.recurring} 
                        onChange={e => setForm(s => ({ ...s, recurring: e.target.value as 'Y' | 'N' }))}
                      >
                        <option value="N">No (One-time)</option>
                        <option value="Y">Yes (Monthly/Yearly)</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.paymentDate} onChange={e => setForm({...form, paymentDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Month For</label>
                  <input required type="month" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.monthFor} onChange={e => setForm({...form, monthFor: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                  <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Method / Reference ID</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.referenceId} onChange={e => setForm({...form, referenceId: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm h-20" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">{loading ? 'Saving...' : 'Log Payment'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
