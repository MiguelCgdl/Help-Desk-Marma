/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#FD5200",
                "dark-teal": "#00272E",
                "medium-teal": "#006D65",
                "accent-teal": "#D5EFF2",
            },
            fontFamily: {
                jakarta: ["Plus Jakarta Sans", "sans-serif"],
            },
            borderRadius: {
                'marma': '24px',
            }
        }
    },
    plugins: []
}