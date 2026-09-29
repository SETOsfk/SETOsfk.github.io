/* Scotch Whisky Flavour Atlas — static explorer. No framework, no tracking; the only outside call is the
   optional OpenStreetMap Overpass query the visitor triggers with "find shops near me". */
"use strict";

const I18N = {
  tr: {
    crumb: "Projeler / Viski tat atlası", kicker: "Veri bilimi · 86 damıtımevi · 12 tat · Python + R",
    finderLink: "Yeni: viski ve şarap bulucu — tadı seç, yanına peynir ekle, en yakın mağazayı gör →",
    title: "İskoç viskisinin tadı coğrafyayı izliyor mu?",
    lede: "86 İskoç damıtımevinin 12 boyutlu tat profili haritada. Tat gerçekten bölgeye mi bağlı, yoksa bu yalnız Islay'in dumanı mı? Her damıtımevi için benzerleri, Türkiye'de satılan en yakın tat, peynir eşleşmesi ve en yakın satış noktası.",
    appTitle: "Damıtımevini keşfet", appSub: "Haritadan ya da adından bir damıtımevi seç — veya sevdiğin tadı ayarla, en yakın damıtımevlerini ve Türkiye'de bulabileceklerini gör.",
    tabMap: "Harita", tabTaste: "Tadına göre", searchPh: "Damıtımevi ara… (ör. Lagavulin, Macallan)", colorBy: "Renk",
    peatIdx: "Turba (duman + iyot)", styleCol: "Tarz", pickHint: "Haritadan ya da listeden bir damıtımevi seç — ayrıntılar burada açılır.",
    islay: "Islay", profile: "Tat profili (0–4; çizgi = 86 damıtımevi ortalaması)", similar: "Tadı en çok benzeyenler", match: "tat eşleşmesi",
    onShelf: "Türkiye'de satılan şişeleri", trAlt: "Türkiye'de bulabileceğin en yakın tatlar",
    trNote: "İskoç viskisi yalnız İskoçya'da üretilebilir; bu yüzden \"muadil\" burada Türkiye'de satılan, tat profili en yakın damıtımevinin şişeleri. Eşleşme: 100 − profil uzaklığı / olası en büyük uzaklık.",
    priceTl: (p, d) => `≈ ${p} TL (${d} liste fiyatı)`, noPrice: "fiyat listede yok", source: "kaynak",
    wa: "Whisky Advocate", waNone: "Bu damıtımevi için eşleşen inceleme yok.",
    waLine: (n, p, u) => `${n} inceleme · medyan ${p} puan${u ? ` · medyan $${u}` : ""}`,
    resid: (v) => `Fiyatına göre beklenenden ${v >= 0 ? "+" : "−"}${fmtNum(Math.abs(v), 1)} puan`,
    topBottles: "En yüksek puanlı şişeler", pts: "puan", cheese: "Yanına peynir",
    where: "Nereden alırım?", whereTxt: "Konumuna en yakın içki satış noktaları (OpenStreetMap). Konumun yalnız bu sorgu için yuvarlanarak gönderilir, saklanmaz.",
    useLoc: "Konumumu kullan", orCity: "ya da il seç", searching: "Aranıyor…", none: "Bu yarıçapta kayıtlı satış noktası bulunamadı.",
    locErr: "Konum alınamadı — il seçebilirsin.", ovErr: "OpenStreetMap şu an yanıt vermedi; biraz sonra tekrar dene.",
    km: "km", open: "haritada aç", route: "yol tarifi", unnamed: "(adsız)",
    shopType: { wine: "şarap dükkânı", alcohol: "tekel / içki", beverages: "içecek" },
    legal: "Türkiye'de alkollü içki 22.00–06.00 arası perakende satılamaz, 18 yaş altına satılamaz; posta ile satış yapılamaz (4250 s. Kanun md. 6). Bu yüzden çevrimiçi satış bağlantısı yok.",
    presets: "Hazır tatlar (tarz ortalaması)", tasteTop: "Bu tada en yakın damıtımevleri", tasteTr: "Türkiye'de bulabileceklerin",
    shelfTitle: "Türkiye rafı", shelfSub: "Türkiye'de satılan İskoç viskileri, liste fiyatı ve Whisky Advocate puanı (eşleşen incelemelerin medyanı). Başlığa tıklayarak sırala.",
    shelfHead: ["Şişe", "Damıtımevi", "TL", "WA puanı (n)", "Kaynak"], blend: "harman",
    anTitle: "Nasıl analiz ettim", anSub: "Önce yapı (PCA, kümeler), sonra coğrafya (Mantel testi, komşuluk tahmini, permütasyon), en son puanlar (OLS, Spearman + Holm). Her sayının yanında bir kıyas.",
    c1t: "Tat haritası: iki eksen", c1s: "PCA (kovaryans). Sağa gittikçe duman ve iyot, yukarı gittikçe şeri ve gövde. Noktaya tıkla: damıtımevi açılır.",
    c2t: "Kaç tat ailesi var?", c2s: "Ward kümelemesinde k'ya göre ortalama siluet. 0,25'in altı zayıf yapı demek.",
    c3t: "Konum tadı tahmin ediyor mu?", c3s: "En yakın 5 damıtımevinin ortalaması, düz ortalamadan ne kadar iyi tahmin ediyor (beceri > 0 = konum işe yarıyor).",
    c4t: "Fiyat puanı ne kadar artırıyor?", c4s: "Fiyat bandına göre Whisky Advocate puanı: medyan ve çeyrekler arası aralık.",
    c5t: "Whisky Advocate hangi tadı ödüllendiriyor?", c5s: "Damıtımevinin tat puanı ile medyan inceleme puanı arasında Spearman ρ (≥ 5 incelemeli damıtımevleri). Gri = anlamsız.",
    c6t: "Fiyatına göre en çok ve en az puan", c6s: "Fiyattan beklenen puanın üstünde/altında kalma (medyan artık, ≥ 10 inceleme).",
    found: "Ne buldum", care: "Dikkat",
    fData: "Veri ve lisans", fDataTxt: "Tat atlası: Pope, A. (2017) Scotch Whisky characteristics, Edinburgh DataShare, doi:10.7488/ds/1942 — CC BY-SA 3.0; tat puanları Strathclyde Üniversitesi \"Nessie\" sayfasından. Harita: Natural Earth (kamu malı). Whisky Advocate puan ve fiyatları: Kaggle (neilcosgrove, CC0 olarak listelenmiş); inceleme metinleri kullanılmadı. Türkiye fiyatları: habergazetesi.com.tr (Eylül 2026), Diageo ve Pernod Ricard Türkiye. Bu sayfadaki türetilmiş veri CC BY-SA 3.0.",
    fMethod: "Yöntem", fMethodTxt: "Kovaryans PCA; Ward + siluet, k-means ile ARI; Spearman Mantel testi (9.999 permütasyon); birini dışarıda bırakan 5-komşu tahmini + 999 permütasyon, Holm düzeltmesi; log2(fiyat) üzerine OLS. Python (NumPy, SciPy, scikit-learn, statsmodels) ve R (temel R + cluster) aynı sonuçları üretir.",
    fRepro: "Yeniden üret", fLegal: "Not", fLegalTxt: "Ticari değildir; hiçbir üretici ya da satıcıyla bağı yoktur, satış yapmaz. 18 yaş ve üzeri içindir.",
    age18: "Bu sayfa alkollü içecekler hakkında bilgi içerir. 18 yaşından büyük müsün?", ageYes: "Evet, 18+", ageNo: "Hayır",
    showTable: "Tabloyu göster", allIslay: "86 damıtımevi", noIslay: "Islay'siz (79)", sigNote: "* Holm p < 0,05",
    kpi: (n) => [["Coğrafya ↔ tat", `ρ ${n.m1} → ${n.m2}`, `Mantel testi · Islay çıkınca p ${n.p1} → ${n.p2}`],
                 ["Konumdan tahmin", `12 tattan ${n.nSkill}`, `yalnız iyot (+${n.sMed}) ve duman (+${n.sSmoke}) düz ortalamadan iyi`],
                 ["Fiyat 2 katına çıkınca", `+${n.slope} puan`, `%95 GA ${n.lo}–${n.hi} · Spearman ${n.rho} · n ${n.nPriced}`],
                 ["Türkiye rafında", `${n.nShelfD} damıtımevi`, `${n.nMalt} tek malt + ${n.nBlend} harman şişe, TL liste fiyatı (Eylül 2026)`]],
  },
  en: {
    crumb: "Projects / Whisky flavour atlas", kicker: "Data science · 86 distilleries · 12 flavours · Python + R",
    finderLink: "New: whisky & wine finder — pick a taste, add a cheese, find the nearest shop →",
    title: "Does Scotch whisky taste follow geography?",
    lede: "The 12-dimension flavour profiles of 86 Scotch distilleries on a map. Is taste really regional — or is it just Islay's smoke? For every distillery: similar ones, the closest taste sold in Türkiye, a cheese to pair and the nearest shop.",
    appTitle: "Explore a distillery", appSub: "Pick a distillery on the map or by name — or dial in the taste you like and see the closest distilleries and what you can buy in Türkiye.",
    tabMap: "Map", tabTaste: "By taste", searchPh: "Search distilleries… (e.g. Lagavulin, Macallan)", colorBy: "Colour",
    peatIdx: "Peat (smoky + medicinal)", styleCol: "Style", pickHint: "Pick a distillery on the map or in the list — details open here.",
    islay: "Islay", profile: "Flavour profile (0–4; tick = mean of 86 distilleries)", similar: "Most similar in taste", match: "taste match",
    onShelf: "Its bottles sold in Türkiye", trAlt: "Closest tastes you can buy in Türkiye",
    trNote: "Scotch can only be made in Scotland, so \"equivalent\" here means bottles sold in Türkiye from the distillery with the closest flavour profile. Match: 100 − profile distance / largest possible distance.",
    priceTl: (p, d) => `≈ ${p} TL (${d} list price)`, noPrice: "no price listed", source: "source",
    wa: "Whisky Advocate", waNone: "No matching reviews for this distillery.",
    waLine: (n, p, u) => `${n} reviews · median ${p} pts${u ? ` · median $${u}` : ""}`,
    resid: (v) => `${v >= 0 ? "+" : "−"}${fmtNum(Math.abs(v), 1)} pts versus what its price predicts`,
    topBottles: "Top-scored bottles", pts: "pts", cheese: "Cheese to pair",
    where: "Where can I buy it?", whereTxt: "Liquor shops nearest to you (OpenStreetMap). Your location is rounded and sent only for this query, never stored.",
    useLoc: "Use my location", orCity: "or pick a province", searching: "Searching…", none: "No shop mapped within this radius.",
    locErr: "Couldn't get your location — pick a province instead.", ovErr: "OpenStreetMap didn't answer; try again shortly.",
    km: "km", open: "open map", route: "directions", unnamed: "(unnamed)",
    shopType: { wine: "wine shop", alcohol: "liquor store", beverages: "beverages" },
    legal: "In Türkiye alcohol cannot be sold at retail between 22:00 and 06:00, to under-18s, or by mail (Law 4250, art. 6) — hence no online-shop links.",
    presets: "Presets (style averages)", tasteTop: "Distilleries closest to this taste", tasteTr: "What you can buy in Türkiye",
    shelfTitle: "The Turkish shelf", shelfSub: "Scotch sold in Türkiye with list prices and the Whisky Advocate score (median of matching reviews). Click a header to sort.",
    shelfHead: ["Bottle", "Distillery", "TL", "WA score (n)", "Source"], blend: "blend",
    anTitle: "How I analysed it", anSub: "Structure first (PCA, clusters), then geography (Mantel test, neighbour prediction, permutations), scores last (OLS, Spearman + Holm). A comparison next to every number.",
    c1t: "A flavour map in two axes", c1s: "PCA (covariance). Right = more smoke and iodine, up = more sherry and body. Click a dot to open the distillery.",
    c2t: "How many flavour families?", c2s: "Mean silhouette of Ward clusters by k. Below 0.25 means weak structure.",
    c3t: "Does location predict taste?", c3s: "How much better the 5 nearest distilleries predict than the plain average (skill > 0 = location helps).",
    c4t: "How much do points rise with price?", c4s: "Whisky Advocate score by price band: median and interquartile range.",
    c5t: "Which flavour does Whisky Advocate reward?", c5s: "Spearman ρ between a distillery's flavour score and its median review score (distilleries with ≥ 5 reviews). Grey = not significant.",
    c6t: "Most and fewest points for the price", c6s: "Points above/below what the price predicts (median residual, ≥ 10 reviews).",
    found: "What I found", care: "Read with care",
    fData: "Data & licence", fDataTxt: "Flavour atlas: Pope, A. (2017) Scotch Whisky characteristics, Edinburgh DataShare, doi:10.7488/ds/1942 — CC BY-SA 3.0; flavour scores from the University of Strathclyde \"Nessie\" page. Map: Natural Earth (public domain). Whisky Advocate scores and prices: Kaggle (neilcosgrove, listed as CC0); review texts not used. Türkiye prices: habergazetesi.com.tr (September 2026), Diageo and Pernod Ricard Türkiye. Derived data on this page: CC BY-SA 3.0.",
    fMethod: "Method", fMethodTxt: "Covariance PCA; Ward + silhouette, ARI against k-means; Spearman Mantel test (9,999 permutations); leave-one-out 5-neighbour prediction + 999 permutations, Holm correction; OLS on log2(price). Python (NumPy, SciPy, scikit-learn, statsmodels) and R (base R + cluster) give the same results.",
    fRepro: "Reproduce", fLegal: "Note", fLegalTxt: "Non-commercial; no tie to any producer or seller, sells nothing. For adults 18+.",
    age18: "This page contains information about alcoholic drinks. Are you 18 or older?", ageYes: "Yes, 18+", ageNo: "No",
    showTable: "Show table", allIslay: "86 distilleries", noIslay: "without Islay (79)", sigNote: "* Holm p < 0.05",
    kpi: (n) => [["Geography ↔ taste", `ρ ${n.m1} → ${n.m2}`, `Mantel test · without Islay p ${n.p1} → ${n.p2}`],
                 ["Predicting from location", `${n.nSkill} of 12 flavours`, `only medicinal (+${n.sMed}) and smoky (+${n.sSmoke}) beat the plain average`],
                 ["Doubling the price", `+${n.slope} pts`, `95% CI ${n.lo}–${n.hi} · Spearman ${n.rho} · n ${n.nPriced}`],
                 ["On the Turkish shelf", `${n.nShelfD} distilleries`, `${n.nMalt} single-malt + ${n.nBlend} blend bottles, TL list prices (Sept 2026)`]],
  },
};
const FLAV = {
  tr: ["Gövde", "Tatlılık", "Duman", "İyot / tıbbi", "Tütün", "Bal", "Baharat", "Şarapsı / şeri", "Kuruyemiş", "Malt", "Meyve", "Çiçek"],
  en: ["Body", "Sweetness", "Smoky", "Medicinal", "Tobacco", "Honey", "Spicy", "Winey / sherry", "Nutty", "Malty", "Fruity", "Floral"],
};
const STYLE = { tr: ["dumanlı / iyotlu", "şeri / şarapsı", "hafif", "ballı / dengeli"], en: ["smoky / medicinal", "sherried / winey", "light", "honeyed / balanced"] };
const FOUND = {
  tr: (n) => [
    `İki eksen tat farklarının %${n.v12} kadarını taşıyor: birinci eksen (%${n.v1}) duman-iyot-gövdeye karşı çiçek-tatlılık-meyve, ikincisi (%${n.v2}) şeri ve gövde.`,
    `Turbanın dışında gerçek "aile" yok: siluet en iyi k = 2 için (${n.s2}: 6 yoğun turbalı damıtımevi ile geri kalan 80); k ≥ 3 için en fazla ${n.sMax}. Bu yüzden uygulama küme yerine en yakın komşularla öneri yapıyor.`,
    `Coğrafya ile tat arasındaki ilişki (Mantel ρ ${n.m1}, p ${n.p1}) Islay çıkarılınca ρ ${n.m2} düzeyine iniyor ve anlamlılığını kaybediyor (p ${n.p2}). En yakın 5 damıtımevi, 12 tattan ${n.nNeg} tanesinde düz ortalamadan bile kötü tahmin ediyor.`,
    `Whisky Advocate'te fiyat iki katına çıkınca puan ortalama +${n.slope} artıyor. Ama hiçbir tat boyutu damıtımevinin medyan puanıyla anlamlı ilişkili değil (${n.nWa} damıtımevi; en güçlüsü iyot, ρ ${n.bestRho}, Holm p ${n.bestP}).`,
    `Veri kontrolü: inceleme metinleri ilk ${n.top} satırdan sonra şişe adlarıyla eşleşmiyor (metnin kendi markasını anma oranı %${n.same}, kaydırılmış satırlarda %${n.shift}; ilk ${n.top} satırda %${n.sameTop}). Metinler bu yüzden kullanılmadı; yaş–fiyat uyumu (ρ ${n.agePrice}) ad, puan ve fiyatın tutarlı olduğunu gösteriyor.`,
  ],
  en: (n) => [
    `Two axes carry ${n.v12}% of the flavour differences: the first (${n.v1}%) is smoke-iodine-body versus floral-sweet-fruity, the second (${n.v2}%) sherry and body.`,
    `Beyond peat there are no real "families": the silhouette peaks at k = 2 (${n.s2}: 6 heavily peated distilleries versus the other 80) and never passes ${n.sMax} for k ≥ 3. So the app recommends by nearest neighbours, not clusters.`,
    `The geography–taste link (Mantel ρ ${n.m1}, p ${n.p1}) drops to ${n.m2} without Islay and is no longer significant (p ${n.p2}). The 5 nearest distilleries predict ${n.nNeg} of 12 flavours worse than the plain average.`,
    `In Whisky Advocate, doubling the price goes with +${n.slope} points. But no flavour dimension is significantly related to a distillery's median score (${n.nWa} distilleries; strongest is medicinal, ρ ${n.bestRho}, Holm p ${n.bestP}).`,
    `Data check: review texts stop matching bottle names after row ${n.top} (text names its own brand ${n.same}% of the time vs ${n.shift}% for shifted rows; ${n.sameTop}% in the first ${n.top}). So texts are not used; age–price agreement (ρ ${n.agePrice}) shows names, scores and prices are consistent.`,
  ],
};
const CARE = {
  tr: (n) => [
    "Her damıtımevi için tek profil var; aynı damıtımevinin turbalı/turbasız serileri ve yıllar içindeki değişim görünmez. Puanların tadım yöntemi kaynakta belgelenmemiş.",
    `Koordinatlar posta kodu düzeyinde: 86 damıtımevi ${n.pts} ayrı noktada, ${n.share} tanesi bir başkasıyla aynı noktayı paylaşıyor (haritada çevresine dağıtıldı). 86 damıtımevi bugünkü listenin tamamı değil.`,
    "Whisky Advocate fiyatları inceleme dönemindeki ABD fiyatı; Türkiye fiyatları bir haber sitesinin derlediği liste fiyatı (Eylül 2026) ve mağazaya göre değişir.",
  ],
  en: (n) => [
    "One profile per distillery: peated and unpeated lines of the same distillery, and change over the years, are invisible. The tasting method behind the scores is not documented at the source.",
    `Coordinates are postcode-level: the 86 distilleries sit on ${n.pts} distinct points and ${n.share} share a point with another (fanned out on the map). The 86 are not today's full list.`,
    "Whisky Advocate prices are US prices at review time; Türkiye prices are a news site's compiled list prices (September 2026) and vary by shop.",
  ],
};

let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("whisky-lang") || L; } catch (e) {}
const t = (k) => I18N[L][k];
let D = null;
const S = { mode: "map", i: null, q: "", color: "peat", want: null, shops: null, sort: [2, 1] };

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
const loc = () => (L === "tr" ? "tr-TR" : "en-GB");
const fmtNum = (x, d = 0) => x.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: d });
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const flav = (k) => FLAV[L][k];
const MAXD = 4 * Math.sqrt(12);                                   // farthest two 0–4 profiles can be
const matchPct = (dd) => Math.round(100 * (1 - dd / MAXD));
const dist = (a, b) => Math.sqrt(a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0));
const peat = (i) => D.d.f[i][2] + D.d.f[i][3];
const f2 = (v) => fmtNum(v, 2), sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + f2(Math.abs(v));

/* ------------------------------------------------------------------ chrome */
function paintStatic() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { const v = t(n.dataset.i === "age" ? "age18" : n.dataset.i); if (typeof v === "string") n.textContent = v; });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
}
function numbers() {
  const R = D.results, A = R.atlas, G = R.geography, P = R.price, W = R.wa, g = (a) => R.geography_table.find((r) => r.attribute === a);
  const fp = R.flavour_points ? [...R.flavour_points].sort((a, b) => a.p_perm - b.p_perm)[0] : null;
  const pc = (x) => fmtNum(100 * x, 0);
  const sil = A.silhouette, sMax = Math.max(...Object.entries(sil).filter(([k]) => +k >= 3).map(([, v]) => v));
  return { m1: f2(G.mantel_rho), m2: f2(G.mantel_rho_without_islay), p1: fmtNum(G.mantel_p, 3), p2: f2(G.mantel_p_without_islay),
    nSkill: R.geography_table.filter((r) => r.skill > 0 && r.p_holm < 0.05).length, sMed: f2(g("Medicinal").skill), sSmoke: f2(g("Smoky").skill),
    nNeg: R.geography_table.filter((r) => r.skill < 0).length,
    slope: P ? f2(P.points_per_doubling) : "—", lo: P ? f2(P.ci95[0]) : "", hi: P ? f2(P.ci95[1]) : "", rho: P ? f2(P.price_spearman) : "",
    nPriced: P ? fmtNum(P.n_priced) : "", agePrice: P ? f2(P.age_price_spearman) : "",
    nMalt: D.shelf.filter((s) => s.distillery).length, nBlend: D.shelf.filter((s) => !s.distillery).length, nShelfD: new Set(D.shelf.map((s) => s.distillery).filter(Boolean)).size,
    pts: A.distinct_points, share: A.sharing_a_point, v1: pc(A.pca_var[0]), v2: pc(A.pca_var[1]), v12: pc(A.pca_var[0] + A.pca_var[1]), s2: f2(sil["2"]), sMax: f2(Math.ceil(sMax * 100) / 100),
    nWa: W ? W.n_distilleries_5plus : "—", bestRho: fp ? f2(fp.rho) : "", bestP: fp ? f2(fp.p_holm) : "",
    top: W ? W.text_alignment.rows_top : "", same: W ? fmtNum(100 * W.text_alignment.same_row_rest, 1) : "",
    shift: W ? fmtNum(100 * W.text_alignment.shifted_rest, 1) : "", sameTop: W ? fmtNum(100 * W.text_alignment.same_row_top, 0) : "" };
}
function paintNumbers() {
  const n = numbers();
  $("#kpis").replaceChildren(...t("kpi")(n).map((k, i) => el("div", { class: "kpi" + (i === 0 ? " hi" : "") },
    el("div", { class: "l" }, k[0]), el("div", { class: "v" }, k[1]), el("div", { class: "c" }, k[2]))));
  $("#found").replaceChildren(...FOUND[L](n).map((x) => el("li", {}, x)));
  $("#care").replaceChildren(...CARE[L](n).map((x) => el("li", {}, x)));
}
function paintAll() { paintStatic(); if (D) { paintNumbers(); renderLeft(); renderDetail(); renderShelf(); renderCharts(); } }
$("#lang").addEventListener("click", () => { L = L === "tr" ? "en" : "tr"; try { localStorage.setItem("whisky-lang", L); } catch (e) {} paintAll(); });
$("#theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const nxt = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nxt);
  try { localStorage.setItem("pd-theme", nxt); } catch (e) {}
});
function setMode(mode) {
  S.mode = mode;
  $("#tab-map").setAttribute("aria-pressed", mode === "map"); $("#tab-taste").setAttribute("aria-pressed", mode === "taste");
  renderLeft(); renderDetail();
}
$("#tab-map").addEventListener("click", () => setMode("map"));
$("#tab-taste").addEventListener("click", () => setMode("taste"));
function pick(i, scroll) {
  S.i = i; S.shops = null;
  if (S.mode !== "map") setMode("map"); else { renderLeft(); renderDetail(); }
  if (matchMedia("(max-width: 960px)").matches) $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
  else if (scroll) $("#left").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ------------------------------------------------------------------ left panel: map + list, or taste sliders */
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
function colourOf(i) {
  if (S.color === "style") return `var(--s${D.d.st[i]})`;
  const v = S.color === "peat" ? peat(i) / 8 : D.d.f[i][+S.color] / 4;
  return `color-mix(in srgb, var(--accent) ${Math.round(4 + 96 * v)}%, var(--surface))`;
}
function mapSvg() {
  const M = D.map, s = sv("svg", { viewBox: `0 0 ${M.w} ${M.h}`, class: "map", role: "img", "aria-label": L === "tr" ? "İskoçya damıtımevleri haritası" : "Map of Scotch distilleries" });
  s.append(sv("path", { d: M.path, class: "land" }));
  const order = D.d.n.map((_, i) => i).sort((a, b) => (a === S.i) - (b === S.i));      // selected dot on top
  for (const i of order) {
    const c = sv("circle", { cx: D.d.x[i], cy: D.d.y[i], r: i === S.i ? 11 : 7, class: "dot" + (i === S.i ? " sel" : "") + (D.d.tr[i].length ? " tr" : ""), fill: colourOf(i) });
    const lbl = S.color === "style" ? STYLE[L][D.d.st[i]] : S.color === "peat" ? `${peat(i)}/8` : `${D.d.f[i][+S.color]}/4`;
    hover(c, `${D.d.n[i]} · ${lbl}${D.d.tr[i].length ? " · TR" : ""}`, true);
    c.addEventListener("click", () => pick(i));
    s.append(c);
  }
  return s;
}
function renderLeft() {
  const box = $("#left");
  if (S.mode === "map") {
    const sel = el("select", { "aria-label": t("colorBy"), onchange: (e) => { S.color = e.target.value; renderLeft(); } },
      el("option", { value: "peat" }, t("peatIdx")), el("option", { value: "style" }, t("styleCol")),
      D.flavours.map((_, k) => el("option", { value: k }, flav(k))));
    sel.value = S.color;
    const legend = S.color === "style" ? el("div", { class: "legend" }, STYLE[L].map((s, k) => el("span", {}, el("i", { style: `background:var(--s${k})` }), s)))
      : el("div", { class: "legend" }, el("span", {}, el("i", { style: "background:color-mix(in srgb,var(--accent) 4%,var(--surface))" }), "0"),
        el("span", {}, el("i", { style: "background:var(--accent)" }), S.color === "peat" ? "8" : "4"), el("span", {}, el("i", { class: "ring" }), L === "tr" ? "Türkiye'de satılıyor" : "sold in Türkiye"));
    const inp = el("input", { class: "search", type: "search", placeholder: t("searchPh"), "aria-label": t("searchPh"), value: S.q });
    const ul = el("ul", { class: "results short" });
    const run = () => {
      S.q = inp.value; const q = norm(S.q.trim());
      const hits = D.d.n.map((_, i) => i).filter((i) => !q || norm(D.d.n[i]).includes(q));
      ul.replaceChildren(...hits.map((i) => el("li", {}, el("button", { type: "button", "aria-current": i === S.i, onclick: () => pick(i) },
        el("span", { class: "nm" }, D.d.n[i]), el("span", { class: "meta" }, `${STYLE[L][D.d.st[i]]}${D.d.tr[i].length ? " · TR" : ""}`)))));
    };
    inp.addEventListener("input", run);
    box.replaceChildren(el("div", { class: "row", style: "align-items:center;gap:8px" }, el("span", { class: "fam", style: "margin:0" }, t("colorBy")), sel), legend, mapSvg(), inp, ul);
    run();
  } else {
    if (!S.want) S.want = D.flavours.map((_, k) => Math.round(D.d.f.reduce((s, f) => s + f[k], 0) / D.d.n.length));
    const presets = D.styles.map((_, s) => {
      const idx = D.d.st.map((v, i) => [v, i]).filter(([v]) => v === s).map(([, i]) => i);
      return D.flavours.map((_, k) => Math.round(idx.reduce((a, i) => a + D.d.f[i][k], 0) / idx.length));
    });
    box.replaceChildren(
      el("div", { class: "fam" }, t("presets")),
      el("div", { class: "chips" }, STYLE[L].map((s, k) => el("button", { class: "chip", type: "button", onclick: () => { S.want = presets[k]; renderLeft(); renderDetail(); } }, s))),
      el("div", { class: "sliders" }, D.flavours.map((_, k) => el("label", {}, el("span", {}, flav(k)),
        el("input", { type: "range", min: 0, max: 4, step: 1, value: S.want[k], oninput: (e) => { S.want[k] = +e.target.value; e.target.nextSibling.textContent = e.target.value; renderDetail(); } }),
        el("b", { class: "mono" }, S.want[k])))));
  }
}

/* ------------------------------------------------------------------ detail */
function profileBars(f, avg) {
  return el("div", { class: "prof" }, D.flavours.flatMap((_, k) => [el("span", {}, flav(k)),
    el("div", { class: "meter" }, el("i", { style: `width:${(f[k] / 4) * 100}%` }), el("u", { style: `left:${(avg[k] / 4) * 100}%` })),
    el("span", { class: "mono muted" }, f[k])]));
}
const shelfOf = (i) => D.d.tr[i].map((k) => D.shelf[k]);
const tl = (p) => (p.price_tl ? +p.price_tl.split("–")[0].replace(/\./g, "") : Infinity);
function shelfCard(p) {
  return el("div", { class: "mini tr" }, el("b", {}, p.product),
    el("div", { class: "s" }, p.price_tl ? t("priceTl")(p.price_tl, p.as_of) : t("noPrice")),
    p.wa_points ? el("div", { class: "s" }, `Whisky Advocate: ${fmtNum(p.wa_points, 1)} ${t("pts")} (n ${p.wa_n})`) : null,
    el("a", { class: "s", href: p.source_url, target: "_blank", rel: "noopener" }, `${t("source")}: ${p.source_name}`));
}
function renderDetail() {
  const box = $("#detail");
  if (S.mode === "taste") { box.replaceChildren(tasteView()); return; }
  if (S.i === null) { box.replaceChildren(el("div", { class: "empty" }, t("pickHint"))); return; }
  const d = D.d, i = S.i, rule = D.rules.find((r) => r.rule_id === D.styles[d.st[i]]);
  const avg = D.flavours.map((_, k) => d.f.reduce((s, f) => s + f[k], 0) / d.n.length);
  const wa = d.wa[i];
  box.replaceChildren(
    el("h3", {}, d.n[i]),
    el("div", { class: "muted" }, [d.pc[i], STYLE[L][d.st[i]], d.isl[i] ? t("islay") : null].filter(Boolean).join(" · ")),
    el("div", { class: "sec" }, el("h4", {}, t("profile")), profileBars(d.f[i], avg)),
    d.tr[i].length ? el("div", { class: "sec" }, el("h4", {}, t("onShelf")), el("div", { class: "grid2" }, shelfOf(i).map(shelfCard))) : null,
    el("div", { class: "sec" }, el("h4", {}, t("trAlt")),
      el("div", { class: "grid2" }, d.alt[i].map(([j, dd]) => {
        const ps = shelfOf(j), cheapest = [...ps].sort((a, b) => tl(a) - tl(b))[0];
        return el("button", { class: "mini tr", type: "button", onclick: () => pick(j) }, el("b", {}, d.n[j]),
          el("span", { class: "s" }, `${matchPct(dd)}% ${t("match")} · ${STYLE[L][d.st[j]]}`),
          el("div", { class: "s" }, ps.map((p) => p.product).join(", ")),
          cheapest.price_tl ? el("div", { class: "s" }, t("priceTl")(cheapest.price_tl, cheapest.as_of)) : null);
      })),
      el("p", { class: "note" }, t("trNote"))),
    el("div", { class: "sec" }, el("h4", {}, t("similar")), el("div", { class: "grid2" }, d.nb[i].map(([j, dd]) =>
      el("button", { class: "mini", type: "button", onclick: () => pick(j) }, el("b", {}, d.n[j]), el("span", { class: "s" }, `${matchPct(dd)}% ${t("match")} · ${STYLE[L][d.st[j]]}`))))),
    el("div", { class: "sec" }, el("h4", {}, t("wa")), wa ? el("div", {},
      el("div", { class: "row" }, el("span", { class: "score" }, fmtNum(wa[1], 1)), el("span", { class: "muted" }, t("waLine")(wa[0], fmtNum(wa[1], 1), wa[2] ? fmtNum(wa[2]) : null))),
      wa[3] !== null ? el("span", { class: "badge" + (wa[3] > 0 ? " hi" : "") }, t("resid")(wa[3])) : null,
      d.b[i].length ? el("div", { class: "fam" }, t("topBottles")) : null,
      el("ul", { class: "plain" }, d.b[i].map(([nm, p, u]) => el("li", {}, el("span", { class: "mono" }, `${p}`), " ", nm, u ? el("span", { class: "muted" }, ` · $${fmtNum(u)}`) : null))))
      : el("p", { class: "note" }, t("waNone"))),
    cheeseBlock(rule), shopsBlock());
}
function cheeseBlock(rule) {
  const ids = rule.cheese_ids.split(";").map((id) => D.cheeses.find((c) => c.id === id));
  const card = (c) => el("div", { class: "mini" + (+c.is_turkish ? " tr" : "") }, el("b", {}, L === "tr" ? c.name_tr : c.name_en),
    el("span", { class: "s" }, `${L === "tr" ? c.origin_tr : c.origin_en} · ${L === "tr" ? c.note_tr : c.note_en}`));
  return el("div", { class: "sec" }, el("h4", {}, t("cheese")),
    el("p", { style: "margin:0 0 8px" }, L === "tr" ? rule.rationale_tr : rule.rationale_en, " ", el("a", { href: rule.source_url, target: "_blank", rel: "noopener" }, `(${rule.source_name})`)),
    el("div", { class: "grid2" }, ids.map(card)));
}
function tasteView() {
  const ranked = D.d.f.map((f, i) => [dist(f, S.want), i]).sort((a, b) => a[0] - b[0]);
  const row = ([dd, i], shelf) => el("li", {}, el("button", { type: "button", onclick: () => pick(i) },
    el("span", { class: "nm" }, D.d.n[i], shelf ? el("span", { class: "muted" }, ` — ${shelfOf(i).map((p) => p.product).join(", ")}`) : null),
    el("span", { class: "meta" }, `${matchPct(dd)}%`)));
  return el("div", {}, el("h4", { class: "fam" }, t("tasteTr")), el("ul", { class: "results" }, ranked.filter(([, i]) => D.d.tr[i].length).slice(0, 4).map((r) => row(r, true))),
    el("div", { class: "sec" }, el("h4", {}, t("tasteTop")), el("ul", { class: "results" }, ranked.slice(0, 8).map((r) => row(r, false)))));
}

/* ------------------------------------------------------------------ Turkish shelf table */
function renderShelf() {
  const [col, dir] = S.sort;
  const key = [(p) => p.product, (p) => p.distillery || "~", tl, (p) => p.wa_points ?? -1, (p) => p.source_name][col];
  const rows = [...D.shelf].sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
  const head = t("shelfHead").map((h, k) => el("th", { "aria-sort": k === col ? (dir > 0 ? "ascending" : "descending") : null },
    el("button", { class: "th", type: "button", onclick: () => { S.sort = [k, k === col ? -dir : 1]; renderShelf(); } }, h, k === col ? (dir > 0 ? " ↑" : " ↓") : "")));
  $("#shelf").replaceChildren(el("div", { class: "scroll shelf-wrap" }, el("table", {}, el("thead", {}, el("tr", {}, head)), el("tbody", {}, rows.map((p) => {
    const j = D.d.n.indexOf(p.distillery);
    return el("tr", {}, el("td", {}, p.product),
      el("td", {}, j >= 0 ? el("button", { class: "linkish", type: "button", onclick: () => pick(j, true) }, p.distillery) : el("span", { class: "muted" }, t("blend"))),
      el("td", { class: "mono" }, p.price_tl || "—"), el("td", { class: "mono" }, p.wa_points ? `${fmtNum(p.wa_points, 1)} (${p.wa_n})` : "—"),
      el("td", {}, el("a", { href: p.source_url, target: "_blank", rel: "noopener" }, p.source_name)));
  })))));
}

/* ------------------------------------------------------------------ shops (same as the wine app) */
function haversine(a, b) {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function findShops(p) {
  const at = [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];   // ~100 m, privacy
  S.shops = "loading"; renderDetail();
  for (const radius of [3000, 10000, 30000]) {
    const q = `[out:json][timeout:20];(nwr["shop"~"^(alcohol|wine|beverages)$"](around:${radius},${at[0]},${at[1]}););out center 80;`;
    try {
      const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!r.ok) throw new Error(r.status);
      const items = (await r.json()).elements.map((e) => { const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon, tg = e.tags || {};
        return { id: `${e.type}/${e.id}`, name: tg.name || tg.brand || t("unnamed"), kind: tg.shop, lat, lon, d: haversine(at, [lat, lon]) }; })
        .filter((x) => x.lat).sort((a, b) => a.d - b.d);
      if (items.length >= 5 || radius === 30000) { S.shops = items.slice(0, 12); renderDetail(); return; }
    } catch (e) { S.shops = "error"; renderDetail(); return; }
  }
}
function shopsBlock() {
  const sel = el("select", { "aria-label": t("orCity"), onchange: (e) => { const p = D.provinces[+e.target.value]; if (p) findShops([p[1], p[2]]); } },
    el("option", { value: "" }, t("orCity")), D.provinces.map((p, k) => el("option", { value: k }, p[0])));
  const btn = el("button", { class: "btn", type: "button", onclick: () => {
    if (!navigator.geolocation) { S.shops = "locerr"; renderDetail(); return; }
    navigator.geolocation.getCurrentPosition((pos) => findShops([pos.coords.latitude, pos.coords.longitude]), () => { S.shops = "locerr"; renderDetail(); }, { timeout: 10000, maximumAge: 600000 });
  } }, t("useLoc"));
  let body = null;
  if (S.shops === "loading") body = el("p", { class: "note" }, t("searching"));
  else if (S.shops === "error") body = el("p", { class: "note" }, t("ovErr"));
  else if (S.shops === "locerr") body = el("p", { class: "note" }, t("locErr"));
  else if (Array.isArray(S.shops)) body = S.shops.length ? el("ul", { class: "shops" }, S.shops.map((s) => el("li", {},
    el("span", { class: "d" }, `${fmtNum(s.d, 1)} ${t("km")}`), el("span", { style: "flex:1" }, el("b", {}, s.name), " ", el("span", { class: "muted" }, t("shopType")[s.kind] || "")),
    el("a", { href: `https://www.openstreetmap.org/${s.id}`, target: "_blank", rel: "noopener" }, t("open")), " · ",
    el("a", { href: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`, target: "_blank", rel: "noopener" }, t("route"))))) : el("p", { class: "note" }, t("none"));
  return el("div", { class: "sec" }, el("h4", {}, t("where")), el("p", { class: "note", style: "margin:0 0 8px" }, t("whereTxt")),
    el("div", { class: "row" }, btn, sel), body, el("p", { class: "note" }, t("legal")), el("p", { class: "note" }, "© OpenStreetMap contributors (ODbL)"));
}

/* ------------------------------------------------------------------ charts */
const tip = $("#tip");
function hover(node, text, noFocus) {
  const show = (e) => { tip.textContent = text; tip.style.opacity = 1; const b = node.getBoundingClientRect(); tip.style.left = (e.clientX ?? b.x) + 12 + "px"; tip.style.top = (e.clientY ?? b.y) + 12 + "px"; };
  node.addEventListener("pointermove", show); node.addEventListener("focus", show);
  node.addEventListener("pointerleave", () => (tip.style.opacity = 0)); node.addEventListener("blur", () => (tip.style.opacity = 0));
  if (!noFocus) node.setAttribute("tabindex", "0");
}
function table(rows, head) {
  return el("details", { class: "tbl" }, el("summary", {}, t("showTable")),
    el("table", {}, el("tr", {}, head.map((h) => el("th", {}, h))), rows.map((r) => el("tr", {}, r.map((c) => el("td", {}, c))))));
}
const txt = (x, y, s, attrs = {}) => { const n = sv("text", { x, y, ...attrs }); n.textContent = s; return n; };
const legend = (items) => el("div", { class: "legend" }, items.map(([bg, s]) => el("span", {}, el("i", { style: `background:${bg}` }), s)));

function scatterPca(host) {
  const d = D.d, W = 520, H = 340, m = { l: 14, r: 14, t: 26, b: 30 };
  const xs = d.p1, ys = d.p2, x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (v) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" }), v = D.results.atlas.pca_var;
  s.append(sv("line", { class: "ax", x1: X(0), x2: X(0), y1: m.t, y2: H - m.b }), sv("line", { class: "ax", x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0) }),
    txt(W - m.r, H - 8, `PC1 ${fmtNum(100 * v[0], 0)}% → ${L === "tr" ? "duman, iyot, gövde" : "smoke, iodine, body"}`, { "text-anchor": "end", class: "tick" }),
    txt(X(0) + 6, 14, `↑ PC2 ${fmtNum(100 * v[1], 0)}% · ${L === "tr" ? "şeri, gövde, bal" : "sherry, body, honey"}`, { class: "tick" }));
  const labelled = new Set(["Lagavulin", "Talisker", "Macallan", "Glendronach", "Auchentoshan", "Glenfiddich"]);
  d.n.forEach((nm, i) => {
    const c = sv("circle", { cx: X(xs[i]), cy: Y(ys[i]), r: 6, fill: `var(--s${d.st[i]})`, class: "pt" });
    hover(c, `${nm} · ${STYLE[L][d.st[i]]}`, true); c.addEventListener("click", () => pick(i, true)); s.append(c);
    if (labelled.has(nm)) s.append(txt(X(xs[i]) + (xs[i] > 3 ? -9 : 9), Y(ys[i]) + 4, nm, { class: "lab", "text-anchor": xs[i] > 3 ? "end" : "start" }));
  });
  host.replaceChildren(s, legend(STYLE[L].map((st, k) => [`var(--s${k})`, st])), table(d.n.map((nm, i) => [nm, f2(xs[i]), f2(ys[i])]), ["", "PC1", "PC2"]));
}
function vbars(host, rows, fmt, hiIdx) {
  const W = 520, H = 220, m = { l: 10, b: 30, t: 16 }, bw = (W - m.l) / rows.length, mx = Math.max(...rows.map((r) => r.value)) * 1.1;
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  const y25 = H - m.b - (0.25 / mx) * (H - m.b - m.t);
  s.append(sv("line", { class: "ax", x1: m.l, x2: W, y1: H - m.b, y2: H - m.b }), sv("line", { class: "guide dash", x1: m.l, x2: W, y1: y25, y2: y25 }),
    txt(W - 4, y25 - 5, "0,25".replace(",", L === "tr" ? "," : "."), { "text-anchor": "end", class: "tick" }));
  rows.forEach((r, k) => {
    const h = (r.value / mx) * (H - m.b - m.t), x = m.l + k * bw + bw * 0.18, g = sv("g");
    g.append(sv("rect", { class: "bar" + (k === hiIdx ? "" : " n"), x, y: H - m.b - h, width: bw * 0.64, height: h, rx: 4 }));
    hover(g, `${r.label}: ${fmt(r.value)}`);
    s.append(g, txt(x + bw * 0.32, H - m.b - h - 6, fmt(r.value), { "text-anchor": "middle" }), txt(x + bw * 0.32, H - 10, r.label, { "text-anchor": "middle" }));
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, fmt(r.value)]), ["k", L === "tr" ? "siluet" : "silhouette"]));
}
function pairedBars(host, rows) {
  const W = 520, rowH = 30, left = 124, right = 16, H = rows.length * rowH + 30;
  const lo = Math.min(0, ...rows.flatMap((r) => [r.a, r.b])), hi = Math.max(...rows.flatMap((r) => [r.a, r.b]));
  const X = (v) => left + ((v - lo) / (hi - lo)) * (W - left - right);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { x1: X(0), x2: X(0), y1: 0, y2: H - 26, stroke: "var(--ink)", "stroke-width": 1 }));
  for (const v of [-0.1, 0.1, 0.2, 0.3]) if (v >= lo && v <= hi) s.append(txt(X(v), H - 10, sgn(v).replace(/0$/, ""), { "text-anchor": "middle", class: "tick" }));
  rows.forEach((r, k) => {
    const y = 4 + k * rowH, g = sv("g");
    g.append(sv("rect", { class: "bar" + (r.sig ? "" : " n"), x: Math.min(X(0), X(r.a)), y, width: Math.max(1, Math.abs(X(r.a) - X(0))), height: 11, rx: 2 }));
    g.append(sv("rect", { class: "bar alt", x: Math.min(X(0), X(r.b)), y: y + 13, width: Math.max(1, Math.abs(X(r.b) - X(0))), height: 9, rx: 2 }));
    g.append(sv("rect", { class: "hit", x: 0, y, width: W, height: rowH - 4 }));
    hover(g, `${r.label}: ${sgn(r.a)} (Holm p ${f2(r.p)}) · ${t("noIslay")}: ${sgn(r.b)}`);
    s.append(txt(left - 10, y + 15, r.label + (r.sig ? " *" : ""), { "text-anchor": "end" }), g);
  });
  host.replaceChildren(s, legend([["var(--accent)", `${t("allIslay")} (${t("sigNote")})`], ["var(--alt)", t("noIslay")]]),
    table(rows.map((r) => [r.label, sgn(r.a), f2(r.p), sgn(r.b)]), ["", t("allIslay"), "Holm p", t("noIslay")]));
}
function rangePlot(host, bands) {
  const W = 520, H = 250, m = { l: 34, r: 8, t: 12, b: 42 }, y0 = 82, y1 = 96, bw = (W - m.l - m.r) / bands.length;
  const Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const v of [84, 88, 92, 96]) s.append(sv("line", { class: "ax", x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }), txt(m.l - 6, Y(v) + 4, v, { "text-anchor": "end", class: "tick" }));
  const lab = (b) => (b[1] === null ? `$${b[0]}+` : b[0] === 0 ? `<$${b[1]}` : `$${b[0]}–${b[1]}`);
  bands.forEach((b, k) => {
    const x = m.l + (k + 0.5) * bw, g = sv("g");
    g.append(sv("line", { class: "iqr", x1: x, x2: x, y1: Y(b[2]), y2: Y(b[4]) }));
    g.append(sv("circle", { class: "mk", cx: x, cy: Y(b[3]), r: 7 }));
    g.append(sv("rect", { class: "hit", x: x - bw / 2, y: m.t, width: bw, height: H - m.t - m.b }));
    hover(g, `${lab(b)}: ${L === "tr" ? "medyan" : "median"} ${fmtNum(b[3], 1)} (${fmtNum(b[2], 1)}–${fmtNum(b[4], 1)}), n ${fmtNum(b[5])}`);
    s.append(g, txt(x, H - 24, lab(b), { "text-anchor": "middle" }), txt(x, H - 8, `n ${fmtNum(b[5])}`, { "text-anchor": "middle", class: "tick" }));
  });
  host.replaceChildren(s, table(bands.map((b) => [lab(b), fmtNum(b[3], 1), `${fmtNum(b[2], 1)}–${fmtNum(b[4], 1)}`, fmtNum(b[5])]), ["USD", L === "tr" ? "medyan" : "median", "IQR", "n"]));
}
function dotPlot(host, rows) {
  const W = 520, rowH = 24, left = 124, right = 16, H = rows.length * rowH + 30, m = 0.5;
  const X = (v) => left + ((v + m) / (2 * m)) * (W - left - right);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { x1: X(0), x2: X(0), y1: 0, y2: H - 24, stroke: "var(--ink)", "stroke-width": 1 }));
  for (const v of [-0.4, -0.2, 0.2, 0.4]) s.append(txt(X(v), H - 8, sgn(v).replace(/0$/, ""), { "text-anchor": "middle", class: "tick" }));
  rows.forEach((r, k) => {
    const y = 12 + k * rowH, g = sv("g");
    g.append(sv("line", { class: "guide", x1: X(0), x2: X(r.v), y1: y, y2: y }));
    g.append(sv("circle", { class: "mk" + (r.p < 0.05 ? "" : " n"), cx: X(r.v), cy: y, r: 6 }));
    g.append(sv("rect", { class: "hit", x: 0, y: y - 11, width: W, height: 22 }));
    hover(g, `${r.label}: ρ ${sgn(r.v)} · p ${f2(r.raw)} · Holm p ${f2(r.p)}`);
    s.append(txt(left - 10, y + 4, r.label, { "text-anchor": "end" }), g);
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, sgn(r.v), f2(r.raw), f2(r.p)]), ["", "ρ", "p", "Holm p"]));
}
function divBars(host, rows) {
  const W = 520, rowH = 24, mid = 290, H = rows.length * rowH + 10, mx = Math.max(...rows.map((r) => Math.abs(r.value)));
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  s.append(sv("line", { class: "ax", x1: mid, x2: mid, y1: 0, y2: H }));
  rows.forEach((r, k) => {
    const y = 6 + k * rowH, w = (Math.abs(r.value) / mx) * 190, g = sv("g");
    g.append(sv("rect", { class: "bar" + (r.value > 0 ? "" : " n"), x: r.value > 0 ? mid : mid - w, y, width: Math.max(w, 1), height: 15, rx: 3 }));
    g.append(sv("rect", { class: "hit", x: 0, y: y - 3, width: W, height: rowH }));
    hover(g, `${r.label}: ${sgn(r.value)} ${t("pts")} · n ${r.n} · ${L === "tr" ? "medyan" : "median"} ${fmtNum(r.pts, 1)}`);
    s.append(g, txt(r.value > 0 ? mid - 8 : mid + 8, y + 12, `${r.label} (${sgn(r.value)})`, { "text-anchor": r.value > 0 ? "end" : "start" }));
  });
  host.replaceChildren(s, table(rows.map((r) => [r.label, sgn(r.value), r.n]), ["", L === "tr" ? "artık" : "residual", "n"]));
}
function renderCharts() {
  const R = D.results;
  scatterPca($("#c1"));
  vbars($("#c2"), Object.entries(R.atlas.silhouette).map(([k, v]) => ({ label: `k=${k}`, value: v })), f2, 0);
  pairedBars($("#c3"), [...R.geography_table].sort((a, b) => b.skill - a.skill).map((r) => ({
    label: flav(D.flavours.indexOf(r.attribute)), a: r.skill, b: r.skill_without_islay, p: r.p_holm, sig: r.p_holm < 0.05 && r.skill > 0 })));
  if (R.price) rangePlot($("#c4"), R.price.bands);
  if (R.flavour_points) dotPlot($("#c5"), [...R.flavour_points].sort((a, b) => b.rho - a.rho).map((r) => ({ label: flav(D.flavours.indexOf(r.attribute)), v: r.rho, raw: r.p_perm, p: r.p_holm })));
  if (R.value) divBars($("#c6"), [...R.value].sort((a, b) => b[1] - a[1]).map((r) => ({ label: r[0], value: r[1], n: r[2], pts: r[3] })));
}

/* ------------------------------------------------------------------ boot */
paintStatic();
try { if (!localStorage.getItem("age-ok")) { const dlg = $("#age"); dlg.showModal(); dlg.addEventListener("close", () => { if (dlg.returnValue === "yes") localStorage.setItem("age-ok", "1"); }); } } catch (e) {}
fetch("data/whisky.json").then((r) => r.json()).then((d) => { D = d; S.i = D.d.n.indexOf("Lagavulin"); paintAll(); })
  .catch(() => { $("#detail").textContent = "data/whisky.json could not be loaded (open via a web server, e.g. python -m http.server)."; });
