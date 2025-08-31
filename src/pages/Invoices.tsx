import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Mail, FileText, Calendar, DollarSign, Edit, Trash2, IndianRupee } from 'lucide-react';
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



const handleDownload= (invoice: InvoiceWithCompany) => {
  const doc = new jsPDF();

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("YADAV GARDENING SERVICES", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Sec-6, IMT Manesar", 105, 28, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 105, 38, { align: "center" });

  // Customer details
  doc.setFontSize(11);
  doc.text("Date: ___________________", 15, 50);
  doc.text("No: ___________________", 140, 50);
  doc.text("Name: ___________________________________________", 15, 60);
  doc.text("Address: ________________________________________", 15, 70);

  // Table Header
  doc.setFont("helvetica", "bold");
  doc.text("Sl. No.", 15, 85);
  doc.text("Items", 40, 85);
  doc.text("Qnty.", 120, 85);
  doc.text("Rate", 140, 85);
  doc.text("Amount", 170, 85);

  doc.line(15, 88, 200, 88); // header underline

  // Table Rows Example
  let y = 100;
  const items = [
    { sl: 1, name: "Garden Soil (per bag)", qty: 5, rate: 200, amount: 1000 },
    { sl: 2, name: "Fertilizer Pack", qty: 2, rate: 350, amount: 700 },
    { sl: 3, name: "Plant Pots", qty: 10, rate: 50, amount: 500 },
  ];

  doc.setFont("helvetica", "normal");
  items.forEach((item) => {
    doc.text(String(item.sl), 17, y);
    doc.text(item.name, 40, y);
    doc.text(String(item.qty), 125, y);
    doc.text(String(item.rate), 145, y);
    doc.text(String(item.amount), 175, y);
    y += 10;
  });

  // Total
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 140, y + 10);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  doc.text(String(total), 175, y + 10);

  // Signature
  doc.setFont("helvetica", "normal");
  doc.text("Signature", 170, y + 40);

  // Save PDF
  doc.save("invoice.pdf");
};


  useEffect(() => {
    loadInvoices();
    
    // Set up real-time subscription
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
    filterInvoices();
  }, [invoices, searchTerm]);

  const filterInvoices = () => {
    if (!searchTerm) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          companies!inner(name)
        `)
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
    <div className="space-y-6 px-4 pb-20 max-w-[100vw] overflow-x-hidden"> {/* Added padding and overflow control */}
      <Header 
        onSearch={setSearchTerm} 
        searchPlaceholder="Search invoices..."  // Shortened for mobile
      />

      {/* Header - Modified for better mobile layout */}
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

      {/* Invoice Stats - Modified grid for better mobile layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <GlassCard className="p-3 sm:p-6"> {/* Added responsive padding */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Total Invoices</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{invoices.length}</p>
          </div>
        </GlassCard>
        {/* Apply same changes to other GlassCards */}
      </div>

      {/* Invoices Table - Modified for mobile scroll */}
      <GlassCard className="p-0 sm:p-6"> {/* Removed default padding */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px]"> {/* Added min-width */}
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
                      {/* Apply same changes to other action buttons */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Empty State - Modified for better mobile layout */}
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

  
  
   

      {/* Modals */}
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