import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import { supabase } from '../lib/supabase';
import type { Company, Payment } from '../types/database';
import AddPaymentModal from '../components/modals/AddPaymentModal';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentCompany, setPaymentCompany] = useState<Company | null>(null);


  // --- Initial load & realtime subscription ---
  useEffect(() => {
    // Show loader while first fetching
    setLoading(true);
    loadCompanies();
    loadPayments();

    // Set up real-time subscription for companies and payments.
    // When realtime events fire we'll re-fetch the relevant lists.

    const channel = supabase
      .channel('companies_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        console.debug('Realtime companies event', payload);
        // Simple approach: re-fetch companies (keeps things consistent)
        loadCompanies();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        console.debug('Realtime payments event', payload);
        loadPayments();
      })
      .subscribe();

    // cleanup - use removeChannel() (preferred for v2 client)
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        // fallback: try unsubscribe if removeChannel isn't available for some reason
        // (kept for backwards compatibility)
        try {
          // @ts-ignore
          channel?.unsubscribe?.();
        } catch (_) {
          // no-op
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-run filter when companies or searchTerm changes
  useEffect(() => {
    filterCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, searchTerm]);

  // Handle search value from route state (if any)
  const location = useLocation();
  useEffect(() => {
    const state = location.state as { searchTerm?: string } | null;
    if (state?.searchTerm) {
      setSearchTerm(state.searchTerm);
    }
  }, [location.state]);

  // --- Filtering ---
  const filterCompanies = () => {
    if (!searchTerm) {
      setFilteredCompanies(companies);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = companies.filter((company) =>
      (company?.name ?? '').toLowerCase().includes(term) ||
      (company?.contact_person ?? '').toLowerCase().includes(term) ||
      (company?.email ?? '').toLowerCase().includes(term) ||
      (company?.location ?? '').toLowerCase().includes(term)
    );
    setFilteredCompanies(filtered);
  };

  // --- Loaders ---
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      // stop loading here in case payments already finished or not
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      // stop loading here too (both loaders set loading false - safe)
      setLoading(false);
    }
  };

  // --- Actions ---
  const deleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      // refresh after delete
      await loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company. Check console for details.');
    }
  };

  const getCompanyPayments = (companyId: string) => {
    return payments.filter((p) => p.company_id === companyId);
  };

  const getTotalPayments = (companyId: string) => {
    return getCompanyPayments(companyId)
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
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
        searchPlaceholder="Search companies by name, contact, email, or location..."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600">Manage your client companies and their payment records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register New Company
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => {
          const totalPayments = getTotalPayments(company.id);

          // ensure payments sorted by date descending before taking lastPayment
          const companyPayments = getCompanyPayments(company.id)
            .slice()
            .sort((a, b) => {
              const da = a?.date ? new Date(a.date).getTime() : 0;
              const db = b?.date ? new Date(b.date).getTime() : 0;
              return db - da;
            });
          const lastPayment = companyPayments[0];

          

          return (
            <GlassCard key={company.id} hover>
              <div className="space-y-4">
                {/* Company Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-gray-600">{company.contact_person}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(company)}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCompany(company.id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{company.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{company.location}</span>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(company.services) && company.services.length > 0 ? (
                    company.services.map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200"
                      >
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No services listed</span>
                  )}
                </div>

                {/* Payment Stats */}
                <div className="border-t border-gray-200 pt-4">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-gray-500 text-xs">Total Paid</p>
      <p className="text-green-600 font-semibold">
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0, // remove decimals, add if you need `.00`
        }).format(totalPayments)}
      </p>
    </div>
    <div>
      <p className="text-gray-500 text-xs">Last Payment</p>
      <p className="text-gray-900 text-sm">
        {lastPayment ? new Date(lastPayment.date).toLocaleDateString("en-IN") : "No payments"}
      </p>
    </div>
  </div>
</div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                <button
  onClick={() => {
    setPaymentCompany(company);
     setShowPaymentModal(true);   
  }}
  className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded-lg text-sm transition-colors"
>
  Add Payment
</button>

                  <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2 px-3 rounded-lg text-sm transition-colors">
                    Generate Invoice
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by registering your first client company'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Register Your First Company
          </button>
        </div>
      )}

      {/* Modals */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadCompanies}
      />
      <EditCompanyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadCompanies}
        company={selectedCompany}
      />
      <AddPaymentModal
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  onSuccess={loadPayments}
  company={paymentCompany}
/>

    </div>
  );
}
