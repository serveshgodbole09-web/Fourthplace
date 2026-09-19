/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#234234",
        cream: "#f4eee3",
        parchment: "#e9e1d2",
        amber: "#a9bf8e",
        terracotta: "#6f9f7a",
        moss: "#47745a",
        gold: "#b49a61",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Sora"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        paper: "0 18px 50px -24px rgba(35, 66, 52, 0.34)",
      },
    },
  },
  plugins: [],
};
