import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Company, Invoice, InvoiceItem } from '../../types/database';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice | null;
}

export default function EditInvoiceModal({ isOpen, onClose, onSuccess, invoice }: EditInvoiceModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    company_id: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        company_id: invoice.company_id,
        items: invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        status: invoice.status,
      });
    }
  }, [invoice]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const updateItemAmount = (index: number, quantity: number, rate: number) => {
    const amount = quantity * rate;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity, rate, amount } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    
    setLoading(true);

    try {
      const totalAmount = getTotalAmount();

      const { error } = await supabase
        .from('invoices')
        .update({
          company_id: formData.company_id,
          amount: totalAmount,
          items: formData.items,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Invoice</h2>
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
          {/* Company and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Select Company
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Invoice Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'sent' | 'paid' | 'overdue' }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-gray-700 text-sm font-medium">
                Invoice Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-gray-600 text-xs font-medium mb-1">Description</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        items: prev.items.map((it, i) => 
                          i === index ? { ...it, description: e.target.value } : it
                        )
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Service description"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-gray-600 text-xs font-medium mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        updateItemAmount(index, quantity, item.rate);
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-gray-600 text-xs font-medium mb-1">Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={item.rate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        updateItemAmount(index, item.quantity, rate);
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <label className="block text-gray-600 text-xs font-medium mb-1">Amount</label>
                    <input
                      type="text"
                      value={item.amount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                {getTotalAmount().toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </span>
            </div>
          </div>

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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
