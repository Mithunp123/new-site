import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  User, Bell, Shield, CreditCard, 
  Share2, Trash2, Camera, Globe,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('Profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: async () => {
      const res = await axios.get('/api/brand/profile');
      return res.data.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axios.patch('/api/brand/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['brand-profile']);
      alert('Profile updated successfully!');
    }
  });

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-dm">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold text-gray-900 font-jakarta">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your brand profile and account preferences</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Nav */}
        <aside className="w-full lg:w-64 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.name}
              onClick={() => setActiveSection(section.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeSection === section.name 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="text-sm">{section.name}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            {activeSection === 'Profile' && <ProfileForm brand={profile?.brand} onSave={updateMutation.mutate} />}
            {activeSection === 'Security' && <SecurityForm />}
            {activeSection === 'Danger Zone' && <DangerZone />}
          </div>
        </div>
      </div>
    </div>
  );
};

const SECTIONS = [
  { name: 'Profile', icon: User },
  { name: 'Notifications', icon: Bell },
  { name: 'Security', icon: Shield },
  { name: 'Billing', icon: CreditCard },
  { name: 'Integrations', icon: Share2 },
  { name: 'Danger Zone', icon: Trash2 },
];

const ProfileForm = ({ brand, onSave }) => {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    website: brand?.website || '',
    category: brand?.category || '',
    description: brand?.description || '',
    company_size: brand?.company_size || '',
    phone: brand?.phone || '',
    country: brand?.country || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
            {brand?.logo_url ? (
              <img src={brand.logo_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <Camera className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-700 transition-all">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Brand Logo</h3>
          <p className="text-sm text-gray-500">Update your company logo for brand recognition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Brand Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <Input label="Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
        <Select label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} options={['Beauty', 'Fashion', 'Tech', 'Food']} />
        <Select label="Company Size" value={formData.company_size} onChange={e => setFormData({...formData, company_size: e.target.value})} options={['1-10', '11-50', '51-200', '201-500', '500+']} />
        <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <Input label="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company Description</label>
        <textarea 
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none resize-none"
        />
      </div>

      <div className="pt-4">
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
          Save Changes
        </button>
      </div>
    </form>
  );
};

const Input = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold outline-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <select 
      value={value}
      onChange={onChange}
      className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-bold outline-none appearance-none"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const SecurityForm = () => (
  <div className="space-y-8">
    <h3 className="text-xl font-bold text-gray-900 font-jakarta">Security Settings</h3>
    <div className="space-y-6 max-w-md">
      <Input label="Current Password" type="password" />
      <Input label="New Password" type="password" />
      <Input label="Confirm New Password" type="password" />
      <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">
        Update Password
      </button>
    </div>
  </div>
);

const DangerZone = () => (
  <div className="space-y-6">
    <div className="p-6 bg-red-50 border border-red-100 rounded-3xl">
      <h3 className="text-xl font-bold text-red-600 font-jakarta mb-2">Delete Account</h3>
      <p className="text-sm text-red-700 font-medium mb-6">
        Once you delete your account, there is no going back. Please be certain.
      </p>
      <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100">
        Delete Account Permanently
      </button>
    </div>
  </div>
);

export default Settings;
