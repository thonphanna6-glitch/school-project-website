(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (reduce) document.documentElement.classList.add("reduce");

  $("#year").textContent = new Date().getFullYear();

  /* ---- split name into letters ---- */
  $$("[data-split]").forEach(function (el) {
    var text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? "\u00a0" : ch;
      s.style.animationDelay = (i * 55) + "ms";
      el.appendChild(s);
    });
  });

  /* ---- nav: scroll state, progress, active link, mobile menu ---- */
  var nav = $("#nav"), prog = $("#progress"), menu = $("#menu"), burger = $("#burger");
  var links = $$("#menu a");
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    nav.classList.toggle("scrolled", y > 30);
    growLine();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
  links.forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section").forEach(function (s) { spy.observe(s); });
  }

  /* ---- timeline line grows with scroll ---- */
  var tl = $("#timeline"), fill = $("#lineFill");
  function growLine() {
    if (!tl) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.6 - r.top) / r.height;
    fill.style.height = Math.max(0, Math.min(1, p)) * 100 + "%";
  }
  growLine();

  /* ---- reveal on scroll + counters + skill meters ---- */
  var C = 2 * Math.PI * 52;
  function animateCount(el, to, dur) {
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + (el.dataset.suffix || "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function fireMeter(m) {
    if (m.dataset.done) return; m.dataset.done = "1";
    var lvl = +m.dataset.level, bar = $(".bar", m), num = $("b", m);
    bar.style.strokeDashoffset = C * (1 - lvl / 100);
    num.dataset.suffix = "%";
    animateCount(num, lvl, 1800);
  }
  function fireStat(el) {
    if (el.dataset.done) return; el.dataset.done = "1";
    animateCount(el, +el.dataset.count, 1400);
  }
  var seen = function (el) {
    el.classList.add("in");
    $$("[data-level]", el).forEach(fireMeter);
    if (el.matches("[data-level]")) fireMeter(el);
  };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el, i) {
      if (el.parentElement.id === "road") el.style.setProperty("--i", i % 2);
      io.observe(el);
    });
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { fireStat(e.target); io2.unobserve(e.target); } });
    });
    $$("[data-count]").forEach(function (el) { io2.observe(el); });
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { startCode(); io3.disconnect(); } });
    }, { threshold: 0.3 });
    io3.observe($(".terminal"));
  } else {
    $$(".reveal").forEach(seen);
    $$("[data-count]").forEach(fireStat);
    startCode();
  }

  /* ---- typed role ---- */
  var roles = ["Front-End Learner", "Web Designer", "JavaScript Explorer", "Future Full-Stack Developer"];
  var typed = $("#typed"), ri = 0, ci = 0, del = false;
  function tick() {
    var word = roles[ri];
    if (reduce) { typed.textContent = roles[roles.length - 1]; return; }
    ci += del ? -1 : 1;
    typed.textContent = word.slice(0, ci);
    var wait = del ? 40 : 85;
    if (!del && ci === word.length) { del = true; wait = 1500; }
    else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 350; }
    setTimeout(tick, wait);
  }
  tick();

  /* ---- code typing in terminal ---- */
  var codeHTML = [
    '<span class="c">// my journey so far</span>',
    '<span class="k">const</span> me = {',
    '  skills: [<span class="s">"HTML"</span>, <span class="s">"CSS"</span>, <span class="s">"JavaScript"</span>],',
    '  school: <span class="s">"Porieng"</span>,',
    '  goal: <span class="s">"Full-Stack Developer"</span>',
    '};',
    '',
    '<span class="k">function</span> <span class="f">learn</span>(day) {',
    '  <span class="k">return</span> me.skills.<span class="f">map</span>(s =&gt; s + <span class="s">" +1"</span>);',
    '}',
    '',
    '<span class="f">learn</span>(<span class="s">"today"</span>); <span class="c">// keep going</span>'
  ].join("\n");
  var codeStarted = false;
  function startCode() {
    if (codeStarted) return; codeStarted = true;
    var pre = $("#code");
    if (reduce) { pre.innerHTML = codeHTML; return; }
    // type visible characters but keep tags intact
    var i = 0, out = "";
    (function step() {
      var ch = codeHTML[i];
      if (ch === "<") { var j = codeHTML.indexOf(">", i); out += codeHTML.slice(i, j + 1); i = j + 1; }
      else if (ch === "&") { var k = codeHTML.indexOf(";", i); out += codeHTML.slice(i, k + 1); i = k + 1; }
      else { out += ch; i++; }
      pre.innerHTML = out + '<span class="caret"></span>';
      if (i < codeHTML.length) setTimeout(step, 16);
      else pre.innerHTML = codeHTML + '<span class="caret"></span>';
    })();
  }

  /* ---- 3D tilt + glare position ---- */
  if (fine && !reduce) {
    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = "perspective(900px) rotateY(" + ((x - .5) * 10) + "deg) rotateX(" + ((.5 - y) * 10) + "deg)";
        el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; el.style.transition = "transform .5s"; setTimeout(function () { el.style.transition = ""; }, 500); });
    });
    /* magnetic buttons */
    $$(".magnet").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .25) + "px," + ((e.clientY - r.top - r.height / 2) * .35) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    /* cursor glow */
    var glow = $("#glow"), gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; });
    (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = "translate(" + gx + "px," + gy + "px)"; requestAnimationFrame(loop); })();
  }

  /* ---- background canvas: floating code symbols + connecting lines ---- */
  var cv = $("#bg"), ctx = cv.getContext("2d"), W, H, dpr, pts = [], mouse = { x: -999, y: -999 };
  var glyphs = ["</>", "{ }", "( )", "[ ]", "=>", "#", "&&", "01", ";", "<>"];
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    var n = Math.min(46, Math.floor(innerWidth / 30));
    pts = [];
    for (var i = 0; i < n; i++) pts.push({
      x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35 * dpr, vy: (Math.random() - .5) * .35 * dpr,
      g: glyphs[i % glyphs.length], s: (11 + Math.random() * 9) * dpr, o: .12 + Math.random() * .22,
      c: i % 3 === 0 ? "255,138,61" : i % 3 === 1 ? "106,211,154" : "95,180,255"
    });
  }
  size(); addEventListener("resize", size);
  addEventListener("pointermove", function (e) { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "center";
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -40) p.x = W + 40; if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40; if (p.y > H + 40) p.y = -40;
      var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 140 * dpr) { p.x += dx / d * 1.4; p.y += dy / d * 1.4; }
      ctx.font = p.s + "px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(" + p.c + "," + p.o + ")";
      ctx.fillText(p.g, p.x, p.y);
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], ax = p.x - q.x, ay = p.y - q.y, dist = ax * ax + ay * ay, lim = (150 * dpr) * (150 * dpr);
        if (dist < lim) {
          ctx.strokeStyle = "rgba(255,255,255," + (.07 * (1 - dist / lim)) + ")";
          ctx.lineWidth = dpr * .8;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();

  onScroll();
})();