/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./features/**/*.{js,jsx,ts,tsx}", "App.tsx"],
  theme: {
    extend: {
      colors: {
        theme: {
          1: "rgb(211, 211, 211)",
          2: "rgb(187, 187, 187)",
          3: "rgb(110, 110, 110)",
          4: "rgb(47, 47, 47)",
        },
      },
    },
  },
  plugins: [],
};
