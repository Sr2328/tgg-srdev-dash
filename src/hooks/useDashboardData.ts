import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../types/database';

export function useDashboardData() {
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load all data in parallel
      const [
        { data: payments },
        { data: companies },
        { data: labor },
        { data: projects },
        { data: laborExpenses },
        { data: projectExpenses }
      ] = await Promise.all([
        supabase.from('payments').select('amount, status, date'),
        supabase.from('companies').select('id'),
        supabase.from('labor').select('salary_amount, salary_type'),
        supabase.from('side_projects').select('status, profit, cost'),
        supabase.from('labor_expenses').select('amount'),
        supabase.from('project_expenses').select('amount')
      ]);

      // Calculate stats
      const totalIncome = payments?.reduce((sum, p) => 
        sum + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0;
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const weeklyIncome = payments?.reduce((sum, p) => {
        const paymentDate = new Date(p.date);
        return sum + (p.status === 'paid' && paymentDate >= oneWeekAgo ? Number(p.amount) : 0);
      }, 0) || 0;
      
      const monthlyIncome = payments?.reduce((sum, p) => {
        const paymentDate = new Date(p.date);
        return sum + (p.status === 'paid' && paymentDate >= oneMonthAgo ? Number(p.amount) : 0);
      }, 0) || 0;

      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const oneTimeProjects = projects?.filter(p => p.status === 'completed').length || 0;
      
      const pendingSalaries = labor?.reduce((sum, l) => sum + Number(l.salary_amount), 0) || 0;
      
      const totalExpenses = (laborExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0) +
                           (projectExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0);

      setStats({
        totalIncome,
        weeklyIncome,
        monthlyIncome,
        activeProjects,
        permanentClients: companies?.length || 0,
        oneTimeProjects,
        activeWorkers: labor?.length || 0,
        pendingSalaries,
        totalExpenses,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, reload: loadDashboardStats };
}