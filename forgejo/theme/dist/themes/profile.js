/* Profile contribution surface. Mounts above the profile tabs on overview
   and repositories only; ?tab=activity already has Forgejo's heatmap.
   Data: public /api/v1/users/<name>/heatmap + user + repos. */

const DAY = 86_400_000;
const CACHE = "crt-profile:v1:";
const TTL = 5 * 60 * 1000;
const MAX_REPO_PAGES = 10;

const fmt = new Intl.NumberFormat("en-US");

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dateKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function profileUser() {
  const page = document.querySelector(".page-content.user.profile");
  if (!page) return null;
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return null;
  const user = decodeURIComponent(parts[0]);
  if (!user || ["explore", "user", "admin", "api"].includes(user)) return null;
  return user;
}

function currentTab() {
  return new URLSearchParams(location.search).get("tab") || "overview";
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

async function fetchRepos(user) {
  const all = [];
  let total = 0;
  for (let page = 1; page <= MAX_REPO_PAGES; page++) {
    const response = await fetch(`/api/v1/users/${encodeURIComponent(user)}/repos?page=${page}&limit=50`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) break;
    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    total = Number(response.headers.get("x-total-count") || all.length);
    if (all.length >= total) break;
  }
  return {
    total: total || all.length,
    stars: all.reduce((sum, repo) => sum + (Number(repo.stars_count) || 0), 0),
  };
}

function bucketHeatmap(points) {
  const buckets = new Map();
  for (const point of points || []) {
    const ms = Number(point.timestamp) * 1000;
    if (!Number.isFinite(ms)) continue;
    const key = dateKey(ms);
    buckets.set(key, (buckets.get(key) || 0) + (Number(point.contributions) || 0));
  }
  return buckets;
}

function computeStats(buckets, start, days) {
  let total = 0;
  let best = { date: null, count: 0 };
  let longest = 0;
  let run = 0;

  for (let i = 0; i < days; i++) {
    const key = dateKey(start + i * DAY);
    const count = buckets.get(key) || 0;
    total += count;
    if (count > best.count) best = { date: key, count };
    if (count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  let current = 0;
  const today = startOfUtcDay(new Date());
  for (let i = 0; i < 370; i++) {
    const key = dateKey(today - i * DAY);
    if ((buckets.get(key) || 0) > 0) current += 1;
    else if (i === 0) continue;
    else break;
  }

  return { total, best, longest, current };
}

function levelFor(count, thresholds) {
  if (count <= 0) return 0;
  if (count <= thresholds[0]) return 1;
  if (count <= thresholds[1]) return 2;
  if (count <= thresholds[2]) return 3;
  return 4;
}

function buildSection({ user, heatmap, repos, profile }) {
  const buckets = bucketHeatmap(heatmap);
  const days = 53 * 7;
  const today = startOfUtcDay(new Date());
  const start = today - (52 * 7 + new Date(today).getUTCDay()) * DAY;
  const stats = computeStats(buckets, start, days);

  const values = [...buckets.values()].filter((n) => n > 0).sort((a, b) => a - b);
  const q = (p) => values[Math.min(values.length - 1, Math.floor(values.length * p))] || 1;
  const thresholds = [q(0.25), q(0.5), q(0.75)];

  const section = document.createElement("section");
  section.id = "crt-profile";
  section.className = "crt-profile";
  section.setAttribute("aria-label", "Contribution activity");

  const head = document.createElement("div");
  head.className = "crt-profile__head";
  const title = document.createElement("h3");
  title.textContent = "Contribution activity";
  const total = document.createElement("span");
  total.className = "crt-profile__total";
  total.textContent = `${fmt.format(stats.total)} in the last year · UTC`;
  head.append(title, total);

  const statGrid = document.createElement("div");
  statGrid.className = "crt-profile__stats";
  const items = [
    ["Repositories", repos.total],
    ["Stars", repos.stars],
    ["Followers", Number(profile.followers_count) || 0],
    ["Contributions", stats.total],
  ];
  for (const [label, value] of items) {
    const box = document.createElement("div");
    box.className = "crt-profile__stat";
    const b = document.createElement("b");
    b.textContent = fmt.format(value);
    const span = document.createElement("span");
    span.textContent = label;
    box.append(b, span);
    statGrid.append(box);
  }

  const heat = document.createElement("div");
  heat.className = "crt-heatmap";

  const dayLabels = document.createElement("div");
  dayLabels.className = "crt-heatmap__days";
  dayLabels.setAttribute("aria-hidden", "true");
  ["", "Mon", "", "Wed", "", "Fri", ""].forEach((label) => {
    const span = document.createElement("span");
    span.textContent = label;
    dayLabels.append(span);
  });

  const main = document.createElement("div");
  main.className = "crt-heatmap__main";

  const months = document.createElement("div");
  months.className = "crt-heatmap__months";
  months.setAttribute("aria-hidden", "true");
  let lastMonth = -1;
  for (let week = 0; week < 53; week++) {
    const date = new Date(start + week * 7 * DAY);
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      const label = document.createElement("span");
      label.textContent = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      label.style.gridColumn = `${week + 1} / span 4`;
      months.append(label);
      lastMonth = month;
    }
  }

  const weeks = document.createElement("div");
  weeks.className = "crt-heatmap__weeks";
  weeks.setAttribute("role", "img");
  weeks.setAttribute("aria-label", `${fmt.format(stats.total)} contributions in the last year`);

  for (let i = 0; i < days; i++) {
    const ms = start + i * DAY;
    const key = dateKey(ms);
    const count = buckets.get(key) || 0;
    const cell = document.createElement("i");
    cell.className = "crt-heatmap__cell";
    cell.dataset.level = String(levelFor(count, thresholds));
    cell.title = `${new Date(ms).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })}: ${fmt.format(count)} ${count === 1 ? "contribution" : "contributions"}`;
    weeks.append(cell);
  }

  main.append(months, weeks);

  const foot = document.createElement("div");
  foot.className = "crt-profile__foot";
  const legend = document.createElement("div");
  legend.className = "crt-heatmap__legend";
  legend.setAttribute("aria-hidden", "true");
  const less = document.createElement("span");
  less.textContent = "Less";
  legend.append(less);
  for (let level = 0; level <= 4; level++) {
    const cell = document.createElement("i");
    cell.dataset.level = String(level);
    legend.append(cell);
  }
  const more = document.createElement("span");
  more.textContent = "More";
  legend.append(more);

  const note = document.createElement("span");
  note.className = "crt-heatmap__note";
  note.textContent = `Longest ${stats.longest}d · Current ${stats.current}d · Best ${fmt.format(stats.best.count)}`;
  foot.append(legend, note);

  heat.append(dayLabels, main);
  section.append(head, statGrid, heat, foot);
  return section;
}

async function loadData(user) {
  try {
    const cached = sessionStorage.getItem(CACHE + user);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.at < TTL) return parsed;
    }
  } catch {}

  const [heatmap, profile, repos] = await Promise.all([
    getJson(`/api/v1/users/${encodeURIComponent(user)}/heatmap`),
    getJson(`/api/v1/users/${encodeURIComponent(user)}`).catch(() => ({})),
    fetchRepos(user).catch(() => ({ total: 0, stars: 0 })),
  ]);

  const data = { at: Date.now(), user, heatmap, profile, repos };
  try {
    sessionStorage.setItem(CACHE + user, JSON.stringify(data));
  } catch {}
  return data;
}

async function mount() {
  const user = profileUser();
  if (!user) return;
  const existing = document.getElementById("crt-profile");
  const tab = currentTab();
  if (tab !== "overview" && tab !== "repositories") {
    existing?.remove();
    return;
  }
  if (existing) return;

  const column = document.querySelector(".page-content.user.profile .ui.twelve.wide.column");
  if (!column) return;

  try {
    const data = await loadData(user);
    const section = buildSection({ user, ...data });
    const tabs = column.querySelector("overflow-menu");
    column.insertBefore(section, tabs || column.firstChild);
  } catch (error) {
    console.warn("[crt-profile] not mounted:", error.message);
  }
}

let timer = 0;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(mount, 40);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", schedule, { once: true });
} else {
  schedule();
}

document.addEventListener("htmx:afterSwap", schedule);
document.addEventListener("htmx:afterSettle", schedule);
window.addEventListener("popstate", schedule);
