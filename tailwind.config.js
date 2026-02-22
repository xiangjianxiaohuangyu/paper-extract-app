/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F7F8FA',
          card: '#FFFFFF',
        },
        accent: {
          primary: '#4F6BED',
          hover: '#3A5BD9',
          light: '#EEF2FF',
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        state: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        terminal: {
          bg: '#0F172A',
          header: '#1E293B',
          border: '#334155',
          text: '#E2E8F0',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
