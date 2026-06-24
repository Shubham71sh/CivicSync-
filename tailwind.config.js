/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f", // Based on image 1
        card: "#12141d", // Cards and sidebar
        cardHover: "#1a1d29",
        accent: "#f4d37c", // The specific gold/yellow
        accentHover: "#e0be63",
        secondary: "#1d4ed8", 
        textPrimary: "#ffffff",
        textSecondary: "#8b949e",
        textMuted: "#6b7280",
        border: "#24283b",
        success: "#10b981",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(244, 211, 124, 0.15)',
        'glow-accent': '0 0 20px rgba(244, 211, 124, 0.4)',
      }
    },
  },
  plugins: [],
}
