import { initLayout, observe } from "./layout.js";

initLayout();
observe?.(document);

// Smooth in-page scroll for "See how it works" (respects reduced motion via CSS scroll-behavior in base.css).
document
  .querySelector('a[href="#audiences"]')
  ?.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.getElementById("audiences");
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

// Keep only one FAQ open at a time.
const faqs = document.querySelectorAll(".pf-faq details");
faqs.forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open)
      faqs.forEach((o) => {
        if (o !== d) o.open = false;
      });
  }),
);
