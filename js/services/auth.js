import { auth, firebaseReady } from "../firebase-config.js";

const AUTH_URL = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

export const authService = {
  /** Demo mode (no Firebase keys yet) lets you in. With Firebase, unauthenticated visitors go to sign in. */
  async requireSession() {
    if (!firebaseReady) return { demo: true };
    const { onAuthStateChanged } = await import(AUTH_URL);
    return new Promise((resolve) =>
      onAuthStateChanged(auth, (user) => {
        if (!user)
          location.replace(
            `account.html?next=${encodeURIComponent(location.pathname.split("/").pop())}`,
          );
        else resolve({ user });
      }),
    );
  },

  async signOut() {
    if (firebaseReady) {
      const { signOut } = await import(AUTH_URL);
      await signOut(auth);
    }
    location.href = "index.html";
  },
};
