/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function ({ addComponents }) {
      addComponents({
        ".link": {
          "@apply font-medium text-[var(--primary)] underline decoration-[var(--link-underline)] decoration-1 decoration-dashed underline-offset-4":
            {},
        },
      })
    },
  ],
}
