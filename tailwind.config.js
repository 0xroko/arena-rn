const nativewind = require("nativewind/tailwind")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./features/**/*.{js,jsx,ts,tsx}", "App.tsx"],
  theme: {
    extend: {},
  },
  plugins: [],
  presets: [nativewind],
}
