import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Mail, FileText, Calendar, DollarSign, Edit, Trash2, IndianRupee, MoreVertical, X } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import AddInvoiceModal from '../components/modals/AddInvoiceModal';
import EditInvoiceModal from '../components/modals/EditInvoiceModal';
import { supabase } from '../lib/supabase';
import type { Invoice } from '../types/database';
import jsPDF from "jspdf";

interface InvoiceWithCompany extends Invoice {
  company_name?: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceWithCompany[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, companies!inner(name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const invoicesWithCompany = data?.map(invoice => ({
        ...invoice,
        company_name: invoice.companies.name
      })) || [];

      setInvoices(invoicesWithCompany);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    const subscription = supabase
      .channel('invoices_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        loadInvoices();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm]);

  const handleDownload = (invoice: InvoiceWithCompany) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("YADAV GARDENING SERVICES", 105, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Sec-6, IMT Manesar", 105, 40, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 55, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 15, 70);
    doc.text(`Invoice No: ${invoice.invoice_number}`, 140, 70);
    doc.text(`Company: ${invoice.company_name}`, 15, 80);

    doc.rect(15, 90, 180, 15);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, 100);
    doc.text("Qty", 100, 100);
    doc.text("Rate", 130, 100);
    doc.text("Amount", 170, 100);

    doc.setFont("helvetica", "normal");
    doc.text("Services Rendered", 20, 120);
    doc.text("1", 100, 120);
    doc.text(`₹${Number(invoice.amount).toLocaleString('en-IN')}`, 130, 120);
    doc.text(`₹${Number(invoice.amount).toLocaleString('en-IN')}`, 170, 120);

    doc.line(15, 130, 195, 130);

    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 130, 140);
    doc.text(`₹${Number(invoice.amount).toLocaleString('en-IN')}`, 170, 140);

    doc.setFont("helvetica", "normal");
    doc.text("Amount in words:", 15, 160);
    doc.setFont("helvetica", "italic");
    doc.text(`${numberToWords(Number(invoice.amount))} Rupees Only`, 15, 170);

    doc.setFont("helvetica", "normal");
    doc.text("For YADAV GARDENING SERVICES", 140, 200);
    doc.text("Authorized Signatory", 140, 220);

    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  };

  const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    };

    return convert(num);
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'sent': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const totalInvoiceValue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 pb-20 max-w-[100vw] overflow-x-hidden">
      <Header 
        onSearch={setSearchTerm} 
        searchPlaceholder="Search invoices..." 
      />

      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-600">Manage and track your invoices</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <GlassCard className="p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Invoices</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{invoices.length}</p>
          </div>
        </GlassCard>
        
        <GlassCard className="p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Value</p>
            <div className="flex items-center justify-center">
              <p className="text-xl sm:text-3xl font-bold text-blue-600">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(totalInvoiceValue)}
              </p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Paid</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl sm:text-3xl font-bold text-green-600">{paidInvoices.length}</p>
              <span className="text-xs text-green-600">invoices</span>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Overdue</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl sm:text-3xl font-bold text-red-600">{overdueInvoices.length}</p>
              <span className="text-xs text-red-600">invoices</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 sm:p-6">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Invoice #</th>
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Company</th>
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Amount</th>
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Date</th>
                <th className="text-left text-xs sm:text-sm text-gray-600 font-medium p-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-blue-600 font-medium">{invoice.invoice_number}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-gray-900">{invoice.company_name}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-gray-900 font-semibold">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(Number(invoice.amount))}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex gap-1 sm:gap-2">
                      <button className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(invoice)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownload(invoice)}
                        className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => deleteInvoice(invoice.id)}
                        className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
          <p className="text-sm text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Create your first invoice'}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Generate Invoice
          </button>
        </div>
      )}

      <AddInvoiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadInvoices}
      />
      <EditInvoiceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadInvoices}
        invoice={selectedInvoice}
      />
    </div>
  );
}