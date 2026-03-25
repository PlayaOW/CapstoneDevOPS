/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lofi-beige': '#F5F5DC',
        'lofi-brown': '#3E2723',
        'lofi-clay': '#A1887F',
        'lofi-warm': '#D7CCC8',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
