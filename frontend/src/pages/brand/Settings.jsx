import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { User, Bell, Shield, Trash2, Camera, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { name: 'Profile',      icon: User },
  { name: 'Notifications', icon: Bell },
  { name: 'Security',     icon: Shield },
  { name: 'Danger Zone',  icon: Trash2, danger: true },
];

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('Profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: async () => {
      const res = await api.get('/api/brand/profile');
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch('/api/brand/profile', data),
    onSuccess: () => queryClient.invalidateQueries(['brand-profile']),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your brand profile, security, and preferences</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {SECTIONS.map(section => (
              <button
                key={section.name}
                onClick={() => setActiveSection(section.name)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === section.name
                    ? section.danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#2563EB]'
                    : section.danger ? 'text-red-500 hover:bg-red-50/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <section.icon size={16} />
                <span className="flex-1 text-left">{section.name}</span>
                {activeSection === section.name && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'Profile'       && <ProfileForm brand={profile?.brand} onSave={updateMutation.mutate} />}
          {activeSection === 'Notifications' && <NotificationsForm />}
          {activeSection === 'Security'      && <SecurityForm />}
          {activeSection === 'Danger Zone'   && <DangerZone />}
        </div>
      </div>
    </motion.div>
  );
};

const ProfileForm = ({ brand, onSave }) => {
  const [formData, setFormData] = useState({
    name:         brand?.name || '',
    website:      brand?.website || '',
    category:     brand?.category || '',
    description:  brand?.description || '',
    company_size: brand?.company_size || '',
    phone:        brand?.phone || '',
    country:      brand?.country || '',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Brand Profile</h2>
        <p className="text-sm text-slate-400 mt-0.5">Update your brand information</p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-5 pb-5 border-b border-slate-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
            {brand?.logo_url ? (
              <img src={brand.logo_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <Camera className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2563EB] text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#1D4ED8] transition">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Brand Logo</p>
          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormInput label="Brand Name"    value={formData.name}         onChange={e => setFormData({ ...formData, name: e.target.value })} />
        <FormInput label="Website"       value={formData.website}      onChange={e => setFormData({ ...formData, website: e.target.value })} />
        <FormSelect label="Category"     value={formData.category}     onChange={e => setFormData({ ...formData, category: e.target.value })}     options={['Beauty', 'Fashion', 'Tech', 'Food', 'Other']} />
        <FormSelect label="Company Size" value={formData.company_size} onChange={e => setFormData({ ...formData, company_size: e.target.value })} options={['1-10', '11-50', '51-200', '201-500', '500+']} />
        <FormInput label="Phone"         value={formData.phone}        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        <FormInput label="Country"       value={formData.country}      onChange={e => setFormData({ ...formData, country: e.target.value })} />
      </div>

      <div>
        <label className="input-label">Description</label>
        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className="input resize-none" />
      </div>

      <button type="submit" className="btn-primary">Save Changes</button>
    </form>
  );
};

const NotificationsForm = () => (
  <div className="card p-6 space-y-5">
    <div>
      <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
      <p className="text-sm text-slate-400 mt-0.5">Choose how you want to be notified</p>
    </div>
    <div className="space-y-3">
      {[
        { label: 'Campaign Updates',  desc: 'Get notified when creators respond to requests' },
        { label: 'Content Uploads',   desc: 'Receive alerts when creators upload content' },
        { label: 'Payment Updates',   desc: 'Notifications about payments and escrow' },
        { label: 'Weekly Summary',    desc: 'Get a summary of your campaigns every week' },
      ].map(item => (
        <label key={item.label} className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#2563EB]" />
          <div>
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-400">{item.desc}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
);

const SecurityForm = () => (
  <div className="card p-6 space-y-5">
    <div>
      <h2 className="text-base font-semibold text-slate-900">Security</h2>
      <p className="text-sm text-slate-400 mt-0.5">Protect your account</p>
    </div>
    <div className="space-y-4 max-w-md">
      <FormInput label="Current Password" type="password" />
      <FormInput label="New Password"     type="password" />
      <FormInput label="Confirm Password" type="password" />
      <button className="btn-primary">Update Password</button>
    </div>
  </div>
);

const DangerZone = () => (
  <div className="card p-6 border-red-100">
    <div className="flex items-start gap-3 mb-5">
      <Trash2 size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
        <p className="text-sm text-slate-500 mt-0.5">Permanently delete your account and all associated data. This cannot be undone.</p>
      </div>
    </div>
    <div className="flex items-center justify-between bg-red-50 rounded-xl p-4 border border-red-100">
      <div>
        <p className="text-sm font-semibold text-slate-800">Delete Account</p>
        <p className="text-xs text-slate-500">This is permanent and cannot be undone.</p>
      </div>
      <button className="btn-danger">Delete Account</button>
    </div>
  </div>
);

const FormInput = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label className="input-label">{label}</label>
    <input type={type} value={value} onChange={onChange} className="input" />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="input-label">{label}</label>
    <select value={value} onChange={onChange} className="input appearance-none cursor-pointer">
      <option value="">Select an option</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default Settings;
