import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Explicitly include dark mode classes to prevent purging
    {
      raw: `
        .dark { }
        .dark\\:bg-gray-800 { }
        .dark\\:bg-gray-900 { }
        .dark\\:hover\\:bg-gray-800:hover { }
        .dark\\:hover\\:bg-gray-700:hover { }
        .dark\\:text-white { }
        .dark\\:text-gray-200 { }
        .dark\\:text-gray-300 { }
        .dark\\:text-purple-400 { }
        .dark\\:text-gray-100 { }
        .dark\\:border-gray-700 { }
        .dark\\:bg-purple-900\\/20 { }
        .dark\\:hover\\:bg-purple-900\\/20:hover { }
        .dark\\:hover\\:bg-purple-800\\/10:hover { }
        .dark\\:hover\\:bg-purple-800\\/70:hover { }
        .dark\\:bg-gray-700 { }
        .dark\\:hover\\:bg-gray-600:hover { }
        .dark\\:bg-gray-900\\/80 { }
        .dark\\:bg-purple-800\\/70 { }
        .dark\\:border-purple-900 { }
        .dark\\:text-purple-300 { }
        .dark\\:shadow-purple-900\\/30 { }
        .dark\\:border-purple-700 { }
        .dark\\:hover\\:shadow-purple-900\\/40:hover { }
        
        /* Mantine tab overrides */
        .mantine-Tabs-tab:hover { }
        .dark .mantine-Tabs-tab:hover { }
        
        /* Input field dark mode classes */
        .dark\\:bg-dark-700 { }
        .dark\\:bg-dark-800 { }
        .dark\\:bg-dark-900 { }
        .dark\\:border-dark-600 { }
        .dark\\:border-dark-700 { }
        .dark\\:text-gray-400 { }
        .dark\\:text-gray-500 { }
        .dark\\:placeholder-gray-500 { }
        .dark\\:focus\\:border-primary-400:focus { }
        .dark\\:focus\\:ring-primary-400:focus { }
      `,
    },
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#7C3AED', // Rich purple
        'primary-light': '#9F7AEA', 
        'primary-dark': '#5B21B6',
        'secondary': '#0EA5E9', // Vibrant blue
        'secondary-light': '#38BDF8',
        'secondary-dark': '#0369A1',
        'accent': '#F97316', // Orange for accents/CTAs
        'surface': '#1E1E23', // Dark surface
        'surface-light': '#2A2A32',
        'surface-dark': '#131316',
        'text-primary': '#F8FAFC', // Light text
        'text-secondary': '#CBD5E1', // Muted text
        'text-tertiary': '#64748B', // Very muted text
        'border': '#2F2F3A',
        'success': '#10B981', // Green
        'error': '#EF4444', // Red
        'warning': '#F59E0B', // Amber
      },
      fontFamily: {
        'display': ['CalSans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(to right, #7C3AED, #0EA5E9)',
        'card-gradient': 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.05), rgba(14, 165, 233, 0.05))',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'button': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 8s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.8, 0, 1, 1)',
      },
      transitionDelay: {
        '1000': '1000ms',
        '2000': '2000ms',
      },
    },
  },
  plugins: [],
}
export default config 