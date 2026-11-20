// Live network defence animation: packets travel between nodes; threats (red) are caught by a firewall ring.
(function () {
  const cv = document.getElementById('net');
  const log = document.getElementById('netlog');
  if (!cv || !log) return;

  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const msgs = [
    'Phishing link blocked',
    'Brute-force login blocked',
    'Malware download quarantined',
    'SQL injection blocked',
    'Ransomware payload isolated',
    'Suspicious port scan dropped'
  ];

  let W = 0, H = 0, nodes = [], edges = [], packets = [], rings = [], last = 0, spawn = 0, running = true;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function size() {
    const r = cv.parentElement.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.max(14, Math.min(46, Math.round(W / 34)));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .18,
      vy: (Math.random() - .5) * .18,
      p: 0
    }));
  }

  function link() {
    edges = [];
    const m = 150;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < m) {
          edges.push([i, j]);
        }
      }
    }
  }

  function send() {
    if (!edges.length) return;
    const e = edges[Math.random() * edges.length | 0], flip = Math.random() < .5;
    packets.push({
      a: flip ? e[1] : e[0],
      b: flip ? e[0] : e[1],
      t: 0,
      s: .004 + Math.random() * .004,
      threat: Math.random() < .22
    });
  }

  function say(t, ok) {
    log.className = 'netlog' + (ok ? ' ok' : '');
    log.innerHTML = '<i></i>' + t;
  }

  function draw(dt) {
    const ink = css('--ink'), steel = css('--steel'), flag = css('--flag'), sig = css('--sig'), ok = css('--ok');
    ctx.clearRect(0, 0, W, H);
    if (!reduce) {
      nodes.forEach(n => {
        n.x += n.vx * dt / 16;
        n.y += n.vy * dt / 16;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.p *= .94;
      });
    }
    link();
    ctx.lineWidth = 1; ctx.strokeStyle = steel; ctx.globalAlpha = .22;
    edges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.stroke();
    });
    ctx.globalAlpha = .55; ctx.fillStyle = ink;
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.5 + n.p * 3, 0, 7);
      ctx.fill();
    });

    // packets
    packets = packets.filter(k => {
      const a = nodes[k.a], b = nodes[k.b];
      if (!a || !b) return false;
      k.t += k.s * dt / 16;
      const x = a.x + (b.x - a.x) * k.t, y = a.y + (b.y - a.y) * k.t;
      if (k.threat && k.t > .55) { // firewall catches it
        rings.push({ x, y, r: 4, a: 1 });
        say(msgs[Math.random() * msgs.length | 0], false);
        return false;
      }
      if (k.t >= 1) { b.p = 1; return false; }
      ctx.globalAlpha = .9; ctx.fillStyle = k.threat ? flag : ok;
      ctx.beginPath(); ctx.arc(x, y, k.threat ? 4 : 3, 0, 7); ctx.fill();
      if (k.threat) {
        ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
      }
      return true;
    });

    // firewall rings
    rings = rings.filter(r => {
      r.r += 1.4 * dt / 16; r.a -= .018 * dt / 16;
      if (r.a <= 0) return false;
      ctx.globalAlpha = r.a; ctx.strokeStyle = sig; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  function frame(ts) {
    if (!running) return;
    const dt = Math.min(50, ts - last || 16);
    last = ts; spawn += dt;
    if (spawn > 420) { spawn = 0; send(); }
    draw(dt);
    requestAnimationFrame(frame);
  }

  size();
  addEventListener('resize', () => { size(); if (reduce) draw(0); });
  if (reduce) { link(); for (let i = 0; i < 6; i++) send(); draw(0); return; }
  say('Monitoring network', true);

  new IntersectionObserver(es => {
    const v = es[0].isIntersecting;
    if (v && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!v) running = false;
  }).observe(cv);

  requestAnimationFrame(frame);
})();
