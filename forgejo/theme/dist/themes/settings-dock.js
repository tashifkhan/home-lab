/* Settings dock for git.taf.sh, the forge twin of the one on taf.sh: theme
   mode, the theme families, haptics and reduced motion in one panel. It sits
   bottom-right rather than bottom-left as on taf.sh, because on the left the
   folded button covered the file icons in every repo listing.

   Guests keep every choice in localStorage. Signed-in users post the theme to
   Forgejo's own appearance setting so it follows them; haptics and motion stay
   per browser either way. header.tmpl restores all of it before first paint. */

(() => {
  const KEY = "crt-theme";
  const HAPTICS_KEY = "crt-haptics";
  const MOTION_KEY = "crt-reduce-motion";

  const FAMILIES = [
    { id: "taf", label: "taf.sh", paper: "#f6f1e9", ink: "#171615", accent: "#0f7a6c", font: '"Inter Tight Variable", sans-serif' },
    { id: "dump", label: "Dump", paper: "#f6f3ea", ink: "#191713", accent: "#f2e14c", font: '"Anton", sans-serif' },
    { id: "sleeck", label: "sleeck", paper: "#e0d6ff", ink: "#000000", accent: "#c4f042", font: '"Space Mono", monospace' },
    { id: "simple", label: "Simple", paper: "#e8ebed", ink: "#3f3f3f", accent: "#c94f1f", font: '"Lexend Variable", sans-serif' },
    { id: "bubblegum", label: "Bubblegum", paper: "#f6e6ee", ink: "#5b5555", accent: "#b23e73", font: '"Antic", sans-serif' },
    { id: "sketch", label: "Sketch", paper: "#ffffff", ink: "#111111", accent: "#2447c7", font: '"Kalam", cursive' },
    { id: "material", label: "Material", paper: "#fdf7ff", ink: "#1d1b20", accent: "#6750a4", font: '"Google Sans Flex Variable", sans-serif' },
  ];
  const SEEDS = [
    ["purple", "#6750a4"],
    ["blue", "#0b57d0"],
    ["teal", "#006a6a"],
    ["green", "#386a20"],
    ["amber", "#8b5000"],
    ["red", "#b3261e"],
    ["rose", "#984061"],
  ];

  // Every icon is a 16px stroked SVG so they share one line weight.
  const svg = (body, size = 16) =>
    `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const ICONS = {
    system: svg('<rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M5.5 14h5M8 11.5V14"/>', 14),
    light: svg('<circle cx="8" cy="8" r="3.1"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1"/>', 14),
    dark: svg('<path d="M13.4 9.6A5.8 5.8 0 0 1 6.4 2.6a5.8 5.8 0 1 0 7 7Z"/>', 14),
    chevron: svg('<path d="m4 6 4 4 4-4"/>', 14),
    check: svg('<path d="m3.5 8.5 3 3 6-7"/>', 12),
    haptics: svg('<rect x="5" y="2" width="6" height="12" rx="1.2"/><path d="M2.5 5.5v5M13.5 5.5v5"/>', 14),
    motion: svg('<path d="M1.5 8h3l1.5-3 2 6 1.5-3h5"/>', 14),
    palette: svg('<path d="M8 1.5a6.5 6.5 0 1 0 0 13c.9 0 1.4-.6 1.4-1.3 0-.8-.6-1.1-.6-1.8 0-.7.6-1.2 1.3-1.2h1.6a2.8 2.8 0 0 0 2.8-2.8C14.5 4.1 11.6 1.5 8 1.5Z"/><circle cx="4.8" cy="7.2" r=".8" fill="currentColor" stroke="none"/><circle cx="7" cy="4.5" r=".8" fill="currentColor" stroke="none"/><circle cx="10.3" cy="4.9" r=".8" fill="currentColor" stroke="none"/>', 13),
  };
  // Half ink, half accent: stands for the whole panel without a label.
  const MARK =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="var(--accent)"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/></svg>';

  const root = document.documentElement;
  const signedIn = window.__crtSignedIn === true;
  const prefersLight = matchMedia("(prefers-color-scheme: light)");
  const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const assetBase = document.currentScript ? new URL(".", document.currentScript.src).href : "/assets/themes/";

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {}
    },
  };

  /* ---- state ---- */

  function parseSlug(slug) {
    const material = /^material-([a-z]+)-(light|dark)$/.exec(slug || "");
    if (material) return { family: "material", seed: material[1], mode: material[2] };
    const family = /^(taf|dump|sleeck|simple|bubblegum|sketch)-(light|dark)$/.exec(slug || "");
    if (family) return { family: family[1], seed: "purple", mode: family[2] };
    return null;
  }

  function readGuest() {
    try {
      const stored = JSON.parse(store.get(KEY) || "null");
      if (stored && typeof stored.family === "string") return stored;
    } catch {}
    return null;
  }

  const initial = (!signedIn && readGuest()) || parseSlug(root.dataset.theme) || { family: "taf", seed: "purple", mode: "light" };
  const state = { family: initial.family, seed: initial.seed || "purple", mode: initial.mode || "light" };

  const resolvedMode = () => (state.mode === "system" ? (prefersLight.matches ? "light" : "dark") : state.mode);
  const slugFor = () => (state.family === "material" ? `material-${state.seed}-${resolvedMode()}` : `${state.family}-${resolvedMode()}`);

  const systemReduce = () => systemMotion.matches;
  const motionReduced = () => root.hasAttribute("data-reduce-motion") || systemReduce();

  /* ---- haptics ---- */

  // web-haptics is fetched on the first touch, and only while haptics are on.
  // Starting the import on pointerdown leaves it loaded by the time the click
  // lands, which the iOS path needs: it rides on the tap's user activation.
  let engine;
  let loading;
  let lastPulse = -Infinity;
  let requests = 0;
  const loadHaptics = () =>
    (loading ??= import(new URL("web-haptics.js", assetBase).href)
      .then((mod) => (engine = new mod.WebHaptics({ debug: false, showSwitch: false })))
      .catch(() => undefined));

  function hapticsEnabled() {
    const saved = store.get(HAPTICS_KEY);
    if (saved !== null) return saved === "true";
    return !systemReduce();
  }

  function pulse(kind = "light") {
    requests++;
    if (document.visibilityState === "hidden" || !hapticsEnabled()) return;
    const now = performance.now();
    if (now - lastPulse < 100) return;
    lastPulse = now;
    const pattern = { selection: [{ duration: 4, intensity: 1 }], light: [{ duration: 6, intensity: 1 }], error: [{ duration: 10, intensity: 1 }] }[kind];
    try {
      if (engine) void engine.trigger(pattern).catch(() => {});
      else void loadHaptics();
    } catch {}
  }

  function installHaptics() {
    const controls = 'a[href], button, summary, [role="button"], [role="tab"], [role="switch"], [role="radio"], .ui.button, .ui.dropdown, .item';
    const quiet = '[disabled], [aria-disabled="true"], [inert], .disabled, [data-haptic="manual"]';
    document.addEventListener("pointerdown", () => hapticsEnabled() && void loadHaptics(), { capture: true, passive: true });
    document.addEventListener(
      "click",
      (event) => {
        if (!event.isTrusted || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        if (!(event.target instanceof Element)) return;
        const control = event.target.closest(controls);
        if (!control || control.closest(quiet)) return;
        const kind = control.matches('summary, [role="tab"], [role="switch"], [role="radio"], [aria-pressed], [aria-expanded], .ui.dropdown') ? "selection" : "light";
        const before = requests;
        setTimeout(() => requests === before && pulse(kind), 0);
      },
      true,
    );
    document.addEventListener("invalid", (event) => event.isTrusted && navigator.userActivation?.isActive && pulse("error"), true);
    const cancel = () => {
      engine?.cancel();
      lastPulse = -Infinity;
    };
    document.addEventListener("visibilitychange", () => document.hidden && cancel());
    addEventListener("pagehide", cancel);
  }

  /* ---- applying a theme ---- */

  // Swap the stylesheet only once the new one has loaded, so there is never a
  // frame with no theme at all.
  function swapStylesheet(slug) {
    const current = document.querySelector('link[rel="stylesheet"][href*="/assets/css/theme-"]');
    root.dataset.theme = slug;
    if (!current) return Promise.resolve();
    const url = new URL(current.href);
    url.pathname = url.pathname.replace(/theme-[^/]+\.css$/, `theme-${slug}.css`);
    if (url.href === current.href) return Promise.resolve();
    const next = current.cloneNode();
    next.href = url.href;
    return new Promise((resolve) => {
      const done = () => {
        current.remove();
        resolve();
      };
      next.addEventListener("load", done, { once: true });
      next.addEventListener("error", done, { once: true });
      current.after(next);
    });
  }

  /* The new palette grows out of the pressed control as a circle, the same
     reveal as taf.sh. Without view transitions it repaints in place. */
  function reveal(origin, update) {
    if (!document.startViewTransition || motionReduced() || root.hasAttribute("data-theme-switch")) return update();
    const box = origin.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    root.dataset.themeSwitch = "";
    try {
      document.startViewTransition(update).finished.finally(() => delete root.dataset.themeSwitch);
    } catch {
      delete root.dataset.themeSwitch;
      update();
    }
  }

  async function saveToAccount(slug) {
    const csrf = (window.config && window.config.csrfToken) || "";
    status("Saving to your account…");
    try {
      const headers = { "Content-Type": "application/x-www-form-urlencoded" };
      if (csrf) headers["x-csrf-token"] = csrf;
      const response = await fetch("/user/settings/appearance/theme", {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: new URLSearchParams({ _csrf: csrf, theme: slug }),
      });
      if (!response.ok) throw new Error(String(response.status));
      status("Saved to your account.");
    } catch (error) {
      status(`Could not save (${error.message}). Showing it here only.`);
    }
  }

  function apply(origin) {
    const slug = slugFor();
    if (!signedIn) store.set(KEY, JSON.stringify(state));
    render();
    reveal(origin, () => swapStylesheet(slug));
    if (signedIn) void saveToAccount(slug);
    else status(`${FAMILIES.find((f) => f.id === state.family).label}, ${state.mode === "system" ? `system (${resolvedMode()})` : resolvedMode()}. Saved in this browser.`);
  }

  /* ---- markup ---- */

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
  };

  let dock;
  let panel;
  let openBtn;
  let closeBtn;
  let statusNode;
  const status = (message) => statusNode && (statusNode.textContent = message);

  function switchButton(label, title, onToggle) {
    return el("button", {
      type: "button",
      role: "switch",
      class: "crt-dock__switch",
      "aria-checked": "false",
      "aria-label": label,
      title,
      "data-haptic": "manual",
      onclick: onToggle,
    }, [el("span", { class: "crt-dock__knob" })]);
  }

  function build() {
    const modes = el("div", { class: "crt-dock__modes", role: "radiogroup", "aria-label": "Color mode" });
    for (const [mode, label] of [["system", "System"], ["light", "Light"], ["dark", "Dark"]]) {
      modes.append(
        el("button", {
          type: "button",
          role: "radio",
          class: "crt-dock__mode",
          "aria-checked": "false",
          "data-mode": mode,
          "data-haptic": "manual",
          html: `${ICONS[mode]}<span>${label}</span>`,
          onclick: (event) => {
            pulse("selection");
            if (state.mode === mode) return;
            state.mode = mode;
            apply(event.currentTarget);
          },
        }),
      );
    }

    const grid = el("div", { class: "crt-dock__families", role: "radiogroup", "aria-label": "Theme" });
    for (const family of FAMILIES) {
      const card = el("button", {
        type: "button",
        role: "radio",
        class: "crt-dock__family",
        "aria-checked": "false",
        "data-family": family.id,
        "data-haptic": "manual",
        onclick: (event) => {
          pulse("selection");
          if (state.family === family.id) return;
          state.family = family.id;
          apply(event.currentTarget);
        },
      }, [
        el("span", { class: "crt-dock__sample", "aria-hidden": "true" }, [el("span", { text: "Aa" }), el("i")]),
        el("span", { class: "crt-dock__family-name", text: family.label }),
        el("span", { class: "crt-dock__tick", html: ICONS.check }),
      ]);
      card.style.setProperty("--sample-paper", family.paper);
      card.style.setProperty("--sample-ink", family.ink);
      card.style.setProperty("--sample-accent", family.accent);
      card.style.setProperty("--sample-font", family.font);
      grid.append(card);
    }

    const seeds = el("div", { class: "crt-dock__seeds", role: "radiogroup", "aria-label": "Material seed colour" });
    for (const [seed, hex] of SEEDS) {
      const button = el("button", {
        type: "button",
        role: "radio",
        class: "crt-dock__seed",
        "aria-checked": "false",
        "aria-label": `${seed[0].toUpperCase()}${seed.slice(1)} seed`,
        title: `${seed[0].toUpperCase()}${seed.slice(1)}`,
        "data-seed": seed,
        "data-haptic": "manual",
        onclick: (event) => {
          pulse("selection");
          if (state.family === "material" && state.seed === seed) return;
          state.family = "material";
          state.seed = seed;
          apply(event.currentTarget);
        },
      });
      button.style.setProperty("--seed", hex);
      seeds.append(button);
    }

    const hapticsSwitch = switchButton("Haptic feedback", "Vibrate on taps, on phones that support it", () => {
      const next = !hapticsEnabled();
      store.set(HAPTICS_KEY, String(next));
      if (next) {
        void loadHaptics();
        pulse("selection");
      } else engine?.cancel();
      render();
    });
    hapticsSwitch.dataset.switch = "haptics";

    const motionSwitch = switchButton("Reduce motion", "Turn off animations", () => {
      if (systemReduce()) return;
      pulse("selection");
      const next = !root.hasAttribute("data-reduce-motion");
      root.toggleAttribute("data-reduce-motion", next);
      store.set(MOTION_KEY, next ? "true" : null);
      render();
    });
    motionSwitch.dataset.switch = "motion";

    const toggleRow = (icon, label, control) =>
      el("div", { class: "crt-dock__toggle" }, [
        el("span", { class: "crt-dock__toggle-label", html: `${icon}<span>${label}</span>` }),
        control,
      ]);

    closeBtn = el("button", {
      type: "button",
      class: "crt-dock__icon-btn",
      "aria-label": "Collapse appearance settings",
      title: "Collapse",
      "data-haptic": "manual",
      html: ICONS.chevron,
      onclick: () => {
        pulse("selection");
        setExpanded(false, true);
      },
    });

    statusNode = el("p", { class: "crt-dock__status", "aria-live": "polite", text: signedIn ? "Theme follows your account." : "Saved in this browser." });

    panel = el("div", { id: "crt-dock-panel", class: "crt-dock__panel", role: "group", "aria-label": "Appearance and motion", hidden: "" }, [
      el("div", { class: "crt-dock__head" }, [el("span", { class: "crt-dock__eyebrow", html: `${MARK}<span>Appearance</span>` }), closeBtn]),
      modes,
      el("p", { class: "crt-dock__label", html: `${ICONS.palette}<span>Theme</span>` }),
      grid,
      seeds,
      el("div", { class: "crt-dock__toggles" }, [
        toggleRow(ICONS.haptics, "Haptics", hapticsSwitch),
        toggleRow(ICONS.motion, "Reduce motion", motionSwitch),
      ]),
      statusNode,
    ]);

    openBtn = el("button", {
      type: "button",
      class: "crt-dock__open",
      "aria-label": "Open appearance settings",
      "aria-controls": "crt-dock-panel",
      "aria-expanded": "false",
      title: "Appearance and motion",
      "data-haptic": "manual",
      html: MARK,
      onclick: () => {
        pulse("selection");
        setExpanded(true, true);
      },
    });

    dock = el("div", { class: "crt-dock", "data-settings-dock": "" }, [panel, openBtn]);
    document.body.append(dock);
    render();
    wire();
  }

  function render() {
    if (!dock) return;
    const check = (selector, match) => dock.querySelectorAll(selector).forEach((node) => node.setAttribute("aria-checked", String(match(node))));
    check(".crt-dock__mode", (node) => node.dataset.mode === state.mode);
    check(".crt-dock__family", (node) => node.dataset.family === state.family);
    check(".crt-dock__seed", (node) => state.family === "material" && node.dataset.seed === state.seed);
    dock.querySelector(".crt-dock__seeds").hidden = state.family !== "material";

    const seed = SEEDS.find(([id]) => id === state.seed);
    if (seed) dock.querySelector('.crt-dock__family[data-family="material"]').style.setProperty("--sample-accent", seed[1]);

    dock.querySelector('[data-switch="haptics"]').setAttribute("aria-checked", String(hapticsEnabled()));
    const motion = dock.querySelector('[data-switch="motion"]');
    motion.setAttribute("aria-checked", String(motionReduced()));
    if (systemReduce()) {
      motion.setAttribute("aria-disabled", "true");
      motion.title = "Reduced by your system setting";
    } else {
      motion.removeAttribute("aria-disabled");
      motion.title = "Turn off animations";
    }
  }

  /* ---- open / closed ---- */

  let expanded = false;

  function setExpanded(next, moveFocus = false) {
    if (next === expanded) return;
    expanded = next;
    panel.hidden = !next;
    openBtn.hidden = next;
    openBtn.setAttribute("aria-expanded", String(next));
    if (next) render();
    if (moveFocus) (next ? panel.querySelector('[aria-checked="true"]') || closeBtn : openBtn).focus();
  }

  function wire() {
    // Folds away on an outside press or Escape, and steps aside while the
    // page is scrolling.
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (expanded && event.target instanceof Element && !event.target.closest("[data-settings-dock]")) setExpanded(false);
      },
      true,
    );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && expanded) setExpanded(false, dock.contains(document.activeElement));
    });

    let settle = 0;
    let lastY = scrollY;
    addEventListener(
      "scroll",
      () => {
        if (Math.abs(scrollY - lastY) < 4) return;
        lastY = scrollY;
        if (dock.contains(document.activeElement) && expanded) return;
        dock.classList.add("is-away");
        setExpanded(false);
        clearTimeout(settle);
        settle = setTimeout(() => dock.classList.remove("is-away"), 220);
      },
      { passive: true },
    );

    prefersLight.addEventListener("change", () => {
      if (state.mode !== "system") return;
      if (signedIn) render();
      else void swapStylesheet(slugFor());
    });
    systemMotion.addEventListener("change", render);
    addEventListener("storage", (event) => {
      if (event.key === MOTION_KEY) root.toggleAttribute("data-reduce-motion", event.newValue === "true");
      if (event.key === KEY && !signedIn) {
        const next = readGuest();
        if (next) {
          Object.assign(state, next);
          void swapStylesheet(slugFor());
        }
      }
      render();
    });
  }

  installHaptics();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build, { once: true });
  else build();
})();
