/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Exchange board" palette — deep ink navy base, warm brass/amber
        // accent (the color of an old departures board or trading-floor
        // signage), muted teal for gains, a desaturated rose for losses.
        ink: {
          950: "#0b0f14",
          900: "#0f151c",
          800: "#161e27",
          700: "#212b37",
          600: "#2e3b49",
        },
        brass: {
          400: "#e8b95f",
          500: "#d9a441",
          600: "#b8862f",
        },
        gain: "#4fae8e",
        loss: "#c96a5a",
        paper: "#f4efe4",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
