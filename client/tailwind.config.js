/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#f5f5f7',
          card: '#ffffff',
          darkBg: '#000000',
          darkCard: '#1c1c1e',
          darkElevated: '#2c2c2e',
          border: 'rgba(0, 0, 0, 0.08)',
          darkBorder: 'rgba(255, 255, 255, 0.12)',
          blue: '#0071e3',
          purple: '#af52de',
          amber: '#ff9500',
          red: '#ff3b30',
          green: '#34c759'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif'
        ]
      },
      boxShadow: {
        'apple': '0 4px 24px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'apple-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}
