import React, { useState } from 'react';
import { Lock, Store, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E5E7EB] p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-100">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#111827]">Quench Mart</h1>
          <p className="text-[#6B7280] mt-2 italic">"Unlock the Vault of Flavor"</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all pr-12"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111827] hover:bg-black text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                <Lock size={18} /> Sign In to Vault
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-[#9CA3AF]">
          <p>Default Admin: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}
