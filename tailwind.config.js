/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5D3A9B", // Morado Imperial
          light: "#8B63B3",
          dark: "#4A2E7A",
        },
        secondary: {
          DEFAULT: "#D53F8C", // Rosa Vibrante
          light: "#E76FB3",
          dark: "#B32E70",
        },
        background: {
          default: "#F7FAFC", // Un blanco ligeramente grisáceo
        },
        text: {
          primary: "#1A202C", // Carbón Intenso
          secondary: "#4A5568",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
