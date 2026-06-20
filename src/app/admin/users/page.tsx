// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createNewUser, deleteAuthUser, updateUserPassword, getAdminUsersData, updateUserToken } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Coins, Search, User, Activity, ChevronLeft, ChevronRight, Lock, ShieldAlert, Crown } from "lucide-react";

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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              User Management
            </h1>
            <p className="text-zinc-500 mt-2 text-sm font-medium">
              {isSuperAdmin ? "Super Admin Access: Manage permissions, passwords, and tokens." : "Admin Access: Manage standard contributor accounts."}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="group bg-zinc-100 text-black px-6 py-2.5 rounded-lg font-bold hover:bg-white transition-all flex items-center gap-2 shadow-sm active:scale-95 flex-1 sm:flex-none justify-center text-sm"
            >
              <Plus className="w-4 h-4 transition-transform duration-300" />
              Add User
            </button>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
          {/* Search Bar & Stats */}
          <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-black/20">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); 
                }}
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
              />
            </div>
            <div className="hidden md:flex ml-auto items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-2 rounded-lg">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{filteredUsers.length} Accounts</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 border-b border-white/5 text-zinc-500 font-semibold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Account Detail</th>
                  <th className="px-6 py-4">Remaining Quota</th>
                  <th className="px-6 py-4">Token Usage</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto mb-3" />
                      <span className="text-sm font-medium text-zinc-500">Loading user data...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <User className="w-5 h-5 text-zinc-500" />
                      </div>
                      <span className="text-sm font-medium text-zinc-500">No users found.</span>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => {
                    const canManageUser = isSuperAdmin || (isAdmin && user.role === 'user');
                    const canEditToken = isSuperAdmin;

                    return (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Account Detail */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-lg border ${
                              user.role === 'super_admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                              user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                              'bg-white/5 border-white/10 text-zinc-400'
                            }`}>
                              {user.role === 'super_admin' ? <Crown className="w-4 h-4" /> : 
                               user.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : 
                               <User className="w-4 h-4" />}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-200 text-sm">
                                {user.username}
                              </span>
                              <span className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${
                                user.role === 'super_admin' ? 'text-purple-400' :
                                user.role === 'admin' ? 'text-amber-400' : 
                                'text-zinc-500'
                              }`}>
                                {user.role === 'super_admin' && "Super Admin"}
                                {user.role === 'admin' && "System Admin"}
                                {user.role === 'user' && "Contributor"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Remaining Quota */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-zinc-300 text-sm">
                            <Coins className="w-3.5 h-3.5 text-emerald-400" />
                            {user.token_balance}
                          </span>
                        </td>
                        
                        {/* Token Usage */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-zinc-400 text-sm">
                            <Activity className="w-3.5 h-3.5 text-zinc-500" />
                            {user.total_used}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-zinc-500 text-sm">
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
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-all"
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
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-all"
                                title="Edit Token"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canManageUser && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all"
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
            <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">
                Showing <span className="text-zinc-300">{indexOfFirstUser + 1}</span> to <span className="text-zinc-300">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="text-zinc-300">{filteredUsers.length}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-zinc-500 disabled:opacity-30 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {pageNumbers.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors ${
                        currentPage === page 
                          ? 'bg-white/10 text-white' 
                          : 'bg-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 sm:hidden">
                  <span className="text-xs text-zinc-300 font-medium px-2 py-1">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-zinc-500 disabled:opacity-30 hover:bg-white/5 hover:text-white transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" /> Create Account
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white p-1.5 rounded-md transition-colors hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="e.g., editor01"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="Min. 6 characters"
                    minLength={6}
                  />
                </div>
                
                {isSuperAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                    >
                      <option value="user">Contributor</option>
                      <option value="admin">System Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Initial Quota</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={newTokens}
                      onChange={(e) => setNewTokens(Number(e.target.value))}
                      disabled={!isSuperAdmin} 
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-100 text-black font-bold rounded-lg py-3 hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 text-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-zinc-500" /> Edit Quota
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white p-1.5 rounded-md transition-colors hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateTokens} className="p-5 space-y-5">
                <div className="text-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Target Account</span>
                  <span className="text-zinc-200 font-semibold text-base">{selectedUser.username}</span>
                </div>
                
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTokens}
                    onChange={(e) => setEditTokens(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors text-2xl font-mono"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-100 text-black font-bold rounded-lg py-3 hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 text-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-500" /> Reset Password
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-zinc-500 hover:text-white p-1.5 rounded-md transition-colors hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="p-5 space-y-5">
                <div className="text-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Target Account</span>
                  <span className="text-zinc-200 font-semibold text-base">{selectedUser.username}</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Password</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordForReset}
                    onChange={(e) => setNewPasswordForReset(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-100 text-black font-bold rounded-lg py-3 hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 text-sm"
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