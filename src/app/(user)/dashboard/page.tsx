// src/app/(user)/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";

export default function UserDashboard() {
  // Array tools diupdate dengan konfigurasi warna gradient untuk efek hover
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
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="relative">
        <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-3">
          Welcome to Workspace
        </h1>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl">
          Pilih generator AI yang ingin kamu gunakan. Setiap aksi <span className="text-white font-bold">generate</span> akan memotong saldo tokenmu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={tool.href} className="block group h-full">
                {/* Card dengan Efek Hover Persis seperti Landing Page */}
                <div className={`relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${tool.shadowHover} overflow-hidden`}>
                  
                  {/* Background Reveal saat Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradientFrom}/5 ${tool.gradientTo}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Garis Atas Animasi */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tool.gradientFrom} ${tool.gradientTo} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-8">
                      <div className={`p-4 rounded-2xl ${tool.themeBg} ${tool.themeBorder} border group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                        <Icon className={`w-8 h-8 ${tool.themeColor}`} />
                      </div>
                      <div className="p-3 rounded-full bg-black/40 border border-white/10 text-muted-foreground group-hover:bg-white group-hover:text-black transition-all duration-300">
                        <ArrowRight className="w-5 h-5 group-hover:-rotate-45 transition-transform" />
                      </div>
                    </div>
                    
                    <h3 className={`text-2xl font-bold text-foreground mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${tool.gradientFrom} ${tool.gradientTo} transition-all`}>
                      {tool.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mt-auto">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Box Tips yang Dipercantik */}
    </motion.div>
  );
}