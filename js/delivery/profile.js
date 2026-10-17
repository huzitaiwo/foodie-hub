import { mountShell } from "../workspace/shell.js";
import { deliveryRepo } from "../services/delivery-repo.js";
import { toast } from "../ui/toast.js";
import { bindStatus } from "./templates.js";

await mountShell();
bindStatus();

const $ = (id) => document.getElementById(id);
const d = deliveryRepo.driver.get();

$("d-name").value = d.name;
$("d-phone").value = d.phone;
$("d-vehicle").value = d.vehicle;
$("d-area").value = d.area;
$("d-alerts").checked = d.alerts;

$("profile-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("profile-error");
  const name = $("d-name").value.trim();
  const phone = $("d-phone").value.trim();
  const area = $("d-area").value.trim();

  if (!name) {
    err.textContent = "Add the name customers and restaurants will see.";
    return $("d-name").focus();
  }
  if (phone && !/^[+\d][\d\s()-]{6,}$/.test(phone)) {
    err.textContent = "That phone number doesn’t look right.";
    return $("d-phone").focus();
  }
  if (!area) {
    err.textContent = "Tell us where you’ll be delivering.";
    return $("d-area").focus();
  }

  err.textContent = "";
  deliveryRepo.driver.save({
    name,
    phone,
    vehicle: $("d-vehicle").value,
    area,
    alerts: $("d-alerts").checked,
  });
  toast("Profile saved");
});
