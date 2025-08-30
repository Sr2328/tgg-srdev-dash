import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Phone, MapPin, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import AddLaborModal from '../components/modals/AddLaborModal';
import EditLaborModal from '../components/modals/EditLaborModal';
import SalaryPaymentModal from '../components/modals/SalaryPaymentModal';
import AddLaborExpenseModal from '../components/modals/AddLaborExpenseModal';
import { supabase } from '../lib/supabase';
import type { Labor, LaborExpense, SalaryPayment } from '../types/database';

export default function Labor() {
  const [laborers, setLaborers] = useState<Labor[]>([]);
  const [expenses, setExpenses] = useState<LaborExpense[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [filteredLaborers, setFilteredLaborers] = useState<Labor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false); // ADDED
  const [selectedLaborer, setSelectedLaborer] = useState<Labor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLaborers();
    loadExpenses();
    loadSalaryPayments();
    
    // Set up real-time subscriptions
    const subscriptions = [
      supabase
        .channel('labor_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'labor' }, () => {
          loadLaborers();
        })
        .subscribe(),
      
      supabase
        .channel('labor_expenses_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'labor_expenses' }, () => {
          loadExpenses();
        })
        .subscribe(),
      
      supabase
        .channel('salary_payments_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_payments' }, () => {
          loadSalaryPayments();
        })
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  useEffect(() => {
    filterLaborers();
  }, [laborers, searchTerm]);

  const filterLaborers = () => {
    if (!searchTerm) {
      setFilteredLaborers(laborers);
      return;
    }

    const filtered = laborers.filter(labor =>
      labor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labor.phone.includes(searchTerm) ||
      labor.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLaborers(filtered);
  };

  const loadLaborers = async () => {
    try {
      const { data, error } = await supabase
        .from('labor')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLaborers(data || []);
    } catch (error) {
      console.error('Error loading laborers:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('labor_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadSalaryPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalaryPayments(data || []);
    } catch (error) {
      console.error('Error loading salary payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLaborer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;

    try {
      const { error } = await supabase
        .from('labor')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting laborer:', error);
    }
  };

  const getLaborExpenses = (laborId: string) => {
    return expenses.filter(e => e.labor_id === laborId);
  };

  const getTotalExpenses = (laborId: string) => {
    return getLaborExpenses(laborId).reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getLaborSalaryPayments = (laborId: string) => {
    return salaryPayments.filter(sp => sp.labor_id === laborId);
  };

  const getCurrentMonthSalaryStatus = (laborId: string) => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    const payment = salaryPayments.find(sp => 
      sp.labor_id === laborId && 
      sp.month === currentMonth && 
      sp.year === currentYear
    );
    
    return payment?.status || 'pending';
  };

  const handleEdit = (laborer: Labor) => {
    setSelectedLaborer(laborer);
    setShowEditModal(true);
  };

  const handlePaySalary = (laborer: Labor) => {
    setSelectedLaborer(laborer);
    setShowSalaryModal(true);
  };

  // NEW: open Add Expense modal for specific laborer
  const handleAddExpense = (laborer: Labor) => {
    setSelectedLaborer(laborer);
    setShowExpenseModal(true);
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
      <Header 
        onSearch={setSearchTerm} 
        searchPlaceholder="Search workforce by name, phone, or role..."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workforce Management</h1>
          <p className="text-gray-600">Manage your workforce, salaries, and expenses</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Workforce Member
        </button>
      </div>

      {/* Labor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Workers</p>
            <p className="text-3xl font-bold text-gray-900">{laborers.length}</p>
          </div>
        </GlassCard>
        <GlassCard>
         <div className="text-center">
  <p className="text-gray-600 text-sm">Monthly Salaries</p>
  <p className="text-3xl font-bold text-green-600">
    {new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0, // remove paise decimals
    }).format(
      laborers.reduce(
        (sum, l) =>
          sum + (l.salary_type === "monthly"
            ? Number(l.salary_amount)
            : Number(l.salary_amount) * 4),
        0
      )
    )}
  </p>
</div>
        </GlassCard>
        <GlassCard>
  <div className="text-center">
    <p className="text-gray-600 text-sm">Pending Salaries</p>
    <p className="text-3xl font-bold text-orange-600">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(
        salaryPayments
          .filter((sp) => sp.status === "pending")
          .reduce((sum, sp) => sum + Number(sp.amount), 0)
      )}
    </p>
  </div>
</GlassCard>

<GlassCard>
  <div className="text-center">
    <p className="text-gray-600 text-sm">Total Expenses</p>
    <p className="text-3xl font-bold text-red-600">
      {new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(
        expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      )}
    </p>
  </div>
</GlassCard>

      </div>

      {/* Labor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLaborers.map((labor) => {
          const totalExpenses = getTotalExpenses(labor.id);
          const laborExpenses = getLaborExpenses(labor.id);
          const salaryStatus = getCurrentMonthSalaryStatus(labor.id);

          return (
            <GlassCard key={labor.id} hover>
              <div className="space-y-4">
                {/* Labor Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {labor.photo_url ? (
                      <img
                        src={labor.photo_url}
                        alt={labor.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {labor.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{labor.name}</h3>
                      <p className="text-blue-600 text-sm">{labor.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(labor)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteLaborer(labor.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{labor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{labor.address}</span>
                  </div>
                </div>

                {/* Salary Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">Salary Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="text-gray-900 capitalize">{labor.salary_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                   <p className="text-gray-900">
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(labor.salary_amount))}
</p>

                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Current Month</span>
                      <div className="flex items-center gap-1">
                        {salaryStatus === 'paid' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Calendar className="w-4 h-4 text-orange-600" />
                        )}
                        <span className={`text-sm font-medium ${salaryStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                          {salaryStatus === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs">Total Expenses</p>
                    <p className="text-gray-900">
  {new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(labor.salary_amount))}
</p>

                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Last Expense</p>
                      <p className="text-gray-900 text-sm">
                        {laborExpenses[0] ? new Date(laborExpenses[0].date).toLocaleDateString() : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handlePaySalary(labor)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${salaryStatus === 'paid' ? 'border-2 border-green-200 text-green-600 hover:bg-green-50' : 'border-2 border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  >
                    {salaryStatus === 'paid' ? 'View Payment' : 'Pay Salary'}
                  </button>
                  <button 
                    onClick={() => handleAddExpense(labor)} // wired to open expense modal
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLaborers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No workers found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Start building your team by adding workers'}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Your First Worker
          </button>
        </div>
      )}

      {/* Modals */}
      <AddLaborModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadLaborers}
      />
      <EditLaborModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadLaborers}
        laborer={selectedLaborer}
      />
      <SalaryPaymentModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        onSuccess={loadSalaryPayments}
        laborer={selectedLaborer}
      />

      {/* -------- Add Expense Modal (inline) -------- */}
      {showExpenseModal && selectedLaborer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Add Expense — {selectedLaborer.name}</h3>
                <p className="text-sm text-gray-500">Add an expense for this worker</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>

            <AddExpenseForm
              laborer={selectedLaborer}
              onCancel={() => setShowExpenseModal(false)}
              onSuccess={() => {
                loadExpenses();
                setShowExpenseModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------- AddExpenseForm component (inner, keeps imports untouched) ----------------- */
function AddExpenseForm({
  laborer,
  onCancel,
  onSuccess,
}: {
  laborer: Labor;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!laborer) return;

    setLoading(true);
    try {
      const payload = {
        labor_id: laborer.id,
        purpose: purpose.trim(),
        amount: Number(amount) || 0,
        date: date, // assume column is date or timestamptz acceptable
      };

      const { data, error } = await supabase
        .from('labor_expenses')
        .insert([payload])
        .select(); // return inserted row(s)

      if (error) throw error;

      // refresh parent list
      onSuccess();
      // reset
      setPurpose('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Purpose</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2"
          placeholder="e.g. Tools, Transport, Lunch"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={(e) => handleSubmit(e)}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
}
