/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    // Theme objects hold class names too (calculator buttons, etc.).
    './src/themes/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};