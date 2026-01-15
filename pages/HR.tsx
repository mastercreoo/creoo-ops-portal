
import React, { useState, useEffect } from 'react';
import { activeAdapter } from '../services/dataAdapter';
import { Employee, User, Role, AttendanceStatus, LeaveRequest, LeaveRequestStatus } from '../types';
import { Users, Calendar, Clock, MapPin, Search, Filter, Plus, X, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const HR: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leave'>('directory');
  const [employees, setEmployees] = useState<(Employee & { user: User })[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [leaveForm, setLeaveForm] = useState({
    startDate: '', endDate: '', leaveType: 'Casual', reason: ''
  });

  const loadHRData = async () => {
    setLoading(true);
    const [emps, users, leaves] = await Promise.all([
      activeAdapter.listEmployees(),
      activeAdapter.listUsers(),
      activeAdapter.listLeaveRequests()
    ]);
    
    setEmployees(
  emps.map(e => {
    // Airtable linked/lookup fields come as arrays
    const linkedUserId =
      Array.isArray(e.userId) ? e.userId[0] : e.userId;

    const matchedUser =
      users.find(u =>
        u.userId === linkedUserId ||
        u.recordId === linkedUserId || // safety for recordId-based links
        u.name === linkedUserId         // safety for lookup-by-name
      );

    return {
      ...e,
      user: matchedUser || {
        userId: 'unknown',
        name: 'Unknown',
        email: '',
        role: Role.Employee
      }
    };
  })
);

    setLeaveRequests(leaves);
    setLoading(false);
  };

  useEffect(() => {
    loadHRData();
  }, []);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await activeAdapter.createLeaveRequest({ ...leaveForm, userId: user.userId });
      setShowLeaveModal(false);
      loadHRData();
      alert('Leave request submitted');
    } catch (err) {
      console.error("Failed to create leave request:", err);
      alert("Failed to apply for leave. See console.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (id: string, status: LeaveRequestStatus) => {
    if (!user) return;
    
    // Fix: Correctly handle cancellation of the prompt dialog
    const promptMsg = `Notes for ${status.toUpperCase()}:`;
    const notes = prompt(promptMsg);
    
    if (notes === null) {
      console.log("Leave action cancelled.");
      return; // Do not update if user clicked 'Cancel'
    }
    
    try {
      await activeAdapter.updateLeaveRequestStatus(id, status, user.userId, notes || '');
      loadHRData();
    } catch (err) {
      console.error("Failed to update leave request status:", err);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">People & Culture</h2>
          <p className="text-slate-500">Manage directory, attendance, and leave requests.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          {(['directory', 'attendance', 'leave'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search employees by name..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <div key={emp.employeeId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {emp.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{emp.user.name}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{emp.department}</p>
                    <p className="text-xs text-slate-400 mt-1">{emp.user.email}</p>
                  </div>
                </div>
                <div className="space-y-3 py-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="text-sm">{emp.workLocation}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-sm">Joined {emp.joiningDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Leave Requests</h3>
            <button 
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold"
            >
              <Plus size={18} />
              Apply for Leave
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No leave requests found.</td></tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr key={req.leaveId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{req.userId}</td>
                      <td className="px-6 py-4 text-sm">{req.startDate} to {req.endDate}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{req.leaveType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          req.status === LeaveRequestStatus.Approved ? 'bg-green-100 text-green-700' :
                          req.status === LeaveRequestStatus.Rejected ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(user?.role === Role.Admin || user?.role === Role.OpsHR) && req.status === LeaveRequestStatus.Requested && (
                          <div className="flex gap-2">
                            <button onClick={() => handleLeaveAction(req.leaveId, LeaveRequestStatus.Approved)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg"><CheckCircle2 size={18} /></button>
                            <button onClick={() => handleLeaveAction(req.leaveId, LeaveRequestStatus.Rejected)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><XCircle size={18} /></button>
                            <button onClick={() => handleLeaveAction(req.leaveId, LeaveRequestStatus.NeedInfo)} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg"><HelpCircle size={18} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-12 text-center text-slate-400">
          <Clock size={48} className="mx-auto mb-4 opacity-10" />
          <p>Attendance logs are managed via internal check-in system.</p>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold">Apply for Leave</h3>
              <button onClick={() => setShowLeaveModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Leave Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})}>
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Privilege</option>
                  <option>Maternity/Paternity</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
                <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm h-24" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold transition-all hover:bg-indigo-700">{loading ? 'Submitting...' : 'Apply'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
