/* Consumer shopping audit — static page. No framework, no tracking, no outside calls. */
"use strict";
const I18N = {
  tr: {
    crumb: "Projeler / Sentetik veri denetimi", kicker: "Veri kalitesi · 11.789 satır · Python + R",
    title: "Bu veri \"kim online alışveriş yapar?\" sorusunu cevaplayabilir mi?",
    lede: "Kaggle'da 25 sütunluk bir tüketici alışveriş veri seti. Modellemeye başlamadan önce üç şeyi denetledim: veri nereden geliyor, sütunlar birbiriyle ilişkili mi, hedef etiket nasıl oluşmuş. Cevap: hayır, bu veri o soruyu cevaplayamaz — ve bunu göstermek de bir sonuç.",
    c1t: "Sütunlar birbirinden habersiz", c1s: "22 sayısal sütun arasında Spearman korelasyonu. Köşegen dışında her şey sıfıra yakın.",
    c2t: "Davranış sütunları hiçbir şey öğretmiyor", c2s: "Alışveriş tercihini tahmin: 5 katlı CV, dengeli doğruluk (şans 0,33).",
    c3t: "Tahmin gücü tek sütundan geliyor", c3s: "Mağaza harcaması, tercihe göre: medyan ve %5–%95 aralığı.",
    c4t: "Etiket bir formül", c4s: "Tüm sütunlarla kurulan modelin ağırlıkları (online − mağaza, en büyüğe göre). 8 sütun kullanılıyor, gerisi sıfır.",
    found: "Ne buldum", care: "Dikkat",
    fData: "Veri ve lisans", fDataTxt: "Kaggle: sahilgod/consumers-shopping-trends-2026, CC0 (kamu malı). Yazarın kendi açıklaması: veri sentezlenmiş (üretilmiş).",
    fMethod: "Yöntem", fMethodTxt: "Spearman korelasyonu + 200 permütasyonlu bağımsızlık kıyası; ki-kare düzgünlük testi; Kruskal–Wallis ε²; cezasız çok sınıflı lojistik regresyon, aynı 5 kat Python ve R'da.",
    fRepro: "Yeniden üret", showTable: "Tabloyu göster",
    models: { majority: "Hep \"Mağaza\"", behaviour_only: "20 davranış + 2 demografi", store_spend_only: "Yalnız mağaza harcaması", all_columns: "Tüm sütunlar" },
    kpi: (n) => [["En güçlü ilişki", `|ρ| ${n.maxr}`, `231 çift · bağımsız sütunlarda beklenen ${n.nullr}`], ["Davranışla tahmin", n.bal, "dengeli doğruluk · şans 0,33"],
                 ["Tüm sütunlarla", n.all, `etiket ${n.ncols} sütunluk bir formül`], ["Gelir ↔ mağaza harcaması", `ρ ${n.inc}`, "gerçek hayatta pozitif olurdu"]],
    found_: (n) => [
      `Veri gerçek değil: yazarı sentezlendiğini söylüyor, veri de bunu doğruluyor. 231 sütun çiftinin en güçlüsü |ρ| ${n.maxr}; tamamen bağımsız sütunlar karıştırıldığında beklenen en büyük değer ${n.nullr}. Gelir ile mağaza harcaması arasında bile ilişki yok (ρ ${n.inc}).`,
      `13 puan sütununun ${n.uni} tanesi 0–10 arasında düzgün dağılıyor; cinsiyet ve şehir seviyesi üçe bölünmüş. Kümeleme bu veride tüketici segmenti değil, rastgele gürültü bulur.`,
      `Davranış ve demografi sütunları alışveriş tercihini hiç tahmin etmiyor (dengeli doğruluk ${n.bal}, şans 0,33). Tahmin gücünün tamamı mağaza harcamasından geliyor — gerçek hayatta tercihin sonucu olan bir sütun.`,
      `Tüm sütunlarla model %${n.allPct} doğruluğa ulaşıyor; tam veride sınıflar kusursuz ayrılıyor. Yani etiket ${n.ncols} sütunun doğrusal bir formülü: model tüketiciyi değil, üreteci geri buluyor.`],
    care_: ["Bu bir \"negatif sonuç\": veri seti ders ve pratik için uygun, tüketici davranışı hakkında çıkarım için uygun değil.",
           "11.789 satırda en küçük fark da \"anlamlı\" çıkar; burada p değerleri yerine etki büyüklükleri raporlandı.",
           "Tahmin tablosundaki \"tüm sütunlar\" modeli sızıntılıdır: harcama, tahmin edilen tercihin sonucudur."],
  },
  en: {
    crumb: "Projects / Synthetic-data audit", kicker: "Data quality · 11,789 rows · Python + R",
    title: "Can this data answer \"who shops online?\"",
    lede: "A 25-column consumer shopping dataset on Kaggle. Before modelling I audited three things: where the data come from, whether the columns relate to each other, and how the target label was made. The answer: no, this data cannot answer that question — and showing it is a result.",
    c1t: "The columns don't know about each other", c1s: "Spearman correlation between the 22 numeric columns. Everything off the diagonal is near zero.",
    c2t: "Behaviour columns teach nothing", c2s: "Predicting the shopping preference: 5-fold CV, balanced accuracy (chance 0.33).",
    c3t: "All the signal sits in one column", c3s: "Store spend by preference: median and 5–95 % range.",
    c4t: "The label is a formula", c4s: "Weights of the all-columns model (online − store, relative to the largest). 8 columns are used, the rest are zero.",
    found: "What I found", care: "Read with care",
    fData: "Data & licence", fDataTxt: "Kaggle: sahilgod/consumers-shopping-trends-2026, CC0 (public domain). The author's own description: the data were synthesized.",
    fMethod: "Method", fMethodTxt: "Spearman correlation + a 200-permutation independence yardstick; chi-square uniformity tests; Kruskal–Wallis ε²; unpenalised multinomial logistic regression on the same 5 folds in Python and R.",
    fRepro: "Reproduce", showTable: "Show table",
    models: { majority: "Always \"Store\"", behaviour_only: "20 behaviour + 2 demographic", store_spend_only: "Store spend alone", all_columns: "All columns" },
    kpi: (n) => [["Strongest link", `|ρ| ${n.maxr}`, `231 pairs · independent columns give ${n.nullr}`], ["Predicting from behaviour", n.bal, "balanced accuracy · chance 0.33"],
                 ["With every column", n.all, `the label is a formula of ${n.ncols} columns`], ["Income ↔ store spend", `ρ ${n.inc}`, "would be positive in real life"]],
    found_: (n) => [
      `The data aren't real: the author says they were synthesized, and the data agree. The strongest of 231 column pairs is |ρ| ${n.maxr}; shuffling every column independently gives ${n.nullr}. Even income and store spend are unrelated (ρ ${n.inc}).`,
      `${n.uni} of 13 score columns are uniform on 0–10; gender and city tier are split in thirds. Clustering here finds random noise, not customer segments.`,
      `Behaviour and demographic columns do not predict the shopping preference at all (balanced accuracy ${n.bal}, chance 0.33). All the predictive power comes from store spend — in real life a consequence of the preference.`,
      `With every column the model reaches ${n.allPct}% accuracy, and on the full data the classes separate perfectly: the label is a linear formula of ${n.ncols} columns. The model recovers the generator, not the shopper.`],
    care_: ["This is a negative result: the dataset is fine for teaching and practice, not for conclusions about consumer behaviour.",
           "With 11,789 rows every tiny gap is \"significant\"; effect sizes are reported instead of p-values.",
           "The \"all columns\" model leaks: spend is an outcome of the preference it predicts."],
  },
};
let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("shop-lang") || L; } catch (e) {}
const t = (k) => I18N[L][k];
let D = null;
const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === "class") n.className = v; else if (v != null) n.setAttribute(k, v); }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k)); return n; };
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, a = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) n.setAttribute(k, v); return n; };
const txt = (x, y, s, a = {}) => { const n = sv("text", { x, y, ...a }); n.textContent = s; return n; };
const fmt = (x, d = 2) => x.toLocaleString(L === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const tip = $("#tip");
function hover(node, text) {
  node.addEventListener("pointermove", (e) => { tip.textContent = text; tip.style.opacity = 1; tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY + 12 + "px"; });
  node.addEventListener("pointerleave", () => (tip.style.opacity = 0));
}
const table = (rows, head) => el("details", { class: "tbl" }, el("summary", {}, t("showTable")),
  el("table", {}, el("tr", {}, head.map((h) => el("th", {}, h))), rows.map((r) => el("tr", {}, r.map((c) => el("td", {}, c))))));

function nums() {
  const I = D.independence, M = D.models;
  return { maxr: fmt(I.max_abs_rho, 3), nullr: fmt(I.null_max_abs_rho_median, 3), inc: fmt(I.income_vs_store_spend, 3),
    bal: fmt(M.behaviour_only.balanced_accuracy), all: `${fmt(100 * M.all_columns.accuracy, 1)}%`, allPct: fmt(100 * M.all_columns.accuracy, 1),
    ncols: D.label_rule.n_columns_used, uni: D.uniform_scores.n_p_above_0_01 };
}
function heat(host) {
  const n = D.columns.length, cell = 20, left = 190, W = left + n * cell + 10, H = n * cell + 10, s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  D.spearman.forEach((row, i) => {
    s.append(txt(left - 6, i * cell + 14, D.columns[i], { "text-anchor": "end", class: "tick" }));
    row.forEach((v, j) => { const r = sv("rect", { x: left + j * cell, y: i * cell, width: cell - 1, height: cell - 1,
      fill: v >= 0 ? `color-mix(in srgb, var(--accent) ${Math.round(100 * v)}%, var(--surface-2))` : `color-mix(in srgb, #b0272f ${Math.round(-100 * v)}%, var(--surface-2))` });
      hover(r, `${D.columns[i]} × ${D.columns[j]}: ρ ${fmt(v, 3)}`); s.append(r); });
  });
  host.replaceChildren(s);
}
function modelBars(host) {
  const keys = ["majority", "behaviour_only", "store_spend_only", "all_columns"], W = 520, rowH = 40, left = 190, H = keys.length * rowH + 20;
  const X = (v) => left + v * (W - left - 70), s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { x1: X(1 / 3), x2: X(1 / 3), y1: 0, y2: H - 14, stroke: "var(--ink)", "stroke-dasharray": "4 4" }), txt(X(1 / 3), H - 2, L === "tr" ? "şans" : "chance", { "text-anchor": "middle", class: "tick" }));
  keys.forEach((k, i) => { const m = D.models[k], y = 6 + i * rowH, g = sv("g");
    g.append(sv("rect", { class: "bar" + (k === "store_spend_only" || k === "all_columns" ? "" : " n"), x: left, y, width: X(m.balanced_accuracy) - left, height: 22, rx: 4 }));
    hover(g, `${t("models")[k]}: ${L === "tr" ? "dengeli doğruluk" : "balanced accuracy"} ${fmt(m.balanced_accuracy)} · ${L === "tr" ? "doğruluk" : "accuracy"} ${fmt(m.accuracy, 3)}`);
    s.append(txt(left - 8, y + 15, t("models")[k], { "text-anchor": "end" }), g, txt(X(m.balanced_accuracy) + 6, y + 15, fmt(m.balanced_accuracy))); });
  host.replaceChildren(s, table(keys.map((k) => [t("models")[k], fmt(D.models[k].accuracy, 3), fmt(D.models[k].balanced_accuracy, 3), fmt(D.models[k].log_loss, 3)]),
    ["", L === "tr" ? "doğruluk" : "accuracy", L === "tr" ? "dengeli" : "balanced", "log loss"]));
}
function spendRanges(host) {
  const groups = ["Store", "Online", "Hybrid"], W = 520, rowH = 44, left = 90, H = groups.length * rowH + 30, mx = 150000;
  const X = (v) => left + (v / mx) * (W - left - 20), s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const v of [0, 50000, 100000, 150000]) s.append(sv("line", { class: "ax", x1: X(v), x2: X(v), y1: 0, y2: H - 22 }), txt(X(v), H - 6, `${v / 1000}k`, { "text-anchor": "middle", class: "tick" }));
  groups.forEach((gname, i) => { const q = D.store_spend_quantiles[gname], y = 16 + i * rowH, g = sv("g");
    g.append(sv("line", { class: "iqr", x1: X(q[0]), x2: X(q[4]), y1: y, y2: y }), sv("line", { x1: X(q[1]), x2: X(q[3]), y1: y, y2: y, stroke: "var(--accent)", "stroke-width": 10, "stroke-linecap": "round" }),
      sv("circle", { class: "mk", cx: X(q[2]), cy: y, r: 7, stroke: "var(--surface)", "stroke-width": 2 }));
    hover(g, `${gname}: ${L === "tr" ? "medyan" : "median"} ${Math.round(q[2]).toLocaleString()} · 5–95%: ${Math.round(q[0]).toLocaleString()}–${Math.round(q[4]).toLocaleString()}`);
    s.append(txt(left - 10, y + 4, gname, { "text-anchor": "end" }), g); });
  host.replaceChildren(s);
}
function weights(host) {
  const w = Object.entries(D.label_rule.weights_online_vs_store), W = 520, rowH = 26, mid = 330, H = w.length * rowH + 10;
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { class: "ax", x1: mid, x2: mid, y1: 0, y2: H }));
  w.forEach(([k, v], i) => { const y = 5 + i * rowH, len = Math.abs(v) * 170, g = sv("g");
    g.append(sv("rect", { class: "bar" + (v > 0 ? "" : " n"), x: v > 0 ? mid : mid - len, y, width: Math.max(len, 1), height: 16, rx: 3 }));
    hover(g, `${k}: ${fmt(v, 3)}`);
    s.append(g, txt(v > 0 ? mid - 8 : mid + 8, y + 12, `${k} (${fmt(v, 2)})`, { "text-anchor": v > 0 ? "end" : "start", class: "tick" })); });
  host.replaceChildren(s);
}
function paint() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { const v = t(n.dataset.i); if (typeof v === "string") n.textContent = v; });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
  $("#care").replaceChildren(...t("care_").map((x) => el("li", {}, x)));
  if (!D) return;
  const n = nums();
  $("#kpis").replaceChildren(...t("kpi")(n).map((k, i) => el("div", { class: "kpi" + (i === 1 ? " hi" : "") }, el("div", { class: "l" }, k[0]), el("div", { class: "v" }, k[1]), el("div", { class: "c" }, k[2]))));
  $("#found").replaceChildren(...t("found_")(n).map((x) => el("li", {}, x)));
  heat($("#c1")); modelBars($("#c2")); spendRanges($("#c3")); weights($("#c4"));
}
$("#lang").addEventListener("click", () => { L = L === "tr" ? "en" : "tr"; try { localStorage.setItem("shop-lang", L); } catch (e) {} paint(); });
$("#theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const nxt = cur === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nxt);
  try { localStorage.setItem("pd-theme", nxt); } catch (e) {}
});
paint();
fetch("data/audit.json").then((r) => r.json()).then((d) => { D = d; paint(); });
