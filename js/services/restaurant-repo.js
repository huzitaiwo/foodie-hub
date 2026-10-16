// UI → this repository → Firestore (or local seed data until Firebase is configured).
import { db, firebaseReady } from "../firebase-config.js";
import {
  restaurants as seedRestaurants,
  cuisines as seedCuisines,
} from "../data/restaurants.js";

async function fromFirestore(collectionName, build) {
  const { collection, getDocs, query } =
    await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
  const snap = await getDocs(
    build
      ? build(collection(db, collectionName), query)
      : collection(db, collectionName),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function load(collectionName, seed, build) {
  if (!firebaseReady) return seed;
  try {
    const rows = await fromFirestore(collectionName, build);
    return rows.length ? rows : seed; // empty collection → fall back to seed
  } catch (err) {
    console.warn(`[foodie] ${collectionName} failed, using seed data`, err);
    return seed;
  }
}

export const restaurantRepo = {
  getFeatured: async () =>
    (await load("restaurants", seedRestaurants)).filter((r) => r.featured),
  getCuisines: () => load("cuisines", seedCuisines),
};
