/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Adjust according to your project structure
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'kyoto-sm': '0px 1px 3px rgba(0, 0, 0, 0.1)',
        'kyoto-md': '0px 4px 6px rgba(0, 0, 0, 0.2)',
        'kyoto-lg': '0px 8px 15px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'kyoto-base': '8px',
        'kyoto-pill': '28px', // For pill-shaped buttons
      }
    },
  },
  plugins: [],
};

export default config;
