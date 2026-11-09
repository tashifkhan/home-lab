// Tailwind CDN config shared by every template. Colours point at the M3 tokens in m3.css.
tailwind.config = {
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
