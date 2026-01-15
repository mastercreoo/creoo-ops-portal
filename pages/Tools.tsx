
import React, { useEffect, useState } from 'react';
import { Wrench, Search, Filter, Plus, ExternalLink, ShieldCheck, X, Send, DollarSign, Info, Calendar, Box, Tag, UserCheck } from 'lucide-react';
import { activeAdapter } from '../services/dataAdapter';
import { Tool, Role, VisibilityLevel, RequestStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { VISIBILITY_LABELS } from '../constants';

const Tools: React.FC = () => {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [toolForm, setToolForm] = useState<Partial<Tool>>({
    name: '', vendor: '', category: 'Software', cost: 0, currency: 'USD',
    billingCycle: 'monthly', visibilityLevel: VisibilityLevel.CompanyShared, seatsTotal: 1, notes: ''
  });
  
  const [requestForm, setRequestForm] = useState({
    toolName: '', justification: '', expectedUsers: 1, urgency: 'medium' as const,
    estCost: 0, currency: 'USD'
  });

  const loadTools = async () => {
    const allTools = await activeAdapter.listTools();
    let filtered = allTools;
    if (user?.role !== Role.Admin) {
      filtered = allTools.filter(t => t.visibilityLevel !== VisibilityLevel.PrivateAdmin);
    }
    setTools(filtered);
  };

  useEffect(() => {
    loadTools();
  }, [user]);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await activeAdapter.createTool({ ...toolForm, ownerRole: Role.Admin });
      setShowAddModal(false);
      setToolForm({
        name: '', vendor: '', category: 'Software', cost: 0, currency: 'USD',
        billingCycle: 'monthly', visibilityLevel: VisibilityLevel.CompanyShared, seatsTotal: 1, notes: ''
      });
      loadTools();
      alert('Tool added successfully');
    } catch (err) {
      console.error("Add tool error:", err);
      alert('Failed to add tool');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const formattedNotes = `Estimated cost: ${requestForm.estCost} ${requestForm.currency}/month. ${requestForm.justification}`;
      await activeAdapter.createToolRequest({ 
        toolName: requestForm.toolName,
        justification: requestForm.justification,
        expectedUsers: requestForm.expectedUsers,
        urgency: requestForm.urgency,
        userId: user.userId, 
        status: RequestStatus.Requested,
        notes: formattedNotes
      });
      setShowRequestModal(false);
      setRequestForm({
        toolName: '', justification: '', expectedUsers: 1, urgency: 'medium' as const,
        estCost: 0, currency: 'USD'
      });
      alert('Request submitted successfully');
    } catch (err) {
      console.error("Request tool error:", err);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(t => 
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.vendor.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'All' || t.category === categoryFilter)
  );

  const categories = ['All', ...Array.from(new Set(tools.map(t => t.category)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tool Registry</h2>
          <p className="text-slate-500">Manage software licenses and access rights.</p>
        </div>
        <div className="flex gap-2">
          {user?.role === Role.Admin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm shadow-indigo-100"
            >
              <Plus size={18} />
              Add Tool
            </button>
          )}
          <button 
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
          >
            Request New Tool
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tools or vendors..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 border-dashed">
          <Wrench size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="font-bold text-slate-900">No tools found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div key={tool.toolId} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Wrench size={24} className="text-indigo-600" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      tool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tool.status}
                    </span>
                    {tool.visibilityLevel === VisibilityLevel.PrivateAdmin && (
                      <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold uppercase tracking-wider">
                        <ShieldCheck size={12} />
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900">{tool.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{tool.vendor}</p>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Billing</span>
                    <span className="font-medium text-slate-900 capitalize">{tool.billingCycle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cost</span>
                    <span className="font-medium text-slate-900">{tool.currency} {tool.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Visibility</span>
                    <span className="font-medium text-slate-900">{VISIBILITY_LABELS[tool.visibilityLevel]}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Renewal: {new Date(tool.renewalDate).toLocaleDateString()}</span>
                <button 
                  onClick={() => setSelectedTool(tool)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                  Details <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tool Details Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative h-24 bg-indigo-600 p-6 flex items-end">
              <button 
                onClick={() => setSelectedTool(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-10 left-6 p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                <Wrench size={40} className="text-indigo-600" />
              </div>
            </div>
            
            <div className="p-8 pt-14 space-y-8 max-h-[75vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-black text-slate-900">{selectedTool.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedTool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedTool.status}
                  </span>
                </div>
                <p className="text-slate-500 font-medium">{selectedTool.vendor}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Tag size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Category</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedTool.category}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cost</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedTool.currency} {selectedTool.cost.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Renewal</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedTool.renewalDate).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Box size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Seats</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedTool.seatsTotal}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Info size={18} className="text-indigo-600" />
                  <h4>Tool Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Visibility</label>
                    <p className="text-sm font-medium">{VISIBILITY_LABELS[selectedTool.visibilityLevel]}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Cycle</label>
                    <p className="text-sm font-medium capitalize">{selectedTool.billingCycle}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</label>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedTool.notes || 'No internal notes available for this tool.'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <UserCheck size={18} className="text-indigo-600" />
                  <h4>Active Access List</h4>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Access Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium">Jai (u1)</td>
                        <td className="px-6 py-4 text-sm">Admin / Owner</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm font-medium">Ayesha (u2)</td>
                        <td className="px-6 py-4 text-sm">Billing Admin</td>
                      </tr>
                      <tr className="bg-slate-50/50 italic">
                        <td colSpan={2} className="px-6 py-3 text-[10px] text-center text-slate-400">
                          Automatic sync with ToolAccess table pending implementation...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedTool(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Add New Tool</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddTool} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tool Name</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={toolForm.name} onChange={e => setToolForm({...toolForm, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={toolForm.vendor} onChange={e => setToolForm({...toolForm, vendor: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={toolForm.category} onChange={e => setToolForm({...toolForm, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Monthly Cost</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={toolForm.cost} onChange={e => setToolForm({...toolForm, cost: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Visibility</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={toolForm.visibilityLevel} onChange={e => setToolForm({...toolForm, visibilityLevel: e.target.value as VisibilityLevel})}>
                    {Object.entries(VISIBILITY_LABELS).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">{loading ? 'Saving...' : 'Create Tool'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Request Tool Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Request New Tool</h3>
              <button onClick={() => setShowRequestModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestTool} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Tool Name</label>
                <input required placeholder="e.g. GitHub Copilot" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={requestForm.toolName} onChange={e => setRequestForm({...requestForm, toolName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Justification</label>
                <textarea required placeholder="Why do you need this tool?" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm h-24" value={requestForm.justification} onChange={e => setRequestForm({...requestForm, justification: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Est. Monthly Cost</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" required className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={requestForm.estCost} onChange={e => setRequestForm({...requestForm, estCost: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Currency</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase" value={requestForm.currency} onChange={e => setRequestForm({...requestForm, currency: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Urgency</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={requestForm.urgency} onChange={e => setRequestForm({...requestForm, urgency: e.target.value as any})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Target Seats</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={requestForm.expectedUsers} onChange={e => setRequestForm({...requestForm, expectedUsers: parseInt(e.target.value)})} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                <Send size={18} />
                {loading ? 'Submitting...' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tools;
