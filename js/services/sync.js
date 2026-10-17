// Mirrors the customer's account and orders to Firestore. localStorage stays the fast, synchronous cache.
// No Firebase keys → this file does nothing and the app runs on local data.
import { auth, db, firebaseReady } from "../firebase-config.js";
import { store } from "../components.js";

const V = "10.14.1";
const AUTH_URL = `https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`;
const FS_URL = `https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`;

const ACCOUNT = "foodie.account";
const ORDERS = "foodie.orders";
const OWNER = "foodie.sync.uid";

let fs,
  uid = null,
  applying = false,
  timer,
  listening = false;

if (firebaseReady) boot();

async function boot() {
  const [{ onAuthStateChanged }, firestore] = await Promise.all([
    import(AUTH_URL),
    import(FS_URL),
  ]);
  fs = firestore;
  onAuthStateChanged(auth, (user) => (user ? attach(user) : detach()));
}

const clean = (o) => JSON.parse(JSON.stringify(o)); // Firestore rejects undefined values

async function attach(user) {
  uid = user.uid;

  // A different person's cache must never leak into this account.
  if (store.get(OWNER, null) !== uid) {
    store.set(ACCOUNT, null);
    store.set(ORDERS, []);
    store.set(OWNER, uid);
  }

  try {
    const { doc, getDoc, collection, query, where, getDocs } = fs;

    // Account
    const snap = await getDoc(doc(db, "users", uid));
    applying = true;
    if (snap.exists()) {
      const d = snap.data();
      const local = store.get(ACCOUNT, {}) || {};
      store.set(ACCOUNT, {
        ...local,
        profile: d.profile,
        addresses: d.addresses || [],
        preferences: d.preferences,
        profileSaved: !!d.profileSaved,
        orders: local.orders || [],
      });
    } else {
      const [first = "", ...rest] = (user.displayName || "").split(" ");
      store.set(ACCOUNT, {
        profileSaved: false,
        profile: {
          firstName: first,
          lastName: rest.join(" "),
          email: user.email || "",
          mobile: "",
        },
        addresses: [],
        preferences: { vegetarian: false, contactless: false, updates: false },
        orders: [],
      });
      queueMicrotask(pushAccount);
    }
    window.dispatchEvent(new CustomEvent("account:change"));
    applying = false;

    // Orders
    const orders = await getDocs(
      query(collection(db, "orders"), where("uid", "==", uid)),
    );
    const rows = orders.docs
      .map((d) => d.data())
      .sort((a, b) => b.placedAt - a.placedAt);
    store.set(ORDERS, rows);
    window.dispatchEvent(new CustomEvent("account:change"));
  } catch (err) {
    applying = false;
    console.warn(
      "[sync] couldn’t load your data, continuing with this device’s copy.",
      err,
    );
  }

  if (!listening) {
    listening = true;
    window.addEventListener("account:change", () => {
      if (!applying) {
        clearTimeout(timer);
        timer = setTimeout(pushAccount, 400);
      }
    });
    window.addEventListener("order:placed", (e) => pushOrder(e.detail));
  }
}

function detach() {
  if (store.get(OWNER, null)) {
    store.set(ACCOUNT, null);
    store.set(ORDERS, []);
    store.set(OWNER, null);
  }
  uid = null;
}

async function pushAccount() {
  if (!uid) return;
  const { doc, setDoc, serverTimestamp } = fs;
  const a = store.get(ACCOUNT, null);
  if (!a) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      clean({
        profile: a.profile,
        addresses: a.addresses,
        preferences: a.preferences,
        profileSaved: !!a.profileSaved,
      }) && {
        ...clean({
          profile: a.profile,
          addresses: a.addresses,
          preferences: a.preferences,
          profileSaved: !!a.profileSaved,
        }),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn("[sync] account not saved", err);
  }
}

async function pushOrder(order) {
  if (!uid || !order) return;
  const { doc, setDoc } = fs;
  try {
    // Order numbers come from a local counter, so the document id is scoped to the customer.
    await setDoc(
      doc(db, "orders", `${uid}_${order.id}`),
      clean({ ...order, uid }),
    );
  } catch (err) {
    console.warn("[sync] order not saved", err);
  }
}
