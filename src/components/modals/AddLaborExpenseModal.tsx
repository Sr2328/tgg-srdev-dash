import React, { useState } from 'react';
import { X, DollarSign, ClipboardList, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddLaborExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;     // call to refresh list on parent
  laborId: string | null;    // the labor this expense belongs to
  laborName?: string;        // for header, optional
}

export default function AddLaborExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  laborId,
  laborName,
}: AddLaborExpenseModalProps) {
  const [form, setForm] = useState({
    purpose: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborId) {
      alert('No worker selected for this expense.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        labor_id: laborId,
        purpose: form.purpose.trim(),
        amount: Number(form.amount) || 0,
        // your column is timestamptz -> pass ISO
        date: new Date(`${form.date}T00:00:00Z`).toISOString(),
      };

      const { error } = await supabase.from('labor_expenses').insert([payload]).select();
      if (error) throw error;

      onSuccess();         // refresh parent
      onClose();           // close modal
      setForm({
        purpose: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
              {laborName ? (
                <p className="text-gray-600 text-sm">Worker: {laborName}</p>
              ) : null}
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Purpose
            </label>
            <input
              type="text"
              required
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Tools, Transport, Lunch"
            />
          </div>

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
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
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
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
