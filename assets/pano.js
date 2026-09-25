/* pd.js — pano — dashboard toolkit (needs d3 v7).
   Small, reusable pieces every weekly dashboard can use:
     PD.theme.init(button)          light/dark toggle (remembers the choice)
     PD.on / PD.emit                tiny event bus; the time position is the "frame" event
     PD.tip                         one shared tooltip
     PD.chart(el, height, draw)     responsive SVG: draw(svg, width, height) re-runs on resize
     PD.player(opts)                play / pause / step / speed / keyboard over n frames
     PD.timeline(opts)              scrubbable context strip under a time-driven visual
     PD.pointMap(opts)              engraved basemap + "tank" glyphs whose water level = value
     PD.readout(opts)               ranked list with zero-based bars that follows the frame
   Anything project-specific lives in the analysis' own dashboard.js. */
(function (global) {
  "use strict";
  const PD = {};
  const d3 = global.d3;

  /* ---------------- helpers ---------------- */
  PD.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  PD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  PD.f1 = d3.format(".1f");
  PD.f0 = d3.format(".0f");
  PD.sign1 = (v) => (v > 0 ? "+" : v < 0 ? "−" : "±") + PD.f1(Math.abs(v));
  PD.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  PD.reduced = () => global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- event bus ---------------- */
  const handlers = {};
  PD.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  PD.emit = (ev, ...args) => { (handlers[ev] || []).forEach((fn) => fn(...args)); };

  /* ---------------- theme ---------------- */
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
  PD.theme = {
    current() {
      const t = document.documentElement.getAttribute("data-theme");
      if (t) return t;
      return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    init(btn) {
      let saved = null;
      try { saved = global.localStorage.getItem("pd-theme"); } catch (e) { /* storage blocked */ }
      if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
      if (!btn) return;
      const paint = () => {
        const dark = PD.theme.current() === "dark";
        btn.innerHTML = dark ? SUN : MOON;
        btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
        btn.title = btn.getAttribute("aria-label");
      };
      btn.addEventListener("click", () => {
        const next = PD.theme.current() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { global.localStorage.setItem("pd-theme", next); } catch (e) { /* ignore */ }
        paint();
        PD.emit("theme", next);
      });
      paint();
    },
  };

  /* ---------------- tooltip ---------------- */
  PD.tip = (() => {
    let node = null;
    const ensure = () => {
      if (!node) { node = document.createElement("div"); node.className = "pd-tip"; node.setAttribute("role", "status"); document.body.appendChild(node); }
      return node;
    };
    return {
      show(evt, html) {
        const n = ensure();
        n.innerHTML = html;
        n.classList.add("on");
        const r = n.getBoundingClientRect();
        let x = (evt.clientX ?? 0) + 14, y = (evt.clientY ?? 0) + 14;
        if (x + r.width > global.innerWidth - 8) x = (evt.clientX ?? 0) - r.width - 14;
        if (y + r.height > global.innerHeight - 8) y = (evt.clientY ?? 0) - r.height - 14;
        n.style.left = Math.max(8, x) + "px";
        n.style.top = Math.max(8, y) + "px";
      },
      hide() { if (node) node.classList.remove("on"); },
    };
  })();

  /* ---------------- responsive chart wrapper ---------------- */
  PD.chart = function (el, height, draw) {
    const svg = d3.select(el).append("svg").attr("role", "img");
    let lastW = 0;
    const render = () => {
      const w = Math.max(280, Math.floor(el.clientWidth));
      if (w === lastW) return;
      lastW = w;
      const h = typeof height === "function" ? height(w) : height;
      svg.attr("viewBox", `0 0 ${w} ${h}`).attr("width", w).attr("height", h);
      svg.selectAll("*").remove();
      draw(svg, w, h);
    };
    render();
    if (global.ResizeObserver) new ResizeObserver(render).observe(el);
    return { svg, redraw: () => { lastW = 0; render(); } };
  };

  PD.axis = (g, axis) => { g.attr("class", "ax").call(axis); g.select(".domain").remove(); return g; };

  /* ---------------- player ---------------- */
  PD.player = function ({ root, n, start = 0, fps = 4, label }) {
    let i = start, timer = null, speed = 1;
    const playBtn = root.querySelector('[data-act="play"]');
    const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
    const PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    const paint = () => {
      if (!playBtn) return;
      playBtn.innerHTML = (timer ? PAUSE : PLAY) + `<span>${timer ? "Pause" : playBtn.dataset.label || "Play"}</span>`;
      playBtn.setAttribute("aria-pressed", timer ? "true" : "false");
    };
    const set = (j, src, ms) => { i = PD.clamp(Math.round(j), 0, n - 1); PD.emit("frame", i, src || "set", ms); };
    const tick = () => { if (i >= n - 1) { stop(); return; } set(i + 1, "play", 1000 / (fps * speed)); };
    const play = () => {
      if (timer) return;
      if (i >= n - 1) set(0, "play");
      timer = setInterval(tick, 1000 / (fps * speed));
      paint();
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; paint(); };
    const toggle = () => (timer ? stop() : play());

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !root.contains(b)) return;
      const act = b.dataset.act;
      if (act === "play") toggle();
      if (act === "prev") { stop(); set(i - 1); }
      if (act === "next") { stop(); set(i + 1); }
      if (b.dataset.speed) {
        speed = +b.dataset.speed;
        root.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        if (timer) { stop(); play(); }
      }
      if (b.dataset.jump !== undefined) { stop(); set(+b.dataset.jump, "jump"); }
    });
    const stage = root.closest("[data-stage]") || root;
    stage.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select")) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stop(); set(i + (e.shiftKey ? 12 : 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); set(i - (e.shiftKey ? 12 : 1)); }
      else if (e.key === "Home") { e.preventDefault(); stop(); set(0); }
      else if (e.key === "End") { e.preventDefault(); stop(); set(n - 1); }
    });
    PD.on("frame", (j, src) => { i = j; if (src !== "play" && timer && src !== "set") stop(); });
    paint();
    return { set, play, stop, toggle, get: () => i, playing: () => !!timer, label };
  };

  /* ---------------- timeline (context strip + scrubber) ---------------- */
  PD.timeline = function ({ el, x, y, frameX, xFrame, marks = [], thr = null, yMax = 100, height = 92, fmtTick }) {
    let cur = 0, focusFn = null, sx = null, root = null;
    PD.chart(el, height, (svg, W, H) => {
      root = svg;
      const m = { l: 38, r: 10, t: 8, b: 20 };
      sx = d3.scaleTime().domain(d3.extent(x)).range([m.l, W - m.r]);
      const sy = d3.scaleLinear().domain([0, yMax]).range([H - m.b, m.t]);
      svg.append("g").selectAll("line").data([0, 50, 100]).join("line").attr("class", "gridln")
        .attr("x1", m.l).attr("x2", W - m.r).attr("y1", sy).attr("y2", sy);
      svg.append("g").selectAll("text").data([0, 50, 100]).join("text").attr("x", m.l - 6).attr("y", (d) => sy(d) + 3)
        .attr("text-anchor", "end").text((d) => d + "%");
      const idx = d3.range(x.length);
      svg.append("path").attr("class", "tl-area").attr("d", d3.area().x((k) => sx(x[k])).y0(sy(0)).y1((k) => sy(y[k]))(idx));
      svg.append("path").attr("class", "tl-line").attr("d", d3.line().x((k) => sx(x[k])).y((k) => sy(y[k]))(idx));
      if (thr !== null) svg.append("line").attr("class", "thr").attr("x1", m.l).attr("x2", W - m.r).attr("y1", sy(thr)).attr("y2", sy(thr));
      const every = W < 520 ? 4 : 2;
      PD.axis(svg.append("g").attr("transform", `translate(0,${H - m.b})`),
        d3.axisBottom(sx).ticks(d3.timeYear.every(every)).tickSize(3).tickFormat(fmtTick || d3.timeFormat("%Y")));
      svg.append("path").attr("class", "tl-focus").attr("id", el.id + "-focus");
      const mk = svg.append("g").selectAll("g").data(marks).join("g").attr("class", "tl-mark").style("cursor", "pointer")
        .attr("transform", (d) => `translate(${sx(d.date)},${sy(d.v)})`)
        .on("click", (e, d) => PD.emit("frame", d.i, "jump"))
        .on("mousemove", (e, d) => PD.tip.show(e, d.tip))
        .on("mouseleave", () => PD.tip.hide());
      mk.append("circle").attr("r", 3.6).attr("class", (d) => (d.crit ? "f-crit" : "f-ink"));
      const cg = svg.append("g").attr("class", "tl-cur");
      cg.append("line").attr("class", "tl-cursor").attr("y1", m.t - 2).attr("y2", H - m.b);
      cg.append("circle").attr("class", "tl-knob").attr("r", 5.5).attr("cy", m.t + 2);
      const hit = svg.append("rect").attr("x", m.l).attr("y", 0).attr("width", W - m.l - m.r).attr("height", H)
        .attr("fill", "transparent");
      const toFrame = (ev) => { const [px] = d3.pointer(ev, svg.node()); return xFrame(sx.invert(PD.clamp(px, m.l, W - m.r))); };
      hit.call(d3.drag().on("start drag", (ev) => PD.emit("frame", toFrame(ev.sourceEvent || ev), "scrub")));
      hit.on("click", (ev) => PD.emit("frame", toFrame(ev), "scrub"));
      svg.node().__sy = sy;
      move(cur);
      drawFocus();
    });
    function move(i) {
      cur = i;
      if (!sx || !root) return;
      root.select(".tl-cur").attr("transform", `translate(${sx(frameX(i))},0)`);
    }
    function drawFocus() {
      if (!root) return;
      const p = root.select(".tl-focus");
      if (!focusFn || !sx) { p.attr("d", null); return; }
      const sy = root.node().__sy;
      const pts = focusFn();
      p.attr("d", d3.line().defined((d) => d[1] !== null).x((d) => sx(d[0])).y((d) => sy(d[1]))(pts));
    }
    PD.on("frame", move);
    return { setFocus(fn) { focusFn = fn; drawFocus(); } };
  };

  /* ---------------- engraved point map with water-level glyphs ---------------- */
  PD.pointMap = function ({ el, bm, points, value, crit = () => false, labels = [], extras, minLabelScale = 0.55 }) {
    const W = bm.W, H = bm.H;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img");
    const uid = "pm" + Math.random().toString(36).slice(2, 7);
    const defs = svg.append("defs");
    defs.append("pattern").attr("id", uid + "-hatch").attr("width", 7).attr("height", 7).attr("patternUnits", "userSpaceOnUse")
      .append("path").attr("d", "M0 3.5H7").attr("class", "m-hatch");
    svg.append("rect").attr("class", "m-sea").attr("width", W).attr("height", H);
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", `url(#${uid}-hatch)`);
    (bm.water || []).forEach((d, k) => svg.append("path").attr("class", "m-water").attr("d", d).attr("stroke-width", 1.1 - k * 0.2).attr("opacity", 0.55 - k * 0.1));
    svg.append("path").attr("class", "m-land").attr("d", bm.land);
    if (bm.border) svg.append("path").attr("class", "m-border").attr("d", bm.border);
    const lab = svg.append("g").attr("class", "m-labels");
    labels.forEach((l) => lab.append("text").attr("class", l.cls || "m-lab-feat").attr("x", l.x).attr("y", l.y)
      .attr("text-anchor", l.anchor || "middle").attr("transform", l.rot ? `rotate(${l.rot},${l.x},${l.y})` : null).text(l.text));
    if (extras) extras(svg, defs);

    const layer = svg.append("g").attr("class", "dams");
    const g = layer.selectAll("g.dam").data(points, (d) => d.key).join("g").attr("class", "dam")
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (d) => d.name);
    // leader line + pin when the glyph had to be moved off its true position
    g.filter((d) => d.dx || d.dy).each(function (d) {
      const s = d3.select(this), len = Math.hypot(d.dx, d.dy), ux = d.dx / len, uy = d.dy / len;
      s.append("line").attr("class", "lead").attr("x1", d.x).attr("y1", d.y)
        .attr("x2", d.x + d.dx - ux * d.r).attr("y2", d.y + d.dy - uy * d.r);
      s.append("circle").attr("class", "pin").attr("cx", d.x).attr("cy", d.y).attr("r", 2.2);
    });
    const body = g.append("g").attr("class", "body").attr("transform", (d) => `translate(${d.x + (d.dx || 0)},${d.y + (d.dy || 0)})`);
    body.each(function (d) {
      const s = d3.select(this), r = d.r, id = `${uid}-c-${d.key}`;
      defs.append("clipPath").attr("id", id).append("circle").attr("r", r - 0.8);
      s.append("circle").attr("class", "tank").attr("r", r);
      const wl = Math.max(10, r * 0.9), amp = Math.max(0.9, r * 0.07);
      const pts = d3.range(-2 * r - wl, 2 * r + wl + 1, wl / 8).map((x) => [x, amp * Math.sin((x / wl) * 2 * Math.PI)]);
      const path = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + `L${(2 * r + wl).toFixed(1)} ${(2 * r + 4).toFixed(1)}L${(-2 * r - wl).toFixed(1)} ${(2 * r + 4).toFixed(1)}Z`;
      const lv = s.append("g").attr("clip-path", `url(#${id})`).append("g").attr("class", "lvl");
      lv.append("path").attr("class", "wtr" + (PD.reduced() ? "" : " wave")).attr("d", path).style("--wl", `${wl}px`);
      s.append("circle").attr("class", "rim").attr("r", r);
      const lx = d.lx ?? r + 5, ly = d.ly ?? -2, anchor = d.anchor || "start";
      s.append("text").attr("class", "nm").attr("x", lx).attr("y", ly).attr("text-anchor", anchor).text(d.name);
      s.append("text").attr("class", "pc").attr("x", lx).attr("y", ly + 13).attr("text-anchor", anchor);
    });

    let scaleK = 1;
    const relabel = () => {
      const k = el.clientWidth / W;
      if (!k || Math.abs(k - scaleK) < 0.01) return;
      scaleK = k;
      const inv = PD.clamp(1 / k, 1, 2.2);           // keep labels ~11–12px on screen
      g.selectAll(".nm").style("font-size", 12 * inv + "px").style("display", (d) => (k < minLabelScale && d.r < 18 ? "none" : null));
      g.selectAll(".pc").style("font-size", 11 * inv + "px").attr("dy", (13 * inv - 13)).style("display", (d) => (k < minLabelScale && d.r < 18 ? "none" : null));
      svg.selectAll(".m-labels text").style("font-size", function () { return (this.__fs || (this.__fs = parseFloat(getComputedStyle(this).fontSize))) * Math.min(inv, 1.6) + "px"; });
    };
    if (global.ResizeObserver) new ResizeObserver(relabel).observe(el);
    relabel();

    let mode = "level", colorFn = null, labelFn = null, dur = 250;
    function update(i, src, ms) {
      dur = src === "play" ? Math.min(260, (ms || 250) * 0.9) : 380;
      g.each(function (d) {
        const v = value(d.key, i), s = d3.select(this);
        const f = v === null || v === undefined ? 0 : PD.clamp(v / 100, 0, 1);
        const t = s.select(".lvl");
        const y = d.r - 2 * d.r * f;
        if (PD.reduced()) t.attr("transform", `translate(0,${y})`);
        else t.transition().duration(dur).ease(d3.easeCubicOut).attr("transform", `translate(0,${y})`);
        const isCrit = v !== null && crit(v, d.key, i);
        s.classed("is-crit", mode === "level" && isCrit);
        const alt = mode !== "level" && colorFn;
        s.select(".pc").text(alt && labelFn ? labelFn(d.key, i) : v === null ? "–" : PD.f0(v) + "%");
        s.select(".tank").style("fill", alt ? colorFn(d.key, i) : null);
      });
    }
    g.on("mouseenter focus", (e, d) => PD.emit("hover", d.key)).on("mouseleave blur", () => PD.emit("hover", null))
      .on("click", (e, d) => PD.emit("select", d.key))
      .on("keydown", (e, d) => { if (e.key === "Enter") PD.emit("select", d.key); });
    PD.on("frame", update);
    PD.on("hover", (key) => { svg.classed("map-dim", !!key); g.classed("hl", (d) => d.key === key); });
    return {
      svg, update,
      setMode(m, fn, lab) { mode = m; colorFn = fn || null; labelFn = lab || null; svg.classed("mode-alt", m !== "level"); },
    };
  };

  /* ---------------- readout list ---------------- */
  PD.readout = function ({ el, rows, value, extra, crit = () => false, thr = null }) {
    const list = d3.select(el);
    const r = list.selectAll("div.pd-row").data(rows, (d) => d.key).join("div").attr("class", "pd-row").attr("tabindex", 0);
    r.append("div").attr("class", "n").html((d) => `${PD.esc(d.name)}<small>${PD.esc(d.sub || "")}</small>`);
    const bars = r.append("svg").attr("viewBox", "0 0 100 12").attr("preserveAspectRatio", "none");
    bars.append("rect").attr("class", "f-grid").attr("width", 100).attr("height", 12).attr("rx", 2);
    bars.append("rect").attr("class", "b f-water").attr("height", 12).attr("rx", 2);
    if (thr !== null) bars.append("line").attr("class", "thr").attr("x1", thr).attr("x2", thr).attr("y1", 0).attr("y2", 12).style("stroke-dasharray", "2 2").attr("vector-effect", "non-scaling-stroke");
    r.append("div").attr("class", "v");
    r.append("div").attr("class", "a");
    r.on("mouseenter focus", (e, d) => PD.emit("hover", d.key)).on("mouseleave blur", () => PD.emit("hover", null))
      .on("click", (e, d) => PD.emit("select", d.key));
    PD.on("frame", (i) => {
      r.each(function (d) {
        const v = value(d.key, i), s = d3.select(this), c = v !== null && crit(v, d.key, i);
        s.select(".b").attr("width", v === null ? 0 : PD.clamp(v, 0, 100)).attr("class", "b " + (c ? "f-crit" : "f-water"));
        s.select(".v").text(v === null ? "–" : PD.f1(v) + "%").classed("crit", c);
        if (extra) { const x = extra(d.key, i); s.select(".a").text(x.text).attr("class", "a " + (x.cls || "")); }
      });
    });
    PD.on("hover", (key) => r.classed("on", (d) => d.key === key));
    PD.on("select", (key) => r.classed("sel", (d) => d.key === key));
  };

  global.PD = PD;
})(window);
