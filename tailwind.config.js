/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zs: {
          green:          '#3c6030',
          'green-deep':   '#2f5128',
          acc:            '#6d9747',
          accent2:        '#d86835',
          'accent2-deep': '#b9521f',
          red:            '#cc482e',
          paper:          '#f8efe8',
          'paper-warm':   '#f1e6dc',
          cream:          '#fffaf3',
          ink:            '#1c1a17',
          'ink-soft':     '#3a352e',
          mute:           '#6e6660',
          line:           '#e6d9cd',
          'line-strong':  '#c9b9a8',
        },
      },
      fontFamily: {
        display: ['"Bobby Jones Soft"', '"Patrick Hand"', 'sans-serif'],
        outline: ['"Bobby Jones Soft Outline"', 'sans-serif'],
        mono:    ['"Courier Prime"', 'ui-monospace', 'monospace'],
        body:    ['"Courier Prime"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        h1: ['56px', { lineHeight: '1.05' }],
        h2: ['40px', { lineHeight: '1.05' }],
        h3: ['28px', { lineHeight: '1.1' }],
        h4: ['22px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        zs:    '16px',
        'zs-lg': '20px',
        'zs-xl': '24px',
      },
      boxShadow: {
        'zs-1':   '0 1px 2px rgba(60,40,20,0.06), 0 1px 1px rgba(60,40,20,0.04)',
        'zs-2':   '0 4px 14px rgba(60,40,20,0.08), 0 2px 4px rgba(60,40,20,0.04)',
        'zs-3':   '0 12px 32px rgba(60,40,20,0.12), 0 4px 8px rgba(60,40,20,0.06)',
        'zs-pop': '0 18px 40px rgba(216,104,53,0.18)',
      },
    },
  },
  plugins: [],
};
