
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Users as UsersIcon, Wrench, Calendar, 
  ArrowUpRight, ArrowDownRight, Briefcase, Cake
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { activeAdapter } from '../services/dataAdapter';
import { Role, Employee, User } from '../types';
import { useAuth } from '../hooks/useAuth';

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <Icon size={24} />
      </div>
      {trend && change && (
        <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {change}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTools: 0,
    monthlyBurn: 0,
    pendingRequests: 0
  });

  const [upcomingBirthdays, setUpcomingBirthdays] = useState<{ name: string, date: string, dept: string }[]>([]);

  const chartData = [
    { month: 'Jan', burn: 45000 },
    { month: 'Feb', burn: 48000 },
    { month: 'Mar', burn: 52000 },
    { month: 'Apr', burn: 51000 },
    { month: 'May', burn: 54000 },
  ];

  useEffect(() => {
    const loadData = async () => {
      const [emps, tools, expenses, toolReqs, users] = await Promise.all([
        activeAdapter.listEmployees(),
        activeAdapter.listTools(),
        activeAdapter.listExpenses('', ''),
        activeAdapter.listToolRequests(),
        activeAdapter.listUsers()
      ]);
      
console.log('EMPLOYEES RAW:', emps);

      setStats({
        totalEmployees: emps.length,
        activeTools: tools.filter(t => t.status === 'active').length,
        monthlyBurn: expenses.reduce((acc, curr) => acc + curr.amount, 0),
        pendingRequests: toolReqs.filter(r => r.status === 'requested' || r.status === 'need_info').length
      });

      // Calculate upcoming birthdays
      const today = new Date();
      const currentYear = today.getFullYear();
      
      const bdays = emps.map(emp => {
  if (!emp.birthday) return null;

       const bday = new Date(emp.birthday);
const nextBday = new Date(
  currentYear,
  bday.getMonth(),
  bday.getDate()
);
        // If birthday has passed this year, it's next year
        if (nextBday < today) {
          nextBday.setFullYear(currentYear + 1);
        }

        return {
  name: emp.userId, // already the name from Airtable
  dateObj: nextBday,
  dateFormatted: nextBday.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  }),
  dept: emp.department,
  diffDays: (nextBday.getTime() - today.getTime()) / (1000 * 3600 * 24)
};
      })
      .filter((b): b is any => b !== null && b.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5);

      setUpcomingBirthdays(bdays.map(b => ({ name: b.name, date: b.dateFormatted, dept: b.dept })));
    };
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h2>
        <p className="text-slate-500">Here's what's happening at Creoo today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Headcount" value={stats.totalEmployees} change="+2.4%" icon={UsersIcon} trend="up" />
        <StatCard title="Active Tools" value={stats.activeTools} icon={Wrench} />
        <StatCard title="Est. Monthly Burn" value={`$${stats.monthlyBurn.toLocaleString()}`} change="+12%" icon={TrendingUp} trend="up" />
        <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Briefcase} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Monthly Burn Trend</h3>
            <select className="text-sm border-slate-200 rounded-lg p-1 bg-slate-50 focus:outline-none">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="burn" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Cake size={18} className="text-indigo-600" />
            Upcoming Birthdays (Next 30 Days)
          </h3>
          <div className="space-y-4">
            {upcomingBirthdays.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Cake size={32} className="mx-auto mb-2 opacity-10" />
                <p>No birthdays in the next 30 days.</p>
              </div>
            ) : (
              upcomingBirthdays.map((bd, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {bd.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{bd.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{bd.dept}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{bd.date}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Birthday</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
