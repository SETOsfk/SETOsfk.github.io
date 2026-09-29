/* Bordeaux → Türkiye — static explorer. No framework, no tracking; the only outside call is the
   optional OpenStreetMap Overpass query the visitor triggers with "find shops near me". */
"use strict";

const I18N = {
  tr: {
    crumb: "Projeler / Bordeaux → Türkiye", kicker: "Veri bilimi · 14.349 şarap · Python + R",
    finderLink: "Yeni: viski ve şarap bulucu — tadı seç, yanına peynir ekle, en yakın mağazayı gör →",
    title: "90 puanlık bir Bordeaux'yu ne yapar?",
    lede: "Wine Spectator'ın 2000–2016 Bordeaux tadım notlarından çıkarılmış 985 tanımlayıcıyla 90+ puanı tahmin eden, sızıntıya karşı sınanmış bir model. Her şarap için uygun peynirler, Türkiye'deki muadilleri ve en yakın satış noktası.",
    appTitle: "Şarabını bul", appSub: "Adıyla ara ya da sevdiğin tatları seç. Her şarapta: model tahmini, benzer şaraplar, peynir eşleşmesi, Türk muadilleri ve yakındaki satış noktaları.",
    tabName: "Adıyla ara", tabTaste: "Tadıyla ara", searchPh: "Şato, apelasyon ya da üretici… (ör. Margaux)",
    pickHint: "Bir şarap seç — detaylar burada açılır.", vintages: "Rekolteler", score: "Puan", price: "Çıkış fiyatı",
    grapes: "Tipik üzümler (apelasyona göre)", descriptors: "Tadım notundaki tanımlayıcılar", praiseNote: "Kesikli çerçeve: betimleyici/övgü terimi",
    model: "Model (bu şarabı görmeden, yalnız tat ve yapı kelimeleriyle)", modelTxt: (p) => `90+ olasılığı %${p}`,
    similar: "Tadı en çok benzeyenler", cheese: "Yanına peynir", trEq: "Türkiye'deki muadilleri", native: "Yerli üzümle alternatif",
    nativeTxt: "Boğazkere tanen ve yapıyı, Öküzgözü meyve ve asiditeyi taşır — Cabernet–Merlot ikilisine benzer bir iş bölümü.",
    grapeMatch: "üzüm uyumu", body: { light: "hafif gövde", medium: "orta gövde", full: "dolgun gövde" }, oak: "meşe",
    oakMonths: (m) => `${m} ay meşe`, noOak: "meşesiz", region: "Üretim bölgesi", source: "kaynak", pairNote: "Üreticinin/tadım notunun önerisi",
    where: "Nereden alırım?", whereTxt: "Konumuna en yakın şarap ve içki satış noktaları (OpenStreetMap). Konumun yalnız bu sorgu için yuvarlanarak gönderilir, saklanmaz.",
    useLoc: "Konumumu kullan", orCity: "ya da il seç", searching: "Aranıyor…", none: "Bu yarıçapta kayıtlı satış noktası bulunamadı.",
    locErr: "Konum alınamadı — il seçebilirsin.", ovErr: "OpenStreetMap şu an yanıt vermedi; biraz sonra tekrar dene.",
    km: "km", open: "haritada aç", route: "yol tarifi", unnamed: "(adsız)",
    shopType: { wine: "şarap dükkânı", alcohol: "tekel / içki", beverages: "içecek", winery: "şarap evi / üretici" },
    legal: "Türkiye'de alkollü içki 22.00–06.00 arası perakende satılamaz, 18 yaş altına satılamaz; posta ile satış yapılamaz (4250 s. Kanun md. 6). Bu yüzden çevrimiçi satış bağlantısı yok.",
    tastePick: "Sevdiğin tatları seç (en fazla 8)", tasteProb: "Bu profilin 90+ alma olasılığı", tasteTop: "Bu tatlara en yakın şaraplar",
    tasteEmpty: "Tat seçtikçe tahmin ve eşleşen şaraplar burada belirir.", contrib: "Katkılar",
    anTitle: "Nasıl analiz ettim", anSub: "Basit model önce, üç farklı doğrulama tasarımı, her sayının yanında bir kıyas. Tüm sayılar results/ klasöründeki koddan gelir.",
    c1t: "Hangi model?", c1s: "Doğruluk, şaraba göre gruplanmış 5 katlı çapraz doğrulama. Çizgi: hep \"89 ve altı\" diyen taban çizgisi.",
    c2t: "Övgü mü, tat mı?", c2s: "Aynı lojistik model, farklı kelime grupları. ROC AUC (0,5 = yazı-tura).",
    c3t: "Oranı değiştiren kelimeler", c3s: "Lojistik regresyon katsayıları (≥30 incelemede geçen kelimeler).", wS: "Tat ve yapı", wA: "Tümü",
    c4t: "Puan pahalı mı?", c4s: "Puan bandına göre medyan çıkış fiyatı (USD, fiyatı bilinen şaraplar).",
    found: "Ne buldum", care: "Dikkat",
    fData: "Veri ve lisans", fDataTxt: "Dong ve ark. (2020), Beverages 6(1):5 — Wine Spectator incelemelerinden Computational Wine Wheel ile çıkarılmış ikili tanımlayıcılar (Kaggle: jessiedong1). Kaggle'da lisans \"Unknown\"; repo ham veriyi yeniden dağıtmaz, uygulama yalnız türetilmiş etiketleri gösterir. Peynir ve muadil kaynakları her kartta.",
    fMethod: "Yöntem", fMethodTxt: "Seyrek ikili öznitelikler; çoğunluk sınıfı, Naive Bayes, lojistik regresyon, doğrusal SVM, rastgele orman, gradyan artırma. Rastgele / şaraba göre gruplu / zamansal (2000–11 → 2012–16) doğrulama. Python (scikit-learn) ve R (glmnet, ranger) aynı katlarla.",
    fRepro: "Yeniden üret", fLegal: "Not", fLegalTxt: "Ticari değildir; hiçbir üretici ya da satıcıyla bağı yoktur, satış yapmaz. 18 yaş ve üzeri içindir.",
    age: "Bu sayfa alkollü içecekler hakkında bilgi içerir. 18 yaşından büyük müsün?", ageYes: "Evet, 18+", ageNo: "Hayır",
    kpi: (n) => [["En iyi doğruluk", `%${n.best}`, `taban çizgisi %${n.base} · literatür %87,32`], ["Yalnız övgü kelimeleri", `${n.aucPraise} AUC`, `yalnız tat ve yapı: ${n.aucFlavour}`],
          ["Şato sızıntısı", `${n.leak} puan`, `rastgele / gruplu CV: %${n.rand} / %${n.best}`], ["Gelecek rekolteler", `%${n.temp}`, `2012–16'ya taşınınca ${n.tempDrop} puan`]],
  },
  en: {
    crumb: "Projects / Bordeaux → Türkiye", kicker: "Data science · 14,349 wines · Python + R",
    finderLink: "New: whisky & wine finder — pick a taste, add a cheese, find the nearest shop →",
    title: "What makes a 90-point Bordeaux?",
    lede: "A leakage-checked model that predicts a 90+ score from 985 descriptors extracted from Wine Spectator's 2000–2016 Bordeaux reviews. For every wine: cheeses to pair, Turkish equivalents and the nearest place to buy.",
    appTitle: "Find your wine", appSub: "Search by name or pick the flavours you like. Every wine shows the model's estimate, similar wines, cheese pairings, Turkish equivalents and shops nearby.",
    tabName: "By name", tabTaste: "By taste", searchPh: "Château, appellation or producer… (e.g. Margaux)",
    pickHint: "Pick a wine — details open here.", vintages: "Vintages", score: "Score", price: "Release price",
    grapes: "Typical grapes (by appellation)", descriptors: "Descriptors in the review", praiseNote: "Dashed: descriptive/praise term",
    model: "Model (without seeing this wine, flavour and structure words only)", modelTxt: (p) => `${p}% chance of 90+`,
    similar: "Most similar in taste", cheese: "Cheese to pair", trEq: "Turkish equivalents", native: "Native-grape alternative",
    nativeTxt: "Boğazkere carries tannin and structure, Öküzgözü carries fruit and acidity — a division of labour similar to Cabernet–Merlot.",
    grapeMatch: "grape match", body: { light: "light body", medium: "medium body", full: "full body" }, oak: "oak",
    oakMonths: (m) => `${m} months oak`, noOak: "unoaked", region: "Region", source: "source", pairNote: "Producer / tasting-note suggestion",
    where: "Where can I buy it?", whereTxt: "Wine and liquor shops nearest to you (OpenStreetMap). Your location is rounded and sent only for this query, never stored.",
    useLoc: "Use my location", orCity: "or pick a province", searching: "Searching…", none: "No shop mapped within this radius.",
    locErr: "Couldn't get your location — pick a province instead.", ovErr: "OpenStreetMap didn't answer; try again shortly.",
    km: "km", open: "open map", route: "directions", unnamed: "(unnamed)",
    shopType: { wine: "wine shop", alcohol: "liquor store", beverages: "beverages", winery: "winery" },
    legal: "In Türkiye alcohol cannot be sold at retail between 22:00 and 06:00, to under-18s, or by mail (Law 4250, art. 6) — hence no online-shop links.",
    tastePick: "Pick the flavours you like (up to 8)", tasteProb: "Chance this profile scores 90+", tasteTop: "Wines closest to these flavours",
    tasteEmpty: "Pick flavours; the estimate and matching wines appear here.", contrib: "Contributions",
    anTitle: "How I analysed it", anSub: "Simple model first, three validation designs, a comparison next to every number. Every figure comes from the code in results/.",
    c1t: "Which model?", c1s: "Accuracy, 5-fold CV grouped by wine. Line: always predicting \"89 or below\".",
    c2t: "Praise or flavour?", c2s: "Same logistic model, different word groups. ROC AUC (0.5 = coin flip).",
    c3t: "Words that move the odds", c3s: "Logistic-regression coefficients (words in ≥30 reviews).", wS: "Flavour & structure", wA: "All",
    c4t: "Is a high score expensive?", c4s: "Median release price by score band (USD, wines with a price).",
    found: "What I found", care: "Read with care",
    fData: "Data & licence", fDataTxt: "Dong et al. (2020), Beverages 6(1):5 — binary descriptors extracted from Wine Spectator reviews by the Computational Wine Wheel (Kaggle: jessiedong1). Kaggle lists the licence as \"Unknown\"; the repo does not redistribute raw data and the app shows derived tags only. Cheese and equivalent sources are on every card.",
    fMethod: "Method", fMethodTxt: "Sparse binary features; majority class, naive Bayes, logistic regression, linear SVM, random forest, gradient boosting. Random / grouped-by-wine / temporal (2000–11 → 2012–16) validation. Python (scikit-learn) and R (glmnet, ranger) on the same folds.",
    fRepro: "Reproduce", fLegal: "Note", fLegalTxt: "Non-commercial; no tie to any producer or seller, sells nothing. For adults 18+.",
    age: "This page contains information about alcoholic drinks. Are you 18 or older?", ageYes: "Yes, 18+", ageNo: "No",
    kpi: (n) => [["Best accuracy", `${n.best}%`, `baseline ${n.base}% · literature 87.32%`], ["Praise words alone", `${n.aucPraise} AUC`, `flavour & structure alone: ${n.aucFlavour}`],
          ["Château leakage", `${n.leak} pts`, `random / grouped CV: ${n.rand}% / ${n.best}%`], ["Future vintages", `${n.temp}%`, `${n.tempDrop} pts when moved to 2012–16`]],
  },
};

const FOUND = {
  tr: (n) => [
    `Lojistik regresyon %${n.best} doğrulukla literatürdeki en iyi sonucu (%87,32, naive Bayes + kategori sayımları; Dong, Atkison ve Chen 2021) yakaladı; ağaç modelleri (RF %${n.rf}, GB %${n.gb}) geçemedi. Seyrek kelime verisinde basit model yetiyor.`,
    `Puanı en iyi "range, serious, excellent, great" gibi övgü kelimeleri tahmin ediyor. Yalnız tat ve yapı kelimeleriyle AUC ${n.aucAll}'den ${n.aucFlavour}'a düşüyor: eleştirmenin hükmü metne sızıyor.`,
    `2024 sürümündeki sızıntı (öznitelik seçimi tüm veride) doğruluğu yalnız ${n.legLeak} puan şişirmiş (%${n.legOut} / %${n.legIn}); asıl kayıp tanımlayıcıları 45'e indirmekti: aynı RF tüm kelimelerle %${n.rf}.`,
  ],
  en: (n) => [
    `Logistic regression reaches ${n.best}% accuracy, matching the best published result (87.32%, naive Bayes with category counts; Dong, Atkison & Chen 2021); tree models (RF ${n.rf}%, GB ${n.gb}%) don't beat it. On sparse word data the simple model is enough.`,
    `Praise words ("range, serious, excellent, great") predict the score best. Flavour and structure words alone drop AUC from ${n.aucAll} to ${n.aucFlavour}: the critic's verdict leaks into the text.`,
    `The 2024 version's leak (feature selection on all rows) inflated accuracy by only ${n.legLeak} pts (${n.legOut}% vs ${n.legIn}%); the real loss was cutting to 45 descriptors: the same RF with all words scores ${n.rf}%.`,
  ],
};
const CARE = {
  tr: [
    "Veri tek bir yayının (Wine Spectator) incelemeleri; başka eleştirmenlere genellemez. Puan ve metni aynı kişi yazıyor — model \"şarabı\" değil \"yazıyı\" okuyor.",
    "Fiyatların %32'si eksik; fiyat analizi yalnız fiyatı bilinen 9.739 şarapta. İlişki nedensel değil.",
    "Muadiller kural tabanlı (üzüm %60, gövde %25, meşe %15); tadım karşılaştırması değil. Türk şaraplarının bilgisi degustasyon.net tadım notlarından.",
  ],
  en: [
    "One publication (Wine Spectator); it won't generalise to other critics. The same person writes the score and the text — the model reads the writing, not the wine.",
    "32% of prices are missing; the price chart uses the 9,739 wines with a price. Association, not causation.",
    "Equivalents are rule-based (grapes 60%, body 25%, oak 15%), not a blind tasting. Turkish wine facts come from degustasyon.net tasting notes.",
  ],
};

let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("wine-lang") || L; } catch (e) {}
const t = (k) => I18N[L][k];
let D = null;
const S = { mode: "name", wine: null, picked: new Set(), loc: null, shops: null, wordSet: "sensory" };

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
};
const fmtPct = (x, d = 1) => (x * 100).toLocaleString(L === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtNum = (x, d = 0) => x.toLocaleString(L === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const styleName = (s) => ({ tr: { red: "kırmızı", white: "beyaz", sweet: "tatlı", "rosé": "roze" }, en: { red: "red", white: "white", sweet: "sweet", "rosé": "rosé" } })[L][s];
const label = (d) => (L === "tr" ? d.tr : d.en);
const byId = (arr, id) => arr.find((x) => x.id === id);

/* ------------------------------------------------------------------ static text + chrome */
function paintStatic() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { n.textContent = t(n.dataset.i); });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
  $("#care").replaceChildren(...CARE[L].map((x) => el("li", {}, x)));
  if (D) paintNumbers();
}

function paintNumbers() {
  const C = D.results.comparison, g = (d, f, m) => C.find((r) => r.design === d && r.features === f && r.model === m);
  const p1 = (v) => fmtPct(v, 1), a3 = (v) => fmtNum(v, 3), sgn = (v) => { const r = Math.round(v * 10) / 10; return (r > 0 ? "+" : r < 0 ? "−" : "") + fmtNum(Math.abs(r), 1); };
  const best = g("grouped", "all", "logistic").accuracy, lg = D.results.legacy;
  const n = { best: p1(best), base: p1(g("grouped", "all", "majority").accuracy), rand: p1(g("random", "all", "logistic").accuracy),
    leak: sgn((g("random", "all", "logistic").accuracy - best) * 100), temp: p1(g("temporal", "all", "logistic").accuracy),
    tempDrop: sgn((g("temporal", "all", "logistic").accuracy - best) * 100), aucAll: a3(g("grouped", "all", "logistic").roc_auc),
    aucPraise: a3(g("grouped", "descriptive", "logistic").roc_auc), aucFlavour: a3(g("grouped", "sensory", "logistic").roc_auc),
    rf: p1(g("random", "all", "random_forest").accuracy), gb: p1(g("grouped", "all", "gradient_boosting").accuracy),
    legOut: p1(lg.selection_outside_cv.accuracy), legIn: p1(lg.selection_inside_cv.accuracy),
    legLeak: fmtNum((lg.selection_outside_cv.accuracy - lg.selection_inside_cv.accuracy) * 100, 1) };
  $("#kpis").replaceChildren(...t("kpi")(n).map((k, i) => el("div", { class: "kpi" + (i === 1 ? " hi" : "") },
    el("div", { class: "l" }, k[0]), el("div", { class: "v" }, k[1]), el("div", { class: "c" }, k[2]))));
  $("#found").replaceChildren(...FOUND[L](n).map((x) => el("li", {}, x)));
}

$("#lang").addEventListener("click", () => {
  L = L === "tr" ? "en" : "tr";
  try { localStorage.setItem("wine-lang", L); } catch (e) {}
  paintStatic(); if (D) { renderLeft(); renderDetail(); renderCharts(); }
});
$("#theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const nxt = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nxt);
  try { localStorage.setItem("pd-theme", nxt); } catch (e) {}
});
for (const [id, mode] of [["#tab-name", "name"], ["#tab-taste", "taste"]]) {
  $(id).addEventListener("click", () => {
    S.mode = mode;
    $("#tab-name").setAttribute("aria-pressed", mode === "name");
    $("#tab-taste").setAttribute("aria-pressed", mode === "taste");
    renderLeft(); renderDetail();
  });
}

/* ------------------------------------------------------------------ data helpers */
let LABEL_ROWS = null;   // label index -> [wine rows]
function labelRows(li) {
  if (!LABEL_ROWS) {
    LABEL_ROWS = new Map();
    D.wines.l.forEach((l, i) => { if (!LABEL_ROWS.has(l)) LABEL_ROWS.set(l, []); LABEL_ROWS.get(l).push(i); });
    for (const rows of LABEL_ROWS.values()) rows.sort((a, b) => D.wines.y[b] - D.wines.y[a]);
  }
  return LABEL_ROWS.get(li) || [];
}
const SENS_IDF = () => D.desc.map((d) => (d.s ? d.idf : 0));

function similarWines(i, k = 5) {
  const w = D.wines, idf = SENS_IDF(), q = new Set(w.at[i].filter((a) => D.desc[a].s));
  const qn = Math.sqrt([...q].reduce((s, a) => s + idf[a] ** 2, 0)) || 1;
  const out = [];
  for (let j = 0; j < w.l.length; j++) {
    if (w.l[j] === w.l[i] || w.st[j] !== w.st[i]) continue;
    let dot = 0, n2 = 0;
    for (const a of w.at[j]) { if (!D.desc[a].s) continue; n2 += idf[a] ** 2; if (q.has(a)) dot += idf[a] ** 2; }
    if (dot > 0) out.push([dot / (qn * Math.sqrt(n2)), j]);
  }
  out.sort((a, b) => b[0] - a[0] || D.wines.s[b[1]] - D.wines.s[a[1]]);
  const seen = new Set(), res = [];
  for (const [sim, j] of out) { if (seen.has(w.l[j])) continue; seen.add(w.l[j]); res.push([sim, j]); if (res.length === k) break; }
  return res;
}

/* ------------------------------------------------------------------ left panel */
function renderLeft() {
  const box = $("#left");
  if (S.mode === "name") {
    const inp = el("input", { class: "search", type: "search", placeholder: t("searchPh"), "aria-label": t("searchPh") });
    const ul = el("ul", { class: "results" });
    const run = () => {
      const q = norm(inp.value.trim());
      const hits = [];
      if (q.length >= 2) {
        for (let li = 0; li < D.names.length && hits.length < 40; li++) if (norm(D.names[li]).includes(q)) hits.push(li);
      } else {
        // default: a few famous labels to start from
        for (const n of ["Château Margaux Margaux", "Château Pétrus Pomerol", "Château d'Yquem Sauternes", "Château Cheval Blanc St.-Emilion", "Château Latour Pauillac", "Château Haut-Brion Pessac-Léognan White"]) {
          const li = D.names.indexOf(n); if (li >= 0) hits.push(li);
        }
      }
      ul.replaceChildren(...hits.map((li) => {
        const rows = labelRows(li), best = Math.max(...rows.map((r) => D.wines.s[r]));
        return el("li", {}, el("button", { type: "button", onclick: () => { S.wine = rows[0]; S.shops = null; renderDetail(); } },
          el("span", { class: "nm" }, D.names[li]), el("span", { class: "meta" }, `${rows.length}× · max ${best}`)));
      }));
    };
    inp.addEventListener("input", run);
    box.replaceChildren(inp, ul);
    run();
  } else {
    const fams = {};
    D.desc.forEach((d, i) => { if (d.s && d.n >= 60 && d.c !== null) (fams[d.f] ||= []).push(i); });
    const wrap = [el("div", { class: "fam" }, t("tastePick"))];
    for (const [f, ids] of Object.entries(fams)) {
      ids.sort((a, b) => D.desc[b].n - D.desc[a].n);
      wrap.push(el("div", { class: "fam" }, (D.families[f] || [f, f])[L === "tr" ? 1 : 0]));
      wrap.push(el("div", { class: "chips" }, ids.slice(0, 12).map((i) => el("button", {
        class: "chip", type: "button", "aria-pressed": S.picked.has(i),
        onclick: (e) => {
          if (S.picked.has(i)) S.picked.delete(i); else if (S.picked.size < 8) S.picked.add(i);
          e.currentTarget.setAttribute("aria-pressed", S.picked.has(i)); S.wine = null; renderDetail();
        },
      }, label(D.desc[i])))));
    }
    box.replaceChildren(...wrap);
  }
}

/* ------------------------------------------------------------------ detail panel */
function renderDetail() {
  const box = $("#detail");
  if (S.wine === null) { box.replaceChildren(S.mode === "taste" ? tasteView() : el("div", { class: "empty" }, t("pickHint"))); return; }
  const w = D.wines, i = S.wine, li = w.l[i];
  const app = D.appellations[w.ap[i]], st = D.styles[w.st[i]];
  const info = D.appellation_info[app] || {};
  const grapes = st === "white" ? "Sauvignon Blanc, Sémillon, Muscadelle" : info.grapes;
  const rows = labelRows(li);
  const kids = [
    el("h3", {}, D.names[li]),
    el("div", { class: "muted" }, `${app} · ${styleName(st)} · ${info.bank ? ({ left: L === "tr" ? "Sol Yaka" : "Left Bank", right: L === "tr" ? "Sağ Yaka" : "Right Bank", generic: "Bordeaux", sweet: L === "tr" ? "tatlı şarap bölgesi" : "sweet-wine area" })[info.bank] : ""}`),
    el("div", { class: "vintages" }, rows.map((r) => el("button", { class: "chip", type: "button", "aria-pressed": r === i,
      onclick: () => { S.wine = r; renderDetail(); } }, `${w.y[r]} · ${w.s[r]}`))),
    el("div", { class: "row" },
      el("span", { class: "score" }, `${w.s[i]}`), el("span", { class: "badge" + (w.s[i] >= 90 ? " hi" : "") }, w.s[i] >= 90 ? "90+" : "≤89"),
      el("span", { class: "muted" }, `${t("price")}: ${w.p[i] ? "$" + w.p[i] : "—"}`), el("span", { class: "muted" }, `${t("vintages")}: ${w.y[i]}`)),
    el("div", { class: "note" }, `${t("grapes")}: ${grapes}`),
    el("div", { class: "sec" }, el("h4", {}, t("model")), el("div", { class: "meter" }, el("i", { style: `width:${w.pr[i] * 100}%` })),
      el("div", {}, t("modelTxt")(fmtPct(w.pr[i], 0)))),
    el("div", { class: "sec" }, el("h4", {}, t("descriptors")),
      el("div", { class: "chips" }, w.at[i].map((a) => el("span", { class: "chip static" + (D.desc[a].s ? "" : " praise") }, label(D.desc[a])))),
      el("div", { class: "note", style: "margin-top:6px" }, t("praiseNote"))),
    similarBlock(i), cheeseBlock(D.rules[w.ru[i]]), equivalentsBlock(w.eq[i], w.na[i]), shopsBlock(),
  ];
  box.replaceChildren(...kids);
}

function similarBlock(i) {
  const sims = similarWines(i);
  return el("div", { class: "sec" }, el("h4", {}, t("similar")), el("div", { class: "grid2" }, sims.map(([sim, j]) =>
    el("button", { class: "mini", type: "button", style: "text-align:left;cursor:pointer", onclick: () => { S.wine = j; renderDetail(); } },
      el("b", {}, D.names[D.wines.l[j]]), el("span", { class: "s" }, `${D.wines.y[j]} · ${D.wines.s[j]} · ${fmtPct(sim, 0)}% ${L === "tr" ? "benzerlik" : "similar"}`)))));
}

function cheeseBlock(rule) {
  const ids = rule.cheese_ids.split(";").map((id) => byId(D.cheeses, id));
  const card = (c) => el("div", { class: "mini" + (c.is_turkish ? " tr" : "") },
    el("b", {}, L === "tr" ? c.name_tr : c.name_en),
    el("span", { class: "s" }, `${L === "tr" ? c.origin_tr : c.origin_en} · ${L === "tr" ? c.note_tr : c.note_en}`));
  return el("div", { class: "sec" }, el("h4", {}, t("cheese")),
    el("p", { style: "margin:0 0 8px" }, L === "tr" ? rule.rationale_tr : rule.rationale_en, " ",
      el("a", { href: rule.source_url, target: "_blank", rel: "noopener" }, `(${rule.source_name})`)),
    el("div", { class: "grid2" }, ids.filter((c) => c.is_turkish).map(card), ids.filter((c) => !c.is_turkish).map(card)));
}

function trCard(tw, extra) {
  const oak = tw.oak_months === "" ? null : tw.oak_months === "0" ? t("noOak") : t("oakMonths")(tw.oak_months.replace("-", "–"));
  const dist = S.loc ? ` · ~${fmtNum(haversine(S.loc, [tw.lat, tw.lon]))} ${t("km")}` : "";
  return el("div", { class: "mini tr" },
    el("b", {}, `${tw.producer} — ${tw.wine}`),
    el("span", { class: "s" }, [tw.grapes.replace(/:\d+/g, "").split(";").join(", "), tw.body ? t("body")[tw.body] : null, oak].filter(Boolean).join(" · ")),
    el("div", { class: "s" }, `${t("region")}: ${L === "tr" ? tw.location_tr : tw.location_en}${dist}`),
    tw.pairing_note_tr ? el("div", { class: "s" }, `${t("pairNote")}: ${tw.pairing_note_tr}`) : null,
    extra || null,
    el("a", { class: "s", href: tw.source_url, target: "_blank", rel: "noopener" }, t("source")));
}

function equivalentsBlock(eq, native) {
  const cards = eq.map(([k, sc]) => trCard(D.turkish[k], el("div", { class: "s" }, `${fmtPct(sc, 0)}% ${L === "tr" ? "uyum" : "match"}`)));
  const kids = [el("h4", {}, t("trEq")), el("div", { class: "grid2" }, cards)];
  if (native) {
    const kb = byId(D.turkish, "kayra_buzbag_rezerv");
    kids.push(el("h4", { style: "margin-top:12px" }, t("native")), el("div", { class: "grid2" }, trCard(kb, el("div", { class: "s" }, t("nativeTxt")))));
  }
  return el("div", { class: "sec" }, ...kids);
}

/* ------------------------------------------------------------------ taste mode */
function tasteView() {
  if (!S.picked.size) return el("div", { class: "empty" }, t("tasteEmpty"));
  const ids = [...S.picked];
  const z = D.model.intercept + ids.reduce((s, i) => s + D.desc[i].c, 0);
  const p = 1 / (1 + Math.exp(-z));
  const w = D.wines, idf = D.desc.map((d) => d.idf), q = new Set(ids);
  const qn = Math.sqrt(ids.reduce((s, a) => s + idf[a] ** 2, 0));
  const scored = [];
  for (let j = 0; j < w.l.length; j++) {
    let dot = 0, n2 = 0;
    for (const a of w.at[j]) { if (!D.desc[a].s) continue; n2 += idf[a] ** 2; if (q.has(a)) dot += idf[a] ** 2; }
    if (dot) scored.push([dot / (qn * Math.sqrt(n2)), j]);
  }
  scored.sort((a, b) => b[0] - a[0] || w.s[b[1]] - w.s[a[1]]);
  const seen = new Set(), top = [];
  for (const [s, j] of scored) { if (seen.has(w.l[j])) continue; seen.add(w.l[j]); top.push([s, j]); if (top.length === 10) break; }
  return el("div", {},
    el("h4", { class: "fam" }, t("tasteProb")), el("div", { class: "big" }, L === "tr" ? `%${fmtPct(p, 0)}` : `${fmtPct(p, 0)}%`),
    el("div", { class: "meter" }, el("i", { style: `width:${p * 100}%` })),
    el("div", { class: "note" }, `${t("contrib")}: ` + ids.map((i) => `${label(D.desc[i])} ${D.desc[i].c > 0 ? "+" : ""}${fmtNum(D.desc[i].c, 2)}`).join(" · ")),
    el("div", { class: "sec" }, el("h4", {}, t("tasteTop")), el("ul", { class: "results" }, top.map(([s, j]) =>
      el("li", {}, el("button", { type: "button", onclick: () => { S.wine = j; renderDetail(); } },
        el("span", { class: "nm" }, D.names[w.l[j]]), el("span", { class: "meta" }, `${w.y[j]} · ${w.s[j]} · ${fmtPct(s, 0)}%`)))))));
}

/* ------------------------------------------------------------------ nearest shops */
function haversine(a, b) {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function findShops(loc) {
  S.loc = [Math.round(loc[0] * 1000) / 1000, Math.round(loc[1] * 1000) / 1000];   // ~100 m, privacy
  S.shops = "loading"; renderDetail();
  for (const radius of [3000, 10000, 30000]) {
    const q = `[out:json][timeout:20];(nwr["shop"~"^(wine|alcohol|beverages)$"](around:${radius},${S.loc[0]},${S.loc[1]});nwr["craft"="winery"](around:${radius},${S.loc[0]},${S.loc[1]}););out center 80;`;
    try {
      const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!r.ok) throw new Error(r.status);
      const js = await r.json();
      const items = js.elements.map((e) => {
        const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon, tg = e.tags || {};
        return { id: `${e.type}/${e.id}`, name: tg.name || tg.brand || t("unnamed"), kind: tg.craft === "winery" ? "winery" : tg.shop,
                 lat, lon, d: haversine(S.loc, [lat, lon]) };
      }).filter((x) => x.lat).sort((a, b) => a.d - b.d);
      if (items.length >= 5 || radius === 30000) { S.shops = items.slice(0, 12); renderDetail(); return; }
    } catch (e) { S.shops = "error"; renderDetail(); return; }
  }
}

function shopsBlock() {
  const sel = el("select", { "aria-label": t("orCity"), onchange: (e) => { const p = D.provinces[+e.target.value]; if (p) findShops([p[1], p[2]]); } },
    el("option", { value: "" }, t("orCity")), D.provinces.map((p, k) => el("option", { value: k }, p[0])));
  const btn = el("button", { class: "btn", type: "button", onclick: () => {
    if (!navigator.geolocation) { S.shops = "locerr"; renderDetail(); return; }
    navigator.geolocation.getCurrentPosition((pos) => findShops([pos.coords.latitude, pos.coords.longitude]),
      () => { S.shops = "locerr"; renderDetail(); }, { timeout: 10000, maximumAge: 600000 });
  } }, t("useLoc"));
  let body = null;
  if (S.shops === "loading") body = el("p", { class: "note" }, t("searching"));
  else if (S.shops === "error") body = el("p", { class: "note" }, t("ovErr"));
  else if (S.shops === "locerr") body = el("p", { class: "note" }, t("locErr"));
  else if (Array.isArray(S.shops)) body = S.shops.length ? el("ul", { class: "shops" }, S.shops.map((s) => el("li", {},
    el("span", { class: "d" }, `${fmtNum(s.d, 1)} ${t("km")}`), el("span", { style: "flex:1" }, el("b", {}, s.name), " ", el("span", { class: "muted" }, t("shopType")[s.kind] || "")),
    el("a", { href: `https://www.openstreetmap.org/${s.id}`, target: "_blank", rel: "noopener" }, t("open")), " · ",
    el("a", { href: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`, target: "_blank", rel: "noopener" }, t("route")))))
    : el("p", { class: "note" }, t("none"));
  return el("div", { class: "sec" }, el("h4", {}, t("where")), el("p", { class: "note", style: "margin:0 0 8px" }, t("whereTxt")),
    el("div", { class: "row" }, btn, sel), body, el("p", { class: "note" }, t("legal")),
    el("p", { class: "note" }, "© OpenStreetMap contributors (ODbL)"));
}

/* ------------------------------------------------------------------ charts (plain SVG) */
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const tip = $("#tip");
function hover(node, html) {
  const show = (e) => { tip.textContent = html; tip.style.opacity = 1; const x = e.clientX ?? node.getBoundingClientRect().x; const y = e.clientY ?? node.getBoundingClientRect().y; tip.style.left = x + 12 + "px"; tip.style.top = y + 12 + "px"; };
  node.addEventListener("pointermove", show); node.addEventListener("focus", show);
  node.addEventListener("pointerleave", () => (tip.style.opacity = 0)); node.addEventListener("blur", () => (tip.style.opacity = 0));
  node.setAttribute("tabindex", "0");
}
function table(rows, head) {
  return el("details", { class: "tbl" }, el("summary", {}, L === "tr" ? "Tabloyu göster" : "Show table"),
    el("table", {}, el("tr", {}, head.map((h) => el("th", {}, h))), rows.map((r) => el("tr", {}, r.map((c) => el("td", {}, c))))));
}

function dotPlot(host, rows, { min, max, fmt, ref, refLabel }) {
  const W = 520, rowH = 30, left = 170, right = 60, H = rows.length * rowH + 30;
  const x = (v) => left + ((v - min) / (max - min)) * (W - left - right);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const v of [min, (min + max) / 2, max]) { s.append(sv("line", { class: "ax", x1: x(v), x2: x(v), y1: 4, y2: H - 22 })); const tx = sv("text", { x: x(v), y: H - 6, "text-anchor": "middle" }); tx.textContent = fmt(v); s.append(tx); }
  if (ref !== undefined) { s.append(sv("line", { x1: x(ref), x2: x(ref), y1: 4, y2: H - 22, stroke: "var(--ink)", "stroke-width": 1.5 })); const tx = sv("text", { x: x(ref) + 4, y: 14 }); tx.textContent = refLabel; s.append(tx); }
  rows.forEach((r, k) => {
    const y = 18 + k * rowH;
    const lb = sv("text", { x: left - 10, y: y + 4, "text-anchor": "end" }); lb.textContent = r.label; s.append(lb);
    s.append(sv("line", { class: "guide", x1: x(min), x2: x(r.value), y1: y, y2: y }));
    const g = sv("g"); g.append(sv("circle", { class: "mk" + (r.hl ? "" : " n"), cx: x(r.value), cy: y, r: 6, stroke: "var(--surface)", "stroke-width": 2 }));
    g.append(sv("rect", { class: "hit", x: left, y: y - 12, width: W - left, height: 24 }));
    hover(g, `${r.label}: ${fmt(r.value)}${r.sd ? ` ± ${fmt(r.sd)}` : ""}`); s.append(g);
    const vt = sv("text", { x: x(r.value) + 10, y: y + 4 }); vt.textContent = fmt(r.value); s.append(vt);
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, fmt(r.value)]), ["", ""]));
}

function divBars(host, rows) {
  const W = 520, rowH = 22, mid = 260, H = rows.length * rowH + 10;
  const mx = Math.max(...rows.map((r) => Math.abs(r.value)));
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { class: "ax", x1: mid, x2: mid, y1: 0, y2: H }));
  rows.forEach((r, k) => {
    const y = 6 + k * rowH, w = (Math.abs(r.value) / mx) * 150;
    const g = sv("g");
    g.append(sv("rect", { class: "bar" + (r.value > 0 ? "" : " n"), x: r.value > 0 ? mid : mid - w, y, width: Math.max(w, 1), height: 14, rx: 3 }));
    g.append(sv("rect", { class: "hit", x: 0, y: y - 3, width: W, height: rowH }));
    hover(g, `${r.label}: ${r.value > 0 ? "+" : ""}${fmtNum(r.value, 2)} (${r.n} ${L === "tr" ? "inceleme" : "reviews"})`);
    const tx = sv("text", { x: r.value > 0 ? mid - 8 : mid + 8, y: y + 11, "text-anchor": r.value > 0 ? "end" : "start" }); tx.textContent = r.label;
    s.append(g, tx);
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, fmtNum(r.value, 2), r.n]), ["", "log-odds", "n"]));
}

function bars(host, rows, fmt) {
  const W = 520, rowH = 34, left = 80, H = rows.length * rowH + 8;
  const mx = Math.max(...rows.map((r) => r.value));
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  rows.forEach((r, k) => {
    const y = 6 + k * rowH, w = (r.value / mx) * (W - left - 70);
    const lb = sv("text", { x: left - 10, y: y + 15, "text-anchor": "end" }); lb.textContent = r.label;
    const g = sv("g"); g.append(sv("rect", { class: "bar" + (r.hl ? "" : " n"), x: left, y, width: w, height: 20, rx: 4 }));
    hover(g, `${r.label}: ${fmt(r.value)}`);
    const vt = sv("text", { x: left + w + 8, y: y + 15 }); vt.textContent = fmt(r.value);
    s.append(lb, g, vt);
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, fmt(r.value)]), ["", ""]));
}

function renderCharts() {
  const R = D.results, C = R.comparison;
  const get = (d, f, m) => C.find((r) => r.design === d && r.features === f && r.model === m);
  const nm = { majority: L === "tr" ? "Hep \"≤89\"" : "Always \"≤89\"", naive_bayes: "Naive Bayes", logistic: L === "tr" ? "Lojistik regresyon" : "Logistic regression",
    linear_svm: L === "tr" ? "Doğrusal SVM" : "Linear SVM", random_forest: L === "tr" ? "Rastgele orman" : "Random forest", gradient_boosting: L === "tr" ? "Gradyan artırma" : "Gradient boosting" };
  const rows = ["naive_bayes", "linear_svm", "logistic", "gradient_boosting"].map((m) => ({ label: nm[m], value: get("grouped", "all", m).accuracy, sd: get("grouped", "all", m).accuracy_sd, hl: m === "logistic" }))
    .concat([{ label: nm.random_forest + (L === "tr" ? " (rastgele kat)" : " (random folds)"), value: get("random", "all", "random_forest").accuracy, sd: get("random", "all", "random_forest").accuracy_sd }]);
  rows.sort((a, b) => b.value - a.value);
  const pct = (v) => `${fmtPct(v)}%`;
  dotPlot($("#c1"), rows, { min: 0.65, max: 0.9, fmt: pct, ref: get("grouped", "all", "majority").accuracy, refLabel: L === "tr" ? "taban" : "baseline" });
  const ab = ["all", "descriptive", "sensory"].map((f) => ({ label: ({ all: L === "tr" ? "Tüm 616 kelime" : "All 616 words", descriptive: L === "tr" ? "Yalnız betimleme/övgü" : "Praise/descriptive only", sensory: L === "tr" ? "Yalnız tat ve yapı" : "Flavour & structure only" })[f], value: get("grouped", f, "logistic").roc_auc, hl: f === "descriptive" }));
  dotPlot($("#c2"), ab, { min: 0.5, max: 1, fmt: (v) => fmtNum(v, 3), ref: 0.5, refLabel: L === "tr" ? "yazı-tura" : "coin flip" });
  const tw = R.top[S.wordSet], lab = (a) => { const d = D.desc.find((x) => x.a === a); return d ? label(d) : a; };
  divBars($("#c3"), [...tw.pos.slice(0, 8).map((r) => ({ label: lab(r.attribute), value: r.coef, n: r.n_reviews })),
    ...tw.neg.slice(0, 8).reverse().map((r) => ({ label: lab(r.attribute), value: r.coef, n: r.n_reviews }))].sort((a, b) => b.value - a.value));
  const pb = R.price.median_price_by_band;
  bars($("#c4"), Object.entries(pb).map(([k, v]) => ({ label: k, value: v, hl: k.startsWith("9") })), (v) => `$${fmtNum(v)}`);
}
for (const [id, set] of [["#w-s", "sensory"], ["#w-a", "all"]]) {
  $(id).addEventListener("click", () => { S.wordSet = set; $("#w-s").setAttribute("aria-pressed", set === "sensory"); $("#w-a").setAttribute("aria-pressed", set === "all"); renderCharts(); });
}

/* ------------------------------------------------------------------ boot */
paintStatic();
try { if (!localStorage.getItem("age-ok")) { const dlg = $("#age"); dlg.showModal(); dlg.addEventListener("close", () => { if (dlg.returnValue === "yes") localStorage.setItem("age-ok", "1"); }); } } catch (e) {}
fetch("data/wine.json").then((r) => r.json()).then((d) => {
  D = d; paintNumbers(); renderLeft(); renderDetail(); renderCharts();
}).catch(() => { $("#detail").textContent = "data/wine.json could not be loaded (open via a web server, e.g. python -m http.server)."; });
