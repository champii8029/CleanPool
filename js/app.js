// 844CleanPool — Sistema de Cotizaciones
// Lógica de filas dinámicas, cálculo en tiempo real y folio autoincrementable.

const TAX_RATE = 0.16;
const FOLIO_STORAGE_KEY = "cp844_last_folio";
const FOLIO_START = 155967;

const itemsBody = document.getElementById("itemsBody");
const rowTemplate = document.getElementById("rowTemplate");
const quoteNumberEl = document.getElementById("quoteNumber");
const quoteDateEl = document.getElementById("quoteDate");
const dueDateEl = document.getElementById("dueDate");

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function todayISO(offsetDays = 0) {
  // Usa componentes de fecha locales (no toISOString/UTC) para evitar que,
  // en husos horarios negativos (p. ej. México, UTC-6), la fecha se recorra
  // al día siguiente durante la tarde/noche.
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nextFolio() {
  const last = parseInt(localStorage.getItem(FOLIO_STORAGE_KEY) || String(FOLIO_START), 10);
  const next = last + 1;
  localStorage.setItem(FOLIO_STORAGE_KEY, String(next));
  return "S" + next;
}

function addRow(prefill = {}) {
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".item-row");

  if (prefill.desc) row.querySelector(".desc-main").value = prefill.desc;
  if (prefill.code) row.querySelector(".desc-code").value = prefill.code;
  if (prefill.qty) row.querySelector(".qty").value = prefill.qty;
  if (prefill.unit) row.querySelector(".unit").value = prefill.unit;
  if (prefill.price) row.querySelector(".price").value = prefill.price;

  row.addEventListener("input", handleRowInput);
  row.querySelector(".taxed").addEventListener("change", handleRowInput);
  row.querySelector(".removeRow").addEventListener("click", () => {
    row.remove();
    recalcTotals();
  });

  itemsBody.appendChild(row);
  recalcRow(row);
  recalcTotals();
}

function handleRowInput(e) {
  const row = e.target.closest(".item-row");
  recalcRow(row);
  recalcTotals();
}

function recalcRow(row) {
  const qty = parseFloat(row.querySelector(".qty").value) || 0;
  const price = parseFloat(row.querySelector(".price").value) || 0;
  const taxed = row.querySelector(".taxed").checked;

  const amount = qty * price;
  const tax = taxed ? amount * TAX_RATE : 0;

  row.querySelector(".line-amount").textContent = currency.format(amount);
  row.querySelector(".tax-amount").textContent = currency.format(tax);

  row.dataset.amount = amount;
  row.dataset.tax = tax;
}

function recalcTotals() {
  let subtotal = 0;
  let tax = 0;

  document.querySelectorAll(".item-row").forEach((row) => {
    subtotal += parseFloat(row.dataset.amount || 0);
    tax += parseFloat(row.dataset.tax || 0);
  });

  document.getElementById("totalSubtotal").textContent = currency.format(subtotal);
  document.getElementById("totalTax").textContent = currency.format(tax);
  document.getElementById("totalGrand").textContent = currency.format(subtotal + tax);
}

function resetQuote() {
  itemsBody.innerHTML = "";
  quoteNumberEl.textContent = nextFolio();
  quoteDateEl.value = todayISO();
  dueDateEl.value = todayISO(15);
  addRow();
}

document.getElementById("btnAddRow").addEventListener("click", () => addRow());
document.getElementById("btnNewQuote").addEventListener("click", () => {
  if (confirm("¿Iniciar una nueva cotización? Se limpiará el formulario actual.")) {
    resetQuote();
  }
});
document.getElementById("btnPrint").addEventListener("click", () => window.print());

// Estado inicial
quoteDateEl.value = todayISO();
dueDateEl.value = todayISO(15);
addRow({ desc: "Mantenimiento semanal de alberca", code: "LIMP-001", qty: 4, unit: "Servicio", price: 450 });
addRow({ desc: "Aplicación de cloro y clarificador", code: "QUIM-010", qty: 1, unit: "Pza", price: 320 });
