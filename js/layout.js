// Behaviour shared by every page. Call initLayout() once at the top of each page script.
import { mountLayout, store } from "./components.js";
import { basket } from "./services/basket.js";

const favourites = new Set(store.get("foodie.favourites", []));
export const isFavourite = (id) => favourites.has(id);

export function observe(root = document) {
  root.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
    if (observer) observer.observe(el);
    else el.classList.add("is-visible");
  });
}

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

export function initLayout() {
  mountLayout();

  /* Header scroll state */
  const header = document.querySelector(".site-header");
  const onScroll = () =>
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
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
  menu.addEventListener(
    "click",
    (e) => e.target.closest("a") && setMenu(false),
  );

  /* Basket count */
  const updateCount = () => {
    const qty = basket.count();
    document.querySelectorAll("[data-basket-count]").forEach((el) => {
      el.textContent = qty;
      el.classList.toggle("is-visible", qty > 0);
    });
  };
  updateCount();
  window.addEventListener("basket:change", updateCount);
  window.addEventListener(
    "storage",
    (e) =>
      e.key === "foodie.basket" &&
      (updateCount(), window.dispatchEvent(new CustomEvent("basket:change"))),
  );

  /* Location (explicit confirmation) */
  const dialog = document.getElementById("location-dialog");
  const labels = document.querySelectorAll("[data-location-label]");
  const setLabel = (v) => labels.forEach((el) => (el.textContent = v));
  setLabel(store.get("foodie.location", "Wapping, London"));

  document.querySelectorAll("[data-open-location]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const radio = dialog.querySelector(
        `input[value="${store.get("foodie.location", "Wapping, London")}"]`,
      );
      if (radio) radio.checked = true;
      dialog.showModal();
    }),
  );
  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "confirm") return;
    const area = dialog.querySelector('input[name="area"]:checked').value;
    store.set("foodie.location", area);
    setLabel(area);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close("cancel");
  });

  /* Favourites (any restaurant card, any page) */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    const id = btn.dataset.fav;
    favourites.has(id) ? favourites.delete(id) : favourites.add(id);
    btn.setAttribute("aria-pressed", String(favourites.has(id)));
    store.set("foodie.favourites", [...favourites]);
  });

  observe(document);
}
