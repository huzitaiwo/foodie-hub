import { auth, firebaseReady } from "../firebase-config.js";

const AUTH_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

let userPromise;
const getUser = () => {
  if (!firebaseReady) return Promise.resolve(null);
  return (userPromise ??= import(AUTH_URL).then(
    ({ onAuthStateChanged }) =>
      new Promise((resolve) => onAuthStateChanged(auth, resolve)),
  ));
};

const MESSAGES = {
  "auth/invalid-credential": "That email and password don’t match.",
  "auth/invalid-email": "That email address doesn’t look right.",
  "auth/email-already-in-use":
    "An account with that email already exists. Try signing in.",
  "auth/weak-password": "Choose a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed":
    "Network problem. Check your connection and try again.",
};

export const authService = {
  enabled: firebaseReady,
  current: getUser,
  explain: (err) =>
    MESSAGES[err?.code] || "Something went wrong. Please try again.",

  /** Workspaces: demo mode lets you in; with Firebase, signed-out visitors are sent to sign in. */
  async requireSession() {
    if (!firebaseReady) return { demo: true };
    const user = await getUser();
    if (!user)
      location.replace(
        `account.html?next=${encodeURIComponent(location.pathname.split("/").pop())}`,
      );
    return { user };
  },

  async signIn(email, password) {
    const { signInWithEmailAndPassword } = await import(AUTH_URL);
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  },

  async signUp({ name, email, password }) {
    const { createUserWithEmailAndPassword, updateProfile } = await import(
      AUTH_URL
    );
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    if (name) await updateProfile(user, { displayName: name });
    return user;
  },

  async signOut() {
    if (firebaseReady) {
      const { signOut } = await import(AUTH_URL);
      await signOut(auth);
    }
    location.href = "index.html";
  },
};
