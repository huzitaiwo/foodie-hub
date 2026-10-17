import { initLayout } from "./layout.js";
import { authService } from "./services/auth.js";
import { accountRepo } from "./services/account-repo.js";
import { emptyState, escapeHtml, icon } from "./components.js";
import { formatPrice } from "./utils/format.js";
import { toast } from "./ui/toast.js";

initLayout();

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const user = await authService.current();

if (authService.enabled && !user) showAuth();
else showDashboard(user);

/* ======================= Sign in / create account ======================= */
function showAuth() {
  $("auth-view").hidden = false;
  let mode = params.get("mode") === "signup" ? "signup" : "signin";

  const paint = () => {
    const signup = mode === "signup";
    $("auth-eyebrow").textContent = signup ? "Join Foodie" : "Welcome back";
    $("auth-title").textContent = signup ? "Create your account." : "Sign in.";
    $("auth-submit").textContent = signup ? "Create account" : "Sign in";
    $("auth-name-field").hidden = !signup;
    $("auth-password").autocomplete = signup
      ? "new-password"
      : "current-password";
    $("auth-switch-text").textContent = signup
      ? "Already have an account?"
      : "New to Foodie?";
    $("auth-switch").textContent = signup ? "Sign in" : "Create an account";
    $("auth-error").textContent = "";
  };
  paint();
  $("auth-switch").addEventListener("click", () => {
    mode = mode === "signup" ? "signin" : "signup";
    paint();
  });

  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("auth-error");
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      err.textContent = "That email address doesn’t look right.";
      return $("auth-email").focus();
    }
    if (password.length < 6) {
      err.textContent = "Choose a password with at least 6 characters.";
      return $("auth-password").focus();
    }

    const btn = $("auth-submit");
    btn.disabled = true;
    try {
      if (mode === "signup")
        await authService.signUp({
          name: $("auth-name").value.trim(),
          email,
          password,
        });
      else await authService.signIn(email, password);
      const next = params.get("next");
      location.replace(
        /^[\w-]+\.html$/.test(next || "") ? next : "account.html",
      );
    } catch (error) {
      err.textContent = authService.explain(error);
      btn.disabled = false;
    }
  });
}

/* ============================== Dashboard =============================== */
function showDashboard(user) {
  $("dash-view").hidden = false;
  const TABS = ["orders", "profile", "addresses", "preferences"];
  const TITLES = {
    orders: "Orders",
    profile: "Profile",
    addresses: "Addresses",
    preferences: "Preferences",
  };

  /* ---- Tabs (real links, enhanced) ---- */
  const tabFromUrl = () => {
    const t = new URLSearchParams(location.search).get("tab");
    return TABS.includes(t) ? t : "orders";
  };
  const showTab = (tab, push = false) => {
    TABS.forEach((t) => {
      $(`panel-${t}`).hidden = t !== tab;
      const link = document.querySelector(`[data-tab="${t}"]`);
      t === tab
        ? link.setAttribute("aria-current", "page")
        : link.removeAttribute("aria-current");
    });
    if (push)
      history.pushState(
        null,
        "",
        tab === "orders" ? "account.html" : `?tab=${tab}`,
      );
    document.title = `${TITLES[tab]} — Your account · Foodie`;
  };
  document.querySelector(".account-nav").addEventListener("click", (e) => {
    const link = e.target.closest("[data-tab]");
    if (!link) return;
    e.preventDefault();
    showTab(link.dataset.tab, true);
  });
  window.addEventListener("popstate", () => showTab(tabFromUrl()));

  /* ---- Hello ---- */
  const profile = () => accountRepo.profile.get(user);
  const setHello = () =>
    ($("hello-name").textContent = profile().firstName || "there");

  /* ---- Orders ---- */
  const whenLabel = (ts) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days < 1) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7)
      return `Last ${new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(ts)}`;
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
    }).format(ts);
  };

  const liveCopy = {
    at_restaurant: {
      title: "Your food is ready.",
      text: (o) =>
        `${o.restaurant} has your order ready. Your delivery partner is collecting it.`,
      steps: ["done", "current", "upcoming"],
    },
    collected: {
      title: "Your food is moving.",
      text: (o) => `Delivery partner ${o.driver} has collected your order.`,
      steps: ["done", "done", "current"],
    },
    on_the_way: {
      title: "Your food is moving.",
      text: (o) => `Delivery partner ${o.driver} is on the way to you.`,
      steps: ["done", "done", "current"],
    },
    delivered: {
      title: "Delivered. Enjoy.",
      text: (o) => `Your order from ${o.restaurant} has arrived.`,
      steps: ["done", "done", "done"],
    },
  };
  const STEP_LABELS = ["Accepted", "Collected", "On its way"];
  const STATE_WORD = {
    done: "Done",
    current: "In progress",
    upcoming: "Coming up",
  };

  const liveCard = (o) => {
    const copy = liveCopy[o.status];
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(o.updatedAt);
    return `
    <section class="live-order" aria-labelledby="live-title">
      <div class="live-order__top">
        <div>
          <p class="eyebrow eyebrow--accent">${o.status === "delivered" ? "Order" : "Live order"} · #${escapeHtml(o.id)}</p>
          <h2 class="live-order__title" id="live-title">${copy.title}</h2>
          <p class="live-order__text">${escapeHtml(copy.text(o))}</p>
        </div>
        <a class="live-order__time" href="track.html?id=${encodeURIComponent(o.id)}">${icon("bike")} At ${time} · Track</a>
      </div>
      <ol class="live-steps">
        ${STEP_LABELS.map(
          (label, i) => `
          <li class="live-step live-step--${copy.steps[i]}">
            <span class="live-step__dot" aria-hidden="true">${icon("check")}</span>
            <span>${label}<span class="sr-only"> — ${STATE_WORD[copy.steps[i]]}</span></span>
          </li>`,
        ).join("")}
      </ol>
    </section>`;
  };

  const reorderHref = (o) =>
    `restaurant.html?id=${encodeURIComponent(o.restaurantId)}&reorder=${encodeURIComponent(o.id)}`;

  const renderOrders = () => {
    const live = accountRepo.liveOrder();
    $("live").innerHTML = live ? liveCard(live) : "";

    const rows = accountRepo.orders();
    $("previous-title").hidden = !rows.length && !!live;
    $("orders-list").innerHTML = rows.length
      ? rows
          .map(
            (o) => `
          <li class="past-order">
            <span class="past-order__icon" aria-hidden="true">${icon("utensils")}</span>
            <div class="past-order__main">
              <p class="past-order__name">${escapeHtml(o.restaurant)}</p>
              <p class="past-order__meta">${whenLabel(o.placedAt)} · Delivered</p>
            </div>
            <div class="past-order__side">
              <span class="past-order__price">${formatPrice(o.totalPence)}</span>
              <a class="link-action" href="${reorderHref(o)}">Order again<span class="sr-only"> from ${escapeHtml(o.restaurant)}</span></a>
            </div>
          </li>`,
          )
          .join("")
      : live
        ? ""
        : `<li>${emptyState({ icon: "box", title: "No orders yet.", text: "When you order, you’ll see it here, live, from kitchen to doorstep.", ctaLabel: "Find dinner", ctaHref: "restaurants.html" })}</li>`;

    $("order-again-top").href = rows[0]
      ? reorderHref(rows[0])
      : "restaurants.html";
  };

  /* ---- Profile ---- */
  const fillProfile = () => {
    const p = profile();
    $("p-first").value = p.firstName;
    $("p-last").value = p.lastName;
    $("p-email").value = p.email;
    $("p-mobile").value = p.mobile;
    $("p-email").readOnly = !!user; // Firebase email changes need re-authentication
    $("email-hint").hidden = !user;
  };
  $("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("profile-error");
    const first = $("p-first").value.trim();
    const email = $("p-email").value.trim();
    const mobile = $("p-mobile").value.trim();
    if (!first) {
      err.textContent = "Add your first name.";
      return $("p-first").focus();
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      err.textContent = "That email address doesn’t look right.";
      return $("p-email").focus();
    }
    if (mobile && !/^[+\d][\d\s()-]{6,}$/.test(mobile)) {
      err.textContent = "That mobile number doesn’t look right.";
      return $("p-mobile").focus();
    }
    err.textContent = "";
    accountRepo.profile.save({
      firstName: first,
      lastName: $("p-last").value.trim(),
      email,
      mobile,
    });
    setHello();
    toast("Profile saved");
  });

  /* ---- Addresses ---- */
  const addressDialog = $("address-dialog");
  const deleteDialog = $("delete-dialog");
  let editingId = null;

  const renderAddresses = () => {
    const list = accountRepo.addresses.list();
    $("address-list").innerHTML = list.length
      ? list
          .map(
            (a) => `
          <li class="address${a.isDefault ? " is-default" : ""}">
            <span class="address__icon" aria-hidden="true">${icon(a.label === "Work" ? "bag" : a.label === "Other" ? "pin" : "home")}</span>
            <div class="address__body">
              <p class="address__label">${escapeHtml(a.label)}${a.isDefault && list.length > 1 ? '<span class="tag">Default</span>' : ""}</p>
              <p class="address__line">${escapeHtml(a.line)}</p>
              ${a.instructions ? `<p class="address__notes">${escapeHtml(a.instructions)}</p>` : ""}
            </div>
            <button class="link-action" type="button" data-act="edit-address" data-id="${escapeHtml(a.id)}">Edit<span class="sr-only"> ${escapeHtml(a.label)} address</span></button>
          </li>`,
          )
          .join("")
      : `<li>${emptyState({ icon: "pin", title: "No saved addresses yet.", text: "Add one so checkout takes a single tap.", ctaLabel: "Add an address", ctaAct: "add-address" })}</li>`;
  };

  const openAddress = (id = null) => {
    editingId = id;
    const a = id ? accountRepo.addresses.list().find((x) => x.id === id) : null;
    $("address-title").textContent = a ? "Edit address" : "Add an address";
    addressDialog.querySelector(
      `input[name="label"][value="${a?.label || "Home"}"]`,
    ).checked = true;
    $("a-line").value = a?.line ?? "";
    $("a-notes").value = a?.instructions ?? "";
    $("a-default").checked = a
      ? a.isDefault
      : accountRepo.addresses.list().length === 0;
    $("a-default").disabled = !!a?.isDefault; // can't un-default; pick another address as default instead
    $("a-delete").hidden = !a;
    $("address-error").textContent = "";
    addressDialog.showModal();
    $("a-line").focus();
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    if (el.dataset.act === "add-address") openAddress();
    if (el.dataset.act === "edit-address") openAddress(el.dataset.id);
  });

  $("address-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const line = $("a-line").value.trim();
    if (line.length < 6) {
      $("address-error").textContent =
        "Enter the full address, including postcode.";
      return $("a-line").focus();
    }
    accountRepo.addresses.save({
      id: editingId || undefined,
      label: addressDialog.querySelector('input[name="label"]:checked').value,
      line,
      instructions: $("a-notes").value.trim(),
      isDefault: $("a-default").checked,
    });
    addressDialog.close();
    toast(editingId ? "Address updated" : "Address saved");
  });
  $("a-cancel").addEventListener("click", () => addressDialog.close());
  $("a-delete").addEventListener("click", () => {
    const a = accountRepo.addresses.list().find((x) => x.id === editingId);
    $("delete-text").textContent =
      `“${a.label} — ${a.line}” will be removed from your saved addresses.`;
    deleteDialog.showModal();
  });
  deleteDialog.addEventListener("close", () => {
    if (deleteDialog.returnValue !== "confirm") return;
    accountRepo.addresses.remove(editingId);
    addressDialog.close();
    toast("Address deleted");
  });
  [addressDialog, deleteDialog].forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close("cancel");
    }),
  );

  /* ---- Preferences ---- */
  const fillPrefs = () => {
    const p = accountRepo.preferences.get();
    $("pref-vegetarian").checked = p.vegetarian;
    $("pref-contactless").checked = p.contactless;
    $("pref-updates").checked = p.updates;
  };
  $("prefs-form").addEventListener("submit", (e) => {
    e.preventDefault();
    accountRepo.preferences.save({
      vegetarian: $("pref-vegetarian").checked,
      contactless: $("pref-contactless").checked,
      updates: $("pref-updates").checked,
    });
    toast("Preferences saved");
  });

  /* ---- Boot + live updates ---- */
  setHello();
  fillProfile();
  fillPrefs();
  renderOrders();
  renderAddresses();
  showTab(tabFromUrl());

  window.addEventListener("delivery:change", renderOrders); // same tab
  window.addEventListener("storage", (e) => {
    if (e.key === "foodie.dp.state") renderOrders();
  }); // delivery workspace in another tab
  window.addEventListener("account:change", () => {
    renderOrders();
    renderAddresses();
  });
}
