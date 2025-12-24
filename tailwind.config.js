/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor': {
          'bg': '#f5f5f5',
          'sidebar': '#ffffff',
          'canvas': '#e5e7eb',
          'primary': '#3b82f6',
          'secondary': '#6b7280',
          'accent': '#8b5cf6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
        }
      },
      boxShadow: {
        'block': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'block-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'block-selected': '0 0 0 2px #3b82f6',
      }
    },
  },
  plugins: [],
}
