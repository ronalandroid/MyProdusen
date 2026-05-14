import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: "#FDC704",
        },
        accent: {
          red: "#B51B19",
        },
        neutral: {
          gray: "#E5E3E6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
