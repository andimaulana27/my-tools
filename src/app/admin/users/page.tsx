// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createNewUser, deleteAuthUser, updateUserPassword } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Coins, Search, User, Activity, ChevronLeft, ChevronRight, Lock } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  token_balance: number;
  created_at: string;
  total_used?: number; 
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 25;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTokens, setNewTokens] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Edit Token
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editTokens, setEditTokens] = useState(0);

  // State Modal Reset Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPasswordForReset, setNewPasswordForReset] = useState("");

  const refreshUsers = async () => {
    setLoading(true);
    
    // 1. Ambil data profil
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false });

    // 2. Ambil data pemakaian (usage)
    const { data: usageData } = await supabase
      .from("tools_usage")
      .select("user_id, tokens_used");

    if (!profilesError && profiles) {
      const enrichedUsers = profiles.map(user => {
        const totalUsed = usageData
          ?.filter(usage => usage.user_id === user.id)
          .reduce((sum, current) => sum + current.tokens_used, 0) || 0;
          
        return {
          ...user,
          total_used: totalUsed
        };
      });
      setUsers(enrichedUsers);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialUsers = async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")
        .order("created_at", { ascending: false });

      const { data: usageData } = await supabase
        .from("tools_usage")
        .select("user_id, tokens_used");

      if (isMounted) {
        if (!profilesError && profiles) {
          const enrichedUsers = profiles.map(user => {
            const totalUsed = usageData
              ?.filter(usage => usage.user_id === user.id)
              .reduce((sum, current) => sum + current.tokens_used, 0) || 0;
              
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
    loadInitialUsers();
    return () => { isMounted = false; };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await createNewUser(newUsername, newPassword, newTokens);

    if (result.success) {
      setNewUsername("");
      setNewPassword("");
      setNewTokens(100);
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

    const { error } = await supabase
      .from("profiles")
      .update({ token_balance: editTokens })
      .eq("id", selectedUser.id);

    if (error) {
      alert(`Gagal update token: ${error.message}`);
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
      alert(`Password untuk pengguna @${selectedUser.username} berhasil di-reset.`);
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

  // Logika Filter & Paginasi
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const indexOfLastUser = currentPage * USERS_PER_PAGE;
  const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Men-generate array nomor halaman untuk navigasi
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="relative min-h-full">
      
      {/* BACKGROUND MODERN DASHBOARD: Faint Dot Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,transparent_20%,#000_100%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 space-y-8 max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              User Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">Kelola akses, sandi, dan pantau aktivitas token pengguna secara efisien.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group bg-white text-black px-6 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Add New User
          </button>
        </div>

        {/* Table Container (Glassmorphism) */}
        <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          
          {/* Top Bar (Search) */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Cari username pengguna..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset halaman ke 1 setiap kali mencari
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
              />
            </div>
            {/* Badge Indicator */}
            <div className="hidden md:flex ml-auto items-center gap-2 bg-black/40 border border-white/10 px-4 py-2 rounded-xl shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{filteredUsers.length} Users Found</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                <tr>
                  <th className="px-6 py-5">Account Detail</th>
                  <th className="px-6 py-5">Sisa Kuota</th>
                  <th className="px-6 py-5">Pemakaian Token</th>
                  <th className="px-6 py-5">Tanggal Dibuat</th>
                  <th className="px-6 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                      <span className="text-sm font-medium text-gray-400">Memuat data pengguna & aktivitas...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-400">Belum ada user yang terdaftar atau ditemukan.</span>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-base block">@{user.username}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {user.id.substring(0,8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-black/40 text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-inner group-hover:bg-yellow-500/10 group-hover:border-yellow-500/20 transition-colors">
                          <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                          {user.token_balance}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-black/40 text-gray-300 font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-inner group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                          <Activity className="w-4 h-4 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
                          {user.total_used}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPasswordForReset("");
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1 border border-transparent hover:border-white/10 shadow-sm"
                          title="Reset Password"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditTokens(user.token_balance);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1 border border-transparent hover:border-white/10 shadow-sm"
                          title="Edit Token"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all ml-1 border border-transparent hover:border-red-500/20 shadow-sm"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Kontrol Paginasi */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Menampilkan <span className="font-bold text-white">{indexOfFirstUser + 1}</span> hingga <span className="font-bold text-white">{Math.min(indexOfLastUser, filteredUsers.length)}</span> dari total <span className="font-bold text-white">{filteredUsers.length}</span> pengguna
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {pageNumbers.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm ${
                        currentPage === page 
                          ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                          : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 sm:hidden">
                  <span className="text-sm text-white font-bold px-3 py-1 bg-white/10 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* Modal Tambah User */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card/80 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" /> Add New User
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                    placeholder="misal: editor01"
                  />
                  <p className="text-[11px] text-gray-500 font-medium ml-1">Otomatis diubah menjadi lowercase dan tanpa spasi.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Initial Token Kuota</label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={newTokens}
                      onChange={(e) => setNewTokens(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-white to-gray-200 text-black font-black rounded-xl py-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Token */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card/80 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-gray-400" /> Edit Kuota Token
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTokens} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="text-center bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Target Account</span>
                    <span className="text-white font-black text-lg">@{selectedUser.username}</span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">Total Terpakai: {selectedUser.total_used} Token</span>
                  </div>
                  
                  <div className="relative group">
                    <Coins className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    <input
                      type="number"
                      required
                      min={0}
                      value={editTokens}
                      onChange={(e) => setEditTokens(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all text-4xl font-black shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium text-center">Token digunakan untuk men-generate metadata AI.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black rounded-xl py-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Reset Password */}
      <AnimatePresence>
        {isPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card/80 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-400" /> Reset Password
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdatePassword} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="text-center bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Target Account</span>
                    <span className="text-white font-black text-lg">@{selectedUser.username}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password Baru</label>
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={newPasswordForReset}
                      onChange={(e) => setNewPasswordForReset(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium text-center">Admin dapat mereset sandi ini secara paksa tanpa memerlukan input sandi lama dari pengguna.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black rounded-xl py-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}