/* Netflix Prize re-analysis — static page. No framework, no tracking, no outside calls. */
"use strict";
const I18N = {
  tr: {
    crumb: "Projeler / Netflix Prize, yeniden", kicker: "Öneri sistemleri · 100 milyon puan · Python + R",
    title: "\"0,81 RMSE\" gerçekte ne kadar iyiydi?",
    lede: "2025'teki takım projemizde Netflix Prize verisinde 0,81 RMSE raporlamıştık. Aynı model türünü resmî probe kümesinde ve eski rastgele bölmede yan yana çalıştırdım: sayıyı modelden çok bölme yöntemi belirliyor.",
    appTitle: "Benzer filmler", appSub: "Bir film seç: matris ayrıştırmasının öğrendiği film vektörlerine göre en yakın 10 film (eğitim verisinde en az 1.000 puanı olan filmler).",
    searchPh: "Film ara… (ör. Lord of the Rings, Matrix)", pick: "Bir film seç — benzerleri burada açılır.",
    ratings: "puan", mean: "ortalama", sim: "benzerlik", neighbours: "Puanlama örüntüsü en çok benzeyenler",
    anTitle: "Nasıl analiz ettim", anSub: "Aynı dört model, iki bölmede: resmî probe (her kullanıcının en yeni puanları) ve 2025 tasarımı (tüm puanların rastgele %20'si). Hiperparametreler ders kitabı varsayılanı; test kümesinde ayar yapılmadı.",
    c1t: "Aynı modeller, iki bölme", c1s: "RMSE (düşük daha iyi). Kesikli çizgiler: Cinematch (quiz, 0,9514) ve büyük ödül (test, 0,8567).",
    c2t: "Öğrenme eğrisi", c2s: "Matris ayrıştırma (k = 50), tur başına test RMSE; kesikli: eğitim.",
    c3t: "Az puan veren kullanıcı zor", c3s: "Probe'da RMSE, test puanının sahibinin eğitimdeki puan sayısına göre.",
    c4t: "Veride bir kırılma: 2004", c4s: "Aylık ortalama puan (en az 10.000 puanlı aylar).",
    found: "Ne buldum", care: "Dikkat",
    fData: "Veri ve lisans", fDataTxt: "Netflix Prize veri seti (Netflix, 2006; Kaggle: netflix-inc/netflix-prize-data). Lisans: yalnız araştırma amaçlı, yeniden dağıtılamaz, ticari kullanılamaz; kullanımı belirtilmelidir. Bu sayfa yalnız toplu sonuçlar ve film benzerlikleri içerir; tek bir puan, kullanıcı ya da tarih yayımlanmaz. Netflix ile bağı yoktur.",
    fTeam: "Takım", fTeamTxt: "Özgün proje (2025): Yunus Emre Civelek, Mxlenos ve Sertan Şafak — veri birleştirme, keşif, recommenderlab/recosystem ve NeuMF modelleri depoda duruyor. 2026 yeniden analizi: Sertan Şafak.",
    fRepro: "Yeniden üret", showTable: "Tabloyu göster",
    models: { global_mean: "Genel ortalama", movie_mean: "Film ortalaması", biases: "Kullanıcı + film sapmaları", mf: "Matris ayrıştırma (k=50)" },
    probe: "probe (resmî)", random: "rastgele %20 (2025)",
    kpi: (n) => [["Resmî probe'da", n.mfp, `matris ayrıştırma · Cinematch ${n.cine}, ödül ${n.prize}`], ["Aynı model, rastgele bölme", n.mfr, "2025'teki 0,81'in geldiği tasarım"],
                 ["Bölmenin hediyesi", `−${n.gap}`, `her model rastgele bölmede RMSE'de ${n.gmin}–${n.gmax} daha iyi görünüyor`], ["Veri", n.nr, `${n.nu} kullanıcı · ${n.nm} film · 0 tekrar`]],
    found_: (n) => [
      `2025'teki 0,81, tüm puanların rastgele %20'sinde ölçülmüştü. Aynı tasarımda k = 50'lik ayarlanmamış modelim ${n.mfr} veriyor; takımın raporladığı 0,81 (recosystem, k = 300) bu tasarımla tutarlı.`,
      `Resmî probe kümesinde (her kullanıcının en yeni puanları) aynı model ${n.mfp}: Cinematch'ten (${n.cine}) iyi, büyük ödülden (${n.prize}) uzak. Rastgele bölme her modeli kayırıyor: genel ortalama ${n.g0}, film ortalaması ${n.g1}, sapmalar ${n.g2}, matris ayrıştırma ${n.g3} daha iyi görünüyor.`,
      `Neden: rastgele bölmede test puanlarının neredeyse tamamı (%${n.fut}) kullanıcının son eğitim puanıyla aynı gün ya da ondan önce — model kullanıcının sonraki davranışını zaten görmüş oluyor; probe'da bu oran %${n.futp} (aynı gün verilen puanlar). Test kullanıcıları da daha yoğun: eğitimde medyan ${n.actr} puan, probe'da ${n.actp}.`,
      `Film ortalaması probe'da ${n.mm}; yayımlanmış kıyas (quiz kümesi) 1,0540. Yani ayrıştırma ve eşleştirme doğru: 1.408.395 probe puanının tamamı eğitim dosyalarında bulundu.`,
      `Veride bir kırılma var: aylık ortalama puan 2003 sonunda ${n.m03}, 2004 ortasında ${n.m04}. Tarihi modellemeyen her yöntem bu kaymayı hata olarak taşıyor.`],
    care_: ["Hiperparametreler ders kitabı varsayılanı (k=50, öğrenme 0,005, düzenlileştirme 0,02, 20 tur); probe'da ayar yapılmadı. Ayar iki sayıyı da düşürür; ama fark dört modelin dördünde de aynı yönde, yani bölmeden geliyor.",
            "Probe, quiz/test kümesiyle aynı değil; Cinematch ve ödül sayıları quiz/test üzerinde. Kıyas yönü doğru, birebir değil.",
            "Benzer filmler puanlama örüntüsünden geliyor, içerikten değil; aynı kitleye hitap eden filmler yan yana düşer."],
  },
  en: {
    crumb: "Projects / Netflix Prize, revisited", kicker: "Recommender systems · 100 million ratings · Python + R",
    title: "How good was \"0.81 RMSE\" really?",
    lede: "Our 2025 team project reported 0.81 RMSE on the Netflix Prize data. I ran the same kind of model on the official probe set and on the old random split side by side: the split decides the number more than the model does.",
    appTitle: "Similar films", appSub: "Pick a film: the 10 nearest films by the vectors matrix factorisation learned (films with at least 1,000 ratings in training).",
    searchPh: "Search films… (e.g. Lord of the Rings, Matrix)", pick: "Pick a film — its neighbours open here.",
    ratings: "ratings", mean: "mean", sim: "similarity", neighbours: "Closest by rating pattern",
    anTitle: "How I analysed it", anSub: "The same four models on two splits: the official probe (each user's newest ratings) and the 2025 design (a random 20% of all ratings). Textbook hyperparameters; nothing tuned on a test set.",
    c1t: "Same models, two splits", c1s: "RMSE (lower is better). Dashed: Cinematch (quiz, 0.9514) and the Grand Prize (test, 0.8567).",
    c2t: "Learning curve", c2s: "Matrix factorisation (k = 50), test RMSE per epoch; dashed: training.",
    c3t: "Light users are hard", c3s: "Probe RMSE by how many training ratings the test rating's user has.",
    c4t: "A break in the data: 2004", c4s: "Monthly mean rating (months with at least 10,000 ratings).",
    found: "What I found", care: "Read with care",
    fData: "Data & licence", fDataTxt: "Netflix Prize dataset (Netflix, 2006; Kaggle: netflix-inc/netflix-prize-data). Licence: research only, no redistribution, no commercial use; use must be acknowledged. This page holds aggregates and film similarities only — no single rating, user or date is published. Not affiliated with Netflix.",
    fTeam: "Team", fTeamTxt: "Original project (2025): Yunus Emre Civelek, Mxlenos and Sertan Şafak — data merging, exploration, recommenderlab/recosystem and NeuMF models remain in the repo. 2026 re-analysis: Sertan Şafak.",
    fRepro: "Reproduce", showTable: "Show table",
    models: { global_mean: "Global mean", movie_mean: "Movie mean", biases: "User + movie biases", mf: "Matrix factorisation (k=50)" },
    probe: "probe (official)", random: "random 20% (2025)",
    kpi: (n) => [["On the official probe", n.mfp, `matrix factorisation · Cinematch ${n.cine}, prize ${n.prize}`], ["Same model, random split", n.mfr, "the design behind 2025's 0.81"],
                 ["What the split gives away", `−${n.gap}`, `every model looks ${n.gmin}–${n.gmax} RMSE better on the random split`], ["Data", n.nr, `${n.nu} users · ${n.nm} films · 0 duplicates`]],
    found_: (n) => [
      `2025's 0.81 was measured on a random 20% of all ratings. On that design my untuned k = 50 model gets ${n.mfr}; the team's reported 0.81 (recosystem, k = 300) is consistent with it.`,
      `On the official probe (each user's newest ratings) the same model scores ${n.mfp}: better than Cinematch (${n.cine}), far from the Grand Prize (${n.prize}). The random split flatters every model: global mean by ${n.g0}, movie mean by ${n.g1}, biases by ${n.g2}, matrix factorisation by ${n.g3}.`,
      `Why: in the random split almost every test rating (${n.fut}%) falls on or before the user's last training date — the model has already seen the user's later behaviour; on the probe it is ${n.futp}% (same-day ratings). Random-split test users are also heavier: median ${n.actr} training ratings vs ${n.actp} on the probe.`,
      `The movie mean scores ${n.mm} on the probe; the published benchmark (quiz set) is 1.0540. So parsing and matching are right: all 1,408,395 probe ratings were found in the training files.`,
      `There is a break in the data: the monthly mean rating is ${n.m03} at the end of 2003 and ${n.m04} by mid-2004. Any method that ignores time carries this shift as error.`],
    care_: ["Hyperparameters are textbook defaults (k=50, learning rate 0.005, regularisation 0.02, 20 epochs), never tuned on the probe. Tuning would lower both numbers, but the gap points the same way for all four models: it comes from the split.",
            "The probe is not the quiz/test set; the Cinematch and prize figures are on quiz/test. The comparison is directional, not exact.",
            "Similar films come from rating patterns, not content: films watched by the same audience sit together."],
  },
};
let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("nf-lang") || L; } catch (e) {}
const t = (k) => I18N[L][k];
let D = null;
const S = { i: null, q: "" };
const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v != null && v !== false) n.setAttribute(k, v === true ? "" : v); }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k)); return n; };
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, a = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) n.setAttribute(k, v); return n; };
const txt = (x, y, s, a = {}) => { const n = sv("text", { x, y, ...a }); n.textContent = s; return n; };
const fmt = (x, d = 3) => x.toLocaleString(L === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const tip = $("#tip");
function hover(node, text) {
  node.addEventListener("pointermove", (e) => { tip.textContent = text; tip.style.opacity = 1; tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY + 12 + "px"; });
  node.addEventListener("pointerleave", () => (tip.style.opacity = 0));
}
const table = (rows, head) => el("details", { class: "tbl" }, el("summary", {}, t("showTable")),
  el("table", {}, el("tr", {}, head.map((h) => el("th", {}, h))), rows.map((r) => el("tr", {}, r.map((c) => el("td", {}, c))))));
const R = (split) => D.metrics.results.find((r) => r.split === split);

function nums() {
  const p = R("probe"), r = R("random"), ref = D.metrics.reference, keys = ["global_mean", "movie_mean", "biases", "mf"];
  const gaps = keys.map((k) => p[k] - r[k]);
  const mo = (m) => { const row = D.monthly.find((x) => x[0] === m); return row ? fmt(row[2], 2) : "—"; };
  return { mfp: fmt(p.mf), mfr: fmt(r.mf), cine: fmt(ref.cinematch_quiz, 4), prize: fmt(ref.grand_prize_test, 4), gap: fmt(p.mf - r.mf),
    gmin: fmt(Math.min(...gaps), 2), gmax: fmt(Math.max(...gaps), 2), g0: fmt(gaps[0]), g1: fmt(gaps[1]), g2: fmt(gaps[2]), g3: fmt(gaps[3]),
    nr: `${fmt(D.metrics.n_ratings / 1e6, 2)} M`, nu: D.metrics.n_users.toLocaleString(L === "tr" ? "tr-TR" : "en-GB"), nm: D.metrics.n_movies.toLocaleString(L === "tr" ? "tr-TR" : "en-GB"),
    fut: fmt(100 * (1 - r.test_share_after_last_train_rating), 1), futp: fmt(100 * (1 - p.test_share_after_last_train_rating), 0),
    actr: Math.round(r.test_user_median_train_ratings), actp: Math.round(p.test_user_median_train_ratings), mm: fmt(p.movie_mean, 4),
    m03: mo("2003-12"), m04: mo("2004-06") };
}

/* ------------------------------------------------------------------ similar films */
function renderLeft() {
  const F = D.films, inp = el("input", { class: "search", type: "search", placeholder: t("searchPh"), "aria-label": t("searchPh"), value: S.q });
  const ul = el("ul", { class: "results" });
  const run = () => {
    S.q = inp.value; const q = norm(S.q.trim());
    const hits = q.length >= 2 ? F.t.map((_, i) => i).filter((i) => norm(F.t[i]).includes(q)).sort((a, b) => F.n[b] - F.n[a]).slice(0, 40)
      : F.n.map((n, i) => [n, i]).sort((a, b) => b[0] - a[0]).slice(0, 25).map(([, i]) => i);
    ul.replaceChildren(...hits.map((i) => el("li", {}, el("button", { type: "button", "aria-current": i === S.i, onclick: () => { S.i = i; renderLeft(); renderDetail(); } },
      el("span", { class: "nm" }, F.t[i]), el("span", { class: "meta" }, `${F.y[i] ?? ""} · ${F.n[i].toLocaleString()}`)))));
  };
  inp.addEventListener("input", run);
  $("#left").replaceChildren(inp, ul); run();
}
function renderDetail() {
  const F = D.films, i = S.i;
  if (i === null) { $("#detail").replaceChildren(el("div", { class: "empty" }, t("pick"))); return; }
  $("#detail").replaceChildren(
    el("h3", {}, F.t[i]), el("div", { class: "muted" }, `${F.y[i] ?? "—"} · ${F.n[i].toLocaleString()} ${t("ratings")} · ${t("mean")} ${fmt(F.m[i], 2)}`),
    el("div", { class: "sec" }, el("h4", {}, t("neighbours")), el("ul", { class: "results" }, F.nb[i].map(([j, s]) => el("li", {},
      el("button", { type: "button", onclick: () => { S.i = j; renderLeft(); renderDetail(); } },
        el("span", { class: "nm" }, `${F.t[j]} `, el("span", { class: "muted" }, `(${F.y[j] ?? "—"})`)),
        el("span", { class: "meta" }, `${fmt(100 * s, 0)}% ${t("sim")} · ${fmt(F.m[j], 2)}★`)))))));
}

/* ------------------------------------------------------------------ charts */
function ladder(host) {
  const keys = ["global_mean", "movie_mean", "biases", "mf"], ref = D.metrics.reference, W = 520, rowH = 50, left = 175, H = keys.length * rowH + 34, x0 = 0.8, x1 = 1.16;
  const X = (v) => left + ((v - x0) / (x1 - x0)) * (W - left - 44), s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const [v, lab] of [[ref.cinematch_quiz, "Cinematch"], [ref.grand_prize_test, L === "tr" ? "Ödül" : "Prize"]])
    s.append(sv("line", { x1: X(v), x2: X(v), y1: 0, y2: H - 28, stroke: "var(--ink)", "stroke-dasharray": "4 4" }), txt(X(v), H - 14, lab, { "text-anchor": "middle", class: "tick" }));
  keys.forEach((k, i) => { const y = 6 + i * rowH;
    s.append(txt(left - 8, y + 18, t("models")[k], { "text-anchor": "end" }));
    [["probe", 0, "bar"], ["random", 17, "bar n"]].forEach(([sp, dy, cls]) => { const v = R(sp)[k], g = sv("g");
      g.append(sv("rect", { class: cls, x: left, y: y + dy, width: X(v) - left, height: 14, rx: 3 }));
      hover(g, `${t("models")[k]} · ${t(sp)}: ${fmt(v, 4)}`); s.append(g, txt(X(v) + 5, y + dy + 11, fmt(v), { class: "tick" })); }); });
  host.replaceChildren(s, el("div", { class: "legend" }, el("span", {}, el("i", { style: "background:var(--accent)" }), t("probe")), el("span", {}, el("i", { style: "background:var(--neutral-mark)" }), t("random"))),
    table(keys.map((k) => [t("models")[k], fmt(R("probe")[k], 4), fmt(R("random")[k], 4)]), ["", t("probe"), t("random")]));
}
function curves(host) {
  const W = 520, H = 260, m = { l: 44, r: 12, t: 10, b: 30 }, all = D.curve, y0 = 0.7, y1 = 1.02;
  const X = (e) => m.l + ((e - 1) / 19) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const v of [0.75, 0.85, 0.95]) s.append(sv("line", { class: "ax", x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }), txt(m.l - 6, Y(v) + 4, fmt(v, 2), { "text-anchor": "end", class: "tick" }));
  for (const e of [1, 5, 10, 15, 20]) s.append(txt(X(e), H - 10, e, { "text-anchor": "middle", class: "tick" }));
  for (const [sp, col] of [["probe", "var(--accent)"], ["random", "var(--neutral-mark)"]]) {
    const rows = all.filter((r) => r.split === sp);
    for (const [key, dash] of [["test_rmse", null], ["train_rmse", "5 4"]]) {
      const p = sv("polyline", { points: rows.map((r) => `${X(r.epoch)},${Y(r[key])}`).join(" "), fill: "none", stroke: col, "stroke-width": 2.5, ...(dash ? { "stroke-dasharray": dash } : {}) });
      hover(p, `${t(sp)} · ${key === "test_rmse" ? "test" : "train"}: ${rows.map((r) => fmt(r[key], 3)).slice(-1)[0]} (${L === "tr" ? "20. tur" : "epoch 20"})`); s.append(p);
    }
  }
  host.replaceChildren(s, el("div", { class: "legend" }, el("span", {}, el("i", { style: "background:var(--accent)" }), t("probe")), el("span", {}, el("i", { style: "background:var(--neutral-mark)" }), t("random"))),
    table(all.filter((r) => r.epoch % 5 === 0 || r.epoch === 1).map((r) => [t(r.split), r.epoch, fmt(r.train_rmse), fmt(r.test_rmse)]), ["", "epoch", "train", "test"]));
}
function activity(host) {
  const rows = D.activity.filter((r) => r.split === "probe"), W = 520, H = 250, m = { l: 44, r: 10, t: 10, b: 44 }, bw = (W - m.l - m.r) / rows.length, y0 = 0.7, y1 = 1.2;
  const Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b), tot = rows.reduce((a, r) => a + r.n_test, 0);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (const v of [0.8, 0.9, 1.0, 1.1]) s.append(sv("line", { class: "ax", x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }), txt(m.l - 6, Y(v) + 4, fmt(v, 1), { "text-anchor": "end", class: "tick" }));
  rows.forEach((r, i) => { const x = m.l + i * bw, g = sv("g");
    g.append(sv("rect", { class: "bar n", x: x + bw * 0.14, y: Y(r.biases), width: bw * 0.34, height: Y(y0) - Y(r.biases), rx: 3 }),
      sv("rect", { class: "bar", x: x + bw * 0.52, y: Y(r.mf), width: bw * 0.34, height: Y(y0) - Y(r.mf), rx: 3 }));
    hover(g, `${r.bucket}: ${L === "tr" ? "sapmalar" : "biases"} ${fmt(r.biases)} · MF ${fmt(r.mf)} · ${fmt(100 * r.n_test / tot, 1)}% ${L === "tr" ? "probe puanı" : "of probe"}`);
    s.append(g, txt(x + bw / 2, H - 26, r.bucket, { "text-anchor": "middle" }), txt(x + bw / 2, H - 10, `${fmt(100 * r.n_test / tot, 0)}%`, { "text-anchor": "middle", class: "tick" }));
  });
  host.replaceChildren(s, el("div", { class: "legend" }, el("span", {}, el("i", { style: "background:var(--neutral-mark)" }), t("models").biases), el("span", {}, el("i", { style: "background:var(--accent)" }), t("models").mf)),
    table(rows.map((r) => [r.bucket, r.n_test.toLocaleString(), fmt(r.biases), fmt(r.mf)]), [L === "tr" ? "eğitim puanı" : "training ratings", "n", t("models").biases, "MF"]));
}
function monthly(host) {
  const rows = D.monthly.filter((r) => r[1] >= 10000), W = 520, H = 230, m = { l: 40, r: 10, t: 10, b: 28 };
  const ys = rows.map((r) => r[2]), y0 = Math.floor(Math.min(...ys) * 10) / 10, y1 = Math.ceil(Math.max(...ys) * 10) / 10;
  const X = (i) => m.l + (i / (rows.length - 1)) * (W - m.l - m.r), Y = (v) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img" });
  for (let v = y0; v <= y1 + 1e-9; v += 0.1) s.append(sv("line", { class: "ax", x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }), txt(m.l - 6, Y(v) + 4, fmt(v, 1), { "text-anchor": "end", class: "tick" }));
  rows.forEach((r, i) => { if (r[0].endsWith("-01")) s.append(txt(X(i), H - 8, r[0].slice(0, 4), { "text-anchor": "middle", class: "tick" })); });
  s.append(sv("polyline", { points: rows.map((r, i) => `${X(i)},${Y(r[2])}`).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 2.5 }));
  rows.forEach((r, i) => { const c = sv("circle", { cx: X(i), cy: Y(r[2]), r: 5, class: "hit" }); hover(c, `${r[0]}: ${fmt(r[2], 3)} · n ${r[1].toLocaleString()}`); s.append(c); });
  host.replaceChildren(s, table(rows.filter((r) => /-(01|07)$/.test(r[0])).map((r) => [r[0], r[1].toLocaleString(), fmt(r[2], 3)]), [L === "tr" ? "ay" : "month", "n", L === "tr" ? "ortalama" : "mean"]));
}

function paint() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { const v = t(n.dataset.i); if (typeof v === "string") n.textContent = v; });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
  $("#care").replaceChildren(...t("care_").map((x) => el("li", {}, x)));
  if (!D) return;
  const n = nums();
  $("#kpis").replaceChildren(...t("kpi")(n).map((k, i) => el("div", { class: "kpi" + (i === 0 ? " hi" : "") }, el("div", { class: "l" }, k[0]), el("div", { class: "v" }, k[1]), el("div", { class: "c" }, k[2]))));
  $("#found").replaceChildren(...t("found_")(n).map((x) => el("li", {}, x)));
  renderLeft(); renderDetail(); ladder($("#c1")); curves($("#c2")); activity($("#c3")); monthly($("#c4"));
}
$("#lang").addEventListener("click", () => { L = L === "tr" ? "en" : "tr"; try { localStorage.setItem("nf-lang", L); } catch (e) {} paint(); });
$("#theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const nxt = cur === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nxt);
  try { localStorage.setItem("pd-theme", nxt); } catch (e) {}
});
paint();
fetch("data/netflix.json").then((r) => r.json()).then((d) => {
  D = d; const k = D.films.t.findIndex((x) => /Fellowship of the Ring/.test(x)); S.i = k >= 0 ? k : 0; paint();
}).catch(() => { $("#detail").textContent = "data/netflix.json could not be loaded (open via a web server)."; });
