import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Factory, Lock, User, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, users } = useAuth();
  const [username, setUsername] = useState('PRODUCTION1');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Failed to authenticate');
    }
  };

  const selectQuickUser = (uname: string) => {
    setUsername(uname);
    setPassword('1234');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
      {/* Background industrial pattern */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Banner */}
        <div className="bg-slate-950 px-6 py-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600/20 text-blue-400 mb-3 border border-blue-500/30">
            <Factory className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Master Production Report</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 tracking-wider uppercase">System Document R06 · Mill Floor Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select or Enter User
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="e.g. PRODUCTION1 or SUPERUSER"
                required
                className="block w-full pl-9 pr-3 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: 1234"
                required
                className="block w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <span>{submitting ? 'Verifying...' : 'Sign In to Report Center'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Select Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Login Accounts:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['PRODUCTION1', 'PRODUCTION2', 'PRODUCTION3', 'PRODUCTION4', 'PRODUCTION5', 'SUPERUSER'].map((name) => {
                const userObj = users.find((u) => u.username.toUpperCase() === name);
                const isSuper = name === 'SUPERUSER';
                const isSelected = username === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectQuickUser(name)}
                    className={`py-1.5 px-2 text-xs font-mono rounded transition-colors text-center border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                        : isSuper
                        ? 'bg-amber-50/80 border-amber-300 text-amber-800 hover:bg-amber-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">{name}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {isSuper ? 'Admin/All' : userObj?.formAccess === 'read' ? 'Read-only' : 'Write'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Security Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Access Control</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v1.0 (R06)</span>
        </div>
      </div>
    </div>
  );
};
