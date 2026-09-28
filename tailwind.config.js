// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./src/**/*.css"],
  theme: {
    extend: {
      colors: {
        primaryLavender: "#9FA1FF",
        softLavender: "#B5BAFF",
        deepLavender: "#9192E8",
        skyBlue: "#AEE2FF",
        mint: "#D9F9DF",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: [""],
      },
    },
  },
  plugins: [],
};
