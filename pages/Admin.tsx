import React, { useState, useEffect } from 'react';
import { Shield, Settings, UserPlus, Activity, User as UserIcon, CheckCircle2, AlertCircle, Terminal, Copy, ClipboardCheck, History, X, RefreshCw, Calendar, MapPin, Clock, Briefcase, Cake } from 'lucide-react';
import { activeAdapter } from '../services/dataAdapter';
import { User, Role, AuditLog } from '../types';
import { notifyN8N } from '../services/notificationService';

const Admin: React.FC = () => {
  const [activeView, setActiveView] = useState<'users' | 'audit' | 'config'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: Role.Employee,
    birthday: '',
    department: 'Engineering',
    workLocation: 'Remote',
    timezone: 'UTC',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time' as const
  });

  const loadUsers = async () => {
    setLoading(true);
    const data = await activeAdapter.listUsers();
    setUsers(data);
    setLoading(false);
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    const data = await activeAdapter.listAuditLogs();
    setAuditLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeView === 'users') loadUsers();
    if (activeView === 'audit') loadAuditLogs();
  }, [activeView]);

  const handleUpdateRole = async (userId: string, role: Role) => {
    await activeAdapter.updateUser(userId, { role });
    loadUsers();
  };

  const handleToggleStatus = async (userId: string, current: string) => {
    await activeAdapter.updateUser(userId, { status: current === 'active' ? 'inactive' : 'active' });
    loadUsers();
  };

  const generateTempPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pwd = generateTempPassword();
      const newUser = await activeAdapter.createUser({
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        passwordHash: pwd,
        status: 'active_temp_password'
      });

      await activeAdapter.createEmployee({
        userId: newUser.userId,
        department: inviteForm.department,
        joiningDate: inviteForm.joiningDate,
        employmentType: inviteForm.employmentType,
        workLocation: inviteForm.workLocation,
        timezone: inviteForm.timezone,
        birthday: inviteForm.birthday,
        managerId: null
      });

      setTempPassword(pwd);
      setShowInviteModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testNotifications = async () => {
    await notifyN8N('FINANCE_EVENT', {
      requestType: 'System',
      event: 'test',
      id: 'TEST_ID',
      requester: { userId: 'admin', name: 'System Admin', email: 'admin@creoo.com' },
      fields: { message: 'Test notification from Ops Portal' },
      status: 'active',
      timestamp: new Date().toISOString(),
      deepLink: window.location.origin
    });
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset demo data?")) return;
    await activeAdapter.resetDemoData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Shield size={24} /></div>
        <div>
          <h2 className="text-2xl font-bold">Admin Control Center</h2>
          <p className="text-slate-500">Manage system settings, users, and security logs.</p>
        </div>
      </div>

      {/* USERS */}
      {activeView === 'users' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <tbody>
              {users.map(u => (
                <tr key={u.userId} className="border-b">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {(u.name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">{u.name || 'Unnamed User'}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">{u.status}</td>
                  <td className="p-4">{u.lastLoginAt || 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;