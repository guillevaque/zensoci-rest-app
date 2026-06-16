export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        zs: {
          green: {
            50:  '#EEF4EC',
            100: '#D6E8D1',
            200: '#AECFA5',
            300: '#7FB570',
            400: '#569B44',
            500: '#3C6030',
            600: '#2E4A25',
            700: '#20341A',
          },
          orange: {
            50:  '#FEF3EE',
            100: '#FDE3D1',
            200: '#FAC7A3',
            300: '#F6A870',
            400: '#E87A44',
            500: '#D86835',
            600: '#C45E2A',
            700: '#8C3E1C',
          },
          surface: '#F4F7F4',
          border:  '#E2EAE0',
          text:    '#1C2B1A',
          muted:   '#6B7A69',
        },
      },
      borderRadius: {
        zs:    '10px',
        'zs-lg': '14px',
        'zs-xl': '20px',
      },
      boxShadow: {
        'zs-xs': '0 1px 4px rgba(0,0,0,0.05)',
        'zs-sm': '0 2px 8px rgba(0,0,0,0.06)',
        zs:      '0 4px 16px rgba(0,0,0,0.08)',
        'zs-lg': '0 8px 32px rgba(0,0,0,0.12)',
        'zs-xl': '0 16px 48px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
