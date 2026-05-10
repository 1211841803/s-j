/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2d2924",
        paper: "#fbf7ef",
        canvas: "#f3eee6",
        milk: "#fffdf8",
        tea: "#8b735e",
        clay: "#9a5b44",
        sage: "#667864",
        rosewood: "#7f4a44",
        moss: "#5f7651",
        marigold: "#b9823b",
      },
      boxShadow: {
        soft: "0 16px 42px rgba(60, 49, 39, 0.14)",
        glass: "0 14px 34px rgba(45, 41, 36, 0.1)",
      },
      fontFamily: {
        sans: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "KaiTi",
          "Kaiti SC",
          "PingFang SC",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["Noto Serif SC", "Songti SC", "STSong", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
