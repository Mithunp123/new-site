import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Bell, Shield, CreditCard, Plug, AlertTriangle, Save, Upload, Camera } from 'lucide-react';
import { getProfile, updateProfile, updatePassword, deleteAccount } from '../api/creatorApi';
import useAuthStore from '../store/authStore';

const menuItems = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'payout', label: 'Payout Method', icon: CreditCard },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuthStore();
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data)
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        display_name: profile.display_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        upi_id: profile.upi_id || '',
        languages_known: profile.languages_known ? (Array.isArray(profile.languages_known) ? profile.languages_known.join(', ') : profile.languages_known) : ''
      });
    }
  }, [profile]);

  const updateMut = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['earnings']);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    }
  });

  const pwMut = useMutation({
    mutationFn: (data) => updatePassword(data),
    onSuccess: () => { setMsg('Password updated!'); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); }
  });

  const deleteMut = useMutation({ mutationFn: () => deleteAccount() });

  const handleSave = () => {
    const langs = form.languages_known?.split(',').map(l => l.trim()).filter(Boolean) || [];
    updateMut.mutate({ ...form, languages_known: langs });
  };

  const handlePasswordUpdate = () => {
    if (pwForm.new_password !== pwForm.confirm_password) { setMsg('Passwords do not match!'); return; }
    pwMut.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password });
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PS';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Account Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your profile, notifications, security, and billing</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition hover:scale-[1.02]">
          <Save size={16} /> Save Changes
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{msg}</div>
      )}

      <div className="flex gap-6">
        {/* Settings menu */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
            {menuItems.map(item => (
              <button key={item.key} onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === item.key
                    ? item.danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    : item.danger ? 'text-red-500 hover:bg-red-50/50' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              {/* Photo */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-100">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full gradient-blue flex items-center justify-center text-white font-bold text-2xl font-heading">
                    {initials}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-2">
                    <Upload size={14} /> Upload New Photo
                  </button>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG max 5MB</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {[
                  { name: 'name', label: 'Full Name' },
                  { name: 'display_name', label: 'Display Name' },
                  { name: 'email', label: 'Email Address', disabled: true },
                  { name: 'phone', label: 'Phone Number' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">{f.label}</label>
                    <input value={form[f.name] || ''} disabled={f.disabled}
                      onChange={e => setForm({...form, [f.name]: e.target.value})}
                      className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition ${f.disabled ? 'bg-slate-50 text-slate-400' : ''}`} />
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Bio</label>
                <textarea value={form.bio || ''} onChange={e => setForm({...form, bio: e.target.value})} rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Location</label>
                  <input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Languages</label>
                  <input value={form.languages_known || ''} onChange={e => setForm({...form, languages_known: e.target.value})}
                    placeholder="English, Hindi, etc."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-base font-bold font-heading text-slate-900 mb-6">Change Password</h3>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Current Password</label>
                    <input type="password" value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">New Password</label>
                      <input type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Confirm Password</label>
                      <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
                    </div>
                  </div>
                  <button onClick={handlePasswordUpdate}
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium text-sm transition">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-red-700 font-heading">Danger Zone</h3>
                  <p className="text-sm text-slate-600 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-red-50 rounded-xl p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Delete Account</p>
                  <p className="text-xs text-slate-500">This is permanent and cannot be undone.</p>
                </div>
                <button onClick={() => { if(confirm('Are you sure?')) deleteMut.mutate(); }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payout' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-base font-bold font-heading text-slate-900 mb-6">Payout Details</h3>
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">UPI ID</label>
                  <input value={form.upi_id || ''} 
                    onChange={e => setForm({...form, upi_id: e.target.value})}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" />
                  <p className="text-xs text-slate-400 mt-2 italic">
                    Your earnings will be transferred to this UPI ID when you request a withdrawal.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex gap-3">
                    <CreditCard className="text-blue-600 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Important Note</p>
                      <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                        Please ensure your UPI ID is correct. Gradix is not responsible for transfers to incorrect IDs provided by users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {['notifications', 'integrations'].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <p className="text-slate-400 text-sm">Settings for {activeTab} coming soon</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
