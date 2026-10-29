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
        dark: {
          950: '#090d13',
          900: '#0d1117',
          850: '#131821',
          800: '#161b22',
          750: '#1c222b',
          700: '#21262d',
          600: '#30363d',
          500: '#484f58',
          400: '#8b949e',
          300: '#c9d1d9',
          200: '#e6edf3',
          100: '#f0f6fc',
        },
        brand: {
          blue: '#58a6ff',
          green: '#3fb950',
          yellow: '#d29922',
          red: '#f85149',
          purple: '#bc8cff',
          cyan: '#39c5bb',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
