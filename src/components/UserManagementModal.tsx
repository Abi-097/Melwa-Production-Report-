import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FormAccess, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Lock,
  Check,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface UserManagementModalProps {
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { users, updateUserFormAccess, updateUserRole, createUser, currentUser } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newRole, setNewRole] = useState<UserRole>('production');
  const [newAccess, setNewAccess] = useState<FormAccess>('write');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUsername.trim()) {
      setError('Username is required.');
      return;
    }

    setSubmitting(true);
    const res = await createUser(newUsername, newPassword, newRole, newAccess);
    setSubmitting(false);

    if (res.success) {
      setSuccess(`User ${newUsername.trim().toUpperCase()} created successfully!`);
      setNewUsername('');
      setNewPassword('1234');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error || 'Failed to create user');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>User Access & Role Management</span>
            </h1>
            <p className="text-xs text-slate-500">
              Super User controls: grant Read-Only or Read & Write form access and provision new factory accounts.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-300 text-rose-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User List Table */}
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Registered Users ({users.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Live RBAC</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">System Role</th>
                  <th className="py-2.5 px-3">Form Permission</th>
                  <th className="py-2.5 px-3 text-right">Access Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const isSuper = user.role === 'super';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{user.username}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-sans font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono ${
                            isSuper
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            user.formAccess === 'write'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {user.formAccess === 'write' ? 'Read & Write' : 'Read-Only'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateUserFormAccess(user.id, 'read')}
                            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              user.formAccess === 'read'
                                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Read
                          </button>
                          <button
                            type="button"
                            onClick={() => updateUserFormAccess(user.id, 'write')}
                            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                              user.formAccess === 'write'
                                ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Write
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provision New User Form */}
        <div className="md:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Create New User</span>
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toUpperCase())}
                  placeholder="e.g. PRODUCTION6 or QC_SUPERVISOR"
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Initial password (e.g. 1234)"
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="production">Production Operator</option>
                  <option value="super">Super User (Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Initial Form Permission
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccess('read')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                      newAccess === 'read'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Read-Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccess('write')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                      newAccess === 'write'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Read & Write
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Register User'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
