/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // if you use src directory
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // if using prose classes
    require('@tailwindcss/forms'), // if using form styles
  ],
}