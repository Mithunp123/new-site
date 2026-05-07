import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Bell, Shield, CreditCard, Plug, AlertTriangle, Save, Camera } from 'lucide-react';
import { getProfile, updateProfile, updatePassword, deleteAccount } from '../api/creatorApi';
import useAuthStore from '../store/authStore';

const MENU = [
  { key: 'profile',       label: 'Profile',        icon: User },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'security',      label: 'Security',       icon: Shield },
  { key: 'payout',        label: 'Payout Method',  icon: CreditCard },
  { key: 'integrations',  label: 'Integrations',   icon: Plug },
  { key: 'danger',        label: 'Danger Zone',    icon: AlertTriangle, danger: true },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuthStore();
  const [form, setForm]     = useState({});
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [msg, setMsg]       = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(r => r.data.data),
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name:            profile.name || '',
        display_name:    profile.display_name || '',
        email:           profile.email || '',
        phone:           profile.phone || '',
        bio:             profile.bio || '',
        location:        profile.location || '',
        upi_id:          profile.upi_id || '',
        languages_known: profile.languages_known
          ? (Array.isArray(profile.languages_known) ? profile.languages_known.join(', ') : profile.languages_known)
          : '',
      });
    }
  }, [profile]);

  const updateMut = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (err) => {
      const message = err?.response?.data?.error || err?.message || 'Failed to update profile. Please try again.';
      setMsg(message);
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const pwMut = useMutation({
    mutationFn: (data) => updatePassword(data),
    onSuccess: () => {
      setMsg('Password updated!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMsg(''), 3000);
    },
    onError: (err) => {
      const message = err?.response?.data?.error || err?.message || 'Failed to update password.';
      setMsg(message);
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const deleteMut = useMutation({ mutationFn: () => deleteAccount() });

  const handleSave = () => {
    const langs = form.languages_known
      ? form.languages_known.split(',').map(l => l.trim()).filter(Boolean)
      : [];
    const { email, ...rest } = form; // email is read-only, don't send it
    updateMut.mutate({ ...rest, languages_known: langs });
  };

  const handlePasswordUpdate = () => {
    if (pwForm.new_password !== pwForm.confirm_password) { setMsg('Passwords do not match!'); return; }
    pwMut.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password });
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CR';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your profile, notifications, security, and billing</p>
        </div>
        <button onClick={handleSave} disabled={updateMut.isPending} className="btn-primary">
          <Save size={15} /> {updateMut.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          msg.includes('match') || msg.includes('fail')
            ? 'bg-red-50 border-red-100 text-red-700'
            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
        }`}>
          {msg}
        </div>
      )}

      <div className="flex gap-5">
        {/* Sidebar menu */}
        <div className="w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {MENU.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? item.danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#2563EB]'
                    : item.danger ? 'text-red-500 hover:bg-red-50/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {activeTab === 'profile' && (
            <div className="card p-6">
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-bold text-xl">
                    {initials}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center text-white shadow-sm hover:bg-[#1D4ED8] transition">
                    <Camera size={13} />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG max 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                {[
                  { name: 'name',         label: 'Full Name' },
                  { name: 'display_name', label: 'Display Name' },
                  { name: 'email',        label: 'Email Address', disabled: true },
                  { name: 'phone',        label: 'Phone Number' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="input-label">{f.label}</label>
                    <input
                      value={form[f.name] || ''}
                      disabled={f.disabled}
                      onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      className={`input ${f.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="input-label">Bio</label>
                <textarea
                  value={form.bio || ''}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">Location</label>
                  <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">Languages</label>
                  <input value={form.languages_known || ''} onChange={e => setForm({ ...form, languages_known: e.target.value })} placeholder="English, Hindi, etc." className="input" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-5">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="input-label">Current Password</label>
                  <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">New Password</label>
                    <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="input-label">Confirm Password</label>
                    <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} className="input" />
                  </div>
                </div>
                <button onClick={handlePasswordUpdate} className="btn-primary">Update Password</button>
              </div>
            </div>
          )}

          {activeTab === 'payout' && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-5">Payout Details</h3>
              <div className="space-y-5 max-w-md">
                <div>
                  <label className="input-label">UPI ID</label>
                  <input value={form.upi_id || ''} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="yourname@upi" className="input" />
                  <p className="text-xs text-slate-400 mt-1.5">Your earnings will be transferred to this UPI ID when you request a withdrawal.</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex gap-3">
                    <CreditCard className="text-[#2563EB] flex-shrink-0 mt-0.5" size={17} />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Important Note</p>
                      <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                        Please ensure your UPI ID is correct. Gradix is not responsible for transfers to incorrect IDs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card p-6 border-red-100">
              <div className="flex items-start gap-3 mb-5">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Once you delete your account, there is no going back.</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-red-50 rounded-xl p-4 border border-red-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Delete Account</p>
                  <p className="text-xs text-slate-500">This is permanent and cannot be undone.</p>
                </div>
                <button
                  onClick={() => { if (confirm('Are you sure? This cannot be undone.')) deleteMut.mutate(); }}
                  className="btn-danger"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {['notifications', 'integrations'].includes(activeTab) && (
            <div className="card p-12 text-center">
              <p className="text-slate-400 text-sm">Settings for {activeTab} coming soon</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
