// src/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createNewUser, deleteAuthUser } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Loader2, Coins, Search, User } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  token_balance: number;
  created_at: string;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTokens, setNewTokens] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editTokens, setEditTokens] = useState(0);

  const refreshUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "user")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "user")
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (!error && data) {
          setUsers(data);
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

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Kelola akses, password, dan kuota token pengguna.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Cari username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-bold uppercase tracking-widest text-[11px]">
              <tr>
                <th className="px-6 py-5">Account Detail</th>
                <th className="px-6 py-5">Token Kuota</th>
                <th className="px-6 py-5">Tanggal Dibuat</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Belum ada user yang terdaftar atau ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-full border border-white/10 shadow-inner group-hover:bg-white/20 transition-colors">
                          <User className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="font-bold text-foreground text-base">@{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-black/40 text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                        <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                        {user.token_balance}
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
                          setEditTokens(user.token_balance);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all ml-1"
                        title="Edit Token"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-1"
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
      </div>

      {/* Modal Tambah User (Glassmorphism) */}
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
                <h3 className="text-xl font-black text-white">Add New User</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-300 ml-1">Username</label>
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
                  <label className="text-sm font-bold text-gray-300 ml-1">Password</label>
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
                  <label className="text-sm font-bold text-gray-300 ml-1">Initial Token Kuota</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newTokens}
                    onChange={(e) => setNewTokens(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-black rounded-xl py-4 mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create User"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Token (Glassmorphism) */}
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
                <h3 className="text-xl font-black text-white">Edit Kuota Token</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTokens} className="p-6 space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300 block text-center">
                    Update saldo token untuk <br/>
                    <span className="text-white font-black text-lg bg-white/10 px-3 py-1 rounded-lg inline-block mt-2">@{selectedUser.username}</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTokens}
                    onChange={(e) => setEditTokens(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all text-4xl font-black text-center shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black font-black rounded-xl py-4 mt-4 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}