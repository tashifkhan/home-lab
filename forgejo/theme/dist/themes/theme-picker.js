/* Theme picker for the taf.sh forge. Guests get a local override; signed-in
   users post to Forgejo's own appearance setting so the choice persists. */

const KEY = "crt-theme";
const MODES = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "System"],
];
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

const signedIn = window.__crtSignedIn === true;
const themeLink = document.querySelector('link[rel="stylesheet"][href*="/assets/css/theme-"]');
const media = matchMedia("(prefers-color-scheme: light)");
const status = (message) => {
  const node = document.querySelector(".crt-picker__status");
  if (node) node.textContent = message;
};

function readGuest() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored && typeof stored.family === "string") return stored;
  } catch {}
  return null;
}

function parseSlug(slug) {
  const material = /^material-([a-z]+)-(light|dark)$/.exec(slug || "");
  if (material) return { family: "material", seed: material[1], mode: material[2] };
  const family = /^(taf|dump|sleeck|simple|bubblegum|sketch)-(light|dark)$/.exec(slug || "");
  if (family) return { family: family[1], seed: "purple", mode: family[2] };
  return null;
}

const initial = (!signedIn && readGuest()) || parseSlug(document.documentElement.dataset.theme) || {
  family: "taf",
  seed: "purple",
  mode: "light",
};
const state = { family: initial.family, seed: initial.seed, mode: initial.mode };

function resolvedMode(mode = state.mode) {
  return mode === "system" ? (media.matches ? "light" : "dark") : mode;
}

function slugFor() {
  const mode = resolvedMode();
  return state.family === "material" ? `material-${state.seed}-${mode}` : `${state.family}-${mode}`;
}

function updateThemeLink(slug) {
  if (!themeLink) return;
  const url = new URL(themeLink.href);
  url.pathname = `/assets/css/theme-${slug}.css`;
  themeLink.href = url.href;
  document.documentElement.dataset.theme = slug;
}

function applyGuest() {
  const slug = slugFor();
  updateThemeLink(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  render();
  status(`${FAMILIES.find((f) => f.id === state.family).label} · ${resolvedMode()}`);
}

async function applySignedIn() {
  const slug = slugFor();
  const csrf = (window.config && window.config.csrfToken) || "";
  status("Saving…");
  try {
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (csrf) headers["x-csrf-token"] = csrf;
    const response = await fetch("/user/settings/appearance/theme", {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: new URLSearchParams({ _csrf: csrf, theme: slug }),
    });
    if (!response.ok) throw new Error(`${response.status}`);
    location.reload();
  } catch (error) {
    status(`Could not save (${error.message})`);
  }
}

function apply() {
  if (signedIn) void applySignedIn();
  else applyGuest();
}

function setPressed(nodes, match) {
  for (const node of nodes) node.setAttribute("aria-pressed", String(match(node)));
}

function render() {
  const cards = document.querySelectorAll(".crt-picker-card");
  setPressed(cards, (node) => node.dataset.family === state.family);
  const modes = document.querySelectorAll(".crt-picker__mode");
  setPressed(modes, (node) => node.dataset.mode === state.mode);
  const seeds = document.querySelectorAll(".crt-picker__seed");
  setPressed(seeds, (node) => node.dataset.seed === state.seed);
  const seedBox = document.querySelector(".crt-picker__seeds");
  if (seedBox) seedBox.hidden = state.family !== "material";
  for (const card of cards) {
    if (card.dataset.family === "material") {
      const seed = SEEDS.find(([id]) => id === state.seed);
      if (seed) card.style.setProperty("--sample-accent", seed[1]);
    }
  }
}

function familyCard(family) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "crt-picker-card";
  button.dataset.family = family.id;
  button.style.setProperty("--sample-paper", family.paper);
  button.style.setProperty("--sample-ink", family.ink);
  button.style.setProperty("--sample-accent", family.accent);
  button.style.setProperty("--sample-font", family.font);

  const sample = document.createElement("span");
  sample.className = "crt-picker-card__sample";
  const aa = document.createElement("span");
  aa.textContent = "Aa";
  const bar = document.createElement("i");
  sample.append(aa, bar);

  const name = document.createElement("span");
  name.className = "crt-picker-card__name";
  name.textContent = family.label;
  button.append(sample, name);
  button.addEventListener("click", () => {
    state.family = family.id;
    apply();
  });
  return button;
}

function build() {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "crt-picker-trigger";
  trigger.setAttribute("aria-label", "Appearance");
  trigger.innerHTML =
    '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1m0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11m0 2a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5m0 3.5c1.7 0 3 1.1 3 2.5V11H5v-.5C5 9.1 6.3 8 8 8"/></svg>';

  const dialog = document.createElement("dialog");
  dialog.className = "crt-picker";
  dialog.setAttribute("aria-label", "Appearance");

  const head = document.createElement("div");
  head.className = "crt-picker__head";
  const title = document.createElement("h2");
  title.className = "crt-picker__title";
  title.textContent = "Appearance";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "crt-picker__close";
  close.setAttribute("aria-label", "Close appearance");
  close.textContent = "×";
  head.append(title, close);

  const modeBox = document.createElement("div");
  modeBox.className = "crt-picker__modes";
  modeBox.setAttribute("role", "group");
  modeBox.setAttribute("aria-label", "Color mode");
  for (const [mode, label] of MODES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crt-picker__mode";
    button.dataset.mode = mode;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.mode = mode;
      apply();
    });
    modeBox.append(button);
  }

  const grid = document.createElement("div");
  grid.className = "crt-picker__grid";
  for (const family of FAMILIES) grid.append(familyCard(family));

  const seedBox = document.createElement("div");
  seedBox.className = "crt-picker__seeds";
  seedBox.setAttribute("role", "group");
  seedBox.setAttribute("aria-label", "Material seed color");
  for (const [seed, hex] of SEEDS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crt-picker__seed";
    button.dataset.seed = seed;
    button.style.setProperty("--seed", hex);
    button.setAttribute("aria-label", `${seed} seed`);
    button.addEventListener("click", () => {
      state.family = "material";
      state.seed = seed;
      apply();
    });
    seedBox.append(button);
  }

  const note = document.createElement("p");
  note.className = "crt-picker__status";
  note.setAttribute("aria-live", "polite");
  note.textContent = signedIn ? "Saved to your account." : "Saved in this browser.";

  dialog.append(head, modeBox, grid, seedBox, note);

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  trigger.addEventListener("click", () => {
    render();
    dialog.showModal();
    dialog.querySelector(".crt-picker-card[aria-pressed='true']")?.focus();
  });

  document.body.append(trigger, dialog);
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", build, { once: true });
} else {
  build();
}

if (state.mode === "system" && !signedIn) {
  media.addEventListener("change", () => {
    if (state.mode === "system") applyGuest();
  });
}
