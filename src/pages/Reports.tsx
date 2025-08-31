import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";
import GlassCard from "../components/ui/GlassCard";
import { Download, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabase"; // ✅ make sure you have this client setup

export default function Reports() {
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [projectPerformance, setProjectPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data: reports, error: reportsError } = await supabase.from("reports").select("*").order("created_at");
      const { data: expenses, error: expensesError } = await supabase.from("expense_breakdown").select("*");
      const { data: projects, error: projectsError } = await supabase.from("project_performance").select("*");

      if (reportsError || expensesError || projectsError) {
        console.error("Error fetching reports:", { reportsError, expensesError, projectsError });
      } else {
        setIncomeData(reports || []);
        setExpenseBreakdown(expenses || []);
        setProjectPerformance(projects || []);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-300">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Calendar className="w-4 h-4" />
            Custom Range
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Monthly Revenue</p>
            <p className="text-3xl font-bold text-emerald-400">
              ₹{incomeData.length ? incomeData[incomeData.length - 1].income.toLocaleString() : "0"}
            </p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Net Profit</p>
            <p className="text-3xl font-bold text-blue-400">
              ₹{incomeData.length ? incomeData[incomeData.length - 1].profit.toLocaleString() : "0"}
            </p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Projects Tracked</p>
            <p className="text-3xl font-bold text-purple-400">{projectPerformance.length}</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-sm">%</span>
            </div>
            <p className="text-gray-300 text-sm">Profit Margin</p>
            <p className="text-3xl font-bold text-orange-400">
              {incomeData.length
                ? ((incomeData[incomeData.length - 1].profit / incomeData[incomeData.length - 1].income) * 100).toFixed(1)
                : "0"}%
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income Trend */}
        <GlassCard className="xl:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4">Financial Trend Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Expense Breakdown */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-4">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `₹${expenseBreakdown.find((e) => e.name === name)?.amount.toLocaleString()}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Project Performance */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-4">Project Performance</h3>
          <div className="space-y-3">
            {projectPerformance.map((project, index) => {
              const efficiency = ((project.budget - project.actual) / project.budget) * 100;
              return (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{project.project}</h4>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        efficiency >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {efficiency >= 0 ? "+" : ""}
                      {efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Budget</p>
                      <p className="text-white">₹{project.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Actual</p>
                      <p className="text-white">₹{project.actual.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Profit</p>
                      <p className="text-emerald-400">₹{project.profit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
