import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Shield, Trash2, CheckCircle2, 
  GraduationCap, BookOpen, AlertTriangle 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import { UserRole } from '../../types/index.js';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any>(null);

  const { notify } = useNotification();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      notify('success', 'Role Updated', `User permissions changed to ${newRole.toUpperCase()}.`);
    } catch (err: any) {
      notify('error', 'Update Failed', err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      await api.admin.deleteUser(deleteTargetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
      notify('info', 'User Deleted', `Removed ${deleteTargetUser.name} from platform.`);
      setDeleteTargetUser(null);
    } catch (err: any) {
      notify('error', 'Deletion Failed', err.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Identity & Access Management (IAM)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User & Role Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Govern RBAC permissions, student accounts, teacher faculties, and administrative privileges.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading user repository...</p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider pb-3">
                <th className="pb-3">User</th>
                <th className="pb-3">Registered On</th>
                <th className="pb-3">Current Role</th>
                <th className="pb-3">Change Permissions</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-4">
                    <p className="font-bold text-white text-sm">{u.name}</p>
                    <p className="text-slate-400 text-[11px]">{u.email}</p>
                  </td>
                  <td className="py-4 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      u.role === 'admin'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : u.role === 'teacher'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3" />}
                      {u.role === 'teacher' && <BookOpen className="w-3 h-3" />}
                      {u.role === 'student' && <GraduationCap className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setDeleteTargetUser(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete "${deleteTargetUser?.name}" (${deleteTargetUser?.email})? All associated quiz submissions and metrics will be purged.`}
        confirmLabel="Yes, Delete User"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTargetUser(null)}
      />
    </div>
  );
};
