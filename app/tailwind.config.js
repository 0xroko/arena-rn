const plugin = require("tailwindcss/plugin");

const pallete = {
  dark: {
    // not sure if used
    "accent-0": "#fff",

    "accent-1": "rgb(211, 211, 211)",
    "accent-2": "rgb(110, 110, 110)",
    "accent-3": "rgb(47,47,47)",
    "accent-9": "black",
    "premium-1": "rgb(23, 176, 226)",
    "green-1": "rgb(43, 164, 37)",
    "red-1": "rgb(226, 73, 55)",
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/tailwind")],
  theme: {
    g: ({ theme }) => theme("spacing"),
    "g-x": ({ theme }) => theme("spacing"),
    "g-y": ({ theme }) => theme("spacing"),
    extend: {
      colors: {
        ...pallete["dark"],
      },
      fontSize: {
        "2xs": "10px",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme, addUtilities }) {
      matchUtilities(
        {
          g: (value) => ({
            gap: value,
          }),
          "g-x": (value) => ({
            columnGap: value,
          }),
          "g-y": (value) => ({
            rowGap: value,
          }),
        },
        { values: theme("g") }
      );
    }),
  ],
};
