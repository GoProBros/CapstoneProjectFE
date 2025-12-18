import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        componentBackground: '#282832',
        pageBackground: '#0e0d15',
        accentGreen: '#22c55e',
        buttonGreen: '#4ADE80',
        notification: '#282832',
        modalBackground: '#171717',
        cardBackground: '#1a1a1a',
        cardPreview: '#0f0f0f',
        borderGray: '#374151',
        borderDark: '#1f2937',
        // Add Page Modal colors
        moduleBackground: '#282832',
        skeletonLine: '#2F2F2F',
        // Light mode colors
        light: {
          componentBackground: '#f3f4f6',
          pageBackground: '#ffffff',
          modalBackground: '#f9fafb',
          cardBackground: '#ffffff',
          cardPreview: '#f3f4f6',
          borderGray: '#e5e7eb',
          borderDark: '#d1d5db',
        },
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
