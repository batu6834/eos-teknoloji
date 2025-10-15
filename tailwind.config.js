// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eosblue: "#1E40AF",
      },
    },
  },
  plugins: [],
  plugins: [require("tailwindcss-animate")],
};

