/* Whisky & wine finder — taste → bottle sold in Türkiye → cheese / snack → basket → nearest shops.
   Data: data/finder.json (python/build_finder.py). No build step, no framework; Leaflet only for the shop map. */
"use strict";

const REFS = [
  "Chen, B., Rhodes, C., Crawford, A., Hambuchen, L. (2014). Wineinformatics: Applying data mining on wine sensory reviews processed by the Computational Wine Wheel. IEEE ICDM Workshops. doi:10.1109/ICDMW.2014.149",
  "Chen, B. et al. (2016). The Computational Wine Wheel 2.0 and the TriMax triclustering in Wineinformatics. Advances in Data Mining, Springer. doi:10.1007/978-3-319-41561-1_17",
  "Dong, Z., Guo, X., Rajana, S., Chen, B. (2020). Understanding 21st century Bordeaux wines from wine reviews using naïve Bayes classifier. Beverages 6(1), 5. doi:10.3390/beverages6010005",
  "Dong, Z., Atkison, T., Chen, B. (2021). Wineinformatics: Using the full power of the Computational Wine Wheel to understand 21st century Bordeaux wines from the reviews. Beverages 7(1), 3. doi:10.3390/beverages7010003",
  "Le, L., Hurtado, P. N., Lawrence, I., Tian, Q., Chen, B. (2023). Applying neural networks in Wineinformatics with the new Computational Wine Wheel. Fermentation 9(7), 629. doi:10.3390/fermentation9070629",
  "Lee, K.-Y. M., Paterson, A., Piggott, J. R., Richardson, G. D. (2001). Origins of flavour in whiskies and a revised flavour wheel: a review. Journal of the Institute of Brewing 107(5), 287–313. doi:10.1002/j.2050-0416.2001.tb00099.x",
];
const MODEL = { tr: { NB: "naive Bayes", SVM: "doğrusal SVM", LR: "lojistik regresyon" }, en: { NB: "naive Bayes", SVM: "linear SVM", LR: "logistic regression" } };
const WISH = {
  tr: { Body: "gövde", Sweetness: "tatlılık", Smoky: "duman", Medicinal: "iyot", Tobacco: "tütün", Honey: "bal", Spicy: "baharat", Winey: "şarapsı", Nutty: "fındık", Malty: "malt", Fruity: "meyve", Floral: "çiçek" },
  en: { Body: "body", Sweetness: "sweetness", Smoky: "smoke", Medicinal: "iodine", Tobacco: "tobacco", Honey: "honey", Spicy: "spice", Winey: "winey", Nutty: "nutty", Malty: "malt", Fruity: "fruit", Floral: "floral" },
};

const I18N = {
  tr: {
    crumb: "Projeler / Viski ve şarap bulucu", kicker: "Veri bilimi · Computational Wine Wheel → viski · Python",
    title: "Tadı seç, şişeyi bul, yanına ne alacağını gör",
    lede: "Viski ve şarap için tek sayfa: istediğin tatları seç, Türkiye'de satılan şişeler bu tatlara göre sıralansın; yanına peynir ya da atıştırmalık ekle, sepetin ortalama fiyatını ve en yakın mağazaları gör. Tat profilleri binlerce uzman incelemesinden, Computational Wine Wheel yöntemiyle çıkarıldı; viski tarafı için aynı yöntemle yeni bir sözlük kuruldu.",
    kpis: (n) => [
      ["Etiketlenen viski incelemesi", n.reviews, `Whisky Advocate · ${n.terms} ifade → ${n.attrs} tat özelliği → ${n.cats} kategori`],
      ["Etiketleme doğrulaması", `%${n.recall}`, `yakalama oranı; isabet %${n.prec} · sözlük dondurulduktan sonra okunan ${n.hr} incelemedeki ${n.hp} elle işaretli ifadede`, true],
      ["Uzman paneliyle uyum", `${n.sig} / 12`, `tat Wishart panel puanlarıyla anlamlı örtüşüyor (Holm): ${n.sigList} · ${n.wn} damıtımevi`],
      ["Türkiye'de satılan", `${n.nW} + ${n.nV}`, `viski ve şarap; yanına ${n.nS} peynir ve atıştırmalık, ${n.nSp} tanesinin raf fiyatı var`],
    ],
    findTitle: "Tadına göre bul",
    findSub: "Viski ya da şarap seç, istediğin tatları işaretle. Liste, bu tatların o şişenin incelemelerinde ne kadar sık geçtiğine göre sıralanır (×1 = ortalama); tat seçmezsen fiyata göre.",
    whisky: "Viski", wine: "Şarap", styleTitle: "Tür", wantTitle: "Ne tatmak istiyorsun?", clear: "temizle",
    wstyles: { red: "Kırmızı", white: "Beyaz", sweet: "Tatlı", "rosé": "Roze" },
    styleW: { peated: "Dumanlı / deniz", sherried: "Şeri fıçı", light: "Hafif / çiçeksi", honeyed: "Ballı / tatlı" },
    listCount: (n, byTaste) => `${n} şişe · ${byTaste ? "tada göre" : "fiyata göre"}`,
    nPrice: "fiyat bulunamadı", unitW: "70 cl", unitV: "75 cl",
    liftTxt: (v) => `Seçtiğin tatlar bu şişenin profilinde ortalamanın ${v} katı sık geçiyor.`,
    profW: "İncelemelerde geçme oranı (çizgi = tüm viskilerin ortalaması)",
    profV: "Üzüm paylaşan Bordeaux incelemelerinde geçme oranı (çizgi = bu türün ortalaması)",
    evidW: (b) => (b.n_own ? `Kanıt: bu şişe için ${b.n_own} inceleme${b.n_group > b.n_own ? ` + ${b.group} (damıtımevi / marka) için ${b.n_group - b.n_own} inceleme` : ""}.${b.points ? ` Whisky Advocate puanı: ${b.points}.` : ""}`
      : `Kanıt: bu şişenin incelemesi yok; profil ${b.group} (damıtımevi / marka) için ${b.n_group} incelemeden.`),
    evidV: (n) => `Profil ödünç: üzümlerinden en az birini paylaşan ${n} Bordeaux şarabının Wine Spectator incelemelerinden, benzerliğe göre ağırlıklı. Türk şarabının kendi incelemesi değil.`,
    noProfile: "Profil yok: veri setindeki Bordeaux şaraplarından hiçbiri bu üzümleri paylaşmıyor.",
    cheeseTitle: "Yanına peynir", sideTitle: "Yanına atıştırmalık", turkish: "yerli", add: "+ Sepete",
    sideRange: (lo, hi, n, shop, date) => `${n > 1 ? `${lo}–${hi} TL, ${n} ürün` : "1 ürün"} · ${shop}, ${date}`,
    basketTitle: "Sepet ve en yakın mağazalar",
    basketSub: "Önerilen ürünleri sepete ekle; ortalama fiyatı ve sepetine göre en yakın mağazaları gör. Burada satış yok, sepet yalnız bu tarayıcıda durur.",
    basket: "Sepet", empty: "Sepet boş. Bir içki ve yanına bir peynir ya da atıştırmalık ekle.",
    colItem: "Ürün", colQty: "Adet", colPrice: "≈ Tutar", less: "bir azalt", more: "bir artır",
    total: "Ortalama toplam", totalRange: (lo, hi) => `En ucuz ve en pahalı seçenekle: ${lo}–${hi} TL`,
    unpriced: (n) => `${n} ürünün fiyatı bulunamadı, toplama dahil değil.`, emptyBtn: "Sepeti boşalt",
    priceNote: "Fiyatlar tarihli ortalama liste / raf fiyatlarıdır; mağazaya göre değişir.",
    shopsTitle: "En yakın mağazalar", shopsFor: "Sepetine göre aranacak: ",
    grp: { drink: "İçki (tekel, şarap dükkânı)", cheese: "Peynir / şarküteri", market: "Market / kuruyemiş" },
    kind: { alcohol: "tekel / içki", wine: "şarap dükkânı", beverages: "içecek", cheese: "peynirci", deli: "şarküteri", dairy: "süt ürünleri", supermarket: "market", nuts: "kuruyemiş" },
    useLoc: "Konumumu kullan", orCity: "ya da il seç", searching: "Aranıyor…", none: "Yakında kayıtlı mağaza bulunamadı.",
    locErr: "Konum alınamadı; il seçebilirsin.", ovErr: "OpenStreetMap şu an yanıt vermedi; biraz sonra tekrar dene.",
    stale: "Sepet değişti.", again: "Sepete göre yeniden ara", you: "Sen (yaklaşık)",
    km: "km", open: "haritada aç", route: "yol tarifi", unnamed: "(adsız)",
    privacy: "Konumun yaklaşık 100 m'ye yuvarlanıp yalnız OpenStreetMap servislerine (Overpass, harita karoları) gider; saklanmaz.",
    legal: "Türkiye'de alkollü içki 22.00–06.00 arası perakende satılamaz, 18 yaş altına satılamaz; posta ile satış yapılamaz (4250 s. Kanun md. 6). Bu yüzden çevrimiçi satış bağlantısı yok.",
    howTitle: "Nasıl çalışıyor?", howSub: "Yöntem Computational Wine Wheel çalışmalarından; viski sözlüğü bu projede kuruldu.",
    howW: (n) => [
      `Veri: ${n.reviews} Whisky Advocate İskoç viskisi incelemesi (Kaggle, 2018 sürümü; metinleri kendi satırına ait olan sürüm).`,
      `Sözlük: Computational Wine Wheel'in özgül ifade → normalize özellik → alt kategori → kategori yapısı viskiye taşındı; iskelet Lee ve ark.'nın (2001) viski tat çarkı. ${n.terms} ifade → ${n.attrs} özellik → ${n.subs} alt kategori → ${n.cats} kategori. "no smoke" gibi olumsuzlar sayılmıyor.`,
      `Doğrulama: sözlük dondurulduktan sonra okunan ${n.hr} incelemede elle işaretlenen ${n.hp} ifadede yakalama oranı %${n.recall}, isabet %${n.prec}.`,
      "Şişe profili: şişenin kendi incelemeleri, aynı damıtımevi ya da markanın diğer incelemelerine doğru büzülür; incelemesi az olan şişe ağırlıkla damıtımevine benzer. Tür (dumanlı, şeri, hafif, ballı) profilden basit bir eşikle.",
      "Eşleşme: peynir Whisky Advocate ve Master of Malt'tan, atıştırmalık Master of Malt'tan.",
    ],
    howV: (n) => [
      `Veri: ${n.nB} Bordeaux şarabının Wine Spectator incelemesi, Computational Wine Wheel ile etiketlenmiş (Dong ve ark. 2020).`,
      "Türk şarabının profili: üzümlerinden en az birini paylaşan aynı türdeki Bordeaux şaraplarının, benzerliğe göre ağırlıklı ortalaması (üzüm %60, gövde %25, meşe %15; şarap uygulamasındaki kural).",
      "Peynir: CIVB (bordeaux.com) ve Wine Folly kuralları; yerli peynirler önce.",
    ],
    care: "Dikkat",
    careList: (n) => [
      "Türk şaraplarının profili ödünç. Aynı üzüm karışımından gelen kırmızılar birbirine çok yakın çıkıyor; aralarında seçimi fiyat ve peynir belirlesin.",
      `Viski puanını incelemeden tahmin etmek zor: en iyi model (${n.model}) damıtımevine göre gruplu doğrulamada %${n.acc} doğruluk, hep "89 ve altı" demek %${n.base}. Sıralama "iyi viski" değil, "istediğin tat" söylüyor.`,
      "Fiyatlar: viski habergazetesi.com.tr (Eylül 2026; Royal Salute 21 Ocak 2026); şarap habergazetesi.com.tr (09.07.2026, yalnız 5 şarap); peynir ve atıştırmalık Migros Sanal Market raf fiyatı (28.09.2026), porsiyon başına medyan, aralık en ucuz ve en pahalı ürün.",
      "Mağazalar OpenStreetMap kayıtları; eksik ya da eski olabilir. Market listesi peynir ve atıştırmalık içindir; içki için tekel ve şarap dükkânlarına bak.",
    ],
    fRefs: "Kaynaklar", fData: "Veri ve lisans",
    fDataTxt: "Viski incelemeleri: Kaggle, koki25ando (2018). Metinler Whisky Advocate'indir; sayfada ve depoda yalnız türetilmiş tat bayrakları var. Şarap: Dong ve ark. (2020) Bordeaux veri seti. Fiyatlar: habergazetesi.com.tr, Migros Sanal Market (tarihleri yanında). Harita: © OpenStreetMap katkıcıları (ODbL), Leaflet (BSD-2).",
    fRepro: "Yeniden üret", fLegal: "Not", fLegalTxt: "Ticari değildir; hiçbir üretici ya da satıcıyla bağı yoktur, satış yapmaz. 18 yaş ve üzeri içindir.",
    age18: "Bu sayfa alkollü içecekler hakkında bilgi içerir. 18 yaşından büyük müsün?", ageYes: "Evet, 18+", ageNo: "Hayır",
  },
  en: {
    crumb: "Projects / Whisky & wine finder", kicker: "Data science · Computational Wine Wheel → whisky · Python",
    title: "Pick a taste, find the bottle, see what goes with it",
    lede: "One page for whisky and wine: choose the flavours you want, rank the bottles sold in Türkiye by them, add a cheese or a snack, and see the basket's average price and the nearest shops. Taste profiles come from thousands of expert reviews via the Computational Wine Wheel method; for whisky, a new dictionary was built the same way.",
    kpis: (n) => [
      ["Whisky reviews tagged", n.reviews, `Whisky Advocate · ${n.terms} phrases → ${n.attrs} attributes → ${n.cats} categories`],
      ["Tagging check", `${n.recall}%`, `recall; precision ${n.prec}% · ${n.hp} hand-marked phrases in ${n.hr} reviews read after the dictionary was frozen`, true],
      ["Agreement with a tasting panel", `${n.sig} / 12`, `flavours agree significantly with Wishart's panel scores (Holm): ${n.sigList} · ${n.wn} distilleries`],
      ["Sold in Türkiye", `${n.nW} + ${n.nV}`, `whiskies and wines; ${n.nS} cheeses and snacks to go with them, ${n.nSp} with a shelf price`],
    ],
    findTitle: "Find by taste",
    findSub: "Choose whisky or wine and tick the flavours you want. The list is ranked by how often those flavours appear in the bottle's reviews (×1 = average); with no flavour ticked, by price.",
    whisky: "Whisky", wine: "Wine", styleTitle: "Type", wantTitle: "What do you want to taste?", clear: "clear",
    wstyles: { red: "Red", white: "White", sweet: "Sweet", "rosé": "Rosé" },
    styleW: { peated: "Smoky / maritime", sherried: "Sherry cask", light: "Light / floral", honeyed: "Honeyed / sweet" },
    listCount: (n, byTaste) => `${n} bottles · ${byTaste ? "by taste" : "by price"}`,
    nPrice: "no price found", unitW: "70 cl", unitV: "75 cl",
    liftTxt: (v) => `The flavours you picked appear ${v}× as often as average in this bottle's profile.`,
    profW: "Share of reviews mentioning it (line = all whiskies)",
    profV: "Share of reviews of grape-sharing Bordeaux wines mentioning it (line = this type's average)",
    evidW: (b) => (b.n_own ? `Evidence: ${b.n_own} review(s) of this bottle${b.n_group > b.n_own ? ` + ${b.n_group - b.n_own} of ${b.group} (distillery / brand)` : ""}.${b.points ? ` Whisky Advocate score: ${b.points}.` : ""}`
      : `Evidence: no review of this bottle; the profile comes from ${b.n_group} reviews of ${b.group} (distillery / brand).`),
    evidV: (n) => `Borrowed profile: from the Wine Spectator reviews of ${n} Bordeaux wines sharing at least one of its grapes, weighted by similarity. Not reviews of the Turkish wine itself.`,
    noProfile: "No profile: no Bordeaux wine in the data shares these grapes.",
    cheeseTitle: "Cheese to go with it", sideTitle: "Snack to go with it", turkish: "Turkish", add: "+ Basket",
    sideRange: (lo, hi, n, shop, date) => `${n > 1 ? `${lo}–${hi} TL, ${n} products` : "1 product"} · ${shop}, ${date}`,
    basketTitle: "Basket and nearest shops",
    basketSub: "Add the suggestions to a basket to see the average price and the shops nearest to you for what is in it. Nothing is sold here; the basket stays in this browser.",
    basket: "Basket", empty: "The basket is empty. Add a drink and a cheese or snack to go with it.",
    colItem: "Item", colQty: "Qty", colPrice: "≈ Amount", less: "one less", more: "one more",
    total: "Average total", totalRange: (lo, hi) => `With the cheapest and dearest options: ${lo}–${hi} TL`,
    unpriced: (n) => `${n} item(s) without a price are not in the total.`, emptyBtn: "Empty the basket",
    priceNote: "Prices are dated average list / shelf prices and vary by shop.",
    shopsTitle: "Nearest shops", shopsFor: "Searching for your basket: ",
    grp: { drink: "Drinks (liquor store, wine shop)", cheese: "Cheese / deli", market: "Supermarket / nuts" },
    kind: { alcohol: "liquor store", wine: "wine shop", beverages: "beverages", cheese: "cheese shop", deli: "deli", dairy: "dairy", supermarket: "supermarket", nuts: "nut shop" },
    useLoc: "Use my location", orCity: "or pick a province", searching: "Searching…", none: "No shop recorded nearby.",
    locErr: "Could not get your location; pick a province instead.", ovErr: "OpenStreetMap did not answer; try again in a moment.",
    stale: "The basket changed.", again: "Search again for the basket", you: "You (approx.)",
    km: "km", open: "open map", route: "directions", unnamed: "(unnamed)",
    privacy: "Your location is rounded to about 100 m and sent only to OpenStreetMap services (Overpass, map tiles); nothing is stored.",
    legal: "In Türkiye alcohol cannot be sold at retail between 22:00 and 06:00, to under-18s, or by mail (Law 4250, art. 6) — hence no online-shop links.",
    howTitle: "How it works", howSub: "The method comes from the Computational Wine Wheel papers; the whisky dictionary was built for this project.",
    howW: (n) => [
      `Data: ${n.reviews} Whisky Advocate reviews of Scotch (Kaggle, 2018 upload — the version whose texts belong to their rows).`,
      `Dictionary: the Computational Wine Wheel's specific term → normalized attribute → subcategory → category structure, carried over to whisky on the skeleton of Lee et al.'s (2001) whisky flavour wheel. ${n.terms} phrases → ${n.attrs} attributes → ${n.subs} subcategories → ${n.cats} categories. Negations such as "no smoke" are not counted.`,
      `Validation: on ${n.hp} hand-marked phrases in ${n.hr} reviews read after the dictionary was frozen, recall ${n.recall}%, precision ${n.prec}%.`,
      "Bottle profile: the bottle's own reviews, shrunk toward the other reviews of its distillery or brand; a bottle with few reviews looks mostly like its distillery. The type (smoky, sherry, light, honeyed) is a simple threshold on the profile.",
      "Pairings: cheeses from Whisky Advocate and Master of Malt, snacks from Master of Malt.",
    ],
    howV: (n) => [
      `Data: Wine Spectator reviews of ${n.nB} Bordeaux wines, tagged with the Computational Wine Wheel (Dong et al. 2020).`,
      "Turkish wine profile: similarity-weighted average of the same-type Bordeaux wines sharing at least one of its grapes (grape 60%, body 25%, oak 15%; the wine app's rule).",
      "Cheese: CIVB (bordeaux.com) and Wine Folly rules; Turkish cheeses first.",
    ],
    care: "Keep in mind",
    careList: (n) => [
      "Turkish wine profiles are borrowed. Reds from the same grape blend come out very close to each other; let price and cheese decide between them.",
      `Predicting a whisky's score from its review is hard: the best model (${n.model}) reaches ${n.acc}% accuracy under distillery-grouped validation, against ${n.base}% for always saying "89 or below". The ranking tells you "the taste you asked for", not "a good whisky".`,
      "Prices: whisky from habergazetesi.com.tr (September 2026; Royal Salute 21 January 2026); wine from habergazetesi.com.tr (09.07.2026, only 5 wines); cheese and snacks from Migros Sanal Market shelf prices (28.09.2026), median per portion, range = cheapest and dearest product.",
      "Shops are OpenStreetMap records and may be missing or outdated. The supermarket list is for cheese and snacks; for drinks look at liquor and wine shops.",
    ],
    fRefs: "References", fData: "Data & licence",
    fDataTxt: "Whisky reviews: Kaggle, koki25ando (2018). The texts belong to Whisky Advocate; only derived flavour flags are on this page and in the repo. Wine: the Bordeaux dataset of Dong et al. (2020). Prices: habergazetesi.com.tr, Migros Sanal Market (dated next to each). Map: © OpenStreetMap contributors (ODbL), Leaflet (BSD-2).",
    fRepro: "Reproduce", fLegal: "Note", fLegalTxt: "Non-commercial; no tie to any producer or seller, sells nothing. For adults 18+.",
    age18: "This page contains information about alcoholic drinks. Are you 18 or older?", ageYes: "Yes, 18+", ageNo: "No",
  },
};

let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("whisky-lang") || L; } catch (e) {}
const t = (k) => I18N[L][k];
let D = null;
const S = { drink: "whisky", wstyle: "red", want: { whisky: new Set(), wine: new Set() }, sel: { whisky: null, wine: null },
  basket: {}, at: null, shops: null, for: null, run: 0 };
try { S.basket = JSON.parse(localStorage.getItem("finder-basket")) || {}; } catch (e) {}
const save = () => { try { localStorage.setItem("finder-basket", JSON.stringify(S.basket)); } catch (e) {} };

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
const put = (host, ...kids) => host.append(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));   // DOM append() would print "null"
const loc = () => (L === "tr" ? "tr-TR" : "en-GB");
const fmtNum = (x, d = 0) => x.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: d });
const pctS = (x) => (L === "tr" ? `%${fmtNum(100 * x)}` : `${fmtNum(100 * x)}%`);
const fmtDate = (s) => new Date(`${s}T12:00:00`).toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
const fmtMonth = (s) => new Date(`${s}-15T12:00:00`).toLocaleDateString(loc(), { month: "long", year: "numeric" });
const mid = (p) => (p ? (p[0] + p[1]) / 2 : Infinity);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const CHEESE = new Set(["hard_aged", "semi_hard", "blue", "brined_white", "fresh_goat", "bloomy"]);
const SHOP = { alcohol: "drink", wine: "drink", beverages: "drink", cheese: "cheese", deli: "cheese", dairy: "cheese", supermarket: "market", nuts: "market" };
const GROUPS = ["drink", "cheese", "market"];
const COLOUR = { drink: "--accent", cheese: "--s3", market: "--good" };

/* ------------------------------------------------------------------ data helpers */
const side = (id) => D.sides.find((s) => s.id === id);
const wineName = (w) => (w.name.split(" ")[0] === w.producer.split(" ")[0] ? w.name : `${w.producer} ${w.name}`);
const pool = () => (S.drink === "whisky" ? D.whisky.bottles : D.wine.wines.filter((w) => w.style === S.wstyle));
const base = () => (S.drink === "whisky" ? D.whisky.baseline : D.wine.baseline[S.wstyle]);
const chips = () => D[S.drink].chips;
function lift(x) {            // mean ratio profile / average over the ticked flavours
  const want = [...S.want[S.drink]], ids = chips().map((c) => c.id), b = base();
  if (!want.length || !x.profile) return null;
  // ponytail: +0.02 on both sides keeps a zero average (rosé has 50 Bordeaux wines) from dividing by zero
  return want.reduce((s, id) => { const k = ids.indexOf(id); return s + (x.profile[k] + 0.02) / (b[k] + 0.02); }, 0) / want.length;
}
function ranked() {
  return pool().map((x) => ({ x, l: lift(x) }))
    .sort((a, b) => (b.l ?? -1) - (a.l ?? -1) || mid(a.x.price) - mid(b.x.price) || a.x.name.localeCompare(b.x.name, "tr"));
}
const curId = () => { const R = ranked(); return R.some((r) => r.x.id === S.sel[S.drink]) ? S.sel[S.drink] : R[0]?.x.id; };
function item(key) {         // basket key → {name, unit, price {mid, lo, hi}, grp}
  const kind = key[0], id = key.slice(2);
  if (kind === "w") { const b = D.whisky.bottles.find((x) => x.id === id); return b && { name: b.name, unit: t("unitW"), grp: "drink", price: b.price && { mid: mid(b.price), lo: b.price[0], hi: b.price[1] } }; }
  if (kind === "v") { const w = D.wine.wines.find((x) => x.id === id); return w && { name: wineName(w), unit: t("unitV"), grp: "drink", price: w.price && { mid: mid(w.price), lo: w.price[0], hi: w.price[1] } }; }
  const s = side(id); return s && { name: s[L], unit: `${s.portion_g} g`, grp: CHEESE.has(s.kind) ? "cheese" : "market", price: s.price };
}
function needs() {
  const g = new Set();
  for (const k of Object.keys(S.basket)) { const it = item(k); if (it) { g.add(it.grp); if (it.grp === "cheese") g.add("market"); } }
  return g.size ? GROUPS.filter((x) => g.has(x)) : GROUPS;
}
function sideRule(style) {    // style-specific snacks + the ones that go with any dram
  const a = D.whisky.side_rules[style], any = D.whisky.side_rules.any;
  if (!a) return any;
  return { ...a, sides: [...new Set([...a.sides, ...any.sides])], tr: `${a.tr} ${any.tr}`, en: `${a.en} ${any.en}` };
}

/* ------------------------------------------------------------------ chrome */
function paintStatic() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { const v = t(n.dataset.i); if (typeof v === "string") n.textContent = v; });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
}
function numbers() {
  const W = D.wheel, p = (x) => fmtNum(100 * x, 1), sig = W.wishart.filter((r) => r[2] < 0.05).sort((a, b) => b[1] - a[1]);
  return {
    reviews: fmtNum(W.reviews), terms: fmtNum(W.terms), attrs: fmtNum(W.attributes), subs: W.subcategories, cats: W.categories,
    recall: p(W.recall), prec: p(W.precision), hr: W.holdout_reviews, hp: W.holdout_phrases, wn: W.wishart_n, sig: sig.length,
    sigList: sig.map((r) => `${WISH[L][r[0]]} ρ ${fmtNum(r[1], 2)}`).join(" · "),
    model: MODEL[L][W.best_grouped.model], acc: p(W.best_grouped.accuracy), base: p(W.baseline),
    nW: D.whisky.bottles.length, nV: D.wine.wines.length, nS: D.sides.length, nSp: D.sides.filter((s) => s.price).length, nB: fmtNum(D.wine.n_bordeaux),
  };
}
function paintText() {
  const n = numbers();
  $("#kpis").replaceChildren(...t("kpis")(n).map(([l, v, c, hi]) => el("div", { class: "kpi" + (hi ? " hi" : "") }, el("div", { class: "l" }, l), el("div", { class: "v" }, v), el("div", { class: "c" }, c))));
  $("#howW").replaceChildren(...t("howW")(n).map((s) => el("li", {}, s)));
  $("#howV").replaceChildren(...t("howV")(n).map((s) => el("li", {}, s)));
  $("#care").replaceChildren(...t("careList")(n).map((s) => el("li", {}, s)));
  $("#refs").replaceChildren(...REFS.map((s) => { const m = s.match(/doi:(\S+)$/); return el("li", {}, s.replace(/ doi:\S+$/, " "), el("a", { href: `https://doi.org/${m[1]}`, target: "_blank", rel: "noopener" }, `doi:${m[1]}`)); }));
}
function paintAll() { paintStatic(); if (D) { paintText(); renderFind(); renderBasket(); renderShops(); } }
$("#lang").addEventListener("click", () => { L = L === "tr" ? "en" : "tr"; try { localStorage.setItem("whisky-lang", L); } catch (e) {} paintAll(); });
$("#theme").addEventListener("click", () => {
  const dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  const nxt = dark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nxt);
  try { localStorage.setItem("pd-theme", nxt); } catch (e) {}
  renderShops();
});
for (const d of ["whisky", "wine"]) $(`#tab-${d}`).addEventListener("click", () => { S.drink = d; renderFind(); });

/* ------------------------------------------------------------------ finder */
function renderFind() {
  for (const d of ["whisky", "wine"]) $(`#tab-${d}`).setAttribute("aria-pressed", S.drink === d);
  renderLeft(); renderDetail();
}
function renderLeft() {
  const host = $("#left"), set = S.want[S.drink], R = ranked(), cur = curId();
  host.replaceChildren();
  if (S.drink === "wine") put(host, el("div", { class: "fam" }, t("styleTitle")), el("div", { class: "chips" }, Object.keys(t("wstyles")).map((s) =>
    el("button", { class: "chip", type: "button", "aria-pressed": String(S.wstyle === s), onclick: () => { S.wstyle = s; renderFind(); } }, t("wstyles")[s]))));
  put(host,
    el("div", { class: "fam" }, t("wantTitle"), set.size ? [" · ", el("button", { class: "linkish", type: "button", onclick: () => { set.clear(); renderFind(); } }, t("clear"))] : null),
    el("div", { class: "chips" }, chips().map((c) => el("button", { class: "chip", type: "button", "aria-pressed": String(set.has(c.id)),
      onclick: () => { set.has(c.id) ? set.delete(c.id) : set.add(c.id); S.sel[S.drink] = null; renderFind(); } }, c[L]))),
    el("div", { class: "fam" }, t("listCount")(R.length, set.size > 0)),
    el("ul", { class: "results" }, R.map(({ x, l }) => el("li", {}, el("button", { type: "button", "aria-current": String(x.id === cur), onclick: () => pick(x.id) },
      el("span", { class: "nm" }, S.drink === "whisky" ? x.name : wineName(x), el("br"), el("span", { class: "muted", style: "font-size:.82rem" }, S.drink === "whisky" ? t("styleW")[x.style] : x.region)),
      el("span", { class: "meta" }, l != null ? [el("b", {}, `×${fmtNum(l, 1)}`), " · "] : null, x.price ? `≈ ${fmtNum(mid(x.price))} TL` : "—"))))));
}
function pick(id) {
  S.sel[S.drink] = id; renderFind();
  if (matchMedia("(max-width: 960px)").matches) $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
}
function addBtn(key, label) {
  return el("button", { class: "add", type: "button", "data-n": S.basket[key] || 0, "aria-label": `${t("add")}: ${label}`,
    onclick: (e) => { S.basket[key] = (S.basket[key] || 0) + 1; save(); e.currentTarget.dataset.n = S.basket[key]; renderBasket(); renderShops(); } }, t("add"));
}
function renderDetail() {
  const host = $("#detail"), W = S.drink === "whisky", x = pool().find((p) => p.id === curId());
  host.replaceChildren();
  if (!x) return;
  const l = lift(x), src = W ? `${x.source}, ${fmtMonth(x.as_of)}` : x.source;
  put(host,
    el("h3", {}, W ? x.name : wineName(x)),
    el("div", { class: "row", style: "margin-top:6px;gap:8px" }, el("span", { class: "badge hi" }, W ? t("styleW")[x.style] : t("wstyles")[x.style]),
      el("span", { class: "muted" }, W ? x.group : [x.region, x.grapes].filter(Boolean).join(" · "))),
    el("div", { class: "price" }, x.price ? [el("span", { class: "big" }, `≈ ${fmtNum(mid(x.price))} TL`),
      el("span", { class: "muted" }, x.price[0] !== x.price[1] ? `${fmtNum(x.price[0])}–${fmtNum(x.price[1])} TL · ` : "", `${t(W ? "unitW" : "unitV")} · `,
        el("a", { href: x.source_url, target: "_blank", rel: "noopener" }, src))] : el("span", { class: "muted" }, t("nPrice")),
      addBtn((W ? "w:" : "v:") + x.id, x.name)),
    l != null ? el("p", { class: "note", style: "margin:4px 0 0" }, t("liftTxt")(fmtNum(l, 1))) : null,
    profileBlock(x, W),
    el("p", { class: "note" }, W ? t("evidW")(x) : x.profile ? t("evidV")(fmtNum(x.n_bordeaux)) : t("noProfile")),
    pairBlock(W ? D.whisky.cheese_rules[x.style] : D.wine.cheese_rules[x.rule] || D.wine.cheese_rules.fallback, t("cheeseTitle")),
    W ? pairBlock(sideRule(x.style), t("sideTitle")) : null);
}
function profileBlock(x, W) {
  if (!x.profile) return null;
  const b = base(), set = S.want[S.drink];
  return el("div", { class: "sec" }, el("h4", {}, t(W ? "profW" : "profV")),
    el("div", { class: "prof" }, chips().flatMap((c, k) => [
      el("span", {}, set.has(c.id) ? el("b", {}, c[L]) : c[L]),
      el("div", { class: "meter", role: "img", "aria-label": `${c[L]}: ${pctS(x.profile[k])}` }, el("i", { style: `width:${100 * x.profile[k]}%` }), el("u", { style: `left:${100 * b[k]}%` })),
      el("span", { class: "lift" }, pctS(x.profile[k]))])));
}
function pairBlock(rule, title) {
  if (!rule) return null;
  const items = (rule.cheeses || rule.sides).map(side).filter(Boolean)
    .sort((a, b) => b.turkish - a.turkish || !!b.price - !!a.price);
  return el("div", { class: "sec" }, el("h4", {}, title),
    el("p", { class: "note", style: "margin:0 0 8px" }, rule[L], " ", el("a", { href: rule.url, target: "_blank", rel: "noopener" }, rule.source)),
    el("div", { class: "grid2" }, items.map(sideCard)));
}
function sideCard(s) {
  const cheese = CHEESE.has(s.kind), note = L === "tr" ? s.note_tr : s.note_en;
  return el("div", { class: "mini" + (cheese && s.turkish ? " tr" : "") },
    el("b", {}, s[L], cheese && s.turkish ? [" ", el("span", { class: "badge" }, t("turkish"))] : null),
    note ? el("span", { class: "s" }, note) : null,
    el("div", { class: "row" }, s.price ? [el("span", { class: "p" }, `≈ ${fmtNum(s.price.mid)} TL`), el("span", { class: "s" }, `/ ${s.portion_g} g`)]
      : el("span", { class: "s" }, t("nPrice")), addBtn(`s:${s.id}`, s[L])),
    s.price ? el("span", { class: "s" }, t("sideRange")(fmtNum(s.price.lo), fmtNum(s.price.hi), s.price.n, s.price.shop, fmtDate(s.price.date))) : null);
}

/* ------------------------------------------------------------------ basket */
function bump(k, d) {
  S.basket[k] = (S.basket[k] || 0) + d;
  if (S.basket[k] <= 0) delete S.basket[k];
  save(); renderBasket(); renderDetail(); renderShops();
}
function renderBasket() {
  const host = $("#basket"), rows = Object.entries(S.basket).map(([k, q]) => ({ k, q, it: item(k) })).filter((r) => r.it && r.q > 0);
  host.replaceChildren(el("h3", {}, t("basket")));
  if (!rows.length) { put(host, el("p", { class: "note" }, t("empty"))); return; }
  let m = 0, lo = 0, hi = 0, un = 0;
  for (const r of rows) if (r.it.price) { m += r.q * r.it.price.mid; lo += r.q * r.it.price.lo; hi += r.q * r.it.price.hi; } else un += 1;
  put(host,
    el("div", { class: "scroll" }, el("table", {}, el("tr", {}, [t("colItem"), t("colQty"), t("colPrice")].map((h) => el("th", {}, h))),
      rows.map((r) => el("tr", {},
        el("td", {}, el("b", {}, r.it.name), el("br"), el("span", { class: "muted", style: "font-size:.8rem" }, r.it.unit, r.it.price ? ` · ≈ ${fmtNum(r.it.price.mid)} TL` : ` · ${t("nPrice")}`)),
        el("td", {}, el("span", { class: "qty" }, el("button", { type: "button", "aria-label": `${t("less")}: ${r.it.name}`, onclick: () => bump(r.k, -1) }, "−"),
          el("span", { class: "mono" }, r.q), el("button", { type: "button", "aria-label": `${t("more")}: ${r.it.name}`, onclick: () => bump(r.k, 1) }, "+"))),
        el("td", { class: "mono" }, r.it.price ? `${fmtNum(r.q * r.it.price.mid)} TL` : "—"))))),
    el("div", { class: "tot" }, el("span", {}, t("total")), el("span", { class: "big" }, `≈ ${fmtNum(m)} TL`)),
    el("p", { class: "note", style: "margin:2px 0" }, t("totalRange")(fmtNum(lo), fmtNum(hi))),
    un ? el("p", { class: "note", style: "margin:2px 0" }, t("unpriced")(un)) : null,
    el("p", { class: "note" }, t("priceNote")),
    el("button", { class: "btn ghost", type: "button", onclick: () => { S.basket = {}; save(); renderBasket(); renderDetail(); renderShops(); } }, t("emptyBtn")));
}

/* ------------------------------------------------------------------ shops: OpenStreetMap Overpass + Leaflet */
function haversine(a, b) {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function findShops(p) {
  const at = [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];   // ~100 m, privacy
  const run = ++S.run, found = {};
  let todo = needs();
  S.at = at; S.for = todo; S.shops = "loading"; renderShops();
  for (const radius of [1500, 5000, 15000, 40000]) {   // widen only for the groups still short of 3 shops
    const types = Object.keys(SHOP).filter((k) => todo.includes(SHOP[k]));
    // ponytail: "out center 1000" caps a huge 40 km answer; nearest-first is exact below the cap, fine for a shop hint
    const q = `[out:json][timeout:25];nwr["shop"~"^(${types.join("|")})$"](around:${radius},${at[0]},${at[1]});out center 1000;`;
    try {
      const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (!r.ok) throw new Error(r.status);
      const items = (await r.json()).elements.map((e) => {
        const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon, tg = e.tags || {};
        return { id: `${e.type}/${e.id}`, name: tg.name || tg.brand || "", kind: tg.shop, lat, lon, d: lat == null ? 0 : haversine(at, [lat, lon]) };
      }).filter((x) => x.lat != null).sort((a, b) => a.d - b.d);
      if (run !== S.run) return;
      for (const g of todo) found[g] = items.filter((x) => SHOP[x.kind] === g);
    } catch (e) { if (run === S.run) { S.shops = "error"; renderShops(); } return; }
    todo = todo.filter((g) => found[g].length < 3);
    if (!todo.length) break;
  }
  S.shops = found; renderShops();
}
function locate() {
  if (!navigator.geolocation) { S.shops = "locerr"; renderShops(); return; }
  navigator.geolocation.getCurrentPosition((pos) => findShops([pos.coords.latitude, pos.coords.longitude]),
    () => { S.shops = "locerr"; renderShops(); }, { timeout: 10000, maximumAge: 600000 });
}
const mapBox = el("div", { id: "map", hidden: true });
let map = null, layer = null;
const osm = (s) => `https://www.openstreetmap.org/${s.id}`;
const route = (s) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`;
function drawMap(groups) {
  if (!window.L) return;       // Leaflet missing → the lists below still work
  mapBox.hidden = false;
  if (!map) {
    map = window.L.map(mapBox, { scrollWheelZoom: false });
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    layer = window.L.layerGroup().addTo(map);
  }
  map.invalidateSize();
  layer.clearLayers();
  const pts = [S.at];
  window.L.circleMarker(S.at, { radius: 6, color: css("--ink"), weight: 2, fillColor: css("--surface"), fillOpacity: 1 }).bindTooltip(t("you")).addTo(layer);
  for (const g of groups) for (const s of S.shops[g].slice(0, 5)) {
    pts.push([s.lat, s.lon]);
    window.L.circleMarker([s.lat, s.lon], { radius: 8, color: "#fff", weight: 2, fillColor: css(COLOUR[g]), fillOpacity: 1 })
      .bindPopup(el("div", {}, el("b", {}, s.name || t("unnamed")), el("br"), `${t("grp")[g]} · ${fmtNum(s.d, 1)} ${t("km")}`, el("br"),
        el("a", { href: route(s), target: "_blank", rel: "noopener" }, t("route")))).addTo(layer);
  }
  map.fitBounds(pts, { padding: [28, 28], maxZoom: 15 });
}
function renderShops() {
  if (!D) return;
  const host = $("#shops"), groups = S.for || needs(), dot = (g) => el("i", { class: "grp", style: `background:${css(COLOUR[g])}` });
  const sel = el("select", { "aria-label": t("orCity"), onchange: (e) => { const p = D.provinces[+e.target.value]; if (p) findShops([p[1], p[2]]); } },
    el("option", { value: "" }, t("orCity")), D.provinces.map((p, k) => [p[0], k]).sort((x, y) => x[0].localeCompare(y[0], "tr")).map(([n, k]) => el("option", { value: k }, n)));
  host.replaceChildren(el("h3", {}, t("shopsTitle")),
    el("p", { class: "note", style: "margin:0 0 8px" }, t("shopsFor"), needs().map((g) => el("span", { style: "margin-right:12px;white-space:nowrap" }, dot(g), t("grp")[g]))),
    el("div", { class: "row" }, el("button", { class: "btn", type: "button", onclick: locate }, t("useLoc")), sel));
  if (S.at && S.for && S.for.join() !== needs().join()) put(host, el("p", { class: "note" }, t("stale"), " ",
    el("button", { class: "linkish", type: "button", onclick: () => findShops(S.at) }, t("again"))));
  if (S.shops === "loading") put(host, el("p", { class: "note" }, t("searching")));
  else if (S.shops === "error") put(host, el("p", { class: "note" }, t("ovErr")));
  else if (S.shops === "locerr") put(host, el("p", { class: "note" }, t("locErr")));
  put(host, mapBox);
  if (S.shops && typeof S.shops === "object") {
    for (const g of groups) put(host, el("div", { class: "sec" }, el("h4", {}, dot(g), t("grp")[g]),
      S.shops[g].length ? el("ul", { class: "shops" }, S.shops[g].slice(0, 5).map((s) => el("li", {},
        el("span", { class: "d" }, `${fmtNum(s.d, 1)} ${t("km")}`),
        el("span", { class: "nm" }, el("b", {}, s.name || t("unnamed")), " ", el("span", { class: "muted" }, t("kind")[s.kind] || "")),
        el("a", { href: osm(s), target: "_blank", rel: "noopener" }, t("open")), " · ",
        el("a", { href: route(s), target: "_blank", rel: "noopener" }, t("route"))))) : el("p", { class: "note" }, t("none"))));
    drawMap(groups);
  } else mapBox.hidden = true;
  put(host, el("p", { class: "note" }, t("privacy")), el("p", { class: "note" }, t("legal")));
}

/* ------------------------------------------------------------------ boot */
paintStatic();
fetch("data/finder.json").then((r) => r.json()).then((d) => { D = d; paintAll(); });
try { if (!localStorage.getItem("age-ok")) { const dlg = $("#age"); dlg.showModal(); dlg.addEventListener("close", () => { if (dlg.returnValue === "yes") localStorage.setItem("age-ok", "1"); }); } } catch (e) {}
