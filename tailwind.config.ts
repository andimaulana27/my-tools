// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Lebih terang dari #000000, memberikan kesan dark mode modern
        foreground: "#fafafa",
        card: {
          DEFAULT: "#121214",
          border: "#27272a",
          hover: "#18181b",
        },
        primary: {
          DEFAULT: "#ffffff",
          foreground: "#09090b",
          hover: "#e5e5e5",
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#222222",
          foreground: "#ffffff",
        },
        // Warna Khusus Microstock
        adobe: {
          red: "#ff0000",
          pink: "#ff3366",
        },
        canva: {
          cyan: "#00c4cc",
          purple: "#8b3dff",
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;