
"use strict";

const API = "https://api.jikan.moe/v4";
const PAGE_SIZE = 24;

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const state = {
  view: "home",
  query: "",
  genre: "all",
  page: 1,
  loading: false,
  hasMore: true,
  anime: [],
  byId: new Map(),
  watchlist: readStore("animePWatchlist"),
  history: readStore("animePHistory")
};

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("Couldn't save browser data.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function validURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

let toastTimer;

function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function normalise(item) {
  return {
    id: Number(item.mal_id),
    title: item.title_english || item.title || "Untitled anime",
    japanese: item.title_japanese || "",
    image: validURL(
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      item.images?.webp?.image_url || ""
    ),
    score: Number(item.score) || 0,
    year: item.year || item.aired?.prop?.from?.year || "",
    episodes: item.episodes || null,
    status: item.status || "Unknown",
    synopsis: item.synopsis || "No description is available yet.",
    genres: [
      ...(item.genres || []),
      ...(item.themes || [])
    ].map(x => x.name).filter(Boolean),
    rating: item.rating || "",
    type: item.type || "Anime",
    studios: (item.studios || []).map(x => x.name),
    trailer: validURL(item.trailer?.url || ""),
    malURL: validURL(item.url || "")
  };
}

function isSaved(id) {
  return state.watchlist.some(x => Number(x.id) === Number(id));
}

function genresText(anime) {
  return anime.genres.slice(0, 2).join(" · ") || anime.type || "Anime";
}

function fallbackMarkup(anime) {
  return `
    <div class="poster-fallback">
      <span class="fallback-symbol">✦</span>
      <strong>${escapeHTML(anime.title)}</strong>
      <small>ANIME:P</small>
    </div>`;
}

function posterMarkup(anime, detail = false) {
  const image = anime.image
    ? `<img src="${escapeHTML(anime.image)}"
        alt="${escapeHTML(anime.title)}"
        loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : "";

  return `
    <div class="${detail ? "detail-poster" : "poster"}">
      ${image}
      ${fallbackMarkup(anime)}
    </div>`;
}

function cardMarkup(anime) {
  const saved = isSaved(anime.id);
  const score = anime.score ? anime.score.toFixed(1) : "—";

  return `
    <article class="anime-card" data-id="${anime.id}">
      <div class="poster">
        ${anime.image ? `
          <img src="${escapeHTML(anime.image)}"
            alt="${escapeHTML(anime.title)}"
            loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        ` : ""}
        ${fallbackMarkup(anime)}
        <div class="poster-overlay"></div>
        <div class="poster-top">
          <span class="tag">${escapeHTML(anime.type)}</span>
          <button class="heart-btn ${saved ? "saved" : ""}"
            data-action="save" data-id="${anime.id}"
            aria-label="${saved ? "Remove from watchlist" : "Add to watchlist"}">${saved ? "♥" : "♡"}</button>
        </div>
        <div class="poster-bottom">
          <span>${escapeHTML(String(anime.year || "Anime"))}</span>
          <span class="rating">★ ${score}</span>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${escapeHTML(anime.title)}</h3>
        <div class="card-subtitle">
          <span>${escapeHTML(genresText(anime))}</span>
          <span>${anime.episodes || "—"} EP</span>
        </div>
        <div class="card-actions">
          <button class="mini-btn watch" data-action="details" data-id="${anime.id}">Details</button>
          <button class="mini-btn" data-action="save" data-id="${anime.id}">${saved ? "♥ Saved" : "♡ Save"}</button>
        </div>
      </div>
    </article>`;
}

async function requestAnime(url) {
  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error("Catalogue busy. Wait a few seconds and try again.");
  }

  if (!response.ok) {
    throw new Error("Couldn't reach the anime catalogue. Try again shortly.");
  }

  const json = await response.json();
  return json.data || [];
}

async function loadAnime(reset = false) {
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
  $("#statusMessage").textContent = "Loading anime...";
  $("#loadMoreButton").disabled = true;

  try {
    let url;

    if (state.query) {
      url = `${API}/anime?q=${encodeURIComponent(state.query)}&page=${state.page}&limit=${PAGE_SIZE}&sfw=true`;
    } else {
      // Popular titles first, with more pages available.
      url = `${API}/top/anime?page=${state.page}&limit=${PAGE_SIZE}&filter=bypopularity`;
    }

    const items = await requestAnime(url);
    const results = items.map(normalise).filter(x => x.id);

    results.forEach(anime => state.byId.set(anime.id, anime));

    const existing = new Set(state.anime.map(x => x.id));
    results.forEach(anime => {
      if (!existing.has(anime.id)) state.anime.push(anime);
    });

    state.hasMore = items.length >= PAGE_SIZE;
    state.page++;

    renderCatalogue();

    $("#statusMessage").textContent = state.anime.length
      ? `${state.anime.length} titles loaded`
      : "No anime found. Try a different search.";

    $("#loadMoreButton").classList.toggle("hidden", !state.hasMore);
  } catch (error) {
    $("#statusMessage").textContent = error.message;
    if (!state.anime.length) {
      $("#animeGrid").innerHTML = "";
      $("#emptyState").classList.remove("hidden");
    }
  } finally {
    state.loading = false;
    $("#loadMoreButton").disabled = false;
  }
}

function applyGenre(items) {
  if (state.genre === "all") return items;

  return items.filter(anime =>
    anime.genres.some(g => g.toLowerCase() === state.genre.toLowerCase())
  );
}

function renderCatalogue() {
  const items = applyGenre(state.anime);
  $("#animeGrid").innerHTML = items.map(cardMarkup).join("");
  $("#emptyState").classList.toggle("hidden", items.length !== 0);
  $("#collectionTitle").textContent = state.query
    ? "Search Results"
    : state.view === "browse" ? "Discover Anime" : "Popular Anime";
}

function findStoredAnime(id) {
  return state.byId.get(Number(id)) ||
    state.watchlist.find(x => Number(x.id) === Number(id)) ||
    state.history.find(x => Number(x.id) === Number(id));
}

function renderWatchlist() {
  const items = state.watchlist;
  $("#watchlistGrid").innerHTML = items.map(cardMarkup).join("");
  $("#watchlistEmpty").classList.toggle("hidden", items.length > 0);
  $("#listCount").textContent = String(items.length);
}

function renderHistory() {
  $("#historyGrid").innerHTML = state.history.map(cardMarkup).join("");
  $("#historyEmpty").classList.toggle("hidden", state.history.length > 0);
}

function renderContinue() {
  const items = state.history.slice(0, 12);
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
  if (view === "browse" || view === "home") renderCatalogue();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSave(id) {
  const anime = findStoredAnime(id);
  if (!anime) {
    toast("Anime details haven't loaded yet.");
    return;
  }

  if (isSaved(id)) {
    state.watchlist = state.watchlist.filter(x => Number(x.id) !== Number(id));
    toast("Removed from My List.");
  } else {
    state.watchlist.unshift(anime);
    toast("Added to My List ♥");
  }

  writeStore("animePWatchlist", state.watchlist);
  renderCatalogue();
  renderWatchlist();
  renderHistory();
  renderContinue();

  if ($("#detailDialog").open && state.activeId === Number(id)) {
    openDetails(id);
  }
}

function addToHistory(anime) {
  state.history = [
    anime,
    ...state.history.filter(x => Number(x.id) !== Number(anime.id))
  ].slice(0, 40);

  writeStore("animePHistory", state.history);
  renderHistory();
  renderContinue();
}

let activeId = null;

function openDetails(id) {
  const anime = findStoredAnime(id);
  if (!anime) return;

  activeId = Number(id);
  addToHistory(anime);

  const score = anime.score ? anime.score.toFixed(1) : "Not rated";
  const tags = anime.genres.slice(0, 8)
    .map(g => `<span class="tag">${escapeHTML(g)}</span>`)
    .join("");

  $("#detailContent").innerHTML = `
    <div class="detail-layout">
      ${posterMarkup(anime, true)}
      <div class="detail-copy">
        <span class="eyebrow">ANIME:P DISCOVERY</span>
        <h2>${escapeHTML(anime.title)}</h2>
        ${anime.japanese ? `<p>${escapeHTML(anime.japanese)}</p>` : ""}
        <div class="detail-rating">★ ${score} · ${escapeHTML(String(anime.year || "Year unknown"))}</div>
        <div class="detail-tags">${tags}<span class="tag">${escapeHTML(anime.type)}</span></div>
        <p>${escapeHTML(anime.synopsis)}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" data-action="official" data-id="${anime.id}">Find where to watch ↗</button>
          <button class="btn btn-secondary" data-action="save" data-id="${anime.id}">${isSaved(id) ? "♥ Saved" : "♡ My List"}</button>
          ${anime.malURL ? `<a class="btn btn-secondary" href="${escapeHTML(anime.malURL)}" target="_blank" rel="noopener noreferrer">More info ↗</a>` : ""}
        </div>
      </div>
    </div>
    <h3 class="episode-title">Anime information</h3>
    <div class="episode-list">
      <div class="episode-item">
        <span class="episode-number">★</span>
        <div><strong>Community rating</strong><small>${score}</small></div>
      </div>
      <div class="episode-item">
        <span class="episode-number">EP</span>
        <div><strong>Episodes</strong><small>${anime.episodes || "Not announced"}</small></div>
      </div>
      <div class="episode-item">
        <span class="episode-number">▶</span>
        <div><strong>Streaming</strong><small>Availability depends on your region and provider.</small></div>
        <button class="mini-btn" data-action="official" data-id="${anime.id}">Find</button>
      </div>
    </div>
    <p class="section-description">Anime:P is an anime discovery catalogue and does not host video episodes.</p>
  `;

  $("#detailDialog").showModal();
}

function officialSearch(id) {
  const anime = findStoredAnime(id);
  if (!anime) return;

  const query = encodeURIComponent(`${anime.title} official streaming watch`);
  window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function setupEvents() {
  document.addEventListener("click", event => {
    const close = event.target.closest("[data-close]");
    if (close) {
      closeDialog(close.dataset.close);
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

      if (actionButton.dataset.action === "save") toggleSave(id);
      if (actionButton.dataset.action === "details") openDetails(id);
      if (actionButton.dataset.action === "official") officialSearch(id);
      return;
    }

    const card = event.target.closest(".anime-card");
    if (card) openDetails(Number(card.dataset.id));
  });

  $("#exploreButton").addEventListener("click", () => changeView("browse"));
  $("#heroListButton").addEventListener("click", () => changeView("watchlist"));
  $("#aboutButton").addEventListener("click", () => $("#aboutDialog").showModal());
  $("#loadMoreButton").addEventListener("click", () => loadAnime());

  $("#clearFilters").addEventListener("click", () => {
    state.query = "";
    state.genre = "all";
    $("#searchInput").value = "";
    $$(".genre-chip").forEach(button => {
      button.classList.toggle("active", button.dataset.genre === "all");
    });
    changeView("browse");
    loadAnime(true);
  });

  $("#clearHistoryButton").addEventListener("click", () => {
    state.history = [];
    writeStore("animePHistory", []);
    renderHistory();
    renderContinue();
    toast("History cleared.");
  });

  let searchTimer;
  $("#searchInput").addEventListener("input", event => {
    clearTimeout(searchTimer);
    state.query = event.target.value.trim();
    changeView("browse");

    searchTimer = setTimeout(() => loadAnime(true), state.query ? 500 : 200);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("#searchInput").focus();
    }
  });

  ["detailDialog", "aboutDialog", "playerDialog"].forEach(id => {
    const dialog = document.getElementById(id);
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  });
}

function start() {
  $("#listCount").textContent = String(state.watchlist.length);
  renderContinue();
  setupEvents();
  loadAnime(true);
}

start();
