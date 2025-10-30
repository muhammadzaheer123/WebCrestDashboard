// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf2ff",
          100: "#fce8ff",
          500: "#BB37A4",
          600: "#a82c91",
          700: "#8c2178",
          900: "#1C1039",
        },
        secondary: {
          400: "#4315DB",
          500: "#3a12c2",
          600: "#320fa9",
        },
      },
    },
  },
  theme: { extend: {} },
  plugins: [],
};
