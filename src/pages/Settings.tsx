import React, { useState, useEffect } from 'react';
import { Save, X, Building2, Mail, Phone, MapPin, DollarSign, FileText } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabase';
import type { Settings } from '../types/database';

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    id: '',
    user_id: '',
    company_name: 'GreenCare Agency',
    company_email: 'admin@greencare.com',
    company_phone: '+1 (555) 123-4567',
    company_address: '123 Garden Street, Green City, GC 12345',
    currency: 'USD',
    tax_rate: 0,
    invoice_prefix: 'INV',
    created_at: '',
    updated_at: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsData = {
        company_name: settings.company_name,
        company_email: settings.company_email,
        company_phone: settings.company_phone,
        company_address: settings.company_address,
        currency: settings.currency,
        tax_rate: settings.tax_rate,
        invoice_prefix: settings.invoice_prefix,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('settings')
          .insert([{
            ...settingsData,
            user_id: '00000000-0000-0000-0000-000000000000', // Default user
          }])
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!hasChanges) return;
    if (confirm('Are you sure you want to discard your changes?')) {
      loadSettings();
      setHasChanges(false);
    }
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
      <Header searchPlaceholder="Search settings..." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your agency settings and preferences</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Address
              </label>
              <textarea
                value={settings.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company address"
                rows={3}
              />
            </div>
          </div>
        </GlassCard>

        {/* Financial Settings */}
        <GlassCard>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Financial Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={settings.tax_rate}
                onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tax rate"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter invoice prefix"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Preferences */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">System Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Email Notifications</p>
                <p className="text-gray-600 text-sm">Receive email alerts for important events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Auto-generate Invoice Numbers</p>
                <p className="text-gray-600 text-sm">Automatically create sequential invoice numbers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Payment Reminders</p>
                <p className="text-gray-600 text-sm">Send automatic payment reminders</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">Dark Mode</p>
                <p className="text-gray-600 text-sm">Switch to dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Save Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
          <p className="text-gray-900 font-medium">You have unsaved changes</p>
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}