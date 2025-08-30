import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, DollarSign, IndianRupee } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // this should trigger loadCompanies() in Companies.tsx
}

export default function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    fixed_salary: '',
    services: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const serviceOptions = [
    'Landscaping',
    'Garden Maintenance',
    'Tree Care',
    'Lawn Care',
    'Irrigation',
    'Design Consultation',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Explicit insert object matching DB schema
      const insertData = {
        name: formData.name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        location: formData.location,
        fixed_salary: parseFloat(formData.fixed_salary) || 0,
        services: formData.services, // must be text[] or jsonb in DB
      };

      const { data, error } = await supabase
        .from('companies')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ Error adding company:', JSON.stringify(error, null, 2));
        alert(`Failed to add company: ${error.message}`);
        return;
      }

      console.log('✅ Company added:', data);

      onSuccess(); // refresh companies list
      onClose();

      // reset form
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        location: '',
        fixed_salary: '',
        services: [],
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Register New Company</h2>
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Company Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Contact Person
              </label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact person"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full address"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location/Plot
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location/plot details"
              />
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
             <IndianRupee className="w-4 h-4 inline mr-2" />
              Fixed Salary (Monthly)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.fixed_salary}
              onChange={(e) => setFormData((prev) => ({ ...prev, fixed_salary: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter monthly salary amount"
            />
          </div>

          {/* Services */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-3">Services</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceOptions.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors border ${
                    formData.services.includes(service)
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {service}
                </button>
              ))}
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
              {loading ? 'Adding...' : 'Register Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
