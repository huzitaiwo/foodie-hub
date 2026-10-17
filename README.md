# Foodie

A food-delivery marketplace built with plain **HTML, CSS and JavaScript** (ES modules, no framework, no build step), with a Firebase backend that switches on when you add your keys. It is a portfolio recreation of a Manus-generated product, with the design, interactions and animations rebuilt by hand.

Designed and built by **Handsome**.

## What's inside

| Area                 | Pages                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Customer             | `index.html`, `restaurants.html`, `restaurant.html`, `basket.html`, `checkout.html`, `track.html`, `account.html`                  |
| Marketing            | `platform.html`                                                                                                                    |
| Restaurant workspace | `workspace.html` (overview), `workspace-orders.html`, `workspace-menu.html`, `workspace-analytics.html`, `workspace-settings.html` |
| Delivery workspace   | `delivery.html` (today), `delivery-deliveries.html`, `delivery-earnings.html`, `delivery-profile.html`                             |

Highlights: URL-synced restaurant filters, menu with customisation dialogs, a basket that handles items from different restaurants, multi-section checkout with validation, live order tracking, a full account area, order management for kitchens, analytics charts, and a delivery-partner job flow.

## Run it

The site uses ES modules, so it must be served over HTTP. Opening the files with `file://` will not work.

- **VS Code:** install _Live Server_, right-click `index.html` → _Open with Live Server_.
- **Terminal:** `npx serve .` or `python3 -m http.server 5500`, then open `http://localhost:5500`.

With no Firebase keys the app runs in **demo mode**: data comes from seed files and `localStorage`, and the workspaces are open to everyone.

## Project structure

```
index.html … platform.html      Pages (all at the root)
firestore.rules                 Firestore security rules
images/                         Your images (restaurants/, menu/, …)
css/
  tokens.css                    Colours, type, spacing, radii, shadows
  base.css                      Reset, typography, utilities
  components.css                Shared components (buttons, header, footer, cards,
                                dialogs, form fields, switch, toast, summary…)
  home.css  discover.css  basket.css  restaurant.css  checkout.css
  track.css  account.css  platform.css  workspace.css  delivery.css
js/
  components.js                 Icon sprite, header/footer injection, shared templates
  layout.js                     Page boot: layout, reveal-on-scroll, location dialog
  firebase-config.js            Firebase keys (the only file you edit to connect)
  services/                     Repository layer: UI → service → data source
    restaurant-repo  menu-repo  basket  order-repo  account-repo
    workspace-repo   delivery-repo  auth  sync
  data/                         Seed data (used when Firebase is off)
  workspace/  delivery/         Page scripts and templates for each workspace
  ui/toast.js                   Toast notifications
  utils/format.js               Money formatting (integer pence → GBP)
  main.js basket.js restaurants.js restaurant.js checkout.js track.js account.js platform.js
```

### How it's organised

- **Components are written once.** Anything used on more than one page (cards, dialogs, form fields, switches, the order summary) lives in `components.css` and a template in `components.js`. Pages only add what's unique to them.
- **Repository pattern.** Pages never touch storage directly: UI → `services/*` → data source. Swapping a data source for Firestore changes the service, not the page.
- **Money is stored as integer pence** and formatted with `Intl.NumberFormat` (GBP).
- **Design tokens.** Fonts are DM Serif Display and DM Sans; the brand colours (ink, cream, yellow, green) are CSS custom properties in `tokens.css`. The delivery workspace swaps one accent variable.
- **Light theme only.**

## Connect Firebase (optional)

1. Create a Firebase project. Enable **Authentication → Email/Password** and create a **Firestore** database.
2. Add a Web app and paste its config into `js/firebase-config.js`. When keys are present, `firebaseReady` becomes `true`.
3. Publish the rules in `firestore.rules`.
4. Add your domain under **Authentication → Settings → Authorized domains**.

What changes once connected:

- `account.html` shows sign in / create account to signed-out visitors (`?mode=signup` and `?next=page.html` are supported). The workspaces redirect there when signed out.
- `js/services/sync.js` mirrors the customer's **profile, addresses, preferences and orders** to Firestore, and loads them on sign-in. `localStorage` stays the fast local cache and is cleared on sign-out.

### Data model

| Path                              | Contents                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `users/{uid}`                     | `profile`, `addresses[]`, `preferences`, `profileSaved`                                        |
| `orders/{uid}_{orderId}`          | customer order: lines, totals, address, contact, payment method, status, `uid`, `restaurantId` |
| `restaurants/{id}`                | restaurant details plus `ownerUid` (public read, owner write)                                  |
| `restaurants/{id}/menu/{itemId}`  | menu items                                                                                     |
| `restaurants/{id}/settings/{doc}` | opening hours and preferences (owner only)                                                     |
| `drivers/{uid}/…`                 | a delivery partner's profile and jobs (owner only)                                             |

### Local storage keys (demo mode)

`foodie.basket`, `foodie.location`, `foodie.favourites`, `foodie.account`, `foodie.orders`, `foodie.ws.orders`, `foodie.ws.menu`, `foodie.ws.settings`, `foodie.dp.state`, `foodie.dp.driver`.

## Accessibility

Skip links, semantic landmarks, visible focus, labelled forms with inline errors (`role="alert"`), native `<dialog>` for modals, `role="switch"` toggles, radiogroups, live regions for status changes, tables with text alternatives for charts, no colour-only state, and `prefers-reduced-motion` respected throughout.

## Known limitations

- **Payments are a demo.** Card details are validated in the browser and never stored. A live version needs a payment provider (e.g. Stripe) and a Cloud Function that creates the order after payment succeeds.
- **Tracking is simulated.** Order stages advance on a timer (`STAGES` in `js/services/order-repo.js`) and the route is an illustration, not GPS.
- **Workspaces are local-only for now.** The restaurant and delivery workspaces still read and write `localStorage`. Their Firestore rules already exist; the sync for them is not built yet.
- **Restaurants and menus come from seed files** (`js/data/`). Add `restaurants/{id}` documents to move them to Firestore.
- **Adapters.** `js/restaurant.js` and `js/checkout.js` contain a small adapter each (`toBasketLine`, `readBasket`) that map to the basket's stored shape. If you change the basket service, adjust those two spots.
- **Images** are referenced by path (`images/restaurants/{id}.jpg`, `images/menu/{item-id}.jpg`) and hide themselves if a file is missing.

## Roadmap

- Sync the restaurant and delivery workspaces to Firestore.
- Real payments through a provider and a server function.
- Real-time order status with Firestore listeners instead of the timer.
- Search suggestions, reviews and ratings.
- Unit tests for the repository layer.

## Licence

© Handsome. Made for portfolio purposes. Not affiliated with any real restaurant or delivery company.
