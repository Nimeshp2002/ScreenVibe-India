const posts = [
  {
    type: "review",
    title: "Film ka Naam",
    rating: "3.5/5",
    genre: "Action | Drama",
    text: "Yahan apne words mein review likho.",
    youtube: "",
    ottName: "Netflix",
    ottLink: "https://www.netflix.com"
  },
  {
    type: "news",
    title: "Filmi khabar ki headline",
    text: "Apne words mein 3-4 line ki khabar likho.",
    source: "https://example.com"
  },
  {
    type: "trailer",
    title: "Film ka Official Trailer",
    youtube: ""
  }
];

const list = document.getElementById("list");

function show(t) {
  list.innerHTML = "";
  posts.filter(p => t === "all" || p.type === t).forEach(p => {
    let h = '<div class="card"><h2>' + p.title + '</h2>';
    h += '<span class="badge">' + p.type.toUpperCase() + '</span>';
    if (p.rating) h += '<span class="badge">' + p.rating + '</span>';
    if (p.genre) h += '<span class="badge">' + p.genre + '</span>';
    if (p.youtube) h += '<div class="video"><iframe src="https://www.youtube.com/embed/' + p.youtube + '" allowfullscreen></iframe></div>';
    if (p.text) h += '<p class="story">' + p.text + '</p>';
    if (p.source) h += '<p class="story"><a style="color:#4da3ff" href="' + p.source + '" target="_blank">Source</a></p>';
    if (p.ottLink) h += '<a class="ott" href="' + p.ottLink + '" target="_blank">Watch legally on ' + p.ottName + '</a>';
    h += '</div>';
    list.innerHTML += h;
  });
}

document.querySelectorAll("nav button").forEach(b => {
  b.onclick = () => {
    document.querySelector("nav button.active").classList.remove("active");
    b.classList.add("active");
    show(b.dataset.t);
  };
});

show("all");
