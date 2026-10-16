import { initLayout, isFavourite } from "./layout.js";
import {
  restaurantCard,
  emptyState,
  escapeHtml,
  icon,
  store,
} from "./components.js";
import { restaurantRepo } from "./services/restaurant-repo.js";

initLayout();

const $ = (id) => document.getElementById(id);
const els = {
  area: document.querySelector("[data-area]"),
  search: $("search-input"),
  toggle: $("filter-toggle"),
  count: $("filter-count"),
  layout: $("discover"),
  form: $("filters-form"),
  cuisines: $("cuisine-options"),
  sort: $("sort-select"),
  resultsCount: $("results-count"),
  list: $("results-list"),
  empty: $("results-empty"),
  live: $("live"),
  liveList: $("live-list"),
};

/* ---------- State (mirrored in the URL so views can be shared) ---------- */
const DEFAULTS = {
  q: "",
  cuisine: "all",
  time: "any",
  price: "any",
  rating: "any",
  sort: "recommended",
};
const FILTER_KEYS = ["cuisine", "time", "price", "rating"];
const state = { ...DEFAULTS };
const params = new URLSearchParams(location.search);
Object.keys(DEFAULTS).forEach(
  (k) => params.has(k) && (state[k] = params.get(k)),
);

let all = [];

const syncUrl = () => {
  const p = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => v !== DEFAULTS[k] && p.set(k, v));
  history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
};

/* ---------- Area label ---------- */
const setArea = (full) =>
  (els.area.textContent = String(full).split(",")[0].trim());
setArea(store.get("foodie.location", "Wapping, London"));
window.addEventListener("location:change", (e) => setArea(e.detail));

/* ---------- Filtering / sorting ---------- */
const matches = (r, s) => {
  if (s.q) {
    const hay = `${r.name} ${r.cuisine} ${r.tagline}`.toLowerCase();
    if (
      !s.q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((w) => hay.includes(w))
    )
      return false;
  }
  if (s.cuisine !== "all" && r.cuisineId !== s.cuisine) return false;
  if (s.time !== "any" && r.etaMin >= Number(s.time)) return false;
  if (s.price !== "any" && r.price.length !== Number(s.price)) return false;
  if (s.rating === "new" && r.reviewCount > 0) return false;
  if (s.rating === "feedback" && !(r.reviewCount > 0)) return false;
  return true;
};

const sorters = {
  recommended: () => 0,
  fastest: (a, b) => a.etaMin - b.etaMin,
  "price-asc": (a, b) => a.price.length - b.price.length || a.etaMin - b.etaMin,
  "price-desc": (a, b) =>
    b.price.length - a.price.length || a.etaMin - b.etaMin,
};

/* ---------- Render ---------- */
function render() {
  const rows = all
    .filter((r) => matches(r, state))
    .sort(sorters[state.sort] || sorters.recommended);

  els.resultsCount.innerHTML = `<strong>${rows.length}</strong> ${rows.length === 1 ? "place" : "places"} delivering now`;
  els.list.setAttribute("aria-busy", "false");

  if (!rows.length) {
    els.list.innerHTML = "";
    els.empty.hidden = false;
    els.empty.innerHTML = emptyState({
      icon: "search",
      title: "Nothing matches just yet.",
      text: "Try a different search, or clear a filter or two to see who’s delivering near you.",
      ctaLabel: "Clear filters",
      ctaAct: "clear",
    });
  } else {
    els.empty.hidden = true;
    els.list.innerHTML = rows
      .map((r, i) =>
        restaurantCard(r, isFavourite(r.id)).replace(
          "<li>",
          `<li style="--i:${i}">`,
        ),
      )
      .join("");
  }

  const active = FILTER_KEYS.filter((k) => state[k] !== DEFAULTS[k]).length;
  els.count.hidden = !active;
  els.count.textContent = active;
  syncUrl();
}

function syncControls() {
  els.search.value = state.q;
  els.sort.value = state.sort;
  FILTER_KEYS.forEach((k) => {
    const radio = els.form.querySelector(
      `input[name="${k}"][value="${CSS.escape(state[k])}"]`,
    );
    if (radio) radio.checked = true;
  });
}

const reset = () => {
  FILTER_KEYS.forEach((k) => (state[k] = DEFAULTS[k]));
  state.q = "";
  syncControls();
  render();
};

/* ---------- Events ---------- */
let timer;
els.search.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = els.search.value.trim();
    render();
  }, 150);
});

els.form.addEventListener("change", (e) => {
  if (e.target.name in DEFAULTS) {
    state[e.target.name] = e.target.value;
    render();
  }
});
els.form.addEventListener("submit", (e) => e.preventDefault());

els.sort.addEventListener("change", () => {
  state.sort = els.sort.value;
  render();
});

document.addEventListener("click", (e) => {
  if (e.target.closest('[data-act="clear"]')) reset();
});

const setFilters = (open) => {
  els.layout.classList.toggle("filters-closed", !open);
  els.toggle.setAttribute("aria-expanded", String(open));
};
els.toggle.addEventListener("click", () =>
  setFilters(els.toggle.getAttribute("aria-expanded") !== "true"),
);
setFilters(!matchMedia("(max-width: 860px)").matches); // open on desktop, collapsed on mobile

/* ---------- Boot ---------- */
els.list.innerHTML = Array.from(
  { length: 4 },
  () => '<li class="skeleton" aria-hidden="true"></li>',
).join("");

try {
  const [restaurants, cuisines, live] = await Promise.all([
    restaurantRepo.getAll(),
    restaurantRepo.getCuisines(),
    restaurantRepo.getLiveKitchens(),
  ]);
  all = restaurants;

  els.cuisines.innerHTML =
    `<label class="opt"><input type="radio" name="cuisine" value="all" checked> All</label>` +
    cuisines
      .map(
        (c) =>
          `<label class="opt"><input type="radio" name="cuisine" value="${escapeHtml(c.id)}"> ${escapeHtml(c.name)}</label>`,
      )
      .join("");

  if (state.cuisine !== "all" && !cuisines.some((c) => c.id === state.cuisine))
    state.cuisine = "all";
  if (!sorters[state.sort]) state.sort = "recommended";

  syncControls();
  render();

  if (live.length) {
    els.live.hidden = false;
    els.liveList.innerHTML = live
      .map(
        (k) => `
      <li>
        <a class="live-card" href="restaurant.html?id=${encodeURIComponent(k.id)}">
          <h3 class="live-card__name">${escapeHtml(k.name)}</h3>
          <p class="live-card__meta">${escapeHtml(k.cuisine)} · ${k.etaMin} min delivery</p>
          <span class="live-card__link">View live menu ${icon("chevron", "icon--sm")}</span>
        </a>
      </li>`,
      )
      .join("");
  }
} catch (err) {
  console.error(err);
  els.list.setAttribute("aria-busy", "false");
  els.list.innerHTML = "";
  els.empty.hidden = false;
  els.empty.innerHTML = emptyState({
    icon: "search",
    title: "We couldn’t load restaurants.",
    text: "Check your connection and try again.",
    ctaLabel: "Refresh",
    ctaHref: "restaurants.html",
  });
}
