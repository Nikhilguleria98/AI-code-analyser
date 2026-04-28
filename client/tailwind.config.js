/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06141f',
        panel: '#0d2233',
        accent: '#37d0a7',
        soft: '#9cc7c8',
        warning: '#ffb703',
        danger: '#ef476f'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glow: '0 20px 60px rgba(55, 208, 167, 0.14)'
      }
    }
  },
  plugins: []
};
