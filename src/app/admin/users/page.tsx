// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createNewUser, deleteAuthUser, updateUserPassword, getAdminUsersData, updateUserToken } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, X, Loader2, Coins, Search, User, Activity, ChevronLeft, ChevronRight, Lock, ShieldAlert, Crown } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  role: string;
  token_balance: number;
  created_at: string;
  total_used?: number; 
};

type UsageRecord = {
  user_id: string;
  tokens_used: number;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 25;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTokens, setNewTokens] = useState(100);
  const [newUserRole, setNewUserRole] = useState("user"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editTokens, setEditTokens] = useState(0);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPasswordForReset, setNewPasswordForReset] = useState("");

  const refreshUsers = async () => {
    setLoading(true);
    const result = await getAdminUsersData();
    
    if (result.success && result.profiles) {
      const enrichedUsers = (result.profiles as Profile[]).map((user: Profile) => {
        const totalUsed = (result.usageData as UsageRecord[])
          ?.filter((usage: UsageRecord) => usage.user_id === user.id)
          .reduce((sum: number, current: UsageRecord) => sum + current.tokens_used, 0) || 0;
          
        return {
          ...user,
          total_used: totalUsed
        };
      });
      setUsers(enrichedUsers);
    } else {
      console.error("Gagal load users:", result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authData.user.id).single();
        if (isMounted) setCurrentUser(profile);
      }

      const result = await getAdminUsersData();
      if (isMounted) {
        if (result.success && result.profiles) {
          const enrichedUsers = (result.profiles as Profile[]).map((user: Profile) => {
            const totalUsed = (result.usageData as UsageRecord[])
              ?.filter((usage: UsageRecord) => usage.user_id === user.id)
              .reduce((sum: number, current: UsageRecord) => sum + current.tokens_used, 0) || 0;
              
            return {
              ...user,
              total_used: totalUsed
            };
          });
          setUsers(enrichedUsers);
        }
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createNewUser(newUsername, newPassword, newTokens, newUserRole);

    if (result.success) {
      setNewUsername("");
      setNewPassword("");
      setNewTokens(100);
      setNewUserRole("user");
      setIsAddModalOpen(false);
      await refreshUsers();
    } else {
      alert(`Gagal membuat user: ${result.error}`);
    }
    setIsSubmitting(false);
  };

  const handleUpdateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    const result = await updateUserToken(selectedUser.id, editTokens);

    if (!result.success) {
      alert(`Gagal update token: ${result.error}`);
    } else {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await refreshUsers();
    }
    setIsSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    const result = await updateUserPassword(selectedUser.id, newPasswordForReset);

    if (result.success) {
      alert(`Password untuk pengguna ${selectedUser.username} berhasil di-reset.`);
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPasswordForReset("");
    } else {
      alert(`Gagal mereset password: ${result.error}`);
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (confirm(`Apakah kamu yakin ingin menghapus user "${username}" beserta semua datanya?`)) {
      setLoading(true);
      const result = await deleteAuthUser(id);
      if (result.success) {
        await refreshUsers();
      } else {
        alert(`Gagal menghapus user: ${result.error}`);
        setLoading(false);
      }
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';

  const roleFilteredUsers = users.filter((user) => {
    if (isSuperAdmin) return true; 
    if (isAdmin) return user.role === 'user'; 
    return false;
  });

  const filteredUsers = roleFilteredUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const indexOfLastUser = currentPage * USERS_PER_PAGE;
  const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="relative min-h-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 space-y-8 max-w-7xl mx-auto"
      >
        <div className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-accent">
              <span className="h-px w-7 bg-accent" aria-hidden />
              Directory
            </p>
            <h1 className="text-4xl font-black uppercase leading-[0.86] tracking-tighter text-text md:text-5xl">
              Users<span className="text-accent">.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
              {isSuperAdmin
                ? "Super admin: izin, password, dan kuota."
                : "Admin: kelola akun contributor."}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-11 items-center justify-center border border-line bg-transparent px-6 text-sm font-medium text-text transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg"
          >
            Add user
          </button>
        </div>

        {/* Main Table Card */}
        <div className="overflow-hidden border border-line">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-admin pl-10"
              />
            </div>
            <p className="ml-auto hidden text-[10px] uppercase tracking-[0.16em] text-text-faint md:block">
              {filteredUsers.length} accounts
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-line text-[10px] font-semibold uppercase tracking-[0.16em] text-text-faint">
                <tr>
                  <th className="px-6 py-4">Account Detail</th>
                  <th className="px-6 py-4">Remaining Quota</th>
                  <th className="px-6 py-4">Token Usage</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-text-muted mx-auto mb-3" />
                      <span className="text-sm font-medium text-text-muted">Loading user data...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center border border-line">
                        <User className="h-5 w-5 text-text-muted" />
                      </div>
                      <span className="text-sm font-medium text-text-muted">No users found.</span>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const canManageUser = isSuperAdmin || (isAdmin && user.role === 'user');
                    const canEditToken = isSuperAdmin;

                    return (
                      <tr key={user.id} className="group transition-colors duration-hover hover:bg-wash">
                        
                        {/* Account Detail */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center border ${
                                user.role === "super_admin"
                                  ? "border-accent text-accent"
                                  : user.role === "admin"
                                    ? "border-text text-text"
                                    : "border-line text-text-faint"
                              }`}
                            >
                              {user.role === "super_admin" ? (
                                <Crown className="h-4 w-4" />
                              ) : user.role === "admin" ? (
                                <ShieldAlert className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-text">{user.username}</span>
                              <span
                                className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                  user.role === "super_admin"
                                    ? "text-accent"
                                    : user.role === "admin"
                                      ? "text-text"
                                      : "text-text-faint"
                                }`}
                              >
                                {user.role === 'super_admin' && "Super Admin"}
                                {user.role === 'admin' && "System Admin"}
                                {user.role === 'user' && "Contributor"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Remaining Quota */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-sm text-text">
                            <Coins className="h-3.5 w-3.5 text-accent" />
                            {user.token_balance}
                          </span>
                        </td>
                        
                        {/* Token Usage */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-sm text-text-muted">
                            <Activity className="w-3.5 h-3.5 text-text-muted" />
                            {user.total_used}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {new Date(user.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            {canManageUser && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewPasswordForReset("");
                                  setIsPasswordModalOpen(true);
                                }}
                                className="p-2 text-text-faint transition-colors duration-hover hover:text-accent"
                                title="Reset Password"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            {canEditToken && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditTokens(user.token_balance);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-2 text-text-faint transition-colors duration-hover hover:text-accent"
                                title="Edit Token"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canManageUser && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="p-2 text-text-faint transition-colors duration-hover hover:text-accent"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Minimalis */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-line p-4 sm:flex-row">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-faint">
                Showing <span className="text-text">{indexOfFirstUser + 1}</span> to <span className="text-text">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="text-text">{filteredUsers.length}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 text-text-faint transition-colors duration-hover hover:text-accent disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {pageNumbers.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-7 w-7 items-center justify-center text-xs font-medium transition-colors ${
                        currentPage === page
          ? "bg-accent text-btn-bg"
                          : "bg-transparent text-text-faint hover:text-text"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 sm:hidden">
                  <span className="px-2 py-1 text-xs text-text">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-text-faint transition-colors duration-hover hover:text-accent disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* --- MODALS (Clean Design) --- */}
      
      {/* Modal Tambah User */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-md overflow-hidden border border-line bg-bg"
            >
              <div className="flex items-center justify-between border-b border-line p-5">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-text">
                  <User className="h-4 w-4 text-text-faint" /> Create Account
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-text-faint hover:text-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="input-admin"
                    placeholder="e.g., editor01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-admin"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                </div>
                
                {isSuperAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Access Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="input-admin appearance-none"
                    >
                      <option value="user">Contributor</option>
                      <option value="admin">System Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Initial Quota</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={newTokens}
                      onChange={(e) => setNewTokens(Number(e.target.value))}
                      disabled={!isSuperAdmin} 
                      className="input-admin pl-9 disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-btn-bg py-3 text-sm font-medium text-btn-fg transition-opacity duration-hover hover:opacity-80 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Token */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && isSuperAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-sm overflow-hidden border border-line bg-bg"
            >
              <div className="flex items-center justify-between border-b border-line p-5">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-text">
                  <Edit2 className="h-4 w-4 text-text-faint" /> Edit Quota
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-text-faint hover:text-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateTokens} className="p-5 space-y-5">
                <div className="border border-line bg-wash p-4 text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Target Account</span>
                  <span className="text-text font-semibold text-base">{selectedUser.username}</span>
                </div>
                
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTokens}
                    onChange={(e) => setEditTokens(Number(e.target.value))}
                    className="input-admin py-4 pl-12 font-mono text-2xl"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                    className="inline-flex h-11 w-full items-center justify-center bg-btn-bg text-sm font-medium text-btn-fg transition-opacity duration-hover hover:opacity-80 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Reset Password */}
      <AnimatePresence>
        {isPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-sm overflow-hidden border border-line bg-bg"
            >
              <div className="flex items-center justify-between border-b border-line p-5">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-text">
                  <Lock className="h-4 w-4 text-text-faint" /> Reset Password
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-text-faint hover:text-accent">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="p-5 space-y-5">
                <div className="border border-line bg-wash p-4 text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Target Account</span>
                  <span className="text-text font-semibold text-base">{selectedUser.username}</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">New Password</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordForReset}
                    onChange={(e) => setNewPasswordForReset(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-admin"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                    className="inline-flex h-11 w-full items-center justify-center bg-btn-bg text-sm font-medium text-btn-fg transition-opacity duration-hover hover:opacity-80 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Credentials"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}