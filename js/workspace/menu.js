import { mountShell } from "./shell.js";
import { workspaceRepo } from "../services/workspace-repo.js";
import { emptyState, escapeHtml } from "../components.js";
import { formatPrice } from "../utils/format.js";
import { toast } from "../ui/toast.js";

await mountShell();

const $ = (id) => document.getElementById(id);
const menu = workspaceRepo.menu;
const body = $("menu-body");
const card = $("table-card");
const empty = $("menu-empty");
const itemDialog = $("item-dialog");
const itemForm = $("item-form");
const deleteDialog = $("delete-dialog");
let editingId = null;
let deletingId = null;

function render() {
  const items = menu.list();
  card.hidden = !items.length;
  empty.hidden = !!items.length;
  if (!items.length) {
    empty.innerHTML = emptyState({
      icon: "list",
      title: "Your menu is empty.",
      text: "Add your first dish and customers can order it straight away.",
      ctaLabel: "Add item",
      ctaAct: "add",
    });
    return;
  }
  body.innerHTML = items
    .map((i) => {
      const name = escapeHtml(i.name);
      return `
    <tr data-id="${escapeHtml(i.id)}">
      <th scope="row">
        <span class="cell-name">${name}</span>
        <button class="link-btn" type="button" data-act="edit" data-id="${escapeHtml(i.id)}" aria-label="Edit details for ${name}">Edit details</button>
      </th>
      <td>${escapeHtml(i.category)}</td>
      <td class="cell-price">${formatPrice(i.pricePence)}</td>
      <td>
        <div class="controls">
          <button class="chip ${i.live ? "chip--live" : "chip--hidden"}" type="button" data-act="toggle" data-id="${escapeHtml(i.id)}" aria-pressed="${i.live}" aria-label="Visible to customers: ${name}">${i.live ? "Live" : "Hidden"}</button>
          <button class="chip chip--delete" type="button" data-act="delete" data-id="${escapeHtml(i.id)}" aria-label="Delete ${name}">Delete</button>
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

function openForm(id = null) {
  editingId = id;
  const item = id ? menu.list().find((i) => i.id === id) : null;
  $("item-title").textContent = item ? "Edit item" : "Add item";
  $("item-name").value = item?.name ?? "";
  $("item-category").value = item?.category ?? "";
  $("item-price").value = item ? (item.pricePence / 100).toFixed(2) : "";
  $("item-desc").value = item?.description ?? "";
  $("item-error").textContent = "";
  $("category-list").innerHTML = menu
    .categories()
    .map((c) => `<option value="${escapeHtml(c)}">`)
    .join("");
  itemDialog.showModal();
  $("item-name").focus();
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "add":
      openForm();
      break;
    case "edit":
      openForm(id);
      break;
    case "toggle": {
      const item = menu.toggleLive(id);
      toast(
        `${item.name} is now ${item.live ? "live" : "hidden from customers"}`,
      );
      break;
    }
    case "delete": {
      deletingId = id;
      $("delete-text").textContent =
        `“${menu.list().find((i) => i.id === id).name}” will be removed from your menu. Customers won’t be able to order it.`;
      deleteDialog.showModal();
      break;
    }
  }
});

itemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(itemForm);
  const name = data.get("name").trim();
  const category = data.get("category").trim();
  const price = parseFloat(data.get("price"));
  const err = $("item-error");

  if (!name)
    return (
      (err.textContent = "Give the item a name."),
      $("item-name").focus()
    );
  if (!category)
    return (
      (err.textContent = "Choose or type a category."),
      $("item-category").focus()
    );
  if (!(price > 0))
    return (
      (err.textContent = "Enter a price above £0."),
      $("item-price").focus()
    );

  menu.save({
    id: editingId || undefined,
    name,
    category,
    pricePence: Math.round(price * 100),
    description: data.get("description").trim(),
  });
  itemDialog.close();
  toast(editingId ? `${name} updated` : `${name} added to your menu`);
});

itemForm
  .querySelector("[data-close]")
  .addEventListener("click", () => itemDialog.close());
deleteDialog.addEventListener("close", () => {
  if (deleteDialog.returnValue !== "confirm" || !deletingId) return;
  const name = menu.list().find((i) => i.id === deletingId)?.name;
  menu.remove(deletingId);
  toast(`${name} deleted`);
  deletingId = null;
});
[itemDialog, deleteDialog].forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close("cancel");
  }),
);

window.addEventListener("workspace:menu", render);
render();
