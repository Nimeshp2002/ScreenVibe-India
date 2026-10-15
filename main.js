const API_KEY = "99ff3e248fb87f34f6960c8265b40fc1";

// Apne reviews aur India collection yahan daalo. Key = TMDB film ID
const MY = {
  // 550: { rating: "4/5", review: "Apne words mein review.", india: "₹100 Cr" },
};

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";
const PATHS = { trending: "/trending/movie/week", now: "/movie/now_playing", upcoming: "/movie/upcoming", top: "/movie/top_rated" };
let tab = "trending", page = 1, query = "";
const grid = document.getElementById("grid");
const more = document.getElementById("more");
const modal = document.getElementById("modal");
const box = document.getElementById("box");

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function api(path, params) {
  const r = await fetch(API + path + "?api_key=" + API_KEY + "&region=IN" + (params || ""));
  return r.json();
}

function card(m) {
  const p = m.poster_path ? IMG + "w342" + m.poster_path : "";
  const y = (m.release_date || "").slice(0, 4);
  const r = m.vote_average ? m.vote_average.toFixed(1) : "-";
  return '<div class="c" onclick="openMovie(' + m.id + ')"><span class="r">★ ' + r + '</span><img loading="lazy" src="' + p + '" alt=""><p><b>' + esc(m.title) + '</b><br><small>' + y + '</small></p></div>';
}

async function load(reset) {
  if (API_KEY.indexOf("YAHAN") === 0) {
    grid.innerHTML = '<p class="msg">Pehle main.js ki pehli line mein apni TMDB API key daalo.</p>';
    more.style.display = "none";
    return;
  }
  if (reset) { page = 1; grid.innerHTML = ""; }
  more.style.display = "block";
  try {
    let list = [];
    if (query) {
      const d = await api("/search/movie", "&query=" + encodeURIComponent(query) + "&page=" + page);
      list = d.results || [];
      if (page >= d.total_pages) more.style.display = "none";
    } else if (tab === "reviews") {
      more.style.display = "none";
      const ids = Object.keys(MY);
      if (!ids.length) { grid.innerHTML = '<p class="msg">Abhi koi review nahi hai. main.js mein MY ke andar apna pehla review add karo.</p>'; return; }
      list = await Promise.all(ids.map(id => api("/movie/" + id)));
    } else {
      const d = await api(PATHS[tab], "&page=" + page);
      list = d.results || [];
    }
    if (!list.length && page === 1) grid.innerHTML = '<p class="msg">Koi film nahi mili.</p>';
    grid.innerHTML += list.map(card).join("");
  } catch (e) {
    grid.innerHTML = '<p class="msg">Data load nahi hua. Internet ya API key check karo.</p>';
  }
}

async function openMovie(id) {
  box.innerHTML = '<p style="padding:30px">Loading...</p>';
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
  const m = await api("/movie/" + id, "&append_to_response=credits,videos,watch/providers");
  const mine = MY[id];
  const vids = ((m.videos && m.videos.results) || []).filter(v => v.site === "YouTube" && v.type === "Trailer");
  const tr = vids.find(v => v.official) || vids[0];
  const prov = m["watch/providers"] && m["watch/providers"].results && m["watch/providers"].results.IN;
  const castArr = ((m.credits && m.credits.cast) || []).slice(0, 12);
  const dir = ((m.credits && m.credits.crew) || []).find(c => c.job === "Director");
  const castHtml = castArr.map(c =>
    '<div class="p">' +
    (c.profile_path ? '<img loading="lazy" src="' + IMG + 'w185' + c.profile_path + '" alt="">' : '<div class="ph">' + esc((c.name || "?").charAt(0)) + '</div>') +
    '<b>' + esc(c.name) + '</b><small>' + esc(c.character) + '</small></div>'
  ).join("");
  const money = n => "$" + Math.round(n / 1000000).toLocaleString() + " million";

  let h = '<button class="x" onclick="closeM()">✕</button>';
  if (m.backdrop_path) {
    h += '<div class="hero"><img src="' + IMG + 'w780' + m.backdrop_path + '" alt=""><div class="hg"></div><h2>' + esc(m.title) + '</h2></div><div class="in">';
  } else {
    h += '<div class="in"><h2>' + esc(m.title) + '</h2>';
  }
  h += '<div class="tags"><span class="tag hot">★ ' + (m.vote_average ? m.vote_average.toFixed(1) : "-") + '</span>';
  if (m.release_date) h += '<span class="tag">' + esc(m.release_date) + '</span>';
  if (m.runtime) h += '<span class="tag">' + m.runtime + ' min</span>';
  (m.genres || []).forEach(g => { h += '<span class="tag">' + esc(g.name) + '</span>'; });
  h += '</div>';
  if (dir) h += '<p><b>Director:</b> ' + esc(dir.name) + '</p>';
  if (mine) {
    h += '<h3>HAMARA REVIEW' + (mine.rating ? ' (' + esc(mine.rating) + ')' : '') + '</h3><p class="mine">' + esc(mine.review) + '</p>';
    if (mine.india) h += '<p><b>India Collection:</b> ' + esc(mine.india) + '</p>';
  }
  if (m.overview) h += '<h3>KAHANI</h3><p>' + esc(m.overview) + '</p>';
  if (castHtml) h += '<h3>CAST</h3><div class="cast">' + castHtml + '</div>';
  if (m.revenue > 0 || m.budget > 0) {
    h += '<h3>WORLDWIDE COLLECTION</h3><div class="stat">';
    if (m.budget > 0) h += '<div><b>' + money(m.budget) + '</b><small>Budget</small></div>';
    if (m.revenue > 0) h += '<div><b>' + money(m.revenue) + '</b><small>Collection</small></div>';
    h += '</div>';
  }
  if (tr) h += '<h3>OFFICIAL TRAILER</h3><div class="video"><iframe src="https://www.youtube.com/embed/' + tr.key + '" allowfullscreen></iframe></div>';
  if (prov) {
    const names = (prov.flatrate || []).concat(prov.rent || []).map(x => x.provider_name);
    const uniq = names.filter((n, i) => names.indexOf(n) === i);
    h += '<h3>KAHAN DEKHEIN (INDIA)</h3>';
    if (uniq.length) h += '<p>' + esc(uniq.join(", ")) + '</p>';
    if (prov.link) h += '<a class="ott" href="' + esc(prov.link) + '" target="_blank" rel="noopener">Legally dekhne ke options</a>';
  }
  h += '</div>';
  box.innerHTML = h;
  modal.scrollTop = 0;
}

function closeM() {
  modal.classList.remove("show");
  box.innerHTML = "";
  document.body.style.overflow = "";
}

modal.onclick = e => { if (e.target === modal) closeM(); };

document.querySelectorAll("#tabs button").forEach(b => {
  b.onclick = () => {
    document.querySelector("#tabs button.active").classList.remove("active");
    b.classList.add("active");
    tab = b.dataset.t;
    query = "";
    document.getElementById("q").value = "";
    load(true);
  };
});

function doSearch() {
  query = document.getElementById("q").value.trim();
  load(true);
}
document.getElementById("go").onclick = doSearch;
document.getElementById("q").onkeydown = e => { if (e.key === "Enter") doSearch(); };
more.onclick = () => { page++; load(false); };

load(true);
