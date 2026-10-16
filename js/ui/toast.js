import { icon } from "../components.js";

export function toast(message) {
  let region = document.getElementById("toast-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "toast-region";
    region.className = "toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon("check")}<span></span>`;
  el.lastElementChild.textContent = message;
  region.append(el);
  setTimeout(() => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
