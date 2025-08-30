import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import StatsCard from '../components/ui/StatsCard';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import { IndianRupee, Building2, Users, FolderOpen, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../types/database';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

// ✅ INR Formatter
const formatINR = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    activeProjects: 0,
    permanentClients: 0,
    oneTimeProjects: 0,
    activeWorkers: 0,
    pendingSalaries: 0,
    totalExpenses: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    completedProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [incomeData] = useState([
    { month: 'Jan', income: 45000, expenses: 25000 },
    { month: 'Feb', income: 52000, expenses: 28000 },
    { month: 'Mar', income: 48000, expenses: 26000 },
    { month: 'Apr', income: 61000, expenses: 32000 },
    { month: 'May', income: 55000, expenses: 29000 },
    { month: 'Jun', income: 67000, expenses: 35000 },
  ]);

  const [projectData] = useState([
    { name: 'Landscaping', value: 35, color: '#3B82F6' },
    { name: 'Maintenance', value: 45, color: '#10B981' },
    { name: 'Garden Care', value: 20, color: '#8B5CF6' },
  ]);

  useEffect(() => {
    loadDashboardStats();

    // Supabase realtime subscriptions
    const subscriptions = [
      supabase.channel('companies_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, loadDashboardStats)
        .subscribe(),

      supabase.channel('labor_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'labor' }, loadDashboardStats)
        .subscribe(),

      supabase.channel('projects_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'side_projects' }, loadDashboardStats)
        .subscribe(),

      supabase.channel('invoices_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, loadDashboardStats)
        .subscribe(),

      supabase.channel('payments_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, loadDashboardStats)
        .subscribe(),

      supabase.channel('salary_payments_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_payments' }, loadDashboardStats)
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [
        { data: payments },
        { data: companies },
        { data: labor },
        { data: projects },
        { data: invoices },
        { data: laborExpenses },
        { data: projectExpenses },
        { data: salaryPayments }
      ] = await Promise.all([
        supabase.from('payments').select('amount, date, status'),
        supabase.from('companies').select('id'),
        supabase.from('labor').select('salary_amount, salary_type'),
        supabase.from('side_projects').select('cost, profit, status'),
        supabase.from('invoices').select('amount, status'),
        supabase.from('labor_expenses').select('amount'),
        supabase.from('project_expenses').select('amount'),
        supabase.from('salary_payments').select('amount, status')
      ]);

      const totalIncome = payments?.reduce((sum, p) =>
        sum + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0;

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weeklyIncome = payments?.reduce((sum, p) => {
        const paymentDate = new Date(p.date);
        return sum + (p.status === 'paid' && paymentDate >= oneWeekAgo ? Number(p.amount) : 0);
      }, 0) || 0;

      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
      const unpaidInvoices = invoices?.filter(i => i.status !== 'paid').length || 0;

      const pendingSalaries = salaryPayments?.reduce((sum, sp) =>
        sum + (sp.status === 'pending' ? Number(sp.amount) : 0), 0) || 0;

      const totalExpenses = (laborExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0) +
        (projectExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0);

      setStats({
        totalIncome,
        weeklyIncome,
        monthlyIncome: totalIncome * 0.8,
        activeProjects,
        permanentClients: companies?.length || 0,
        oneTimeProjects: completedProjects,
        activeWorkers: labor?.length || 0,
        pendingSalaries,
        totalExpenses,
        paidInvoices,
        unpaidInvoices,
        completedProjects,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      navigate('/companies', { state: { searchTerm: term } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onSearch={handleGlobalSearch} />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Admin</h1>
        <p className="text-blue-100">Here's your garden maintenance agency overview for today</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Income"
          value={formatINR(stats.totalIncome)}
          icon={IndianRupee}
          change={{ value: '+12.5%', trend: 'up' }}
          color="green"
          onClick={() => navigate('/reports')}
        />
        <StatsCard
          title="Active Companies"
          value={stats.permanentClients}
          icon={Building2}
          change={{ value: '+3', trend: 'up' }}
          color="blue"
          onClick={() => navigate('/companies')}
        />
        <StatsCard
          title="Active Workers"
          value={stats.activeWorkers}
          icon={Users}
          change={{ value: '+2', trend: 'up' }}
          color="purple"
          onClick={() => navigate('/labor')}
        />
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={FolderOpen}
          change={{ value: '+5', trend: 'up' }}
          color="orange"
          onClick={() => navigate('/projects')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Paid Invoices"
          value={stats.paidInvoices}
          icon={FileText}
          color="green"
          onClick={() => navigate('/invoices')}
        />
        <StatsCard
          title="Unpaid Invoices"
          value={stats.unpaidInvoices}
          icon={FileText}
          color="red"
          onClick={() => navigate('/invoices')}
        />
        <StatsCard
          title="Completed Projects"
          value={stats.completedProjects}
          icon={FolderOpen}
          color="blue"
          onClick={() => navigate('/projects')}
        />
        <StatsCard
          title="Pending Salaries"
          value={formatINR(stats.pendingSalaries)}
          icon={IndianRupee}
          color="orange"
          onClick={() => navigate('/labor')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827'
                  }} 
                />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Service Distribution */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-gray-900 font-medium">Green Valley Corp</p>
                  <p className="text-gray-500 text-sm">Landscaping Service</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-semibold">{formatINR(2500)}</p>
                  <p className="text-gray-500 text-sm">2 days ago</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Pending Tasks */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-gray-900 font-medium">Invoice Generation</p>
                  <p className="text-gray-500 text-sm">Due tomorrow</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/companies')}
              className="w-full text-left p-3 border-2 border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Register New Company</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/labor')}
              className="w-full text-left p-3 border-2 border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Add Workforce Member</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/invoices')}
              className="w-full text-left p-3 border-2 border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Generate Invoice</span>
              </div>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
