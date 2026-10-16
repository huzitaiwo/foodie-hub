// UI → this repository → Firestore (or local seed data until Firebase is configured).
import { db, firebaseReady } from "../firebase-config.js";
import {
  restaurants as seedRestaurants,
  cuisines as seedCuisines,
  liveKitchens as seedLive,
} from "../data/restaurants.js";

async function fromFirestore(collectionName) {
  const { collection, getDocs } =
    await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function load(collectionName, seed) {
  if (!firebaseReady) return seed;
  try {
    const rows = await fromFirestore(collectionName);
    return rows.length ? rows : seed;
  } catch (err) {
    console.warn(`[foodie] ${collectionName} failed, using seed data`, err);
    return seed;
  }
}

export const restaurantRepo = {
  getAll: () => load("restaurants", seedRestaurants),
  getFeatured: async () =>
    (await load("restaurants", seedRestaurants)).filter((r) => r.featured),
  getCuisines: () => load("cuisines", seedCuisines),
  getLiveKitchens: () => load("liveKitchens", seedLive),
};
