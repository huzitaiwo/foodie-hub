import {
  mountLayout,
  restaurantCard,
  cuisineCard,
  store,
} from "./components.js";
import { restaurantRepo } from "./services/restaurant-repo.js";

mountLayout();

/* ---------- Header: scroll state + mobile menu ---------- */
const header = document.querySelector(".site-header");
const onScroll = () =>
  header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.querySelector(".menu-toggle");
const menu = document.getElementById("mobile-menu");
const setMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  menu.classList.toggle("is-open", open);
};
toggle.addEventListener("click", () =>
  setMenu(toggle.getAttribute("aria-expanded") !== "true"),
);
document.addEventListener(
  "keydown",
  (e) => e.key === "Escape" && setMenu(false),
);
menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));

/* ---------- Basket count (set by the basket module later) ---------- */
const updateBasketCount = () => {
  const items = store.get("foodie.basket", []);
  const qty = items.reduce((n, i) => n + (i.qty || 1), 0);
  document.querySelectorAll("[data-basket-count]").forEach((el) => {
    el.textContent = qty;
    el.classList.toggle("is-visible", qty > 0);
  });
};
updateBasketCount();
window.addEventListener("basket:change", updateBasketCount);

/* ---------- Location (explicit confirmation) ---------- */
const dialog = document.getElementById("location-dialog");
const labels = document.querySelectorAll("[data-location-label]");
const setLocationLabel = (v) => labels.forEach((el) => (el.textContent = v));
setLocationLabel(store.get("foodie.location", "Wapping, London"));

document.querySelectorAll("[data-open-location]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const current = store.get("foodie.location", "Wapping, London");
    const radio = dialog.querySelector(`input[value="${current}"]`);
    if (radio) radio.checked = true;
    dialog.showModal();
  }),
);
dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "confirm") return;
  const area = dialog.querySelector('input[name="area"]:checked').value;
  store.set("foodie.location", area);
  setLocationLabel(area);
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close("cancel");
}); // backdrop click

/* ---------- Favourites ---------- */
const favs = new Set(store.get("foodie.favourites", []));
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fav]");
  if (!btn) return;
  const id = btn.dataset.fav;
  favs.has(id) ? favs.delete(id) : favs.add(id);
  btn.setAttribute("aria-pressed", String(favs.has(id)));
  store.set("foodie.favourites", [...favs]);
});

/* ---------- Scroll reveal ---------- */
const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries, obs) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              obs.unobserve(en.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      )
    : null;
const observe = (root) =>
  root
    .querySelectorAll(".reveal:not(.is-visible)")
    .forEach((el) =>
      observer ? observer.observe(el) : el.classList.add("is-visible"),
    );
observe(document);

/* ---------- Homepage data ---------- */
const cuisineList = document.getElementById("cuisine-list");
const restaurantList = document.getElementById("restaurant-list");

if (restaurantList) {
  restaurantList.innerHTML = Array.from(
    { length: 4 },
    () => '<li class="near__skeleton" aria-hidden="true"></li>',
  ).join("");

  try {
    const [cuisines, restaurants] = await Promise.all([
      restaurantRepo.getCuisines(),
      restaurantRepo.getFeatured(),
    ]);

    cuisineList.innerHTML = cuisines.map(cuisineCard).join("");
    restaurantList.innerHTML = restaurants
      .map((r, i) =>
        restaurantCard(r, favs.has(r.id)).replace(
          "<li>",
          `<li class="reveal" style="transition-delay:${i * 80}ms">`,
        ),
      )
      .join("");

    observe(cuisineList);
    observe(restaurantList);
  } catch (err) {
    console.error(err);
    restaurantList.innerHTML =
      '<li class="near__error">We couldn’t load restaurants right now. Please refresh and try again.</li>';
  } finally {
    restaurantList.setAttribute("aria-busy", "false");
  }
}
