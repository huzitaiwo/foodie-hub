import { restaurantCard, cuisineCard } from "./components.js";
import { initLayout, observe, isFavourite } from "./layout.js";
import { restaurantRepo } from "./services/restaurant-repo.js";

initLayout();

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
        restaurantCard(r, isFavourite(r.id)).replace(
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
