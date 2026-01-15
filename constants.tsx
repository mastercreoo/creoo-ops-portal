
import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  CreditCard, 
  Inbox, 
  Settings, 
  LogOut,
  Calendar,
  Clock,
  PieChart,
  UserPlus,
  PlusCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Role } from './types';

export const APP_NAME = "Creoo Ops Portal";

export const NAVIGATION = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: Object.values(Role) },
  { name: 'Tool Registry', path: '/tools', icon: Wrench, roles: Object.values(Role) },
  { name: 'HR / Employees', path: '/hr', icon: Users, roles: [Role.Admin, Role.OpsHR, Role.Employee, Role.Intern] },
  { name: 'Finance', path: '/finance', icon: CreditCard, roles: [Role.Admin, Role.Finance] },
  { name: 'Requests', path: '/requests', icon: Inbox, roles: Object.values(Role) },
  { name: 'Admin', path: '/admin', icon: Settings, roles: [Role.Admin] },
];

export const STATUS_COLORS = {
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  procured: 'bg-blue-100 text-blue-800 border-blue-200',
  access_granted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const VISIBILITY_LABELS = {
  company_shared: 'Company Shared',
  team_shared: 'Team Shared',
  private_admin: 'Private (Admin Only)',
  role_based: 'Role Specific',
};
