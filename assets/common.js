// Shared helpers: field rendering, value collection, validation, formatting.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const FIELD_TYPES = [
  { v: "text", l: "Short text" },
  { v: "textarea", l: "Long text" },
  { v: "number", l: "Number" },
  { v: "date", l: "Date" },
  { v: "time", l: "Time" },
  { v: "tel", l: "Mobile / Phone" },
  { v: "email", l: "Email" },
  { v: "yesno", l: "Yes / No" },
  { v: "radio", l: "Choice (one, buttons)" },
  { v: "select", l: "Dropdown" }
];
const NEEDS_OPTIONS = ["radio", "select"];

function fieldOptions(f) {
  if (f.type === "yesno") return ["Yes", "No"];
  return (f.options || []).map((o) => String(o).trim()).filter(Boolean);
}

function renderInput(f, prefix = "") {
  const id = prefix + f.id;
  const req = f.required ? "required" : "";
  const ph = f.placeholder ? `placeholder="${esc(f.placeholder)}"` : "";
  const name = `name="${esc(f.id)}"`;
  switch (f.type) {
    case "textarea":
      return `<textarea id="${esc(id)}" ${name} rows="2" ${req} ${ph}></textarea>`;
    case "select":
      return `<select id="${esc(id)}" ${name} ${req}><option value="">— Select —</option>${fieldOptions(f)
        .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}</select>`;
    case "radio":
    case "yesno":
      return `<div class="choices" id="${esc(id)}">${fieldOptions(f)
        .map((o) => `<label class="choice"><input type="radio" ${name} value="${esc(o)}" ${req}><span>${esc(o)}</span></label>`)
        .join("")}</div>`;
    case "number":
      return `<input id="${esc(id)}" ${name} type="number" step="any" min="0" inputmode="decimal" ${req} ${ph}>`;
    case "tel":
      return `<input id="${esc(id)}" ${name} type="tel" inputmode="numeric" maxlength="10" ${req} ${ph}>`;
    case "date":
    case "time":
    case "email":
      return `<input id="${esc(id)}" ${name} type="${f.type}" ${req} ${ph}>`;
    default:
      return `<input id="${esc(id)}" ${name} type="text" autocomplete="off" ${req} ${ph}>`;
  }
}

function collectValues(form, formEl) {
  const data = {};
  for (const f of form.fields) {
    const el = formEl.elements[f.id];
    data[f.id] = el ? String(el.value ?? "").trim() : "";
  }
  return data;
}

function validateValues(form, data) {
  const errors = {};
  for (const f of form.fields) {
    const v = data[f.id];
    if (f.required && !v) { errors[f.id] = "Yeh field zaroori hai"; continue; }
    if (!v) continue;
    if (f.pattern) {
      try { if (!new RegExp(f.pattern).test(v)) errors[f.id] = f.patternMsg || "Format sahi nahi hai"; } catch (e) { /* bad regex: ignore */ }
    }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[f.id] = "Valid email daalo";
  }
  return errors;
}

function fmtValue(f, v) {
  if (v === undefined || v === null || v === "") return "";
  if (f && f.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}-${m}-${y}`;
  }
  if (f && f.type === "time" && /^\d{2}:\d{2}/.test(v)) {
    let [h, m] = v.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap}`;
  }
  return String(v);
}

function fmtStamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function toast(msg, kind = "ok") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.className = "toast show " + kind;
  t.textContent = msg;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = "toast " + kind), 2600);
}
