// Menus keyed by restaurant id. Same shape as Firestore: restaurants/{id}/menu (sections → items).
// Modifier groups: type "single" (radio) or "multi" (checkbox). Prices in integer pence.
const size = {
  id: "size",
  title: "Size",
  type: "single",
  required: true,
  options: [
    { id: "reg", name: "Regular", pricePence: 0 },
    { id: "lrg", name: "Large", pricePence: 150 },
  ],
};
const extras = {
  id: "extras",
  title: "Extras",
  type: "multi",
  max: 3,
  options: [
    { id: "ex1", name: "Extra sauce", pricePence: 60 },
    { id: "ex2", name: "Side salad", pricePence: 180 },
    { id: "ex3", name: "Crispy onions", pricePence: 90 },
  ],
};

export const menus = {
  "sunroom-kitchen": [
    {
      id: "starters",
      title: "Small plates",
      items: [
        {
          id: "sk-flatbread",
          name: "Charred flatbread",
          desc: "Whipped feta, honey, thyme.",
          pricePence: 650,
          tags: ["Vegetarian"],
        },
        {
          id: "sk-soup",
          name: "Roasted tomato soup",
          desc: "Basil oil and sourdough soldiers.",
          pricePence: 590,
          tags: ["Vegetarian"],
        },
      ],
    },
    {
      id: "mains",
      title: "Mains",
      items: [
        {
          id: "sk-bowl",
          name: "Harvest grain bowl",
          desc: "Roasted squash, farro, tahini, pomegranate.",
          pricePence: 1150,
          tags: ["Vegetarian", "Popular"],
          modifiers: [size, extras],
        },
        {
          id: "sk-chicken",
          name: "Herb-roast chicken",
          desc: "Lemon jus, crushed potatoes, greens.",
          pricePence: 1450,
          modifiers: [extras],
        },
        {
          id: "sk-salmon",
          name: "Miso salmon",
          desc: "Sesame greens and steamed rice.",
          pricePence: 1595,
          tags: ["Popular"],
        },
      ],
    },
    {
      id: "sweet",
      title: "Something sweet",
      items: [
        {
          id: "sk-tart",
          name: "Lemon tart",
          desc: "Crisp pastry, soft curd, cream.",
          pricePence: 550,
          tags: ["Vegetarian"],
        },
      ],
    },
  ],
  "maki-house": [
    {
      id: "rolls",
      title: "Rolls",
      items: [
        {
          id: "mh-salmon",
          name: "Salmon avocado roll",
          desc: "Eight pieces, pickled ginger, wasabi.",
          pricePence: 950,
          tags: ["Popular"],
          modifiers: [extras],
        },
        {
          id: "mh-veg",
          name: "Garden roll",
          desc: "Cucumber, carrot, avocado, sesame.",
          pricePence: 790,
          tags: ["Vegetarian"],
        },
      ],
    },
    {
      id: "hot",
      title: "Hot dishes",
      items: [
        {
          id: "mh-ramen",
          name: "Miso ramen",
          desc: "Rich broth, noodles, soft egg, greens.",
          pricePence: 1290,
          modifiers: [size],
        },
        {
          id: "mh-gyoza",
          name: "Pan-fried gyoza",
          desc: "Six pieces with ponzu.",
          pricePence: 690,
        },
      ],
    },
  ],
  default: [
    {
      id: "popular",
      title: "Popular",
      items: [
        {
          id: "d-signature",
          name: "House signature plate",
          desc: "The kitchen’s most-ordered dish.",
          pricePence: 1250,
          tags: ["Popular"],
          modifiers: [size, extras],
        },
        {
          id: "d-veg",
          name: "Seasonal vegetable plate",
          desc: "Whatever is best at the market today.",
          pricePence: 1050,
          tags: ["Vegetarian"],
        },
      ],
    },
    {
      id: "sides",
      title: "Sides & sweets",
      items: [
        {
          id: "d-fries",
          name: "Skin-on fries",
          desc: "Sea salt, rosemary.",
          pricePence: 450,
          tags: ["Vegetarian"],
        },
        {
          id: "d-dessert",
          name: "Dessert of the day",
          desc: "Ask the kitchen.",
          pricePence: 550,
        },
      ],
    },
  ],
};
