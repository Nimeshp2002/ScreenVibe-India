/* ScreenVibe India - shared script. Isse edit karne ki zarurat nahi.
   Apna data (API key, reviews, news) sirf data.js mein badlo. */
(function () {
  "use strict";
  var D = window.SV || {};
  D.MY = D.MY || {};
  D.NEWS = D.NEWS || [];
  var API = "https://api.themoviedb.org/3";
  var IMG = "https://image.tmdb.org/t/p/";
  var SITE = "ScreenVibe India";

  var G = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western" };
  var LANGS = [["", "Sab"], ["hi", "Hindi"], ["en", "English"], ["ta", "Tamil"], ["te", "Telugu"], ["ml", "Malayalam"], ["kn", "Kannada"], ["pa", "Punjabi"], ["bn", "Bengali"], ["mr", "Marathi"], ["ko", "Korean"], ["ja", "Japanese"]];
  var GENS = [["", "Sab"], [28, "Action"], [35, "Comedy"], [18, "Drama"], [53, "Thriller"], [27, "Horror"], [10749, "Romance"], [878, "Sci-Fi"], [16, "Animation"], [80, "Crime"], [12, "Adventure"], [14, "Fantasy"], [9648, "Mystery"], [36, "History"], [10752, "War"], [99, "Documentary"]];

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); }
  function href(m) { var s = slug(m.title); return "/movie/" + m.id + (s ? "-" + s : ""); }
  function yr(d) { return d ? String(d).slice(0, 4) : ""; }
  function fmtDate(d) {
    if (!d) return "";
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return d; }
  }
  function usd(n) { return n >= 1e9 ? "$" + (n / 1e9).toFixed(2) + " billion" : "$" + Math.round(n / 1e6).toLocaleString("en-US") + " million"; }
  function hm(min) { return min ? Math.floor(min / 60) + "h " + (min % 60) + "m" : ""; }
  function keyOk() { return D.API_KEY && String(D.API_KEY).indexOf("YAHAN") !== 0; }
  function api(path, params) {
    var q = new URLSearchParams(Object.assign({ api_key: D.API_KEY, language: "en-US" }, params || {}));
    return fetch(API + path + "?" + q.toString()).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function parseRate(s) {
    var m = String(s || "").match(/([\d.]+)\s*(?:\/\s*([\d.]+))?/);
    if (!m) return null;
    var v = parseFloat(m[1]), mx = m[2] ? parseFloat(m[2]) : 5;
    if (!(v >= 0) || !(mx > 0)) return null;
    return { v: v, max: mx, pct: Math.min(100, v / mx * 100) };
  }
  function stars(s) {
    var r = parseRate(s);
    return r ? '<span class="stars" style="--p:' + r.pct.toFixed(0) + '%" aria-label="Rating ' + esc(s) + '">★★★★★</span>' : "";
  }
  function pickVideo(list) {
    list = (list || []).filter(function (v) { return v.site === "YouTube"; });
    var f = function (fn) { return list.filter(fn)[0]; };
    return f(function (v) { return v.type === "Trailer" && v.official; }) || f(function (v) { return v.type === "Trailer"; }) || f(function (v) { return v.type === "Teaser"; }) || list[0];
  }
  function sortedDates(arr) {
    return arr.slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
  }

  var ic = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  var IC = {
    home: ic('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
    movies: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
    trailers: ic('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>'),
    reviews: ic('<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 3 1.1-6.2L3 9.7l6.2-.9z"/>'),
    news: ic('<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>'),
    search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>')
  };
  var NAV = [["home", "/", "Home"], ["movies", "/movies", "Movies"], ["trailers", "/trailers", "Trailers"], ["reviews", "/reviews", "Reviews"], ["news", "/news", "News"]];

  /* ---------- seo ---------- */
  function setMeta(attr, key, val) {
    var el = document.querySelector("meta[" + attr + '="' + key + '"]');
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", val);
  }
  function seo(title, desc, image, url) {
    document.title = title;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:site_name", SITE);
    setMeta("property", "og:type", "website");
    if (image) { setMeta("property", "og:image", image); setMeta("name", "twitter:card", "summary_large_image"); }
    if (url) {
      setMeta("property", "og:url", url);
      var c = document.querySelector('link[rel="canonical"]');
      if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
      c.href = url;
    }
  }
  function jsonLd(obj) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj).replace(/</g, "\\u003c");
    document.head.appendChild(s);
  }

  /* ---------- shell: header, bottom nav, footer, modal ---------- */
  function shell(page) {
         [["icon", "/favicon.png"], ["apple-touch-icon", "/apple-touch-icon.png"]].forEach(function (x) {
      var l = document.createElement("link"); l.rel = x[0]; l.href = x[1]; document.head.appendChild(l);
    });
    var links = NAV.map(function (n) { return '<a href="' + n[1] + '"' + (n[0] === page ? ' class="on"' : "") + ">" + n[2] + "</a>"; }).join("") +
      '<a href="/about"' + (page === "about" ? ' class="on"' : "") + ">About</a>";
    var tabs = NAV.map(function (n) { return '<a href="' + n[1] + '"' + (n[0] === page ? ' class="on"' : "") + ">" + IC[n[0]] + "<span>" + n[2] + "</span></a>"; }).join("");
    document.body.insertAdjacentHTML("afterbegin",
      '<header class="hd" id="hd"><a class="logo" href="/" aria-label="' + SITE + '">ScreenVibe<i>India</i></a><nav class="dn" aria-label="Menu">' + links + '</nav><button class="ib" id="sb" aria-label="Search">' + IC.search + "</button></header>" +
      '<div class="so" id="so"><form id="sf" role="search"><input id="si" type="search" placeholder="Film ka naam likho" autocomplete="off" aria-label="Film search"><button class="btn" type="submit">Search</button></form></div>');
    $("#main").insertAdjacentHTML("afterend",
      '<footer class="ft"><div class="wrap"><nav aria-label="Footer"><a href="/about">About</a><a href="/about#privacy">Privacy policy</a><a href="/about#disclaimer">Disclaimer</a><a href="/about#contact">Contact</a></nav>' +
      "<p>Film ka data aur images TMDB se hain. This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming ki jankari JustWatch se.</p>" +
      "<p>© " + new Date().getFullYear() + " " + SITE + "</p></div></footer>" +
      '<nav class="bn" aria-label="Tabs">' + tabs + "</nav>" +
      '<div class="mo" id="mo"><button class="x" id="mx" aria-label="Band karo">✕</button><div class="mb"></div></div>');
  }
  function openModal(h) { var m = $("#mo"); $(".mb", m).innerHTML = h; m.classList.add("on"); document.body.style.overflow = "hidden"; }
  function closeModal() { var m = $("#mo"); if (!m) return; m.classList.remove("on"); $(".mb", m).innerHTML = ""; document.body.style.overflow = ""; }
  function toast(t) {
    var e = $("#ts");
    if (!e) { e = document.createElement("div"); e.id = "ts"; e.className = "ts"; document.body.appendChild(e); }
    e.textContent = t; e.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove("on"); }, 2200);
  }
  function playTrailer(id) {
    openModal('<div class="ld">Trailer load ho raha hai...</div>');
    api("/movie/" + id + "/videos", { include_video_language: "en,hi,ta,te,ml,kn,null" }).then(function (d) {
      var v = pickVideo(d.results);
      if (!v) { $(".mb").innerHTML = '<div class="ld">Is film ka trailer abhi available nahi hai.</div>'; return; }
      $(".mb").innerHTML = '<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.key) + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Trailer"></iframe></div>';
    }).catch(function () { $(".mb").innerHTML = '<div class="ld">Trailer load nahi hua. Internet check karke dobara try karo.</div>'; });
  }
  function bindGlobal() {
    var hd = $("#hd");
    var onScroll = function () { hd.classList.toggle("sc", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    $("#sb").onclick = function () { var so = $("#so"); so.classList.toggle("on"); if (so.classList.contains("on")) $("#si").focus(); };
    $("#sf").onsubmit = function (e) { e.preventDefault(); var v = $("#si").value.trim(); if (v) location.href = "/movies?q=" + encodeURIComponent(v); };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeModal(); $("#so").classList.remove("on"); } });
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-trailer]");
      if (t) { e.preventDefault(); playTrailer(t.getAttribute("data-trailer")); return; }
      t = e.target.closest("[data-img]");
      if (t) { openModal('<img class="big" src="' + esc(t.getAttribute("data-img")) + '" alt="">'); return; }
      t = e.target.closest("[data-vk]");
      if (t) {
        var vp = $("#vp");
        if (vp) {
          vp.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(t.getAttribute("data-vk")) + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Trailer"></iframe>';
          $$(".vch .chip").forEach(function (c) { c.classList.toggle("on", c === t); });
        }
        return;
      }
      t = e.target.closest("[data-share]");
      if (t) {
        var data = { title: document.title, url: location.href };
        if (navigator.share) { navigator.share(data).catch(function () {}); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(location.href).then(function () { toast("Link copy ho gaya"); }); }
        return;
      }
      if (e.target.id === "mo" || e.target.closest("#mx")) closeModal();
    });
    // analytics (Vercel)
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement("script"); s.defer = true; s.src = "/_vercel/insights/script.js"; document.head.appendChild(s);
  }

  /* ---------- components ---------- */
  function card(m) {
    var my = D.MY[m.id];
    var p = m.poster_path ? '<img loading="lazy" src="' + IMG + "w342" + m.poster_path + '" alt="' + esc(m.title) + ' poster">' : '<div class="np">' + esc((m.title || "?").charAt(0)) + "</div>";
    var r = m.vote_average ? '<span class="rt">★ ' + m.vote_average.toFixed(1) + "</span>" : "";
    return '<a class="card" href="' + href(m) + '"><div class="pst">' + p + r + (my ? '<span class="rv">Review</span>' : "") + '</div><div class="ct">' + esc(m.title) + '</div><div class="cs">' + yr(m.release_date) + "</div></a>";
  }
  function skCards(n) { var s = ""; for (var i = 0; i < n; i++) s += '<div class="card"><div class="pst sk"></div><div class="sk l1"></div></div>'; return s; }
  function msgBox(h, p) { return '<div class="wrap"><div class="msg"><h2>' + h + "</h2><p>" + p + "</p></div></div>"; }
  function pageHead(t, s) { return '<div class="ph"><h1>' + t + "</h1><p>" + s + "</p></div>"; }
  function chips(id, arr, cur) {
    return '<div class="chips" id="' + id + '">' + arr.map(function (a) { return '<button class="chip' + (String(a[0]) === String(cur) ? " on" : "") + '" data-v="' + a[0] + '">' + a[1] + "</button>"; }).join("") + "</div>";
  }
  function noKey() {
    $("#main").innerHTML = msgBox("API key chahiye", "GitHub par <code>data.js</code> kholo aur pehli line mein <code>YAHAN_APNI_TMDB_KEY</code> ki jagah apni TMDB key daalo.");
  }
  function newsItem(n) {
    var d = n.date ? new Date(n.date + "T00:00:00") : null, ok = d && !isNaN(d);
    var day = ok ? d.getDate() : "", mon = ok ? d.toLocaleString("en-IN", { month: "short" }) : "";
    return '<article class="nw">' + (ok ? '<div class="dt"><b>' + day + "</b><span>" + mon + "</span></div>" : "") +
      "<div><h3>" + esc(n.title) + "</h3><p>" + esc(n.text) + '</p><div class="lk">' +
      (n.movie ? '<a href="/movie/' + esc(n.movie) + '">Film ki jankari</a>' : "") +
      (n.source ? '<a href="' + esc(n.source) + '" target="_blank" rel="nofollow noopener">Source: ' + esc(n.sourceName || "Link") + "</a>" : "") + "</div></div></article>";
  }

  /* ---------- home ---------- */
  function sec(title, more, id) {
    return '<section class="sec"><div class="sh"><h2>' + title + "</h2>" + (more ? '<a href="' + more + '">Sab dekho</a>' : "") + '</div><div class="row" id="' + id + '">' + skCards(8) + "</div></section>";
  }
  function fill(id, list) {
    var el = $("#" + id); if (!el) return;
    el.innerHTML = list.length ? list.map(card).join("") : '<div class="msg">Abhi kuch nahi mila.</div>';
  }
  function hero(list) {
    var el = $("#hero"); if (!el) return;
    if (!list.length) { el.remove(); return; }
    el.innerHTML = list.map(function (m, i) {
      var g = (m.genre_ids || []).slice(0, 3).map(function (x) { return G[x]; }).filter(Boolean).join(", ");
      var T = i ? "h2" : "h1";
      return '<div class="sl' + (i ? "" : " on") + '"><img src="' + IMG + "w1280" + m.backdrop_path + '" alt=""' + (i ? ' loading="lazy"' : "") + '><div class="hc wrap"><div class="hm"><span class="hr">★ ' + (m.vote_average || 0).toFixed(1) + "</span>" +
        (yr(m.release_date) ? "<span>" + yr(m.release_date) + "</span>" : "") + (g ? "<span>" + esc(g) + "</span>" : "") + "</div><" + T + ">" + esc(m.title) + "</" + T + "><p>" + esc(m.overview || "") +
        '</p><div class="ha"><button class="btn" data-trailer="' + m.id + '">▶ Trailer dekho</button><a class="btn gh" href="' + href(m) + '">Poori jankari</a></div></div></div>';
    }).join("") + '<div class="dots">' + list.map(function (m, i) { return '<button aria-label="Slide ' + (i + 1) + '"' + (i ? "" : ' class="on"') + "></button>"; }).join("") + "</div>";
    var i = 0, slides = $$(".sl", el), dots = $$(".dots button", el), timer;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }
    function auto() {
      clearInterval(timer);
      if (slides.length > 1 && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) timer = setInterval(function () { go(i + 1); }, 7000);
    }
    dots.forEach(function (d, k) { d.onclick = function () { go(k); auto(); }; });
    var x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); auto(); }
    });
    auto();
  }
  function home() {
    var defs = [["Trending is hafte", "/trending/movie/week", {}, "/movies?cat=trending", "r0"], ["Ab theatre mein", "/movie/now_playing", { region: "IN" }, "/movies?cat=now", "r1"], ["Aane wali films", "/movie/upcoming", { region: "IN" }, "/movies?cat=upcoming", "r2"], ["Top rated films", "/movie/top_rated", {}, "/movies?cat=top", "r3"]];
    var myIds = Object.keys(D.MY), html = "";
    if (myIds.length) html += sec("Hamare reviews", "/reviews", "myrow");
    html += sec(defs[0][0], defs[0][3], "r0") + sec(defs[1][0], defs[1][3], "r1") + sec(defs[2][0], defs[2][3], "r2");
    if (D.NEWS.length) html += '<section class="sec"><div class="sh"><h2>Taaza khabar</h2><a href="/news">Sab khabrein</a></div>' + sortedDates(D.NEWS).slice(0, 3).map(newsItem).join("") + "</section>";
    html += sec(defs[3][0], defs[3][3], "r3");
    $("#main").innerHTML = '<section class="hero" id="hero"><div class="sk full"></div></section><div class="wrap">' + html + "</div>";
    api("/trending/movie/day").then(function (d) { hero((d.results || []).filter(function (m) { return m.backdrop_path; }).slice(0, 6)); }).catch(function () { var h = $("#hero"); if (h) h.remove(); });
    defs.forEach(function (d) {
      api(d[1], d[2]).then(function (r) { fill(d[4], (r.results || []).filter(function (m) { return m.poster_path; }).slice(0, 18)); })
        .catch(function () { var el = $("#" + d[4]); if (el) el.innerHTML = '<div class="msg">Data load nahi hua. Internet ya API key check karo.</div>'; });
    });
    if (myIds.length) {
      Promise.all(myIds.slice(0, 12).map(function (id) { return api("/movie/" + id).catch(function () { return null; }); }))
        .then(function (l) { fill("myrow", l.filter(Boolean)); });
    }
    seo("ScreenVibe India - Movie Reviews, Trailers, News aur OTT Guide", "Bollywood, South aur Hollywood films ke reviews, official trailers, cast, box office aur kahan legally dekhein, sab ek jagah.", "", location.origin + "/");
  }

  /* ---------- movies (browse) ---------- */
  function movies() {
    var S = { cat: "trending", lang: "", genre: "", q: "", page: 1, total: 1, busy: false, rid: 0 };
    var u = new URLSearchParams(location.search);
    S.cat = u.get("cat") || "trending"; S.lang = u.get("lang") || ""; S.genre = u.get("genre") || ""; S.q = u.get("q") || "";
    var CATS = [["trending", "Trending"], ["now", "Ab theatre mein"], ["upcoming", "Aane wali"], ["top", "Top rated"]];
    $("#main").innerHTML = '<div class="wrap">' + pageHead("Movies", "Language aur genre se film dhundo.") +
      '<form class="sf2" id="mf"><input id="mq" type="search" placeholder="Film ka naam likho" value="' + esc(S.q) + '" autocomplete="off" aria-label="Film search"><button class="btn" type="submit">Search</button></form>' +
      '<div id="flt" style="margin-top:14px" class="' + (S.q ? "dim" : "") + '">' + chips("cats", CATS, S.cat) + chips("langs", LANGS, S.lang) + chips("gens", GENS, S.genre) + "</div>" +
      '<div class="grid" id="g"></div><div id="snt"></div><div class="mr"><button class="btn gh" id="more" hidden>Aur dikhao</button></div></div>';
    var g = $("#g"), more = $("#more");
    function sync() {
      var p = new URLSearchParams();
      if (S.q) p.set("q", S.q); else { if (S.cat !== "trending") p.set("cat", S.cat); if (S.lang) p.set("lang", S.lang); if (S.genre) p.set("genre", S.genre); }
      history.replaceState(null, "", "/movies" + (p.toString() ? "?" + p : ""));
    }
    function days(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
    function req() {
      if (S.q) return ["/search/movie", { query: S.q, page: S.page, include_adult: "false" }];
      if (!S.lang && !S.genre) {
        var m = { trending: ["/trending/movie/week", {}], now: ["/movie/now_playing", { region: "IN" }], upcoming: ["/movie/upcoming", { region: "IN" }], top: ["/movie/top_rated", {}] }[S.cat] || ["/trending/movie/week", {}];
        return [m[0], Object.assign({}, m[1], { page: S.page })];
      }
      var p = { page: S.page, include_adult: "false" };
      if (S.lang) p.with_original_language = S.lang;
      if (S.genre) p.with_genres = S.genre;
      if (S.cat === "now") { p.sort_by = "popularity.desc"; p["primary_release_date.gte"] = days(-45); p["primary_release_date.lte"] = days(0); }
      else if (S.cat === "upcoming") { p.sort_by = "primary_release_date.asc"; p["primary_release_date.gte"] = days(1); }
      else if (S.cat === "top") { p.sort_by = "vote_average.desc"; p["vote_count.gte"] = 300; }
      else { p.sort_by = "popularity.desc"; p["vote_count.gte"] = 20; }
      return ["/discover/movie", p];
    }
    function load(reset) {
      if (reset) { S.rid++; S.page = 1; S.total = 1; S.busy = false; g.innerHTML = skCards(12); more.hidden = true; }
      if (S.busy || S.page > S.total) return;
      S.busy = true;
      var rid = S.rid, r = req();
      api(r[0], r[1]).then(function (d) {
        if (rid !== S.rid) return;
        S.total = Math.min(d.total_pages || 1, 500);
        var items = (d.results || []).filter(function (m) { return m.poster_path; });
        if (S.page === 1) g.innerHTML = "";
        if (S.page === 1 && !items.length) g.innerHTML = '<div class="msg"><h2>Koi film nahi mili</h2><p>Dusra naam ya filter try karo.</p></div>';
        else g.insertAdjacentHTML("beforeend", items.map(card).join(""));
        S.page++; S.busy = false;
        more.hidden = S.page > S.total;
      }).catch(function () {
        if (rid !== S.rid) return;
        S.busy = false;
        if (S.page === 1) g.innerHTML = '<div class="msg"><h2>Data load nahi hua</h2><p>Internet ya API key check karo.</p></div>';
      });
    }
    $("#flt").addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      var box = b.parentNode.id, v = b.getAttribute("data-v");
      if (box === "cats") S.cat = v; else if (box === "langs") S.lang = v; else S.genre = v;
      S.q = ""; $("#mq").value = ""; $("#flt").classList.remove("dim");
      $$(".chip", b.parentNode).forEach(function (c) { c.classList.toggle("on", c === b); });
      sync(); load(true);
    });
    $("#mf").onsubmit = function (e) {
      e.preventDefault(); S.q = $("#mq").value.trim();
      $("#flt").classList.toggle("dim", !!S.q); sync(); load(true);
    };
    more.onclick = function () { load(false); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting && !S.busy && S.page > 1) load(false); }, { rootMargin: "600px" }).observe($("#snt"));
    }
    seo("Movies - Language aur genre se film dhundo | " + SITE, "Hindi, Tamil, Telugu, English aur aur bhi languages ki films dhundo. Trending, theatre mein, aane wali aur top rated.", "", location.origin + "/movies");
    load(true);
  }

  /* ---------- trailers ---------- */
  function trailers() {
    var S = { cat: "upcoming", page: 1, total: 1, busy: false, rid: 0 };
    var C = [["upcoming", "Aane wali"], ["now", "Ab theatre mein"], ["trending", "Trending"]];
    var P = { upcoming: ["/movie/upcoming", { region: "IN" }], now: ["/movie/now_playing", { region: "IN" }], trending: ["/trending/movie/week", {}] };
    $("#main").innerHTML = '<div class="wrap">' + pageHead("Trailers", "Film par tap karo aur official trailer dekho.") + chips("tc", C, S.cat) + '<div class="tg" id="tg"></div><div class="mr"><button class="btn gh" id="tm" hidden>Aur dikhao</button></div></div>';
    var tg = $("#tg"), more = $("#tm");
    function tcard(m) {
      return '<div><button class="tb" data-trailer="' + m.id + '" aria-label="' + esc(m.title) + ' ka trailer chalao"><img loading="lazy" src="' + IMG + "w500" + m.backdrop_path + '" alt=""><span class="pl">▶</span></button><div class="tm"><a href="' + href(m) + '">' + esc(m.title) + "</a><span>" + fmtDate(m.release_date) + "</span></div></div>";
    }
    function load(reset) {
      if (reset) { S.rid++; S.page = 1; S.total = 1; S.busy = false; tg.innerHTML = ""; more.hidden = true; }
      if (S.busy || S.page > S.total) return;
      S.busy = true;
      var rid = S.rid, r = P[S.cat];
      api(r[0], Object.assign({}, r[1], { page: S.page })).then(function (d) {
        if (rid !== S.rid) return;
        S.total = Math.min(d.total_pages || 1, 500);
        var items = (d.results || []).filter(function (m) { return m.backdrop_path; });
        if (S.page === 1 && !items.length) tg.innerHTML = '<div class="msg">Abhi koi trailer nahi mila.</div>';
        else tg.insertAdjacentHTML("beforeend", items.map(tcard).join(""));
        S.page++; S.busy = false; more.hidden = S.page > S.total;
      }).catch(function () { S.busy = false; if (S.page === 1) tg.innerHTML = '<div class="msg">Data load nahi hua. Internet ya API key check karo.</div>'; });
    }
    $("#tc").addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      S.cat = b.getAttribute("data-v");
      $$("#tc .chip").forEach(function (c) { c.classList.toggle("on", c === b); });
      load(true);
    });
    more.onclick = function () { load(false); };
    seo("Movie trailers - Official trailer dekho | " + SITE, "Aane wali aur theatre mein chal rahi films ke official trailers ek jagah.", "", location.origin + "/trailers");
    load(true);
  }

  /* ---------- reviews ---------- */
  function reviews() {
    var ids = Object.keys(D.MY);
    var head = pageHead("Hamare reviews", "Har film par hamari apni raay, ticket ki tarah.");
    seo("Movie reviews - Hamari raay | " + SITE, "ScreenVibe India ke film reviews: rating, verdict aur India collection.", "", location.origin + "/reviews");
    if (!ids.length) { $("#main").innerHTML = '<div class="wrap">' + head + '<div class="msg"><h2>Pehla review jald aa raha hai</h2><p>Tab tak <a href="/movies">Movies</a> page par film dhundo.</p></div></div>'; return; }
    if (!keyOk()) { noKey(); return; }
    $("#main").innerHTML = '<div class="wrap">' + head + '<div id="rl"></div></div>';
    Promise.all(ids.map(function (id) { return api("/movie/" + id).catch(function () { return null; }); })).then(function (l) {
      l = l.filter(Boolean).sort(function (a, b) { return String(D.MY[b.id].date || "").localeCompare(String(D.MY[a.id].date || "")); });
      $("#rl").innerHTML = l.map(function (m) {
        var my = D.MY[m.id], txt = String(my.review || "").replace(/\s+/g, " ");
        return '<a class="rc" href="' + href(m) + '"><div class="rp">' + (m.poster_path ? '<img loading="lazy" src="' + IMG + "w342" + m.poster_path + '" alt="' + esc(m.title) + ' poster">' : "") +
          '</div><div><h3>' + esc(m.title) + "</h3><div>" + stars(my.rating) + " <b>" + esc(my.rating || "") + "</b>" + (my.verdict ? '<span class="vd">' + esc(my.verdict) + "</span>" : "") + "</div><p>" + esc(txt) + "</p></div></a>";
      }).join("");
    });
  }

  /* ---------- news ---------- */
  function news() {
    var l = sortedDates(D.NEWS);
    seo("Filmi khabrein - Bollywood, South, Hollywood news | " + SITE, "Films ki taaza khabrein, release dates aur box office updates.", "", location.origin + "/news");
    $("#main").innerHTML = '<div class="wrap">' + pageHead("Filmi khabrein", "Taaza updates, short mein.") + (l.length ? l.map(newsItem).join("") : '<div class="msg"><h2>Khabrein jald aa rahi hain</h2><p>Tab tak <a href="/trailers">Trailers</a> dekho.</p></div>') + "</div>";
  }

  /* ---------- about ---------- */
  function about() {
    var c = $("#contact-mail");
    if (c) c.innerHTML = D.CONTACT_EMAIL ? 'Email: <a href="mailto:' + esc(D.CONTACT_EMAIL) + '">' + esc(D.CONTACT_EMAIL) + "</a>" : "Contact email jald add hogi.";
    seo("About, Privacy policy aur Disclaimer | " + SITE, "ScreenVibe India kya hai, hum data kaise use karte hain aur humse kaise judein.", "", location.origin + "/about");
  }

  /* ---------- movie detail ---------- */
  function names(crew, jobs) {
    var o = [];
    crew.forEach(function (c) { if (jobs.indexOf(c.job) > -1 && o.indexOf(c.name) < 0) o.push(c.name); });
    return o;
  }
  function fact(k, v) { return v ? '<div class="fc"><span>' + k + "</span><b>" + v + "</b></div>" : ""; }
  function blk(t, inner, id) { return '<section class="blk"' + (id ? ' id="' + id + '"' : "") + "><h2>" + t + "</h2>" + inner + "</section>"; }
  function ring(v) {
    var p = Math.round(v * 10);
    return '<div class="ring" aria-hidden="true"><svg viewBox="0 0 36 36"><circle class="a" cx="18" cy="18" r="15.9" pathLength="100"/><circle class="b" cx="18" cy="18" r="15.9" pathLength="100" stroke-dasharray="' + p + ' 100"/></svg><i>' + v.toFixed(1) + "</i></div>";
  }
  function ticket(my) {
    var paras = String(my.review || "").split(/\n+/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    return '<section class="tk" id="review"><div class="st"><div class="sc">Hamara rating</div><div class="big">' + esc(my.rating || "-") + "</div>" + stars(my.rating) + (my.verdict ? '<div class="vd">' + esc(my.verdict) + "</div>" : "") +
      '</div><div class="tb2"><h3>Hamara review</h3>' + paras + (my.india ? '<div class="ind">India collection: <b>' + esc(my.india) + "</b></div>" : "") + "</div></section>";
  }
  function movie() {
    var main = $("#main");
    var id = parseInt(location.pathname.split("/").pop(), 10) || parseInt(new URLSearchParams(location.search).get("id"), 10);
    if (!id) { main.innerHTML = msgBox("Film nahi mili", 'Link galat hai. <a href="/movies">Movies</a> page se film chuno.'); return; }
    main.innerHTML = '<div class="mhd sk" style="border-radius:0"></div><div class="wrap"><div class="sk" style="height:220px;margin-top:24px"></div></div>';
    api("/movie/" + id, { append_to_response: "credits,videos,watch/providers,recommendations,images", include_image_language: "en,null", include_video_language: "en,hi,ta,te,ml,kn,null" })
      .then(renderMovie)
      .catch(function () { main.innerHTML = msgBox("Film load nahi hui", 'Internet check karo ya <a href="/movies">Movies</a> page par wapas jao.'); });
  }
  function renderMovie(m) {
    var my = D.MY[m.id], year = yr(m.release_date);
    var crew = (m.credits && m.credits.crew) || [];
    var cast = ((m.credits && m.credits.cast) || []).filter(function (c) { return c.profile_path; }).slice(0, 16);
    var vids = ((m.videos && m.videos.results) || []).filter(function (v) { return v.site === "YouTube"; });
    var rank = function (v) { return (v.type === "Trailer" ? 0 : v.type === "Teaser" ? 2 : 4) + (v.official ? 0 : 1); };
    vids.sort(function (a, b) { return rank(a) - rank(b); }); vids = vids.slice(0, 5);
    var dir = names(crew, ["Director"]), wr = names(crew, ["Writer", "Screenplay", "Story"]).slice(0, 3);
    var pr = m["watch/providers"] && m["watch/providers"].results && m["watch/providers"].results.IN;
    var langs = (m.spoken_languages || []).map(function (l) { return l.english_name; }).join(", ");
    var comp = (m.production_companies || []).slice(0, 3).map(function (c) { return c.name; }).join(", ");
    var back = m.backdrop_path || m.poster_path;
    var url = location.origin + href(m);
    if (location.pathname !== href(m)) history.replaceState(null, "", href(m) + location.search);

    var h = '<section class="mh">' + (back ? '<img src="' + IMG + "w1280" + back + '" alt="">' : "") + '</section><div class="wrap"><div class="md"><div class="pp">' +
      (m.poster_path ? '<img src="' + IMG + "w500" + m.poster_path + '" alt="' + esc(m.title) + ' poster">' : "") + '</div><div class="mi"><h1>' + esc(m.title) + (year ? "<small>(" + year + ")</small>" : "") + "</h1>" +
      (m.tagline ? '<p class="tl">' + esc(m.tagline) + "</p>" : "") + '<div class="tags">' + (m.runtime ? '<span class="tag">' + hm(m.runtime) + "</span>" : "") +
      (m.genres || []).map(function (g) { return '<a class="tag" href="/movies?genre=' + g.id + '">' + esc(g.name) + "</a>"; }).join("") + "</div></div></div>";
    h += '<div class="acts">' + (m.vote_count ? '<div class="rg">' + ring(m.vote_average) + "<span><b>TMDB score</b><br>" + m.vote_count.toLocaleString("en-IN") + " votes</span></div>" : "") +
      (vids.length ? '<a class="btn" href="#trailer">▶ Trailer</a>' : "") + '<button class="btn gh" data-share>Share karo</button></div>';
    if (my) h += ticket(my);
    if (m.overview) h += blk("Kahani", '<p class="story">' + esc(m.overview) + "</p>");
    if (vids.length) {
      h += blk("Trailer", '<div class="vid" id="vp"><button class="vth" data-vk="' + esc(vids[0].key) + '" aria-label="Trailer chalao"><img src="https://i.ytimg.com/vi/' + esc(vids[0].key) + '/hqdefault.jpg" alt=""><span class="pl">▶</span></button></div>' +
        (vids.length > 1 ? '<div class="vch">' + vids.map(function (v, i) { return '<button class="chip' + (i ? "" : " on") + '" data-vk="' + esc(v.key) + '">' + esc(v.type) + (i ? " " + (i + 1) : "") + "</button>"; }).join("") + "</div>" : ""), "trailer");
    }
    var facts = fact("Release", fmtDate(m.release_date)) + fact("Language", esc(langs)) + fact("Director", esc(dir.join(", "))) + fact("Writer", esc(wr.join(", "))) + fact("Production", esc(comp)) + fact("Status", esc(m.status)) +
      fact("Budget", m.budget > 0 ? usd(m.budget) : "") + fact("Worldwide collection", m.revenue > 0 ? usd(m.revenue) : "") + fact("India collection (hamara)", my && my.india ? esc(my.india) : "");
    if (facts) h += blk("Film ki details", '<div class="facts">' + facts + "</div>");
    if (cast.length) {
      h += blk("Cast", '<div class="cast">' + cast.map(function (c) {
        return '<div class="cp"><img loading="lazy" src="' + IMG + "w185" + c.profile_path + '" alt="' + esc(c.name) + '"><b>' + esc(c.name) + "</b><small>" + esc(c.character) + "</small></div>";
      }).join("") + "</div>");
    }
    var groups = [["flatrate", "Streaming"], ["rent", "Kiraye par"], ["buy", "Kharidne ke liye"]], pv = "";
    if (pr) {
      groups.forEach(function (gp) {
        if (pr[gp[0]] && pr[gp[0]].length) {
          pv += '<div class="pv"><h3>' + gp[1] + "</h3><div>" + pr[gp[0]].map(function (p) {
            return '<span class="lg"><img loading="lazy" src="' + IMG + "w92" + p.logo_path + '" alt="">' + esc(p.provider_name) + "</span>";
          }).join("") + "</div></div>";
        }
      });
    }
    h += blk("Kahan dekhein (India)", (pv || "<p class=\"story\">India mein abhi streaming ya rental ki jankari nahi hai. Theatre release ho to wahin dekhein.</p>") +
      '<p class="note">Streaming data JustWatch se. Hum sirf legal options batate hain.</p>' + (pr && pr.link ? '<a class="btn gh" style="margin-top:12px" href="' + esc(pr.link) + '" target="_blank" rel="noopener">Sabhi options dekho</a>' : ""));
    var bd = ((m.images && m.images.backdrops) || []).slice(0, 8);
    if (bd.length) h += blk("Gallery", '<div class="gal">' + bd.map(function (b) { return '<button class="gi" data-img="' + IMG + "w1280" + b.file_path + '" aria-label="Photo badi karo"><img loading="lazy" src="' + IMG + "w500" + b.file_path + '" alt=""></button>'; }).join("") + "</div>");
    var rec = ((m.recommendations && m.recommendations.results) || []).filter(function (x) { return x.poster_path; }).slice(0, 14);
    if (rec.length) h += '<section class="sec"><div class="sh"><h2>Aisi aur films</h2></div><div class="row">' + rec.map(card).join("") + "</div></section>";
    $("#main").innerHTML = h + "</div>";
    window.scrollTo(0, 0);

    var desc = (my && my.review ? String(my.review).replace(/\s+/g, " ").slice(0, 150) : (m.overview || "").slice(0, 150)) || (m.title + " ka review, cast, trailer aur kahan dekhein.");
    seo(m.title + (year ? " (" + year + ")" : "") + " - Review, Cast, Trailer aur OTT | " + SITE, desc, m.poster_path ? IMG + "w500" + m.poster_path : "", url);
    var ld = { "@context": "https://schema.org", "@type": "Movie", name: m.title, description: m.overview || "", url: url };
    if (m.poster_path) ld.image = IMG + "w500" + m.poster_path;
    if (m.release_date) ld.datePublished = m.release_date;
    if (dir.length) ld.director = dir.map(function (n) { return { "@type": "Person", name: n }; });
    var r = my && parseRate(my.rating);
    if (r) ld.review = { "@type": "Review", author: { "@type": "Organization", name: SITE }, reviewBody: String(my.review || ""), reviewRating: { "@type": "Rating", ratingValue: r.v, bestRating: r.max, worstRating: 0 } };
    jsonLd(ld);
  }

  /* ---------- start ---------- */
  var page = document.body.getAttribute("data-page");
  shell(page);
  bindGlobal();
  var needKey = { home: 1, movies: 1, trailers: 1, movie: 1 };
  var routes = { home: home, movies: movies, trailers: trailers, reviews: reviews, news: news, about: about, movie: movie };
  if (needKey[page] && !keyOk()) noKey();
  else if (routes[page]) routes[page]();
})();
