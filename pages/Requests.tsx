
import React, { useState, useEffect } from 'react';
import { Inbox, Send, CheckCircle2, XCircle, Clock, HelpCircle, Box, AlertCircle, Mail } from 'lucide-react';
import { STATUS_COLORS } from '../constants';
import { activeAdapter } from '../services/dataAdapter';
import { ToolRequest, RequestStatus, Role, User } from '../types';
import { useAuth } from '../hooks/useAuth';

const Requests: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    const [reqData, userData] = await Promise.all([
      activeAdapter.listToolRequests(),
      activeAdapter.listUsers()
    ]);

    // Role-based visibility enforcement
    let visibleRequests = reqData;
    if (currentUser?.role === Role.Employee || currentUser?.role === Role.Intern) {
      visibleRequests = reqData.filter(r => r.userId === currentUser.userId);
    }

    setRequests(visibleRequests);
    
    // Map users for enrichment
    const userMap: Record<string, User> = {};
    userData.forEach(u => userMap[u.userId] = u);
    setUsers(userMap);
    
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleStatusUpdate = async (requestId: string, status: RequestStatus) => {
    if (!currentUser) return;
    
    // RBAC check: only Admin (Jai, Ayesha) and Ops/HR can approve/reject.
    if (currentUser.role !== Role.Admin && currentUser.role !== Role.OpsHR) {
      alert("Unauthorized: Only Admin or Ops/HR can update request status.");
      return;
    }

    // Handle prompt cancellation correctly
    const promptMsg = `Enter internal notes for status change to "${status.replace('_', ' ').toUpperCase()}":`;
    const notes = prompt(promptMsg);
    
    if (notes === null) {
      console.log("Status update cancelled by user.");
      return; // Stop here if user clicked 'Cancel'
    }
    
    try {
      await activeAdapter.updateToolRequestStatus(requestId, status, currentUser.userId, notes || '');
      await loadRequests();
    } catch (err) {
      console.error("Failed to update tool request status:", err);
      alert("Failed to update status. See console for details.");
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === RequestStatus.Requested || req.status === RequestStatus.NeedInfo;
    if (filter === 'resolved') return req.status !== RequestStatus.Requested && req.status !== RequestStatus.NeedInfo;
    return true;
  });

  const getRequesterInfo = (userId: string) => {
    const user = users[userId];
    if (!user) return { name: userId, email: 'N/A' };
    return { name: user.name, email: user.email };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {currentUser?.role === Role.Employee || currentUser?.role === Role.Intern ? 'My Requests' : 'Request Center'}
          </h2>
          <p className="text-slate-500">Workflow approvals and provisioning queue.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
          {(['all', 'pending', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Inbox size={48} className="mx-auto mb-4 opacity-10" />
                    <p>No requests found matching current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const requester = getRequesterInfo(req.userId);
                  return (
                    <tr key={req.requestId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-400">#{req.requestId.slice(-5)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                            <Send size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{req.toolName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tool Request • {req.urgency} urgency</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{requester.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail size={10} />
                            {requester.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[req.status as keyof typeof STATUS_COLORS] || 'bg-slate-100'}`}>
                          {req.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {/* Admin/Ops Actions */}
                          {(currentUser?.role === Role.Admin || currentUser?.role === Role.OpsHR) && (
                            <>
                              {(req.status === RequestStatus.Requested || req.status === RequestStatus.NeedInfo) && (
                                <>
                                  <button 
                                    onClick={() => handleStatusUpdate(req.requestId, RequestStatus.Approved)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(req.requestId, RequestStatus.Rejected)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(req.requestId, RequestStatus.NeedInfo)}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Need Info"
                                  >
                                    <HelpCircle size={18} />
                                  </button>
                                </>
                              )}
                              {req.status === RequestStatus.Approved && (
                                <button 
                                  onClick={() => handleStatusUpdate(req.requestId, RequestStatus.Procured)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <Box size={14} /> Mark Procured
                                </button>
                              )}
                              {req.status === RequestStatus.Procured && (
                                <button 
                                  onClick={() => handleStatusUpdate(req.requestId, RequestStatus.AccessGranted)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  Grant Access
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Informational Status for non-approvers */}
                          {req.status === RequestStatus.AccessGranted && (
                             <span className="text-xs text-slate-400 italic">Workflow Complete</span>
                          )}
                          {req.status === RequestStatus.Rejected && (
                             <span className="text-xs text-red-400 italic">Request Rejected</span>
                          )}
                          {(currentUser?.role === Role.Employee || currentUser?.role === Role.Intern) && 
                            req.status !== RequestStatus.AccessGranted && 
                            req.status !== RequestStatus.Rejected && (
                             <span className="text-xs text-slate-400 italic">Processing...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
            <Clock size={12} />
            Approval actions trigger immediate notifications for Jai and Ayesha
          </p>
        </div>
      </div>
    </div>
  );
};

export default Requests;
