import { mountShell } from "./shell.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { toast } from "../ui/toast.js";

await mountShell();

const $ = (id) => document.getElementById(id);
const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];
const settings = workspaceRepo.settings.get();

/* ---------- Opening hours rows ---------- */
$("hours").innerHTML = DAYS.map(
  ([k, name]) => `
  <li class="hours__row">
    <span class="hours__day">${name}</span>
    <label class="switch"><input type="checkbox" role="switch" id="h-${k}-open"><span class="switch__track" aria-hidden="true"></span><span class="sr-only">Open on ${name}</span></label>
    <span class="hours__times">
      <label class="sr-only" for="h-${k}-from">${name} opens</label><input class="input input--time" id="h-${k}-from" type="time">
      <span aria-hidden="true">–</span>
      <label class="sr-only" for="h-${k}-to">${name} closes</label><input class="input input--time" id="h-${k}-to" type="time">
    </span>
    <span class="hours__closed" id="h-${k}-closed">Closed</span>
  </li>`,
).join("");

/* ---------- Fill ---------- */
$("accepting").checked = settings.accepting;
$("pickup").checked = settings.pickup;
$("prep").value = settings.prepMinutes;
$("radius").value = settings.radiusKm;
$("p-name").value = settings.profile.name;
$("p-cuisine").value = settings.profile.cuisine;
$("p-phone").value = settings.profile.phone;
$("p-desc").value = settings.profile.description;

const syncRow = (k) => {
  const open = $(`h-${k}-open`).checked;
  $(`h-${k}-from`).disabled = !open;
  $(`h-${k}-to`).disabled = !open;
  $(`h-${k}-closed`).hidden = open;
  document
    .querySelector(`#h-${k}-from`)
    .closest(".hours__row")
    .classList.toggle("is-closed", !open);
};
DAYS.forEach(([k]) => {
  const h = settings.hours[k];
  $(`h-${k}-open`).checked = h.open;
  $(`h-${k}-from`).value = h.from;
  $(`h-${k}-to`).value = h.to;
  syncRow(k);
  $(`h-${k}-open`).addEventListener("change", () => syncRow(k));
});

/* ---------- Save ---------- */
$("settings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("settings-error");
  const fail = (msg, el) => {
    err.textContent = msg;
    el.focus();
  };

  const name = $("p-name").value.trim();
  const prep = Number($("prep").value);
  const radius = Number($("radius").value);
  if (!name) return fail("Your restaurant needs a name.", $("p-name"));
  if (!(prep >= 5 && prep <= 90))
    return fail(
      "Preparation time should be between 5 and 90 minutes.",
      $("prep"),
    );
  if (!(radius >= 0.5 && radius <= 15))
    return fail(
      "Delivery radius should be between 0.5 and 15 km.",
      $("radius"),
    );

  const hours = {};
  for (const [k, day] of DAYS) {
    const open = $(`h-${k}-open`).checked;
    const from = $(`h-${k}-from`).value;
    const to = $(`h-${k}-to`).value;
    if (open && (!from || !to || from >= to))
      return fail(
        `${day}: closing time needs to be after opening time.`,
        $(`h-${k}-to`),
      );
    hours[k] = { open, from, to };
  }

  err.textContent = "";
  workspaceRepo.settings.save({
    accepting: $("accepting").checked,
    prepMinutes: prep,
    radiusKm: radius,
    pickup: $("pickup").checked,
    profile: {
      name,
      cuisine: $("p-cuisine").value.trim(),
      phone: $("p-phone").value.trim(),
      description: $("p-desc").value.trim(),
    },
    hours,
  });
  toast("Settings saved");
});
