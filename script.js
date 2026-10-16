
/* =========================================================
   ANIME:P — VERSION 1
   Complete Frontend JavaScript
   GitHub Pages Compatible
   ========================================================= */

"use strict";

/* =========================
   CONFIGURATION
========================= */

const STORAGE_KEYS = {
  favorites: "animep_favorites",
  watchlist: "animep_watchlist",
  progress: "animep_progress",
  ratings: "animep_ratings"
};

/*
  Add anime entries here.

  IMPORTANT:
  Only use video URLs you are authorized to embed.
  Replace the example entries with verified official sources.
*/

const ANIME_DATA = [
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    japaneseTitle: "Kimetsu no Yaiba",
    year: 2019,
    rating: 8.6,
    genres: ["Action", "Fantasy", "Adventure"],
    languages: ["Japanese", "English"],
    episodes: 26,
    status: "Completed",
    description:
      "A young swordsman enters a dangerous world of demons while searching for a way to help his sister.",
    poster: "",
    banner: "",
    featured: true,
    episodeList: [
      {
        number: 1,
        title: "Cruelty",
        videoUrl: "",
        source: "Official source required"
      },
      {
        number: 2,
        title: "Trainer Sakonji Urokodaki",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    japaneseTitle: "Jujutsu Kaisen",
    year: 2020,
    rating: 8.5,
    genres: ["Action", "Fantasy", "Supernatural"],
    languages: ["Japanese", "English"],
    episodes: 24,
    status: "Ongoing",
    description:
      "A student becomes involved in the hidden world of curses and sorcerers.",
    poster: "",
    banner: "",
    featured: true,
    episodeList: [
      {
        number: 1,
        title: "Ryomen Sukuna",
        videoUrl: "",
        source: "Official source required"
      },
      {
        number: 2,
        title: "For Myself",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  },
  {
    id: "spy-family",
    title: "SPY x FAMILY",
    japaneseTitle: "Spy x Family",
    year: 2022,
    rating: 8.3,
    genres: ["Comedy", "Action", "Slice of Life"],
    languages: ["Japanese", "English"],
    episodes: 25,
    status: "Ongoing",
    description:
      "A spy, an assassin, and a telepath form an unusual family while hiding their secrets.",
    poster: "",
    banner: "",
    featured: false,
    episodeList: [
      {
        number: 1,
        title: "Operation Strix",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  },
  {
    id: "haikyuu",
    title: "Haikyu!!",
    japaneseTitle: "Haikyu!!",
    year: 2014,
    rating: 8.7,
    genres: ["Sports", "Comedy", "Drama"],
    languages: ["Japanese", "English"],
    episodes: 25,
    status: "Completed",
    description:
      "A determined volleyball player works toward competing at the highest level.",
    poster: "",
    banner: "",
    featured: false,
    episodeList: [
      {
        number: 1,
        title: "The End and the Beginning",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    japaneseTitle: "Sousou no Frieren",
    year: 2023,
    rating: 9.3,
    genres: ["Fantasy", "Adventure", "Drama"],
    languages: ["Japanese"],
    episodes: 28,
    status: "Completed",
    description:
      "An elven mage reflects on time, friendship, and the meaning of human life after an adventure ends.",
    poster: "",
    banner: "",
    featured: true,
    episodeList: [
      {
        number: 1,
        title: "The End of the Journey",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  },
  {
    id: "one-punch-man",
    title: "One-Punch Man",
    japaneseTitle: "One-Punch Man",
    year: 2015,
    rating: 8.7,
    genres: ["Action", "Comedy", "Superhero"],
    languages: ["Japanese", "English"],
    episodes: 12,
    status: "Ongoing",
    description:
      "An overwhelmingly powerful hero searches for excitement in a world of monsters and heroes.",
    poster: "",
    banner: "",
    featured: false,
    episodeList: [
      {
        number: 1,
        title: "The Strongest Man",
        videoUrl: "",
        source: "Official source required"
      }
    ]
  }
];

/* =========================
   STORAGE UTILITIES
========================= */

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Anime:P could not read saved data:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Anime:P could not save data:", error);
    showToast("Could not save. Check browser storage.");
    return false;
  }
}

function getFavorites() {
  return readStorage(STORAGE_KEYS.favorites);
}

function getWatchlist() {
  return readStorage(STORAGE_KEYS.watchlist);
}

function getProgress() {
  return readStorage(STORAGE_KEYS.progress, {});
}

function getRatings() {
  return readStorage(STORAGE_KEYS.ratings, {});
}

/* =========================
   DOM UTILITIES
========================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showToast(message) {
  let toast = $("#animeToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "animeToast";
    toast.className = "anime-toast";
    toast.setAttribute("role", "status");

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      padding: "12px 20px",
      background: "#211b36",
      color: "#ffffff",
      border: "1px solid #8b5cf6",
      borderRadius: "12px",
      boxShadow: "0 8px 30px #0008",
      maxWidth: "90%",
      textAlign: "center"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

/* =========================
   ANIME LOOKUP
========================= */

function getAnimeById(id) {
  return ANIME_DATA.find(anime => anime.id === id);
}

function getAnimePoster(anime) {
  if (anime.poster) return anime.poster;

  return "";
}

function getAnimeImageMarkup(anime) {
  const poster = getAnimePoster(anime);

  if (poster) {
    return `
      <img
        class="anime-poster"
        src="${escapeHTML(poster)}"
        alt="${escapeHTML(anime.title)} poster"
        loading="lazy"
        onerror="this.hidden=true"
      >
    `;
  }

  return `
    <div class="anime-poster-placeholder" aria-label="Poster unavailable">
      <span>✦</span>
      <strong>${escapeHTML(anime.title)}</strong>
      <small>ANIME:P</small>
    </div>
  `;
}

/* =========================
   ANIME CARD RENDERING
========================= */

function createAnimeCard(anime) {
  const favorite = getFavorites().includes(anime.id);
  const watchlist = getWatchlist().includes(anime.id);

  const card = document.createElement("article");

  card.className = "anime-card";
  card.dataset.animeId = anime.id;

  card.innerHTML = `
    <div class="anime-card-poster">
      ${getAnimeImageMarkup(anime)}

      <span class="anime-rating">
        ★ ${Number(anime.rating).toFixed(1)}
      </span>

      <div class="anime-card-actions">
        <button
          type="button"
          class="anime-favorite-btn ${favorite ? "active" : ""}"
          data-action="favorite"
          aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}"
          aria-pressed="${favorite}"
        >${favorite ? "♥" : "♡"}</button>

        <button
          type="button"
          class="anime-watchlist-btn ${watchlist ? "active" : ""}"
          data-action="watchlist"
          aria-label="${watchlist ? "Remove from watchlist" : "Add to watchlist"}"
          aria-pressed="${watchlist}"
        >${watchlist ? "✓" : "+"}</button>
      </div>
    </div>

    <div class="anime-card-info">
      <h3>${escapeHTML(anime.title)}</h3>

      <p class="anime-meta">
        ${anime.year} · ${anime.episodes} episodes
      </p>

      <div class="anime-tags">
        ${anime.genres.slice(0, 2).map(genre =>
          `<span>${escapeHTML(genre)}</span>`
        ).join("")}
      </div>

      <button
        type="button"
        class="anime-details-btn"
        data-action="details"
      >View Details ↗</button>
    </div>
  `;

  return card;
}

function renderAnimeList(container, animeList) {
  if (!container) return;

  container.replaceChildren();

  if (!animeList.length) {
    const empty = document.createElement("p");
    empty.className = "anime-empty-state";
    empty.textContent = "No anime found. Try another search.";
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  animeList.forEach(anime => {
    fragment.appendChild(createAnimeCard(anime));
  });

  container.appendChild(fragment);
}

/* =========================
   SEARCH AND FILTERS
========================= */

let currentGenre = "All";
let currentQuery = "";
let currentSort = "popular";
let currentLanguage = "All";

function filterAnime() {
  let results = [...ANIME_DATA];

  if (currentQuery) {
    const query = currentQuery.toLowerCase();

    results = results.filter(anime => {
      const searchable = [
        anime.title,
        anime.japaneseTitle,
        anime.description,
        ...anime.genres,
        ...anime.languages
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }

  if (currentGenre !== "All") {
    results = results.filter(anime =>
      anime.genres.some(
        genre => genre.toLowerCase() === currentGenre.toLowerCase()
      )
    );
  }

  if (currentLanguage !== "All") {
    results = results.filter(anime =>
      anime.languages.includes(currentLanguage)
    );
  }

  if (currentSort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else if (currentSort === "newest") {
    results.sort((a, b) => b.year - a.year);
  } else if (currentSort === "az") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    results.sort((a, b) =>
      Number(b.featured) - Number(a.featured)
      || b.rating - a.rating
    );
  }

  return results;
}

function updateAnimeDisplay() {
  const results = filterAnime();

  const container =
    $("#animeGrid") ||
    $("#animeContainer") ||
    $("#animeList");

  renderAnimeList(container, results);

  const count = $("#animeCount");

  if (count) {
    count.textContent = `${results.length} anime`;
  }
}

function setupSearch() {
  const searchInputs = [
    $("#searchInput"),
    $("#animeSearch"),
    $("#searchBar")
  ].filter(Boolean);

  searchInputs.forEach(input => {
    input.addEventListener("input", () => {
      currentQuery = input.value.trim();
      updateAnimeDisplay();
    });
  });

  const sortSelect = $("#sortSelect");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;
      updateAnimeDisplay();
    });
  }

  const languageSelect = $("#languageFilter");

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      currentLanguage = languageSelect.value;
      updateAnimeDisplay();
    });
  }

  $$(".genre-filter, [data-genre]").forEach(button => {
    button.addEventListener("click", () => {
      currentGenre =
        button.dataset.genre ||
        button.textContent.trim() ||
        "All";

      $$(".genre-filter, [data-genre]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      updateAnimeDisplay();
    });
  });
}

/* =========================
   FAVORITES
========================= */

function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);

  if (index === -1) {
    favorites.push(id);
    showToast("Added to favorites ♥");
  } else {
    favorites.splice(index, 1);
    showToast("Removed from favorites");
  }

  if (!writeStorage(STORAGE_KEYS.favorites, favorites)) return;

  updateAnimeDisplay();
  renderFavorites();
}

function renderFavorites() {
  const container = $("#favoritesGrid") || $("#favoritesContainer");

  if (!container) return;

  const favorites = getFavorites()
    .map(getAnimeById)
    .filter(Boolean);

  renderAnimeList(container, favorites);
}

/* =========================
   WATCHLIST
========================= */

function toggleWatchlist(id) {
  const watchlist = getWatchlist();
  const index = watchlist.indexOf(id);

  if (index === -1) {
    watchlist.push(id);
    showToast("Added to your watchlist +");
  } else {
    watchlist.splice(index, 1);
    showToast("Removed from your watchlist");
  }

  if (!writeStorage(STORAGE_KEYS.watchlist, watchlist)) return;

  updateAnimeDisplay();
  renderWatchlist();
}

function renderWatchlist() {
  const container = $("#watchlistGrid") || $("#watchlistContainer");

  if (!container) return;

  const items = getWatchlist()
    .map(getAnimeById)
    .filter(Boolean);

  renderAnimeList(container, items);
}

/* =========================
   ANIME DETAILS
========================= */

function openAnimeDetails(id) {
  const anime = getAnimeById(id);

  if (!anime) return;

  const modal = $("#animeModal") || $("#animeDetailsModal");

  if (!modal) {
    showToast(`${anime.title} — ${anime.genres.join(", ")}`);
    return;
  }

  const poster = $("#modalPoster");
  const title = $("#modalTitle");
  const description = $("#modalDescription");
  const meta = $("#modalMeta");
  const genres = $("#modalGenres");
  const episodes = $("#episodeList");

  if (poster) {
    poster.src = anime.poster || "";
    poster.alt = `${anime.title} poster`;
    poster.hidden = !anime.poster;
  }

  if (title) title.textContent = anime.title;

  if (description) {
    description.textContent = anime.description;
  }

  if (meta) {
    meta.textContent =
      `${anime.year} · ★ ${anime.rating} · ${anime.status} · ${anime.episodes} episodes`;
  }

  if (genres) {
    genres.replaceChildren();

    anime.genres.forEach(genre => {
      const tag = document.createElement("span");
      tag.className = "anime-genre-tag";
      tag.textContent = genre;
      genres.appendChild(tag);
    });
  }

  if (episodes) {
    renderEpisodes(anime);
  }

  modal.dataset.animeId = anime.id;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  const closeButton = $("[data-action='close-modal']", modal);

  if (closeButton) closeButton.focus();
}

function closeAnimeDetails() {
  const modal = $("#animeModal") || $("#animeDetailsModal");

  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

/* =========================
   EPISODE LIST
========================= */

function renderEpisodes(anime) {
  const container = $("#episodeList");

  if (!container) return;

  container.replaceChildren();

  const progress = getProgress();
  const watchedEpisode = progress[anime.id]?.episode || 0;

  anime.episodeList.forEach(episode => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "episode-item";

    button.innerHTML = `
      <span class="episode-number">
        ${String(episode.number).padStart(2, "0")}
      </span>

      <span class="episode-title">
        ${escapeHTML(episode.title)}
      </span>

      <span class="episode-status">
        ${episode.number <= watchedEpisode ? "✓ Watched" : "▶ Play"}
      </span>
    `;

    button.addEventListener("click", () => {
      playEpisode(anime.id, episode.number);
    });

    container.appendChild(button);
  });
}

/* =========================
   AUTHORIZED VIDEO PLAYER
========================= */

function isAllowedVideoUrl(rawUrl) {
  if (!rawUrl) return false;

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "https:") return false;

    const allowedHosts = [
      "www.youtube-nocookie.com",
      "www.youtube.com",
      "youtube.com",
      "www.crunchyroll.com",
      "crunchyroll.com",
      "www.bilibili.tv",
      "bilibili.tv"
    ];

    return allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

function normalizeEmbedUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (
    url.hostname === "youtube.com" ||
    url.hostname === "www.youtube.com"
  ) {
    if (url.pathname === "/watch") {
      const videoId = url.searchParams.get("v");

      if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
        return null;
      }

      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    if (url.pathname.startsWith("/embed/")) {
      return `https://www.youtube-nocookie.com${url.pathname}`;
    }
  }

  if (url.hostname === "www.youtube-nocookie.com") {
    return url.pathname.startsWith("/embed/")
      ? url.href
      : null;
  }

  /*
    Other streaming providers must supply an explicitly
    supported official embed URL. Their normal watch URLs
    are not assumed to be embeddable.
  */

  if (
    url.hostname === "www.bilibili.tv" ||
    url.hostname === "bilibili.tv"
  ) {
    return null;
  }

  if (
    url.hostname === "www.crunchyroll.com" ||
    url.hostname === "crunchyroll.com"
  ) {
    return null;
  }

  return null;
}

function playEpisode(animeId, episodeNumber) {
  const anime = getAnimeById(animeId);

  if (!anime) return;

  const episode = anime.episodeList.find(
    item => item.number === episodeNumber
  );

  if (!episode) {
    showToast("Episode information is unavailable.");
    return;
  }

  const progress = getProgress();

  progress[anime.id] = {
    episode: episodeNumber,
    updatedAt: new Date().toISOString()
  };

  writeStorage(STORAGE_KEYS.progress, progress);

  if (!episode.videoUrl) {
    showToast(
      "No authorized video source has been configured for this episode yet."
    );
    return;
  }

  if (!isAllowedVideoUrl(episode.videoUrl)) {
    showToast("This video URL is not an approved source.");
    return;
  }

  const embedUrl = normalizeEmbedUrl(episode.videoUrl);

  if (!embedUrl) {
    showToast(
      "This source does not have a supported embed URL. Open its official website instead."
    );
    return;
  }

  openVideoPlayer(anime, episode, embedUrl);
}

function openVideoPlayer(anime, episode, embedUrl) {
  const modal = $("#videoModal");
  const frame = $("#videoFrame");
  const title = $("#videoTitle");

  if (!modal || !frame) {
    window.open(embedUrl, "_blank", "noopener,noreferrer");
    return;
  }

  frame.src = embedUrl;
  frame.title = `${anime.title} — Episode ${episode.number}`;

  if (title) {
    title.textContent =
      `${anime.title} — Episode ${episode.number}: ${episode.title}`;
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

function closeVideoPlayer() {
  const modal = $("#videoModal");
  const frame = $("#videoFrame");

  if (frame) frame.src = "";

  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  document.body.classList.remove("modal-open");
}

/* =========================
   CONTINUE WATCHING
========================= */

function renderContinueWatching() {
  const container = $("#continueWatchingGrid");

  if (!container) return;

  const progress = getProgress();

  const items = Object.entries(progress)
    .map(([id, data]) => ({
      anime: getAnimeById(id),
      episode: data.episode,
      updatedAt: data.updatedAt
    }))
    .filter(item => item.anime)
    .sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

  container.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "anime-empty-state";
    empty.textContent = "Your recently watched anime will appear here.";
    container.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "continue-watching-item";

    button.innerHTML = `
      ${getAnimeImageMarkup(item.anime)}
      <span>
        <strong>${escapeHTML(item.anime.title)}</strong>
        <small>Continue from episode ${item.episode}</small>
      </span>
    `;

    button.addEventListener("click", () => {
      openAnimeDetails(item.anime.id);
    });

    container.appendChild(button);
  });
}

/* =========================
   RATINGS
========================= */

function rateAnime(id, rating) {
  if (!getAnimeById(id)) return;

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 10
  ) {
    showToast("Choose a rating from 1 to 10.");
    return;
  }

  const ratings = getRatings();
  ratings[id] = numericRating;

  if (!writeStorage(STORAGE_KEYS.ratings, ratings)) return;

  showToast(`Your rating: ${numericRating}/10`);
  renderUserRating(id);
}

function renderUserRating(id) {
  const ratings = getRatings();
  const rating = ratings[id];

  const output = $("#userRating");

  if (output) {
    output.textContent = rating
      ? `Your rating: ${rating}/10`
      : "Rate this anime";
  }

  const select = $("#ratingSelect");

  if (select && rating) {
    select.value = String(rating);
  }
}

/* =========================
   NAVIGATION
========================= */

function showSection(sectionName) {
  const sections = $$(".page-section, [data-section]");

  sections.forEach(section => {
    const sectionId =
      section.dataset.section ||
      section.id.replace(/Section$/, "").replace(/Page$/, "");

    section.hidden = sectionId !== sectionName;
  });

  $$("[data-nav]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.nav === sectionName
    );
  });

  if (sectionName === "favorites") renderFavorites();
  if (sectionName === "watchlist") renderWatchlist();
  if (sectionName === "continue") renderContinueWatching();
  if (sectionName === "home") updateAnimeDisplay();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================
   EVENT DELEGATION
========================= */

function setupGlobalEvents() {
  document.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");

    if (actionButton) {
      const card = actionButton.closest("[data-anime-id]");
      const id = card?.dataset.animeId;

      switch (actionButton.dataset.action) {
        case "favorite":
          if (id) toggleFavorite(id);
          return;

        case "watchlist":
          if (id) toggleWatchlist(id);
          return;

        case "details":
          if (id) openAnimeDetails(id);
          return;

        case "close-modal":
          closeAnimeDetails();
          return;

        case "close-video":
          closeVideoPlayer();
          return;
      }
    }

    const navButton = event.target.closest("[data-nav]");

    if (navButton) {
      showSection(navButton.dataset.nav);
    }
  });

  const modal = $("#animeModal") || $("#animeDetailsModal");

  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeAnimeDetails();
    });
  }

  const videoModal = $("#videoModal");

  if (videoModal) {
    videoModal.addEventListener("click", event => {
      if (event.target === videoModal) closeVideoPlayer();
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAnimeDetails();
      closeVideoPlayer();
    }
  });

  const ratingSelect = $("#ratingSelect");

  if (ratingSelect) {
    ratingSelect.addEventListener("change", () => {
      const modal = $("#animeModal") || $("#animeDetailsModal");
      const id = modal?.dataset.animeId;

      if (id) rateAnime(id, ratingSelect.value);
    });
  }
}

/* =========================
   INITIALIZATION
========================= */

function initializeAnimeP() {
  setupSearch();
  setupGlobalEvents();

  updateAnimeDisplay();
  renderFavorites();
  renderWatchlist();
  renderContinueWatching();

  console.log(
    `Anime:P initialized — ${ANIME_DATA.length} anime loaded.`
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAnimeP);
} else {
  initializeAnimeP();
}
