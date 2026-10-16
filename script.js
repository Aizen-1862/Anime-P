
/* =========================================================
   ANIME:P — SCRIPT.JS
   Version 1 | Custom-matched to index.html
   GitHub Pages compatible | No API key required
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION & ANIME CATALOG
   ========================================================= */

const STORAGE = {
  watchlist: "animep_watchlist_v1",
  history: "animep_history_v1",
  ratings: "animep_ratings_v1"
};

const ANIME = [
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    japanese: "Kimetsu no Yaiba",
    year: 2019,
    rating: 8.6,
    episodes: 26,
    status: "Completed",
    genres: ["Action", "Fantasy", "Adventure"],
    languages: ["Japanese", "English"],
    description:
      "A young swordsman joins the Demon Slayer Corps in search of a way to help his sister and protect others from demons.",
    poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    featured: true,
    episodeList: [
      { number: 1, title: "Cruelty", videoId: "" },
      { number: 2, title: "Trainer Sakonji Urokodaki", videoId: "" },
      { number: 3, title: "Sabito and Makomo", videoId: "" }
    ]
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    japanese: "Jujutsu Kaisen",
    year: 2020,
    rating: 8.5,
    episodes: 24,
    status: "Ongoing",
    genres: ["Action", "Fantasy", "Supernatural"],
    languages: ["Japanese", "English"],
    description:
      "Yuji Itadori enters the dangerous world of cursed energy and jujutsu sorcerers after a supernatural encounter.",
    poster: "https://image.tmdb.org/t/p/w500/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg",
    featured: true,
    episodeList: [
      { number: 1, title: "Ryomen Sukuna", videoId: "" },
      { number: 2, title: "For Myself", videoId: "" },
      { number: 3, title: "Girl of Steel", videoId: "" }
    ]
  },
  {
    id: "spy-family",
    title: "SPY x FAMILY",
    japanese: "Spy x Family",
    year: 2022,
    rating: 8.3,
    episodes: 25,
    status: "Ongoing",
    genres: ["Comedy", "Action", "Slice of Life"],
    languages: ["Japanese", "English"],
    description:
      "A spy, an assassin, and a telepath form an unusual family while each hides a remarkable secret.",
    poster: "https://image.tmdb.org/t/p/w500/3r4LYFuXrg3G8fepysr4xSLWnQL.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "Operation Strix", videoId: "" },
      { number: 2, title: "Secure a Wife", videoId: "" }
    ]
  },
  {
    id: "haikyuu",
    title: "Haikyu!!",
    japanese: "Haikyu!!",
    year: 2014,
    rating: 8.7,
    episodes: 25,
    status: "Completed",
    genres: ["Sports", "Comedy", "Drama"],
    languages: ["Japanese", "English"],
    description:
      "A determined young volleyball player strives to reach the top despite his height and the challenges ahead.",
    poster: "https://image.tmdb.org/t/p/w500/9z4jRr43JdtU66P0iy8h18OyLql.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "The End and the Beginning", videoId: "" },
      { number: 2, title: "Karasuno High School", videoId: "" }
    ]
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    japanese: "Sousou no Frieren",
    year: 2023,
    rating: 9.3,
    episodes: 28,
    status: "Completed",
    genres: ["Fantasy", "Adventure", "Drama"],
    languages: ["Japanese"],
    description:
      "After the end of a legendary journey, an elven mage begins to understand time, friendship, and the lives of those around her.",
    poster: "https://image.tmdb.org/t/p/w500/8rOPtjbp0tD7QvU1hYf1WzH7L1Q.jpg",
    featured: true,
    episodeList: [
      { number: 1, title: "The End of the Journey", videoId: "" },
      { number: 2, title: "It Didn't Have to Be Magic...", videoId: "" }
    ]
  },
  {
    id: "one-punch-man",
    title: "One-Punch Man",
    japanese: "One Punch Man",
    year: 2015,
    rating: 8.7,
    episodes: 12,
    status: "Ongoing",
    genres: ["Action", "Comedy", "Superhero"],
    languages: ["Japanese", "English"],
    description:
      "An immensely powerful hero searches for a worthy challenge in a world full of monsters and superheroes.",
    poster: "https://image.tmdb.org/t/p/w500/iE3s0lG5QVdEHOEZnoAxjmMtvne.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "The Strongest Man", videoId: "" },
      { number: 2, title: "The Lone Cyborg", videoId: "" }
    ]
  },
  {
    id: "attack-on-titan",
    title: "Attack on Titan",
    japanese: "Shingeki no Kyojin",
    year: 2013,
    rating: 9.1,
    episodes: 25,
    status: "Completed",
    genres: ["Action", "Drama", "Fantasy"],
    languages: ["Japanese", "English"],
    description:
      "Humanity struggles to survive behind enormous walls in a world threatened by mysterious Titans.",
    poster: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    featured: true,
    episodeList: [
      { number: 1, title: "To You, in 2000 Years", videoId: "" },
      { number: 2, title: "That Day", videoId: "" }
    ]
  },
  {
    id: "death-note",
    title: "Death Note",
    japanese: "Desu Noto",
    year: 2006,
    rating: 8.9,
    episodes: 37,
    status: "Completed",
    genres: ["Mystery", "Thriller", "Supernatural"],
    languages: ["Japanese", "English"],
    description:
      "A brilliant student discovers a supernatural notebook and becomes entangled in a battle of intelligence and justice.",
    poster: "https://image.tmdb.org/t/p/w500/b6a7B6wE9KpJ5R7n3Y1c5z.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "Rebirth", videoId: "" },
      { number: 2, title: "Confrontation", videoId: "" }
    ]
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    japanese: "Ore dake Level Up na Ken",
    year: 2024,
    rating: 8.6,
    episodes: 12,
    status: "Ongoing",
    genres: ["Action", "Fantasy", "Adventure"],
    languages: ["Japanese", "English"],
    description:
      "A hunter gains a mysterious ability that lets him grow stronger through a series of dangerous challenges.",
    poster: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg",
    featured: true,
    episodeList: [
      { number: 1, title: "I'm Used to It", videoId: "" },
      { number: 2, title: "If I Had One More Chance", videoId: "" }
    ]
  },
  {
    id: "blue-lock",
    title: "Blue Lock",
    japanese: "Blue Lock",
    year: 2022,
    rating: 8.1,
    episodes: 24,
    status: "Ongoing",
    genres: ["Sports", "Drama"],
    languages: ["Japanese", "English"],
    description:
      "Talented young footballers compete in an intense program designed to create an extraordinary striker.",
    poster: "https://image.tmdb.org/t/p/w500/mV9gUCw4I5p7J8mL.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "Dream", videoId: "" },
      { number: 2, title: "Monster", videoId: "" }
    ]
  },
  {
    id: "your-name",
    title: "Your Name",
    japanese: "Kimi no Na wa",
    year: 2016,
    rating: 8.8,
    episodes: 1,
    status: "Movie",
    genres: ["Romance", "Drama", "Fantasy"],
    languages: ["Japanese", "English"],
    description:
      "Two teenagers begin mysteriously experiencing each other's lives across distance and time.",
    poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "Full Movie", videoId: "" }
    ]
  },
  {
    id: "violet-evergarden",
    title: "Violet Evergarden",
    japanese: "Violet Evergarden",
    year: 2018,
    rating: 8.7,
    episodes: 13,
    status: "Completed",
    genres: ["Drama", "Fantasy", "Slice of Life"],
    languages: ["Japanese", "English"],
    description:
      "A former soldier becomes a letter writer and gradually learns to understand emotions and human connections.",
    poster: "https://image.tmdb.org/t/p/w500/ImvHbM4GsJJykarnOzhtpG6ax6.jpg",
    featured: false,
    episodeList: [
      { number: 1, title: "I Love You and Auto Memory Dolls", videoId: "" },
      { number: 2, title: "Never Coming Back", videoId: "" }
    ]
  }
];

/* =========================================================
   2. STATE AND STORAGE
   ========================================================= */

let currentView = "home";
let searchQuery = "";
let selectedGenre = "All";
let sortMode = "popular";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn("Anime:P storage read failed:", error);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showToast("Unable to save. Check your browser storage.");
    return false;
  }
}

function getWatchlist() {
  return readJSON(STORAGE.watchlist, []);
}

function getHistory() {
  return readJSON(STORAGE.history, []);
}

function getRatings() {
  return readJSON(STORAGE.ratings, {});
}

function findAnime(id) {
  return ANIME.find(anime => anime.id === id);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeImage(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

/* =========================================================
   3. TOAST NOTIFICATIONS
   ========================================================= */

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* =========================================================
   4. POSTERS AND ANIME CARDS
   ========================================================= */

function posterMarkup(anime, extraClass = "") {
  const poster = safeImage(anime.poster);

  return `
    <div class="poster-wrap ${extraClass}">
      ${
        poster
          ? `<img class="poster-image"
               src="${escapeHTML(poster)}"
               alt="${escapeHTML(anime.title)} poster"
               loading="lazy">`
          : `<div class="poster-placeholder">
               <span>✦</span>
               <strong>${escapeHTML(anime.title)}</strong>
               <small>ANIME:P</small>
             </div>`
      }
      <div class="poster-overlay"></div>
    </div>
  `;
}

function createCard(anime) {
  const saved = getWatchlist().includes(anime.id);
  const userRating = getRatings()[anime.id];

  const article = document.createElement("article");
  article.className = "anime-card";
  article.dataset.id = anime.id;

  article.innerHTML = `
    <div class="card-poster">
      ${posterMarkup(anime)}

      <div class="card-topline">
        <span class="rating-pill">★ ${Number(anime.rating).toFixed(1)}</span>
        <button
          class="heart-button ${saved ? "saved" : ""}"
          data-action="toggle-list"
          aria-label="${saved ? "Remove from watchlist" : "Add to watchlist"}"
          aria-pressed="${saved}"
          title="${saved ? "Remove from My List" : "Add to My List"}"
        >${saved ? "♥" : "♡"}</button>
      </div>

      <button class="poster-play" data-action="details" aria-label="View ${escapeHTML(anime.title)} details">
        <span>▶</span>
      </button>

      <span class="poster-year">${anime.year}</span>
    </div>

    <div class="card-info">
      <h3>${escapeHTML(anime.title)}</h3>

      <p class="card-subtitle">
        ${escapeHTML(anime.japanese)}
      </p>

      <div class="card-genres">
        ${anime.genres.slice(0, 2).map(genre =>
          `<span>${escapeHTML(genre)}</span>`
        ).join("")}
      </div>

      <div class="card-footer">
        <span>${anime.episodes} ${anime.status === "Movie" ? "movie" : "episodes"}</span>
        <button data-action="details" class="details-link">Details ↗</button>
      </div>

      ${userRating ? `<small class="user-rating">Your rating: ${userRating}/10</small>` : ""}
    </div>
  `;

  const img = article.querySelector(".poster-image");

  if (img) {
    img.addEventListener("error", () => {
      const wrap = img.closest(".poster-wrap");

      if (wrap) {
        wrap.innerHTML = `
          <div class="poster-placeholder">
            <span>✦</span>
            <strong>${escapeHTML(anime.title)}</strong>
            <small>ANIME:P</small>
          </div>
        `;
      }
    }, { once: true });
  }

  return article;
}

function renderCards(container, animeList) {
  if (!container) return;

  container.replaceChildren();

  animeList.forEach(anime => {
    container.appendChild(createCard(anime));
  });
}

/* =========================================================
   5. GENRE CHIPS
   ========================================================= */

function renderGenres() {
  const container = document.getElementById("genreChips");
  if (!container) return;

  const genres = [
    "All",
    ...new Set(ANIME.flatMap(anime => anime.genres))
  ];

  container.replaceChildren();

  genres.forEach(genre => {
    const button = document.createElement("button");

    button.className =
      "genre-chip" + (selectedGenre === genre ? " active" : "");

    button.textContent = genre;
    button.dataset.genre = genre;

    button.addEventListener("click", () => {
      selectedGenre = genre;
      renderGenres();
      renderCurrentView();
    });

    container.appendChild(button);
  });
}

/* =========================================================
   6. SEARCH, FILTER AND SORT
   ========================================================= */

function getFilteredAnime() {
  let results = [...ANIME];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();

    results = results.filter(anime => {
      const text = [
        anime.title,
        anime.japanese,
        anime.description,
        anime.year,
        ...anime.genres,
        ...anime.languages
      ].join(" ").toLowerCase();

      return text.includes(query);
    });
  }

  if (selectedGenre !== "All") {
    results = results.filter(anime =>
      anime.genres.includes(selectedGenre)
    );
  }

  if (sortMode === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sortMode === "newest") {
    results.sort((a, b) => b.year - a.year);
  } else if (sortMode === "az") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    results.sort((a, b) =>
      Number(b.featured) - Number(a.featured)
      || b.rating - a.rating
    );
  }

  return results;
}

function renderCurrentView() {
  if (currentView === "watchlist") {
    renderWatchlist();
    return;
  }

  if (currentView === "history") {
    renderHistory();
    return;
  }

  const grid = document.getElementById("animeGrid");
  const empty = document.getElementById("emptyState");

  const results = getFilteredAnime();

  renderCards(grid, results);

  if (empty) {
    empty.classList.toggle("hidden", results.length > 0);
  }
}

/* =========================================================
   7. WATCHLIST
   ========================================================= */

function toggleWatchlist(id) {
  const list = getWatchlist();
  const index = list.indexOf(id);

  if (index >= 0) {
    list.splice(index, 1);
    showToast("Removed from My List");
  } else {
    list.push(id);
    showToast("Added to My List ♥");
  }

  if (!saveJSON(STORAGE.watchlist, list)) return;

  updateListCount();
  renderCurrentView();
  renderWatchlist();
  renderHeroListButton();
}

function updateListCount() {
  const count = document.getElementById("listCount");

  if (count) {
    count.textContent = getWatchlist().length;
  }
}

function renderWatchlist() {
  const grid = document.getElementById("watchlistGrid");
  const empty = document.getElementById("watchlistEmpty");

  const list = getWatchlist()
    .map(findAnime)
    .filter(Boolean);

  renderCards(grid, list);

  if (empty) {
    empty.classList.toggle("hidden", list.length > 0);
  }
}

function renderHeroListButton() {
  const button = document.getElementById("heroListButton");
  if (!button) return;

  const heroAnime = ANIME.find(anime => anime.featured) || ANIME[0];
  const saved = getWatchlist().includes(heroAnime.id);

  button.textContent = saved ? "✓ Added to my list" : "＋ Add to my list";
}

/* =========================================================
   8. CONTINUE WATCHING AND HISTORY
   ========================================================= */

function addToHistory(id, episodeNumber) {
  const history = getHistory().filter(item => item.id !== id);

  history.unshift({
    id,
    episode: episodeNumber,
    updatedAt: Date.now()
  });

  if (history.length > 50) history.length = 50;

  saveJSON(STORAGE.history, history);

  renderContinueWatching();
  renderHistory();
}

function renderContinueWatching() {
  const section = document.getElementById("continueSection");
  const grid = document.getElementById("continueGrid");

  if (!section || !grid) return;

  const history = getHistory()
    .map(item => ({
      ...item,
      anime: findAnime(item.id)
    }))
    .filter(item => item.anime);

  section.classList.toggle("hidden", history.length === 0);
  grid.replaceChildren();

  history.slice(0, 8).forEach(item => {
    const card = createCard(item.anime);

    const label = document.createElement("p");
    label.className = "continue-label";
    label.textContent = `Continue from episode ${item.episode}`;

    card.querySelector(".card-info")?.appendChild(label);

    grid.appendChild(card);
  });
}

function renderHistory() {
  const grid = document.getElementById("historyGrid");
  const empty = document.getElementById("historyEmpty");

  if (!grid) return;

  const history = getHistory()
    .map(item => ({
      ...item,
      anime: findAnime(item.id)
    }))
    .filter(item => item.anime);

  renderCards(grid, history.map(item => item.anime));

  if (empty) {
    empty.classList.toggle("hidden", history.length > 0);
  }
}

/* =========================================================
   9. ANIME DETAILS DIALOG
   ========================================================= */

function openDetails(id) {
  const anime = findAnime(id);
  if (!anime) return;

  const dialog = document.getElementById("detailDialog");
  const content = document.getElementById("detailContent");

  if (!dialog || !content) return;

  const saved = getWatchlist().includes(id);
  const userRating = getRatings()[id];

  content.innerHTML = `
    <div class="detail-layout">
      <div class="detail-poster">
        ${posterMarkup(anime)}
      </div>

      <div class="detail-info">
        <p class="section-eyebrow">ANIME:P ORIGINAL DISCOVERY</p>

        <h2>${escapeHTML(anime.title)}</h2>

        <p class="detail-japanese">${escapeHTML(anime.japanese)}</p>

        <div class="detail-meta">
          <span>${anime.year}</span>
          <span>★ ${Number(anime.rating).toFixed(1)}</span>
          <span>${anime.status === "Movie" ? "Movie" : `${anime.episodes} episodes`}</span>
        </div>

        <div class="detail-genres">
          ${anime.genres.map(genre =>
            `<span>${escapeHTML(genre)}</span>`
          ).join("")}
        </div>

        <p class="detail-description">
          ${escapeHTML(anime.description)}
        </p>

        <div class="detail-actions">
          <button class="btn btn-primary" data-action="episode-play" data-episode="1">
            ▶ Episode 1
          </button>

          <button class="btn btn-ghost" data-action="toggle-list" data-id="${anime.id}">
            ${saved ? "✓ In My List" : "＋ Add to My List"}
          </button>
        </div>

        <div class="rating-section">
          <label for="animeRating">Your rating</label>
          <select id="animeRating">
            <option value="">Rate this anime</option>
            ${Array.from({ length: 10 }, (_, i) => i + 1).map(n =>
              `<option value="${n}" ${userRating === n ? "selected" : ""}>${n}/10</option>`
            ).join("")}
          </select>
        </div>
      </div>
    </div>

    <div class="episode-section">
      <p class="section-eyebrow">THE JOURNEY BEGINS</p>
      <h3>Episodes</h3>
      <div class="episode-list">
        ${anime.episodeList.map(episode => `
          <button
            class="episode-row"
            data-action="episode-play"
            data-episode="${episode.number}"
          >
            <span class="episode-number">
              ${String(episode.number).padStart(2, "0")}
            </span>

            <span class="episode-name">
              <strong>${escapeHTML(episode.title)}</strong>
              <small>Episode ${episode.number}</small>
            </span>

            <span class="episode-arrow">▶</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  dialog.dataset.animeId = id;

  if (!dialog.open) dialog.showModal();
}

/* =========================================================
   10. AUTHORIZED VIDEO PLAYER
   ========================================================= */

/*
  Only configure videoId for an official video you are
  authorized to embed. A blank ID intentionally prevents
  playback and shows a helpful message.

  A public trailer is not a substitute for a full episode.
*/

function playEpisode(id, episodeNumber) {
  const anime = findAnime(id);
  if (!anime) return;

  const episode = anime.episodeList.find(
    item => item.number === Number(episodeNumber)
  );

  if (!episode) {
    showToast("Episode information is unavailable.");
    return;
  }

  addToHistory(id, episode.number);

  if (!episode.videoId) {
    showToast("No authorized video has been configured for this episode yet.");
    return;
  }

  // Only YouTube video IDs are supported by this player.
  if (!/^[A-Za-z0-9_-]{11}$/.test(episode.videoId)) {
    showToast("This video ID is invalid.");
    return;
  }

  openPlayer(anime, episode);
}

function openPlayer(anime, episode) {
  const dialog = document.getElementById("playerDialog");
  const content = document.getElementById("playerContent");

  if (!dialog || !content) return;

  const videoId = episode.videoId;

  content.innerHTML = `
    <div class="player-heading">
      <p class="section-eyebrow">NOW PLAYING</p>
      <h2>${escapeHTML(anime.title)}</h2>
      <p>Episode ${episode.number}: ${escapeHTML(episode.title)}</p>
    </div>

    <div class="video-frame-wrap">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${videoId}"
        title="${escapeHTML(anime.title)} episode ${episode.number}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>

    <p class="player-notice">
      Playback depends on the source's embedding permissions and regional availability.
    </p>

    <button class="btn btn-ghost" data-action="next-episode">
      Next configured episode →
    </button>
  `;

  dialog.dataset.animeId = anime.id;
  dialog.dataset.episode = String(episode.number);

  if (!dialog.open) dialog.showModal();
}

/* =========================================================
   11. RATINGS
   ========================================================= */

function saveRating(id, rating) {
  if (!rating) return;

  const numeric = Number(rating);

  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 10) {
    showToast("Choose a rating between 1 and 10.");
    return;
  }

  const ratings = getRatings();
  ratings[id] = numeric;

  if (!saveJSON(STORAGE.ratings, ratings)) return;

  showToast(`Rating saved: ${numeric}/10`);

  const anime = findAnime(id);

  if (anime) {
    renderCurrentView();
  }
}

/* =========================================================
   12. NAVIGATION
   ========================================================= */

const VIEWS = {
  home: ["hero", "homeTrending"],
  browse: ["homeTrending"],
  watchlist: ["watchlistSection"],
  history: ["historySection"]
};

function changeView(view) {
  if (!VIEWS[view]) view = "home";

  currentView = view;

  const sections = [
    "hero",
    "homeTrending",
    "watchlistSection",
    "historySection"
  ];

  sections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;

    section.classList.toggle(
      "hidden",
      !VIEWS[view].includes(id)
    );
  });

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "home" || view === "browse") {
    renderCurrentView();
  } else if (view === "watchlist") {
    renderWatchlist();
  } else if (view === "history") {
    renderHistory();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   13. SEARCH SHORTCUT
   ========================================================= */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    searchQuery = input.value.trim();

    if (currentView !== "home" && currentView !== "browse") {
      changeView("browse");
    } else {
      renderCurrentView();
    }
  });

  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName;

    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      input.focus();
    }

    if (event.key === "Escape" && document.activeElement === input) {
      input.blur();
    }
  });

  const clearButton = document.getElementById("clearFilters");

  clearButton?.addEventListener("click", () => {
    searchQuery = "";
    selectedGenre = "All";
    sortMode = "popular";
    input.value = "";

    renderGenres();
    changeView("browse");
  });
}

/* =========================================================
   14. ALL BUTTON EVENTS
   ========================================================= */

function setupEvents() {
  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");

    if (viewButton) {
      changeView(viewButton.dataset.view);
      return;
    }

    const closeButton = event.target.closest("[data-close]");

    if (closeButton) {
      const dialog = document.getElementById(closeButton.dataset.close);

      if (dialog?.open) dialog.close();

      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) return;

    const card = actionButton.closest("[data-id]");
    const id = actionButton.dataset.id || card?.dataset.id;

    switch (actionButton.dataset.action) {
      case "details":
        if (id) openDetails(id);
        break;

      case "toggle-list":
        if (id) {
          toggleWatchlist(id);

          const detailDialog = document.getElementById("detailDialog");

          if (detailDialog?.open && detailDialog.dataset.animeId === id) {
            openDetails(id);
          }
        }
        break;

      case "episode-play": {
        const detailDialog = document.getElementById("detailDialog");
        const animeId = detailDialog?.dataset.animeId;

        if (animeId) playEpisode(animeId, actionButton.dataset.episode);

        break;
      }

      case "next-episode": {
        const player = document.getElementById("playerDialog");
        const animeId = player?.dataset.animeId;
        const episode = Number(player?.dataset.episode || 0);
        const anime = findAnime(animeId);

        const next = anime?.episodeList.find(
          item => item.number > episode && item.videoId
        );

        if (next) {
          openPlayer(anime, next);
        } else {
          showToast("No next configured episode is available.");
        }

        break;
      }
    }
  });

  document.getElementById("exploreButton")?.addEventListener("click", () => {
    changeView("browse");
    document.getElementById("homeTrending")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  document.getElementById("heroListButton")?.addEventListener("click", () => {
    const anime = ANIME.find(item => item.featured) || ANIME[0];
    toggleWatchlist(anime.id);
  });

  document.getElementById("profileButton")?.addEventListener("click", () => {
    showToast("Your Anime:P profile is saved locally on this device.");
  });

  document.getElementById("aboutButton")?.addEventListener("click", () => {
    const dialog = document.getElementById("aboutDialog");

    if (dialog && !dialog.open) dialog.showModal();
  });

  document.getElementById("detailContent")?.addEventListener("change", event => {
    if (event.target.id !== "animeRating") return;

    const dialog = document.getElementById("detailDialog");

    if (dialog?.dataset.animeId) {
      saveRating(dialog.dataset.animeId, event.target.value);
    }
  });

  // Stop video playback when the player dialog closes.
  document.getElementById("playerDialog")?.addEventListener("close", () => {
    const content = document.getElementById("playerContent");

    if (content) {
      content.querySelectorAll("iframe").forEach(frame => {
        frame.src = "about:blank";
      });
    }
  });
}

/* =========================================================
   15. OPTIONAL SORT CONTROL
   ========================================================= */

function setupOptionalSort() {
  const select = document.getElementById("sortSelect");
  if (!select) return;

  select.addEventListener("change", () => {
    sortMode = select.value;
    renderCurrentView();
  });
}

/* =========================================================
   16. INITIALIZE
   ========================================================= */

function initAnimeP() {
  renderGenres();
  renderCurrentView();

  updateListCount();
  renderWatchlist();
  renderContinueWatching();
  renderHistory();
  renderHeroListButton();

  setupSearch();
  setupEvents();
  setupOptionalSort();

  console.log(
    `Anime:P ready — ${ANIME.length} catalogue entries loaded.`
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimeP);
} else {
  initAnimeP();
}
