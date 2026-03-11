import React, { useState } from 'react';
import { User, Settings as SettingsType } from '../types';
import { Shield, Lock, Palette, Eye, EyeOff, Check, Moon, Sun, Monitor, DollarSign, Coins } from 'lucide-react';

interface SettingsProps {
  user: User | null;
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

export default function Settings({ user, settings, onSettingsChange }: SettingsProps) {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        }),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Password updated successfully' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        setStatus({ type: 'error', message: data.error || 'Failed to update password' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Server error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">System Settings</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Manage your account, security, and interface preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Security & Password */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#F3F4F6] dark:border-slate-800 flex items-center gap-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#111827] dark:text-white uppercase tracking-tight">Security & Password</h3>
              <p className="text-sm text-[#6B7280]">Update your login credentials and security key.</p>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
              <div className="relative">
                <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords ? "text" : "password"}
                    required
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                    className="w-full pl-10 pr-12 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-[#111827] dark:text-white"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                  <button 
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">New Password</label>
                  <input 
                    type={showPasswords ? "text" : "password"}
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-[#111827] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Confirm New</label>
                  <input 
                    type={showPasswords ? "text" : "password"}
                    required
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-[#111827] dark:text-white"
                  />
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {status.message}
                </div>
              )}

              <button type="submit" className="bg-[#111827] dark:bg-white dark:text-[#111827] text-white font-bold px-8 py-3 rounded-xl hover:bg-black dark:hover:bg-slate-200 transition-all">
                Update Password
              </button>
            </form>
          </div>
        </section>

        {/* Appearance & Localization */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#F3F4F6] dark:border-slate-800 flex items-center gap-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#111827] dark:text-white uppercase tracking-tight">Appearance & Localization</h3>
              <p className="text-sm text-[#6B7280]">Customize how Quench Mart looks and functions.</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-4 uppercase">Theme Preference</label>
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onSettingsChange({ ...settings, theme: theme.id as any })}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      settings.theme === theme.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                        : 'border-[#E5E7EB] dark:border-slate-700 hover:border-[#D1D5DB] text-[#6B7280]'
                    }`}
                  >
                    <theme.icon size={24} />
                    <span className="text-xs font-bold">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] dark:bg-slate-800 rounded-2xl border border-[#E5E7EB] dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-[#E5E7EB] dark:border-slate-600">
                    <Eye size={20} className="text-[#6B7280] dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">Privacy Mode</p>
                    <p className="text-[10px] text-[#6B7280]">Hide sensitive data</p>
                  </div>
                </div>
                <button 
                  onClick={() => onSettingsChange({ ...settings, privacyMode: !settings.privacyMode })}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.privacyMode ? 'bg-emerald-500' : 'bg-[#D1D5DB] dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.privacyMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] dark:bg-slate-800 rounded-2xl border border-[#E5E7EB] dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-[#E5E7EB] dark:border-slate-600">
                    <Coins size={20} className="text-[#6B7280] dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">Currency</p>
                    <p className="text-[10px] text-[#6B7280]">Switch NGN / USD</p>
                  </div>
                </div>
                <div className="flex bg-white dark:bg-slate-700 rounded-lg p-1 border border-[#E5E7EB] dark:border-slate-600">
                  <button 
                    onClick={() => onSettingsChange({ ...settings, currency: 'NGN' })}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${settings.currency === 'NGN' ? 'bg-blue-600 text-white' : 'text-[#6B7280]'}`}
                  >
                    NGN
                  </button>
                  <button 
                    onClick={() => onSettingsChange({ ...settings, currency: 'USD' })}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${settings.currency === 'USD' ? 'bg-blue-600 text-white' : 'text-[#6B7280]'}`}
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
