// Shared behaviour for the Material 3 pages: ripples, the collapsing app bar,
// theme-color sync, a snackbar, and service worker registration.
(function () {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ripple from the touch point on anything with .m3-state
    document.addEventListener("pointerdown", (e) => {
        if (reduced) return;
        const host = e.target.closest(".m3-state");
        if (!host) return;
        const r = host.getBoundingClientRect();
        const size = Math.hypot(r.width, r.height) * 2;
        const dot = document.createElement("span");
        dot.className = "m3-ripple";
        dot.style.width = dot.style.height = size + "px";
        dot.style.left = e.clientX - r.left - size / 2 + "px";
        dot.style.top = e.clientY - r.top - size / 2 + "px";
        host.appendChild(dot);
        dot.addEventListener("animationend", () => dot.remove());
    }, { passive: true });

    // App bar picks up the container colour once content scrolls under it,
    // and the status bar colour follows so the two read as one surface.
    const bar = document.querySelector(".m3-appbar");
    const hero = document.querySelector(".m3-hero");
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    function sync() {
        const scrolled = hero ? hero.getBoundingClientRect().bottom < 72 : scrollY > 4;
        if (!bar) return;
        bar.classList.toggle("is-scrolled", scrolled);
        if (meta) {
            meta.content = getComputedStyle(bar).getPropertyValue(
                scrolled ? "--md-surface-container" : "--md-surface").trim();
        }
    }
    addEventListener("scroll", sync, { passive: true });
    sync();

    // Navigation feedback: the tapped tab lights up at once and a progress
    // bar runs under the app bar until the next page paints.
    const root = document.documentElement;
    function navigating(on) { root.classList.toggle("is-navigating", on); }
    document.addEventListener("click", (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest("a[href]");
        if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
        const tab = a.closest(".m3-navitem, .m3-tab");
        if (tab) {
            document.querySelectorAll(".m3-navitem[aria-current], .m3-tab[aria-current]").forEach((el) => el.removeAttribute("aria-current"));
            document.querySelectorAll(`.m3-navitem[href="${a.getAttribute("href")}"], .m3-tab[href="${a.getAttribute("href")}"]`)
                .forEach((el) => el.setAttribute("aria-current", "page"));
        }
        navigating(true);
    });
    document.addEventListener("submit", (e) => { if (!e.defaultPrevented) navigating(true); });
    // Coming back through the back/forward cache should not show a stale bar.
    addEventListener("pageshow", () => navigating(false));

    // Snackbar
    let snack, timer;
    window.m3Snackbar = function (text) {
        if (!snack) {
            snack = document.createElement("div");
            snack.className = "m3-snackbar";
            snack.setAttribute("role", "status");
            document.body.appendChild(snack);
        }
        snack.textContent = text;
        requestAnimationFrame(() => snack.classList.add("is-open"));
        clearTimeout(timer);
        timer = setTimeout(() => snack.classList.remove("is-open"), 2200);
    };

    if ("serviceWorker" in navigator) {
        addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js", { scope: "/" })
                .catch((err) => console.debug("SW registration error:", err));
        });
    }
})();
