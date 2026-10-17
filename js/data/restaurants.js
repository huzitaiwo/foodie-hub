// Seed data. Same shape as the Firestore collections: restaurants, cuisines, liveKitchens.
export const cuisines = [
  { id: "mediterranean", name: "Mediterranean", tint: "green" },
  { id: "japanese", name: "Japanese", tint: "blue" },
  { id: "mexican", name: "Mexican", tint: "orange" },
  { id: "modern-european", name: "Modern European", tint: "purple" },
  { id: "vegan", name: "Vegan", tint: "sage" },
  { id: "breakfast", name: "Breakfast", tint: "sand" },
];

export const restaurants = [
  {
    id: "sunroom-kitchen",
    name: "Sunroom Kitchen",
    cuisineId: "mediterranean",
    cuisine: "Mediterranean",
    price: "££",
    tagline: "Seasonal plates, bright flavours",
    etaMin: 22,
    status: "open",
    reviewCount: 0,
    featured: true,
    image: "assets/images/sunroom-kitchen.jpg",
    imageAlt: "Seasonal Mediterranean plates and shared bowls",
  },
  {
    id: "maki-house",
    name: "Maki House",
    cuisineId: "japanese",
    cuisine: "Japanese",
    price: "£££",
    tagline: "Handrolls and comforting bowls",
    etaMin: 28,
    status: "open",
    reviewCount: 0,
    featured: true,
    image: "assets/images/maki-house.png",
    imageAlt: "A chef plating seared salmon with asparagus",
  },
  {
    id: "field-and-flame",
    name: "Field & Flame",
    cuisineId: "modern-european",
    cuisine: "Modern European",
    price: "£££",
    tagline: "Wood-fired favourites, done simply",
    etaMin: 31,
    status: "preorder",
    reviewCount: 0,
    featured: true,
    image: "assets/images/field-and-flame.png",
    imageAlt: "A stacked cheeseburger on a dark plate",
  },
  {
    id: "casa-cielo",
    name: "Casa Cielo",
    cuisineId: "mexican",
    cuisine: "Mexican",
    price: "££",
    tagline: "Slow-cooked classics, late-night energy",
    etaMin: 24,
    status: "open",
    reviewCount: 0,
    featured: true,
    image: "assets/images/casa-cielo.jpg",
    imageAlt: "Tacos and sushi-style shared plates",
  },
];

// Kitchens connected to the live backend. Copied from the original page; remove or rename as you like.
export const liveKitchens = [
  {
    id: "foodie-kitchen-test",
    name: "Foodie Kitchen — Test",
    cuisine: "Modern European",
    etaMin: 25,
  },
];
