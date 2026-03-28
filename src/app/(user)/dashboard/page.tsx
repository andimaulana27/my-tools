// src/app/(user)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Image as ImageIcon, Sparkles, ArrowRight, Palette } from "lucide-react";

export default function UserDashboard() {
  const tools = [
    {
      id: "adobe-stock",
      name: "Adobe Stock Metadata",
      description: "Generate judul dan keyword SEO friendly dengan volume tinggi untuk aset desain vektor, halftone, atau foto.",
      icon: Sparkles,
      href: "/metadata?tab=adobe", 
      themeColor: "text-adobe-red",
      themeBg: "bg-adobe-red/10",
      themeBorder: "border-adobe-red/20",
      gradientFrom: "from-adobe-red",
      gradientTo: "to-adobe-pink",
      shadowHover: "hover:shadow-adobe-red/20"
    },
    {
      id: "canva",
      name: "Canva Metadata",
      description: "Buat deskripsi elemen dan keyword yang relevan untuk mempercepat proses review elemen di Canva Creator.",
      icon: ImageIcon,
      href: "/metadata?tab=canva", 
      themeColor: "text-canva-cyan",
      themeBg: "bg-canva-cyan/10",
      themeBorder: "border-canva-cyan/20",
      gradientFrom: "from-canva-cyan",
      gradientTo: "to-canva-purple",
      shadowHover: "hover:shadow-canva-purple/20"
    },
    {
      id: "image-engine",
      name: "AI Image Generator",
      description: "Buat variasi aset desain, ilustrasi, dan vektor secara batch untuk portfolio microstock Anda dengan berbagai pilihan style.",
      icon: Palette,
      href: "/image-engine", // URL ini yang akan kita buat selanjutnya
      themeColor: "text-emerald-400",
      themeBg: "bg-emerald-500/10",
      themeBorder: "border-emerald-500/20",
      gradientFrom: "from-emerald-400",
      gradientTo: "to-teal-500",
      shadowHover: "hover:shadow-emerald-500/20"
    },
  ];

  return (
    <div className="relative min-h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >
        {/* Header Section (Konsisten dengan Admin) */}
        <div className="border-b border-white/5 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3 mb-2">
            Welcome to Workspace
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-2xl">
            Pilih alat AI yang ingin kamu gunakan. Setiap aksi <span className="text-white font-bold">generate</span> akan memotong saldo tokenmu.
          </p>
        </div>

        {/* Diubah menjadi md:grid-cols-3 agar memuat 3 kartu dengan presisi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <Link href={tool.href} className="block group h-full">
                  {/* Card dengan Efek Hover Premium Persis Admin */}
                  <div className={`relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] ${tool.shadowHover} hover:border-white/20 overflow-hidden flex flex-col`}>
                    
                    {/* Background Reveal & Diagonal Shine saat Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradientFrom}/5 ${tool.gradientTo}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Garis Atas Animasi */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tool.gradientFrom} ${tool.gradientTo} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out`} />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-8">
                        {/* Icon Container */}
                        <div className={`p-4 rounded-2xl ${tool.themeBg} ${tool.themeBorder} border shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative`}>
                          <Icon className={`w-8 h-8 ${tool.themeColor} relative z-10`} />
                          {/* Ambient glow */}
                          <div className={`absolute inset-0 ${tool.themeBg} blur-md rounded-2xl`} />
                        </div>
                        
                        {/* Arrow Action */}
                        <div className="p-3 rounded-full bg-black/40 border border-white/10 text-muted-foreground group-hover:bg-white group-hover:text-black transition-all duration-300 shadow-inner">
                          <ArrowRight className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
                        </div>
                      </div>
                      
                      <h3 className={`text-2xl font-black text-foreground mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${tool.gradientFrom} ${tool.gradientTo} transition-all`}>
                        {tool.name}
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed mt-auto pt-2 border-t border-white/5">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}