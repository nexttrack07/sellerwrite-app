/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', 'cupcake', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'lofi'], // Specify themes you want to use
    darkTheme: 'dark', // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
  },
}
