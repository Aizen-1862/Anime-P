
"use strict";

const API = "https://api.jikan.moe/v4";
const PAGE_SIZE = 25;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  view: "home",
  query: "",
  genre: "all",
  page: 1,
  loading: false,
  hasMore: true,
  anime: [],
  byId: new Map(),
  watchlist: loadStorage("animePWatchlist", []),
  history: loadStorage("animePHistory", []),
  activeAnime: null
};

function loadStorage(key, fallback) {
  try {
    const result = JSON.parse(localStorage.getItem(key));
    return Array.isArray(result) ? result : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Browser storage is unavailable.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function normaliseAnime(item) {
  return {
    id: Number(item.mal_id),
    title: item.title_english || item.title || "Untitled anime",
    japaneseTitle: item.title_japanese || "",
    image: safeImageUrl(
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      item.images?.webp?.image_url ||
      ""
    ),
    score: Number(item.score) || 0,
    year: item.year || item.aired?.prop?.from?.year || "",
    episodes: item.episodes || null,
    status: item.status || "Unknown",
    synopsis: item.synopsis || "No synopsis is available for this title yet.",
    genres: [
      ...(item.genres || []),
      ...(item.themes || [])
    ].map(genre => genre.name).filter(Boolean),
    rating: item.rating || "",
    type: item.type || "Anime",
    trailer: safeImageUrl(item.trailer?.images?.maximum_image_url || ""),
    trailerUrl: safeImageUrl(item.trailer?.url || ""),
    url: safeImageUrl(item.url || ""),
    studios: (item.studios || []).map(studio => studio.name),
    source: item.source || "",
    duration: item.duration || "",
    season: item.season || ""
  };
}

function genreLabel(anime) {
  return anime.genres.slice(0, 2).join(" · ") || anime.type || "Anime";
}

function isSaved(id) {
  return state.watchlist.some(item => Number(item.id) === Number(id));
}

function updateListCount() {
  $("#listCount").textContent = String(state.watchlist.length);
}

function fallbackPoster(anime) {
  return `
    <div class="poster-fallback">
      <span class="fallback-symbol">✦</span>
      <strong>${escapeHTML(anime.title)}</strong>
      <small>ANIME:P DISCOVERY</small>
    </div>`;
}

function posterMarkup(anime, detail = false) {
  const image = safeImageUrl(anime.image);
  const cls = detail ? "detail-poster" : "poster";
  const img = image
    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(anime.title)}" loading="lazy" onerror="this.remove()">`
    : "";

  return `
    <div class="${cls}">
      ${img}
      ${fallbackPoster(anime)}
    </div>`;
}

function cardMarkup(anime) {
  const saved = isSaved(anime.id);
  const score = anime.score ? anime.score.toFixed(1) : "—";
  const year = anime.year || "Anime";
  const episodes = anime.episodes ? `${anime.episodes} EP` : "Episodes TBA";

  return `
    <article class="anime-card" data-id="${anime.id}">
      <div class="poster">
        ${anime.image ? `<img src="${escapeHTML(anime.image)}" alt="${escapeHTML(anime.title)}" loading="lazy" onerror="this.style.display='none'">` : ""}
        ${fallbackPoster(anime)}
        <div class="poster-overlay"></div>
        <div class="poster-top">
          <span class="tag">${escapeHTML(anime.type || "ANIME")}</span>
          <button class="heart-btn ${saved ? "saved" : ""}" data-action="toggle-list" data-id="${anime.id}" aria-label="${saved ? "Remove from" : "Add to"} watchlist" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
        </div>
        <div class="poster-bottom">
          <span>${escapeHTML(String(year))}</span>
          <span class="rating">★ ${score}</span>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${escapeHTML(anime.title)}</h3>
        <div class="card-subtitle">
          <span>${escapeHTML(genreLabel(anime))}</span>
          <span>${escapeHTML(String(episodes))}</span>
        </div>
        <div class="card-actions">
          <button class="mini-btn watch" data-action="details" data-id="${anime.id}">View details</button>
          <button class="mini-btn" data-action="toggle-list" data-id="${anime.id}">${saved ? "♥ Saved" : "♡ Save"}</button>
        </div>
      </div>
    </article>`;
}

async function fetchAnime(url) {
  const response = await fetch(url, {
    headers: { "Accept": "application/json" }
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("The anime catalogue is busy. Wait a moment and try again.");
    }
    throw new Error(`Catalogue request failed (${response.status}).`);
  }

  const json = await response.json();
  return json.data || [];
}

async function loadAnime({ reset = false } = {}) {
  if (state.loading) return;
  if (!state.hasMore && !reset) return;

  if (reset) {
    state.page = 1;
    state.hasMore = true;
    state.anime = [];
    state.byId.clear();
    $("#animeGrid").innerHTML = "";
  }

  state.loading = true;
  $("#statusMessage").textContent = "Finding anime for you...";
  $("#loadMoreButton").disabled = true;

  try {
    let endpoint;

    if (state.query.trim()) {
      endpoint = `${API}/anime?q=${encodeURIComponent(state.query.trim())}&page=${state.page}&limit=${PAGE_SIZE}&sfw=true`;
    } else {
      endpoint = `${API}/top/anime?page=${state.page}&limit=${PAGE_SIZE}&filter=bypopularity`;
    }

    const items = await fetchAnime(endpoint);
    const normalized = items.map(normaliseAnime).filter(anime => anime.id);

    normalized.forEach(anime => state.byId.set(anime.id, anime));

    if (normalized.length === 0) state.hasMore = false;

    state.anime.push(...normalized);
    state.page += 1;

    renderCatalogue();

    state.hasMore = items.length >= PAGE_SIZE;
    $("#statusMessage").textContent = state.anime.length
      ? `${state.anime.length} anime loaded · More titles await`
      : "No anime found. Try another search.";

    $("#loadMoreButton").classList.toggle("hidden", !state.hasMore);
  } catch (error) {
    $("#statusMessage").textContent = error.message || "Couldn't load the anime catalogue.";
    if (!state.anime.length) {
      $("#animeGrid").innerHTML = "";
      $("#emptyState").classList.remove("hidden");
    }
  } finally {
    state.loading = false;
    $("#loadMoreButton").disabled = false;
  }
}

function filteredAnime(items) {
  let result = [...items];

  if (state.genre !== "all") {
    result = result.filter(anime =>
      anime.genres.some(genre =>
        genre.toLowerCase() === state.genre.toLowerCase()
      )
    );
  }

  return result;
}

function renderCatalogue() {
  const items = filteredAnime(state.anime);
  $("#animeGrid").innerHTML = items.map(cardMarkup).join("");
  $("#emptyState").classList.toggle("hidden", items.length > 0);
}

function renderWatchlist() {
  const items = state.watchlist
    .map(item => state.byId.get(Number(item.id)) || item)
    .filter(item => item && item.id);

  $("#watchlistGrid").innerHTML = items.map(cardMarkup).join("");
  $("#watchlistEmpty").classList.toggle("hidden", items.length > 0);
  updateListCount();
}

function renderHistory() {
  const items = state.history
    .map(item => state.byId.get(Number(item.id)) || item)
    .filter(item => item && item.id);

  $("#historyGrid").innerHTML = items.map(cardMarkup).join("");
  $("#historyEmpty").classList.toggle("hidden", items.length > 0);
}

function renderContinue() {
  const items = state.history.slice(0, 10)
    .map(item => state.byId.get(Number(item.id)) || item)
    .filter(item => item && item.id);

  $("#continueGrid").innerHTML = items.map(cardMarkup).join("");
  $("#continueSection").classList.toggle("hidden", items.length === 0);
}

function changeView(view) {
  state.view = view;

  $("#hero").classList.toggle("hidden", view !== "home");
  $("#homeTrending").classList.toggle("hidden", !["home", "browse"].includes(view));
  $("#watchlistSection").classList.toggle("hidden", view !== "watchlist");
  $("#historySection").classList.toggle("hidden", view !== "history");

  $$(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (view === "watchlist") renderWatchlist();
  if (view === "history") renderHistory();

  if (view === "browse") {
    $("#collectionTitle").textContent = state.query ? "Search Results" : "Discover Anime";
  } else {
    $("#collectionTitle").textContent = state.query ? "Search Results" : "Trending Anime";
  }

  if (view !== "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function toggleWatchlist(id) {
  const numericId = Number(id);
  const found = state.byId.get(numericId) ||
    state.watchlist.find(item => Number(item.id) === numericId) ||
    state.history.find(item => Number(item.id) === numericId);

  if (!found) return;

  if (isSaved(numericId)) {
    state.watchlist = state.watchlist.filter(item => Number(item.id) !== numericId);
    showToast("Removed from your watchlist.");
  } else {
    state.watchlist.unshift(found);
    showToast("Added to your watchlist ♥");
  }

  saveStorage("animePWatchlist", state.watchlist);
  updateListCount();
  renderCatalogue();
  renderWatchlist();
  renderHistory();
  renderContinue();

  if (state.activeAnime?.id === numericId) openDetails(found.id);
}

function addHistory(anime) {
  state.history = [
    anime,
    ...state.history.filter(item => Number(item.id) !== Number(anime.id))
  ].slice(0, 30);

  saveStorage("animePHistory", state.history);
  renderHistory();
  renderContinue();
}

function openDetails(id) {
  const anime = state.byId.get(Number(id)) ||
    state.watchlist.find(item => Number(item.id) === Number(id)) ||
    state.history.find(item => Number(item.id) === Number(id));

  if (!anime) {
    showToast("Anime details are not available yet.");
    return;
  }

  state.activeAnime = anime;
  addHistory(anime);

  const genres = anime.genres.slice(0, 8);
  const synopsis = anime.synopsis || "No synopsis is available yet.";
  const score = anime.score ? anime.score.toFixed(1) : "Not rated";

  $("#detailContent").innerHTML = `
    <div class="detail-layout">
      ${posterMarkup(anime, true)}
      <div class="detail-copy">
        <span class="eyebrow">ANIME:P DISCOVERY</span>
        <h2>${escapeHTML(anime.title)}</h2>
        ${anime.japaneseTitle ? `<p>${escapeHTML(anime.japaneseTitle)}</p>` : ""}
        <div class="detail-rating">★ ${escapeHTML(score)} <span style="color:var(--muted)">· ${escapeHTML(String(anime.year || "Year unknown"))}</span></div>
        <div class="detail-tags">
          ${genres.map(genre => `<span class="tag">${escapeHTML(genre)}</span>`).join("")}
          <span class="tag">${escapeHTML(anime.type)}</span>
          ${anime.rating ? `<span class="tag">${escapeHTML(anime.rating)}</span>` : ""}
        </div>
        <p>${escapeHTML(synopsis)}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" data-action="official" data-id="${anime.id}">Find official streams ↗</button>
          <button class="btn btn-secondary" data-action="toggle-list" data-id="${anime.id}">${isSaved(anime.id) ? "♥ Saved" : "♡ Add to list"}</button>
        </div>
      </div>
    </div>
    <h3 class="episode-title">About this anime</h3>
    <div class="episode-list">
      <div class="episode-item">
        <span class="episode-number">★</span>
        <div><strong>Community score</strong><small>${escapeHTML(score)}</small></div>
      </div>
      <div class="episode-item">
        <span class="episode-number">EP</span>
        <div><strong>Episode count</strong><small>${escapeHTML(String(anime.episodes || "Not announced"))}</small></div>
      </div>
      <div class="episode-item">
        <span class="episode-number">▶</span>
        <div><strong>Streaming availability</strong><small>Check licensed services in your region. Availability may vary.</small></div>
        <button class="btn btn-secondary" data-action="official" data-id="${anime.id}">Find</button>
      </div>
    </div>
    <p class="section-description">Anime:P provides discovery information. Episodes are not hosted on this website.</p>
  `;

  $("#detailDialog").showModal();
}

function openOfficialSearch(id) {
  const anime = state.byId.get(Number(id)) ||
    state.watchlist.find(item => Number(item.id) === Number(id)) ||
    state.history.find(item => Number(item.id) === Number(id));

  if (!anime) return;

  const search = encodeURIComponent(`${anime.title} official streaming`);
  window.open(`https://www.google.com/search?q=${search}`, "_blank", "noopener,noreferrer");
  showToast("Search results opened. Choose an official streaming provider.");
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function setupEvents() {
  document.addEventListener("click", event => {
    const closeButton = event.target.closest("[data-close]");
    if (closeButton) {
      closeDialog(closeButton.dataset.close);
      return;
    }

    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      event.preventDefault();
      changeView(viewButton.dataset.view);
      return;
    }

    const genreButton = event.target.closest("[data-genre]");
    if (genreButton) {
      state.genre = genreButton.dataset.genre;

      $$(".genre-chip").forEach(button => {
        button.classList.toggle("active", button === genreButton);
      });

      renderCatalogue();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const id = Number(actionButton.dataset.id);
      const action = actionButton.dataset.action;

      if (action === "toggle-list") toggleWatchlist(id);
      if (action === "details") openDetails(id);
      if (action === "official") openOfficialSearch(id);
      return;
    }

    const card = event.target.closest(".anime-card");
    if (card && card.dataset.id) openDetails(Number(card.dataset.id));
  });

  $("#exploreButton").addEventListener("click", () => changeView("browse"));
  $("#heroListButton").addEventListener("click", () => changeView("watchlist"));
  $("#aboutButton").addEventListener("click", () => $("#aboutDialog").showModal());

  $("#clearFilters").addEventListener("click", () => {
    state.query = "";
    state.genre = "all";
    $("#searchInput").value = "";
    $$(".genre-chip").forEach(button => {
      button.classList.toggle("active", button.dataset.genre === "all");
    });
    changeView("browse");
    loadAnime({ reset: true });
  });

  $("#loadMoreButton").addEventListener("click", () => loadAnime());

  $("#clearHistoryButton").addEventListener("click", () => {
    state.history = [];
    saveStorage("animePHistory", []);
    renderHistory();
    renderContinue();
    showToast("Viewing history cleared.");
  });

  let searchTimer;
  $("#searchInput").addEventListener("input", event => {
    clearTimeout(searchTimer);
    state.query = event.target.value.trim();
    changeView("browse");

    searchTimer = setTimeout(() => {
      loadAnime({ reset: true });
    }, state.query ? 550 : 200);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("#searchInput").focus();
    }

    if (event.key === "Escape") {
      ["detailDialog", "playerDialog", "aboutDialog"].forEach(closeDialog);
    }
  });

  ["detailDialog", "playerDialog", "aboutDialog"].forEach(id => {
    const dialog = document.getElementById(id);
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function startApp() {
  updateListCount();
  renderContinue();
  setupEvents();
  loadAnime({ reset: true });
}

startApp();
