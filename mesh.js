// Hero background: a small mesh in the style of the FIPS Lab live view. A
// spanning tree grows from the root (amber), packets travel along it, and every
// few seconds a tree link is cut: dashed red while the nodes still believe it
// is up (packets reaching it are lost), then dropped, and the tree regrows
// around it until the link heals. Static under prefers-reduced-motion.

(() => {
  const canvas = document.getElementById("mesh");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  const N = 17;
  const SPEED = 0.11; // px per ms
  const DETECT = 1600; // ms a cut goes unnoticed
  const HEAL = 5200; // ms from cut to heal
  const EVERY = 7500; // ms between cuts

  // Seeded, so the layout is the same on every visit.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // Node positions as fractions of the layout box, kept apart.
  const unit = [];
  while (unit.length < N) {
    const p = { x: rand(), y: rand() };
    if (unit.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 0.8) > 0.2)) unit.push(p);
  }
  const hex = "023456789acdefghjklmnpqrstuvwxyz";
  const npub = () => "npub1" + Array.from({ length: 4 }, () => hex[Math.floor(rand() * hex.length)]).join("") + "…";
  const nodes = unit.map((p, i) => ({ ...p, i, label: npub(), phase: rand() * 6.28, x0: 0, y0: 0 }));

  // Mesh links: each node to its three nearest neighbours.
  const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  const links = new Map();
  for (const a of nodes) {
    const near = nodes.filter((b) => b !== a).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y));
    for (const b of near.slice(0, 3)) links.set(key(a.i, b.i), { a: a.i, b: b.i, state: "up", since: 0 });
  }
  const ROOT = nodes.reduce((m, n) => (n.y < m.y ? n : m)).i;

  let parent = [];
  function grow() {
    // Breadth-first from the root over links that are not dead.
    parent = new Array(N).fill(-1);
    const seen = new Set([ROOT]);
    const queue = [ROOT];
    while (queue.length) {
      const u = queue.shift();
      for (const l of links.values()) {
        if (l.state === "dead") continue;
        const v = l.a === u ? l.b : l.b === u ? l.a : -1;
        if (v < 0 || seen.has(v)) continue;
        seen.add(v);
        parent[v] = u;
        queue.push(v);
      }
    }
  }
  const isTree = (l) => parent[l.a] === l.b || parent[l.b] === l.a;

  function route(src, dst) {
    const up = (n) => { const p = [n]; while (parent[n] >= 0) p.push((n = parent[n])); return p; };
    const s = up(src), d = up(dst);
    if (s[s.length - 1] !== ROOT || d[d.length - 1] !== ROOT) return null;
    const ds = new Set(d);
    const meet = s.findIndex((n) => ds.has(n));
    return s.slice(0, meet + 1).concat(d.slice(0, d.indexOf(s[meet])).reverse());
  }

  // Layout: on wide screens the mesh sits to the right of the headline.
  let W = 0, H = 0, dpr = 1;
  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const wide = W > 900;
    const h1 = document.querySelector(".hero h1");
    const text = h1 ? h1.getBoundingClientRect().right - r.left : W * 0.52;
    const x0 = wide ? Math.max(W * 0.5, text + 56) : 16, x1 = W - (wide ? 110 : 16);
    const y0 = 72, y1 = H - 56;
    for (const n of nodes) { n.x0 = x0 + n.x * (x1 - x0); n.y0 = y0 + n.y * (y1 - y0); }
  }

  let colors = {};
  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const v = (k) => s.getPropertyValue(k).trim();
    colors = { series: v("--series"), stuck: v("--stuck"), axis: v("--axis"), muted: v("--muted"), root: v("--root"), page: v("--page"), text: v("--text-2"), mono: v("--mono") };
  }

  const pos = (n, t) => ({ x: n.x0 + Math.sin(t / 2400 + n.phase) * 3, y: n.y0 + Math.cos(t / 3100 + n.phase) * 3 });

  let packets = [];
  let nextCut = 2200, nextPacket = 0;

  function step(t, dt) {
    // Cuts: pick a tree link whose loss leaves the mesh connected.
    if (t > nextCut) {
      nextCut = t + EVERY;
      const options = [...links.values()].filter((l) => l.state === "up" && isTree(l) && l.a !== ROOT && l.b !== ROOT);
      for (let tries = 0; tries < 12 && options.length; tries++) {
        const l = options.splice(Math.floor(Math.random() * options.length), 1)[0];
        l.state = "dead"; grow();
        const ok = parent.every((p, i) => i === ROOT || p >= 0);
        l.state = "up"; grow();
        if (ok) { l.state = "cut"; l.since = t; break; }
      }
    }
    for (const l of links.values()) {
      if (l.state === "cut" && t - l.since > DETECT) { l.state = "dead"; grow(); }
      else if (l.state === "dead" && t - l.since > HEAL) { l.state = "up"; grow(); }
    }

    if (t > nextPacket) {
      nextPacket = t + 110 + Math.random() * 160;
      const a = Math.floor(Math.random() * N), b = Math.floor(Math.random() * N);
      const path = a !== b && route(a, b);
      if (path) packets.push({ path, hop: 0, at: 0, lost: 0 });
    }
    for (const p of packets) {
      if (p.lost) { p.lost += dt; continue; }
      const u = nodes[p.path[p.hop]], v = nodes[p.path[p.hop + 1]];
      const l = links.get(key(u.i, v.i));
      const len = Math.hypot(v.x0 - u.x0, v.y0 - u.y0);
      p.at += (SPEED * dt) / len;
      if (l.state !== "up" && p.at > 0.5) { p.at = 0.5; p.lost = 1; continue; }
      if (p.at >= 1) { p.hop++; p.at = 0; }
    }
    packets = packets.filter((p) => (p.lost ? p.lost < 600 : p.hop < p.path.length - 1));
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const P = nodes.map((n) => pos(n, t));

    for (const l of links.values()) {
      const a = P[l.a], b = P[l.b];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      if (l.state === "cut") {
        ctx.setLineDash([6, 5]); ctx.strokeStyle = colors.stuck; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.95;
      } else if (l.state === "dead") {
        ctx.setLineDash([1.5, 5]); ctx.strokeStyle = colors.muted; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
      } else if (isTree(l)) {
        ctx.setLineDash([]); ctx.strokeStyle = colors.series; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
      } else {
        ctx.setLineDash([]); ctx.strokeStyle = colors.axis; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    for (const p of packets) {
      const u = P[p.path[p.hop]], v = P[p.path[p.hop + 1]];
      const x = u.x + (v.x - u.x) * p.at, y = u.y + (v.y - u.y) * p.at;
      ctx.globalAlpha = p.lost ? Math.max(0, 1 - p.lost / 600) : 0.95;
      ctx.fillStyle = p.lost ? colors.stuck : colors.series;
      ctx.beginPath(); ctx.arc(x, y, p.lost ? 2.4 + p.lost / 150 : 2.2, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const labels = W > 900;
    ctx.font = "10px " + colors.mono;
    for (const n of nodes) {
      const { x, y } = P[n.i];
      const root = n.i === ROOT;
      ctx.fillStyle = colors.page;
      ctx.strokeStyle = root ? colors.root : colors.series;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x, y, root ? 7 : 5.5, 0, 6.283); ctx.fill(); ctx.stroke();
      if (root) { ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.283); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1; }
      if (labels) { ctx.fillStyle = colors.muted; ctx.globalAlpha = 0.8; ctx.fillText(n.label, x + 10, y + 16); ctx.globalAlpha = 1; }
    }
  }

  let last = 0, running = false, visible = true;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(64, t - (last || t));
    last = t;
    step(t, dt);
    draw(t);
    requestAnimationFrame(frame);
  }
  function play() {
    const go = visible && !document.hidden && !still.matches;
    if (go && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    if (!go) { running = false; draw(performance.now()); }
  }

  grow();
  readColors();
  layout();
  draw(0);
  new ResizeObserver(() => { layout(); if (!running) draw(performance.now()); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(canvas);
  document.addEventListener("visibilitychange", play);
  still.addEventListener("change", play);
  const recolor = () => { readColors(); if (!running) draw(performance.now()); };
  new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", recolor);
  play();
})();
