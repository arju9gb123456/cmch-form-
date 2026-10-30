// Shared helpers: i18n, field rendering, value collection, validation, formatting.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------- Language (English / Hindi) ---------------- */
const I18N = {
  en: {
    sno: "S.No.", indicator: "Main Indicator", details: "Fill Details",
    clear: "Clear", submit: "Submit Form", submitting: "Submitting…",
    required: "This field is required", badFormat: "Format is not correct", badEmail: "Enter a valid email",
    fixErrors: (n) => `${n} field${n > 1 ? "s need" : " needs"} attention — please check the ones marked in red.`,
    empty: "The form is empty.", failed: "Could not submit:", retry: "Please try again.",
    doneTitle: "Form submitted", doneText: "The details have been saved successfully. Thank you!", again: "Fill another form",
    loading: "Loading form…", notFound: "Form not found", notFoundText: "This form is closed or the link is incorrect.",
    loadFail: "Could not load the form:", select: "— Select —", clearConfirm: "Clear all the details you have entered?",
    progress: (a, b) => `${a} of ${b} filled`, draftRestored: "Your unsaved entries were restored",
    edd: "EDD (expected date of delivery):", requiredNote: "Fields marked * are required",
    yes: "Yes", no: "No"
  },
  hi: {
    sno: "क्र.", indicator: "मुख्य संकेतक", details: "विवरण भरें",
    clear: "साफ़ करें", submit: "फॉर्म जमा करें", submitting: "जमा हो रहा है…",
    required: "यह जानकारी ज़रूरी है", badFormat: "फ़ॉर्मेट सही नहीं है", badEmail: "सही ईमेल डालें",
    fixErrors: (n) => `${n} जगह सुधार ज़रूरी है — लाल रंग वाले खाने जाँचें।`,
    empty: "फॉर्म खाली है।", failed: "जमा नहीं हुआ:", retry: "कृपया फिर से कोशिश करें।",
    doneTitle: "फॉर्म जमा हो गया", doneText: "जानकारी सफलतापूर्वक सेव हो गई है। धन्यवाद!", again: "नया फॉर्म भरें",
    loading: "फॉर्म लोड हो रहा है…", notFound: "फॉर्म नहीं मिला", notFoundText: "यह फॉर्म बंद है या लिंक गलत है।",
    loadFail: "फॉर्म लोड नहीं हुआ:", select: "— चुनें —", clearConfirm: "भरी हुई सारी जानकारी साफ़ करें?",
    progress: (a, b) => `${b} में से ${a} भरे`, draftRestored: "आपकी अधूरी भरी जानकारी वापस लाई गई",
    edd: "EDD (संभावित प्रसव तिथि):", requiredNote: "* वाले खाने भरना ज़रूरी है",
    yes: "हाँ", no: "नहीं"
  }
};
const LANG_KEY = "cmchf_lang";
function getLang() { try { return localStorage.getItem(LANG_KEY) === "hi" ? "hi" : "en"; } catch (e) { return "en"; } }
function setLang(l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} }
const T = (key, lang = getLang(), ...args) => {
  const v = (I18N[lang] || I18N.en)[key] ?? I18N.en[key];
  return typeof v === "function" ? v(...args) : v;
};
// Field/form text in the chosen language, falling back to English
const tx = (obj, key, lang = getLang()) => (lang === "hi" && obj && obj[key + "_hi"]) ? obj[key + "_hi"] : (obj ? obj[key] : "") || "";

/* ---------------- Field types ---------------- */
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

// Stored values (always English)
function fieldOptions(f) {
  if (f.type === "yesno") return ["Yes", "No"];
  return (f.options || []).map((o) => String(o).trim()).filter(Boolean);
}
// [{value, label}] — label in chosen language
function optionPairs(f, lang = getLang()) {
  const vals = fieldOptions(f);
  if (f.type === "yesno") return vals.map((v) => ({ value: v, label: v === "Yes" ? T("yes", lang) : T("no", lang) }));
  const hi = f.options_hi || [];
  return vals.map((v, i) => ({ value: v, label: lang === "hi" && hi[i] ? hi[i] : v }));
}

function renderInput(f, prefix = "", lang = getLang()) {
  const id = prefix + f.id;
  const req = f.required ? "required" : "";
  const phText = tx(f, "placeholder", lang);
  const ph = phText ? `placeholder="${esc(phText)}"` : "";
  const name = `name="${esc(f.id)}"`;
  switch (f.type) {
    case "textarea":
      return `<textarea id="${esc(id)}" ${name} rows="2" ${req} ${ph}></textarea>`;
    case "select":
      return `<select id="${esc(id)}" ${name} ${req}><option value="">${esc(T("select", lang))}</option>${optionPairs(f, lang)
        .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}</select>`;
    case "radio":
    case "yesno":
      return `<div class="choices" id="${esc(id)}">${optionPairs(f, lang)
        .map((o) => `<label class="choice"><input type="radio" ${name} value="${esc(o.value)}" ${req}><span>${esc(o.label)}</span></label>`)
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

function fillValues(form, formEl, data) {
  for (const f of form.fields) {
    const v = data?.[f.id];
    if (v === undefined || v === "") continue;
    const el = formEl.elements[f.id];
    if (!el) continue;
    if (el instanceof RadioNodeList || (el.length && el[0]?.type === "radio")) {
      Array.from(el).forEach((r) => (r.checked = r.value === v));
    } else el.value = v;
  }
}

function validateValues(form, data, lang = getLang()) {
  const errors = {};
  for (const f of form.fields) {
    const v = data[f.id];
    if (f.required && !v) { errors[f.id] = T("required", lang); continue; }
    if (!v) continue;
    if (f.pattern) {
      try { if (!new RegExp(f.pattern).test(v)) errors[f.id] = tx(f, "patternMsg", lang) || T("badFormat", lang); } catch (e) { /* bad regex: ignore */ }
    }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[f.id] = T("badEmail", lang);
  }
  return errors;
}

/* ---------------- Formatting ---------------- */
function fmtDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || "")) return v || "";
  const [y, m, d] = v.split("-");
  return `${d}-${m}-${y}`;
}
function fmtValue(f, v) {
  if (v === undefined || v === null || v === "") return "";
  if (f && f.type === "date") return fmtDate(v);
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
// Expected date of delivery from LMP (Naegele's rule: LMP + 280 days)
function eddFromLmp(lmp) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lmp || "")) return "";
  const d = new Date(lmp + "T00:00:00");
  d.setDate(d.getDate() + 280);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
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

/* ---------------- Shared form-sheet markup ---------------- */
function sheetHeader(form, lang, org, logo = "assets/logo.jpg") {
  const sub = tx(form, "subtitle", lang);
  return `
    <header class="sheet-head">
      <img class="logo" src="${esc(logo)}" alt="Chirayu Medical College & Hospital logo">
      <div class="head-text">
        ${org ? `<p class="org">${esc(org)}</p>` : ""}
        <h1>${esc(tx(form, "title", lang) || "Form title")}</h1>
        ${sub ? `<p class="subtitle">${esc(sub)}</p>` : ""}
      </div>
    </header>`;
}

function sheetRows(form, lang, prefix = "") {
  let n = 0;
  return form.fields.map((fl) => {
    n++;
    const sec = tx(fl, "section", lang);
    return `${sec ? `<tr class="sec-row"><td colspan="3">${esc(sec)}</td></tr>` : ""}
      <tr data-field="${esc(fl.id)}">
        <td class="sn">${n}</td>
        <td class="lbl"><label for="${esc(prefix + fl.id)}">${esc(tx(fl, "label", lang) || "—")}${fl.required ? '<span class="req">*</span>' : ""}</label></td>
        <td class="val">${renderInput(fl, prefix, lang)}${fl.hint === "edd" ? `<div class="hint" data-edd-for="${esc(fl.id)}"></div>` : ""}</td>
      </tr>`;
  }).join("");
}

function langToggle(lang, id = "langToggle") {
  return `<div class="lang-toggle" id="${id}" role="group" aria-label="Language">
    <button type="button" data-lang="en" class="${lang === "en" ? "on" : ""}">English</button>
    <button type="button" data-lang="hi" class="${lang === "hi" ? "on" : ""}">हिंदी</button>
  </div>`;
}
