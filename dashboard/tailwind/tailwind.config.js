// Builds static/tw.css from the templates. Rebuild after changing Tailwind
// classes in templates/ or static/*.js:
//   npx -y tailwindcss@3.4.17 -c tailwind/tailwind.config.js -i tailwind/input.css -o static/tw.css --minify
module.exports = {
    content: ["./templates/**/*.html", "./static/**/*.js"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Roboto Flex", "system-ui", "-apple-system", "sans-serif"],
                mono: ["JetBrains Mono", "ui-monospace", "monospace"],
            },
            colors: {
                primary: "var(--md-primary)",
                "on-surface": "var(--md-on-surface)",
                "on-surface-variant": "var(--md-on-surface-variant)",
                outline: "var(--md-outline)",
                ok: "var(--md-ok)",
            },
        },
    },
};
