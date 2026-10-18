import { checkRecord, rules } from "./validators.js";
import { compile, highlight, matches } from "./search.js";
import { load, save, loadSettings, saveSettings, checkImport } from "./storage.js";

const $ = (id) => document.getElementById(id);
let records = load();
let settings = loadSettings();
let sortKey = "date";
let sortDir = -1;

const dayKey = (date) => {
  const n = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${n(date.getMonth() + 1)}-${n(date.getDate())}`;
};

const money = (amount) => `${settings.base} ${Number(amount).toFixed(2)}`;

function nextId() {
  const max = records.reduce((top, row) => Math.max(top, Number(String(row.id).replace(/\D/g, "")) || 0), 0);
  return `txn_${String(max + 1).padStart(4, "0")}`;
}

function fillCategories() {
  const select = $("category");
  const current = select.value;

  select.replaceChildren();
  settings.categories.forEach((name) => {
    const option = document.createElement("option");
    option.textContent = name;
    option.value = name;
    select.appendChild(option);
  });

  if (settings.categories.includes(current)) {
    select.value = current;
  }
}

function showSettings() {
  $("base").value = settings.base;
  $("eur").value = settings.rates.EUR;
  $("gbp").value = settings.rates.GBP;
  $("cap").value = settings.cap;
  $("cats").value = settings.categories.join("\n");
}

function clearForm() {
  $("txn").reset();
  $("date").value = dayKey(new Date());
  $("save").textContent = "Save";
  $("form-title").textContent = "Add a transaction";
}

function render() {
  const found = compile($("q").value, $("ci").checked);
  $("qerr").textContent = found.error;
  const rows = records.filter((row) => matches(row, found.re)).sort((a, b) => {
    if (sortKey === "amount") return (a.amount - b.amount) * sortDir;
    return String(a[sortKey]).localeCompare(String(b[sortKey])) * sortDir;
  });

  $("rows").innerHTML = rows.map((row) => `
    <tr>
      <td data-label="Date">${row.date}</td>
      <td data-label="Description">${highlight(row.description, found.re)}</td>
      <td data-label="Amount">${highlight(Number(row.amount).toFixed(2), found.re)}</td>
      <td data-label="Category">${highlight(row.category, found.re)}</td>
      <td data-label="Actions">
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Delete</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5">No records yet.</td></tr>`;

  const total = records.reduce((sum, row) => sum + Number(row.amount), 0);
  const totals = {};
  records.forEach((row) => { totals[row.category] = (totals[row.category] || 0) + Number(row.amount); });
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  $("count").textContent = records.length;
  $("sum").textContent = money(total);
  $("top").textContent = top ? top[0] : "—";
  $("fx").textContent = `Also about USD ${(total / settings.rates.EUR).toFixed(2)} and EUR ${(total / settings.rates.GBP).toFixed(2)}.`;

  const today = new Date();
  const bars = [];
  for (let ago = 6; ago >= 0; ago -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ago);
    const key = dayKey(day);
    bars.push(records.filter((row) => row.date === key).reduce((sum, row) => sum + Number(row.amount), 0));
  }
  const tallest = Math.max(1, ...bars);
  $("chart").innerHTML = bars.map((amount) => `<i class="bar" style="height:${Math.max(4, (amount / tallest) * 100)}%"></i>`).join("");
  $("chart").setAttribute("aria-label", `Last 7 days: ${bars.map((amount) => amount.toFixed(2)).join(", ")}`);

  const cap = Number(settings.cap) || 0;
  const message = $("capmsg");
  if (cap <= 0) {
    message.setAttribute("aria-live", "polite");
    message.textContent = "Set a spending cap in Settings.";
    $("fill").style.width = "0%";
    $("fill").classList.remove("over");
  } else if (total > cap) {
    message.setAttribute("aria-live", "assertive");
    message.textContent = `Over the cap by ${money(total - cap)}.`;
    $("fill").style.width = "100%";
    $("fill").classList.add("over");
  } else {
    message.setAttribute("aria-live", "polite");
    message.textContent = `${money(cap - total)} remaining under the cap.`;
    $("fill").style.width = `${(total / cap) * 100}%`;
    $("fill").classList.remove("over");
  }
}

function useData(next) {
  records = next.records;
  settings = next.settings;
  save(records);
  saveSettings(settings);
  fillCategories();
  showSettings();
  render();
}

function start() {
  fillCategories();
  showSettings();
  clearForm();
  render();

  $("menu").onclick = () => {
    const open = $("nav").classList.toggle("open");
    $("menu").setAttribute("aria-expanded", String(open));
  };
  $("q").oninput = render;
  $("ci").onchange = render;
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.onclick = () => {
      const key = button.dataset.sort;
      sortDir = sortKey === key ? -sortDir : (key === "description" ? 1 : -1);
      sortKey = key;
      render();
    };
  });

  $("rows").onclick = (event) => {
    const edit = event.target.closest("[data-edit]");
    const remove = event.target.closest("[data-del]");
    if (edit) {
      const row = records.find((item) => item.id === edit.dataset.edit);
      $("edit-id").value = row.id;
      $("description").value = row.description;
      $("amount").value = row.amount;
      $("date").value = row.date;
      $("category").value = row.category;
      $("save").textContent = "Update";
      $("form-title").textContent = "Edit transaction";
      location.hash = "form";
    }
    if (remove && confirm("Delete this transaction?")) {
      records = records.filter((row) => row.id !== remove.dataset.del);
      save(records);
      $("status").textContent = "Transaction deleted.";
      render();
    }
  };

  $("txn").onsubmit = (event) => {
    event.preventDefault();
    const result = checkRecord({
      description: $("description").value,
      amount: $("amount").value,
      date: $("date").value,
      category: $("category").value
    }, settings.categories);
    if (typeof result === "string") {
      $("status").textContent = result;
      return;
    }
    const now = new Date().toISOString();
    const editing = $("edit-id").value;
    if (editing) {
      records = records.map((row) => (row.id === editing ? { ...row, ...result, updatedAt: now } : row));
    } else {
      records.push({ id: nextId(), ...result, createdAt: now, updatedAt: now });
    }
    save(records);
    $("status").textContent = editing ? "Transaction updated." : "Transaction saved.";
    clearForm();
    render();
  };

  $("cancel").onclick = () => { clearForm(); $("status").textContent = ""; };

  $("prefs").onsubmit = (event) => {
    event.preventDefault();
    const categories = $("cats").value.split("\n").map((line) => line.trim()).filter(Boolean);
    const eur = Number($("eur").value);
    const gbp = Number($("gbp").value);
    const cap = Number($("cap").value);
    if (!categories.length || !(eur > 0) || !(gbp > 0) || !(cap >= 0)) {
      $("prefmsg").textContent = "Enter a cap, two rates, and at least one category.";
      return;
    }
    if (categories.some((name) => !rules.category.test(name))) {
      $("prefmsg").textContent = "Each category uses letters, spaces, or hyphens.";
      return;
    }
    settings = { base: $("base").value, rates: { EUR: eur, GBP: gbp }, cap, categories };
    saveSettings(settings);
    fillCategories();
    $("prefmsg").textContent = "Settings saved.";
    render();
  };

  $("export").onclick = () => {
    const file = new Blob([JSON.stringify({ records, settings }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "argenttracker.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  $("import").onchange = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const checked = checkImport(JSON.parse(await file.text()));
      if (typeof checked === "string") throw new Error(checked);
      useData(checked);
      $("prefmsg").textContent = "Import worked.";
    } catch (error) {
      $("prefmsg").textContent = error.message || "Import failed.";
    }
  };

  $("seed").onclick = async () => {
    try {
      const checked = checkImport(await (await fetch("seed.json")).json());
      if (typeof checked === "string") throw new Error(checked);
      useData(checked);
      $("prefmsg").textContent = "Sample data loaded.";
    } catch (error) {
      $("prefmsg").textContent = error.message || "Open this site with Live Server, then try again.";
    }
  };
}

start();
