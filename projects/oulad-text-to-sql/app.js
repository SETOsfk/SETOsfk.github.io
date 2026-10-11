const $ = (s) => document.querySelector(s);
const T = {
  tr: {
    kicker: "Text-to-SQL · Gemini · Açık veri", title: "Soruyu SQL'e çeviren ajan",
    lede: "Veritabanına Türkçe ya da İngilizce soru soruyorsun, Gemini SQL yazıyor, sorgu salt-okunur çalıştırılıyor, sonuç geliyor. Veri: Open University'nin açık öğrenci verisi (OULAD), 7 tablo, 10,6 milyon satır.",
    notice: "Bu sayfa canlı değil, kayıtlı bir demo. Aşağıdaki cevaplar ajanın gerçek çıktısı ve sorgular gerçek veride çalıştırıldı, ama yeni soru yazamazsın. (Gemini anahtarı herkese açık bir sayfaya konamaz.)",
    h2: "Sorular", sub: "Bir soru seç. Gerçekten yanlış çıkan bir soru ve ajanın soru sorduğu iki belirsiz soru da var.",
    h3: "Ölçüm", sub3: "60 geliştirme + 20 dondurulmuş hold-out soru. Doğru sayılması için sorgu sonucu, elle yazdığım doğru sorgunun sonucuyla aynı olmalı.",
    note3: "Hiçbir fark istatistiksel olarak anlamlı değil (küçük kümeler, tek model, tek koşu). Ayrıntı ve karar günlüğü GitHub'da.",
    fData: "Veri ", fDataTxt: "Kuzilek, Hlosta, Zdrahal, Open University Learning Analytics Dataset, 2017 (CC BY 4.0). Model: gemini-3.5-flash-lite.", fCode: "Kod ",
    q: "Soru", sql: "Ajanın yazdığı SQL", res: "Sonuç", more: "ilk 12 satır", ok: "doğru", no: "yanlış",
    goldT: "Doğru cevap (benim yazdığım sorgu)", wrongNote: "Bu soruda ajan yanlış sorgu yazdı: istenen tek bir sayı, o ise öğrenci başına satır döndürüyor. SQL çalışıyor ama mantık hatalı; lint bunu yakalamıyor.",
    clar: "Ajan cevap yerine soru sordu", clarNote: "Soru belirsiz olduğunda model tahmin etmek yerine netleştirme istiyor. 10 belirsiz sorunun 4'ünde böyle yaptı, 80 net soruda hiç yapmadı.",
    cfg: "Yapılandırma", dev: "Geliştirme (60)", ho: "Hold-out (20)",
    rows: [["Sadece tablo şeması", "93,3%", "80%"], ["+ veri sözlüğü", "93,3%", "95%"], ["+ kolon değerleri", "91,7%", "90%"], ["+ lint ve tekrar deneme", "93,3%", "95%"], ["hepsi + netleştirme", "95,0%", "95%"], ["Türkçe sorular, hepsi açık", "93,3%", "95%"]]
  },
  en: {
    kicker: "Text-to-SQL · Gemini · Open data", title: "An agent that turns questions into SQL",
    lede: "You ask the database a question in Turkish or English, Gemini writes SQL, the query runs read-only, you get the result. Data: the Open University's open student dataset (OULAD), 7 tables, 10.6M rows.",
    notice: "This page is not live; it is a recorded demo. The answers below are the agent's real output and the queries were run on the real data, but you cannot type a new question. (A Gemini key cannot sit on a public page.)",
    h2: "Questions", sub: "Pick one. One question the agent got wrong and two ambiguous questions where it asked back are included.",
    h3: "Evaluation", sub3: "60 dev + 20 frozen hold-out questions. An answer counts as correct only if the query result equals the result of the gold query I wrote by hand.",
    note3: "No difference is statistically significant (small sets, one model, one run). Details and the decision log are on GitHub.",
    fData: "Data ", fDataTxt: "Kuzilek, Hlosta, Zdrahal, Open University Learning Analytics Dataset, 2017 (CC BY 4.0). Model: gemini-3.5-flash-lite.", fCode: "Code ",
    q: "Question", sql: "SQL written by the agent", res: "Result", more: "first 12 rows", ok: "correct", no: "wrong",
    goldT: "Correct answer (my hand-written query)", wrongNote: "The agent got this one wrong: the question wants a single number, the query returns one row per student. The SQL runs but the logic is off; the lint does not catch it.",
    clar: "The agent asked back instead of answering", clarNote: "When a question is ambiguous the model asks instead of guessing. It did so on 4 of 10 ambiguous questions and on none of 80 clear ones.",
    cfg: "Configuration", dev: "Dev (60)", ho: "Hold-out (20)",
    rows: [["Schema only", "93.3%", "80%"], ["+ data dictionary", "93.3%", "95%"], ["+ column values", "91.7%", "90%"], ["+ lint and retry", "93.3%", "95%"], ["all + clarification", "95.0%", "95%"], ["Turkish questions, all on", "93.3%", "95%"]]
  }
};
let L = (navigator.language || "tr").startsWith("tr") ? "tr" : "en";
try { L = localStorage.getItem("oulad-lang") || L; } catch (e) {}
const t = (k) => T[L][k];
let D = [], cur = 0;
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const fmt = (v) => typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString(L) : v.toLocaleString(L, { maximumFractionDigits: 1 })) : (v === null ? "—" : esc(v));
const table = (cols, rows) => `<div class="tbl"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${fmt(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
function paint() {
  document.documentElement.lang = L;
  document.querySelectorAll("[data-i]").forEach((n) => { const v = t(n.dataset.i); if (typeof v === "string") n.textContent = v; });
  $("#lang").textContent = L === "tr" ? "EN" : "TR";
  $("#qs").innerHTML = D.map((e, i) => `<button class="chip${e.ok === false ? " bad" : ""}" data-n="${i}" aria-pressed="${i === cur}">${esc((L === "tr" && e.tr) ? e.tr : e.en)}</button>`).join("");
  const e = D[cur];
  if (e) {
    let h = `<div><h4>${t("q")}</h4><div class="row"><span style="font-size:1.15rem">${esc((L === "tr" && e.tr) ? e.tr : e.en)}</span>${e.clarify ? "" : `<span class="badge ${e.ok ? "ok" : "no"}">${e.ok ? t("ok") : t("no")}</span>`}</div></div>`;
    if (e.clarify) h += `<div><h4>${t("clar")}</h4><div class="ask">${esc(e.clarify)}</div></div><p class="note">${t("clarNote")}</p>`;
    else {
      h += `<div><h4>${t("sql")}</h4><pre>${esc(e.sql)}</pre></div><div><h4>${t("res")}${e.n > 12 ? " · " + t("more") : ""}</h4>${table(e.cols, e.rows)}</div>`;
      if (!e.ok) h += `<p class="note">${t("wrongNote")}</p><div><h4>${t("goldT")}</h4><pre>${esc(e.gold_sql)}</pre>${table(e.gold_cols, e.gold_rows)}</div>`;
    }
    $("#out").innerHTML = h;
  }
  $("#sum").innerHTML = `<thead><tr><th>${t("cfg")}</th><th>${t("dev")}</th><th>${t("ho")}</th></tr></thead><tbody>${t("rows").map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
$("#qs").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) { cur = +b.dataset.n; paint(); } });
$("#lang").addEventListener("click", () => { L = L === "tr" ? "en" : "tr"; try { localStorage.setItem("oulad-lang", L); } catch (e) {} paint(); });
$("#theme").addEventListener("click", () => {
  const c = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const n = c === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", n);
  try { localStorage.setItem("pd-theme", n); } catch (e) {}
});
fetch("data/demo.json").then((r) => r.json()).then((d) => { D = d; paint(); });
