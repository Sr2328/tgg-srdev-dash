import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Labor, SalaryPayment } from '../../types/database';

interface SalaryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  laborer: Labor | null;
}

export default function SalaryPaymentModal({ isOpen, onClose, onSuccess, laborer }: SalaryPaymentModalProps) {
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear(),
    amount: '',
    status: 'paid' as 'paid' | 'pending',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [existingPayments, setExistingPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && laborer) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      setFormData(prev => ({
        ...prev,
        month: currentMonth,
        amount: laborer.salary_amount.toString(),
      }));
      loadExistingPayments();
    }
  }, [isOpen, laborer]);

  const loadExistingPayments = async () => {
    if (!laborer) return;
    
    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('labor_id', laborer.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setExistingPayments(data || []);
    } catch (error) {
      console.error('Error loading existing payments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborer) return;
    
    setLoading(true);

    try {
      // Check if payment already exists for this month/year
      const existingPayment = existingPayments.find(p => 
        p.month === formData.month && p.year === formData.year
      );

      if (existingPayment) {
        // Update existing payment
        const { error } = await supabase
          .from('salary_payments')
          .update({
            amount: parseFloat(formData.amount) || 0,
            status: formData.status,
            payment_date: formData.status === 'paid' ? formData.payment_date : null,
          })
          .eq('id', existingPayment.id);

        if (error) throw error;
      } else {
        // Create new payment
        const { error } = await supabase
          .from('salary_payments')
          .insert([{
            labor_id: laborer.id,
            month: formData.month,
            year: formData.year,
            amount: parseFloat(formData.amount) || 0,
            status: formData.status,
            payment_date: formData.status === 'paid' ? formData.payment_date : null,
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing salary payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!isOpen || !laborer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Salary Payment</h2>
              <p className="text-gray-600">{laborer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Month and Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Month
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter payment amount"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'paid' | 'pending' }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Payment Date */}
          {formData.status === 'paid' && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Payment Date
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Existing Payments */}
          {existingPayments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {existingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-gray-900 font-medium">{payment.month} {payment.year}</p>
                      <p className="text-gray-600 text-sm">${Number(payment.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payment.status === 'paid' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Calendar className="w-4 h-4 text-orange-600" />
                      )}
                      <span className={`text-sm font-medium ${payment.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}