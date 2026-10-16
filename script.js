
"use strict";

/* =========================================================
   ANIME:P — COMPLETE FRONTEND SCRIPT
   Catalogue API: Tenrai
   Preserves the existing HTML and CSS.
========================================================= */

const API = "https://api.tenrai.org/v1";
const PAGE_SIZE = 24;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector)
];

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

let activeId = null;
let activeRequest = null;
let requestNumber = 0;
let searchTimer = null;
let toastTimer = null;

/* =========================
   LOCAL STORAGE
========================= */

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

/* =========================
   HELPERS
========================= */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function validURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function toast(message) {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

function setStatus(message) {
  const element = $("#statusMessage");
  if (element) element.textContent = message;
}

function normalise(item) {
  const images = item.images || {};

  return {
    id: Number(item.mal_id),
    title:
      item.title_english ||
      item.title ||
      "Untitled anime",

    japanese: item.title_japanese || "",

    image: validURL(
      images.webp?.large_image_url ||
      images.jpg?.large_image_url ||
      images.webp?.image_url ||
      images.jpg?.image_url ||
      ""
    ),

    score: Number(item.score) || 0,

    year:
      item.year ||
      item.aired?.prop?.from?.year ||
      "",

    episodes: item.episodes || null,
    status: item.status || "Unknown",

    synopsis:
      item.synopsis ||
      "No description is available yet.",

    genres: [
      ...(item.genres || []),
      ...(item.themes || [])
    ]
      .map(genre => genre.name)
      .filter(Boolean),

    rating: item.rating || "",
    type: item.type || "Anime",

    studios: (item.studios || [])
      .map(studio => studio.name),

    trailer: validURL(item.trailer?.url || ""),
    malURL: validURL(item.url || "")
  };
}

function isSaved(id) {
  return state.watchlist.some(
    item => Number(item.id) === Number(id)
  );
}

function genresText(anime) {
  return anime.genres.slice(0, 2).join(" · ") ||
    anime.type ||
    "Anime";
}

function findStoredAnime(id) {
  return (
    state.byId.get(Number(id)) ||
    state.watchlist.find(item => Number(item.id) === Number(id)) ||
    state.history.find(item => Number(item.id) === Number(id)) ||
    null
  );
}

/* =========================
   POSTER AND CARD HTML
========================= */

function fallbackMarkup(anime) {
  return `
    <div class="poster-fallback">
      <span class="fallback-symbol">✦</span>
      <strong>${escapeHTML(anime.title)}</strong>
      <small>ANIME:P</small>
    </div>
  `;
}

function posterMarkup(anime, detail = false) {
  const image = anime.image
    ? `
      <img
        src="${escapeHTML(anime.image)}"
        alt="${escapeHTML(anime.title)}"
        loading="lazy"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='flex'
        "
      >
    `
    : "";

  return `
    <div class="${detail ? "detail-poster" : "poster"}">
      ${image}
      ${fallbackMarkup(anime)}
    </div>
  `;
}

function cardMarkup(anime) {
  const saved = isSaved(anime.id);
  const score = anime.score
    ? anime.score.toFixed(1)
    : "—";

  return `
    <article class="anime-card" data-id="${anime.id}">
      <div class="poster">

        ${
          anime.image
            ? `
              <img
                src="${escapeHTML(anime.image)}"
                alt="${escapeHTML(anime.title)}"
                loading="lazy"
                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='flex'
                "
              >
            `
            : ""
        }

        ${fallbackMarkup(anime)}

        <div class="poster-overlay"></div>

        <div class="poster-top">
          <span class="tag">${escapeHTML(anime.type)}</span>

          <button
            class="heart-btn ${saved ? "saved" : ""}"
            data-action="save"
            data-id="${anime.id}"
            aria-label="${saved ? "Remove from watchlist" : "Add to watchlist"}"
          >${saved ? "♥" : "♡"}</button>
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
          <button
            class="mini-btn watch"
            data-action="details"
            data-id="${anime.id}"
          >Details</button>

          <button
            class="mini-btn"
            data-action="save"
            data-id="${anime.id}"
          >${saved ? "♥ Saved" : "♡ Save"}</button>
        </div>
      </div>
    </article>
  `;
}

/* =========================
   API REQUESTS
========================= */

async function requestAnime(url, signal) {
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error(
      "Can't connect to the anime catalogue. Check your internet connection. If it continues, the API may be unavailable or blocking browser requests."
    );
  }

  let json = {};

  try {
    json = await response.json();
  } catch {
    // The server returned something other than valid JSON.
  }

  if (!response.ok) {
    const detail =
      json.error ||
      json.message ||
      `HTTP ${response.status}`;

    if (response.status === 429) {
      throw new Error(
        "The anime catalogue is busy. Wait a little and try again."
      );
    }

    if (response.status === 400) {
      throw new Error(
        `The API rejected the request: ${detail}`
      );
    }

    if (response.status === 403) {
      throw new Error(
        "The anime API denied this request (403)."
      );
    }

    if (response.status >= 500) {
      throw new Error(
        "The anime API is having a server problem. Try again later."
      );
    }

    throw new Error(
      `Anime API error (${response.status}): ${detail}`
    );
  }

  if (!Array.isArray(json.data)) {
    throw new Error(
      "The API responded, but its data format was unexpected."
    );
  }

  return json.data;
}

/* =========================
   LOAD CATALOGUE
========================= */

async function loadAnime(reset = false) {
  if (!reset && (state.loading || !state.hasMore)) return;

  if (reset) {
    // Cancel an older request, such as an earlier search.
    if (activeRequest) activeRequest.abort();

    state.loading = false;
    state.page = 1;
    state.hasMore = true;
    state.anime = [];
    state.byId.clear();

    if ($("#animeGrid")) {
      $("#animeGrid").innerHTML = "";
    }

    $("#emptyState")?.classList.add("hidden");
  }

  const currentRequest = ++requestNumber;
  const controller = new AbortController();

  activeRequest = controller;
  state.loading = true;

  setStatus("Loading anime...");

  if ($("#loadMoreButton")) {
    $("#loadMoreButton").disabled = true;
    $("#loadMoreButton").classList.add("hidden");
  }

  try {
    const params = new URLSearchParams();

    params.set("page", String(state.page));
    params.set("limit", String(PAGE_SIZE));
    params.set("sfw", "");

    let url;

    if (state.query) {
      params.set("q", state.query);
      url = `${API}/anime?${params.toString()}`;
    } else {
      params.set("filter", "bypopularity");
      url = `${API}/top/anime?${params.toString()}`;
    }

    const items = await requestAnime(
      url,
      controller.signal
    );

    // Ignore results from an older request.
    if (currentRequest !== requestNumber) return;

    const results = items
      .map(normalise)
      .filter(anime => anime.id > 0);

    results.forEach(anime => {
      state.byId.set(anime.id, anime);
    });

    const existing = new Set(
      state.anime.map(anime => anime.id)
    );

    results.forEach(anime => {
      if (!existing.has(anime.id)) {
        state.anime.push(anime);
      }
    });

    state.hasMore = items.length >= PAGE_SIZE;
    state.page++;

    renderCatalogue();

    setStatus(
      state.anime.length
        ? `${state.anime.length} titles loaded`
        : "No anime found. Try another search."
    );

    $("#loadMoreButton")?.classList.toggle(
      "hidden",
      !state.hasMore
    );

  } catch (error) {
    if (error.name === "AbortError") return;
    if (currentRequest !== requestNumber) return;

    setStatus(error.message || "Couldn't load anime.");

    if (!state.anime.length) {
      $("#animeGrid").innerHTML = "";
      $("#emptyState")?.classList.remove("hidden");
    }

    console.error("Anime:P catalogue error:", error);

  } finally {
    if (currentRequest === requestNumber) {
      state.loading = false;
      activeRequest = null;

      if ($("#loadMoreButton")) {
        $("#loadMoreButton").disabled = false;
        $("#loadMoreButton").classList.toggle(
          "hidden",
          !state.hasMore
        );
      }
    }
  }
}

/* =========================
   CATALOGUE RENDERING
========================= */

function applyGenre(items) {
  if (state.genre === "all") return items;

  return items.filter(anime =>
    anime.genres.some(
      genre =>
        genre.toLowerCase() === state.genre.toLowerCase()
    )
  );
}

function renderCatalogue() {
  const grid = $("#animeGrid");
  if (!grid) return;

  const items = applyGenre(state.anime);

  grid.innerHTML = items.map(cardMarkup).join("");

  $("#emptyState")?.classList.toggle(
    "hidden",
    items.length !== 0
  );

  const title = $("#collectionTitle");

  if (title) {
    title.textContent = state.query
      ? "Search Results"
      : state.view === "browse"
        ? "Discover Anime"
        : "Popular Anime";
  }
}

function renderWatchlist() {
  const grid = $("#watchlistGrid");
  if (!grid) return;

  grid.innerHTML = state.watchlist
    .map(cardMarkup)
    .join("");

  $("#watchlistEmpty")?.classList.toggle(
    "hidden",
    state.watchlist.length > 0
  );

  if ($("#listCount")) {
    $("#listCount").textContent =
      String(state.watchlist.length);
  }
}

function renderHistory() {
  const grid = $("#historyGrid");
  if (!grid) return;

  grid.innerHTML = state.history
    .map(cardMarkup)
    .join("");

  $("#historyEmpty")?.classList.toggle(
    "hidden",
    state.history.length > 0
  );
}

function renderContinue() {
  const grid = $("#continueGrid");
  if (!grid) return;

  const items = state.history.slice(0, 12);

  grid.innerHTML = items.map(cardMarkup).join("");

  $("#continueSection")?.classList.toggle(
    "hidden",
    items.length === 0
  );
}

/* =========================
   NAVIGATION
========================= */

function changeView(view) {
  state.view = view;

  $("#hero")?.classList.toggle(
    "hidden",
    view !== "home"
  );

  $("#homeTrending")?.classList.toggle(
    "hidden",
    !["home", "browse"].includes(view)
  );

  $("#watchlistSection")?.classList.toggle(
    "hidden",
    view !== "watchlist"
  );

  $("#historySection")?.classList.toggle(
    "hidden",
    view !== "history"
  );

  $$(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "watchlist") renderWatchlist();
  if (view === "history") renderHistory();

  if (view === "browse" || view === "home") {
    renderCatalogue();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================
   WATCHLIST
========================= */

function toggleSave(id) {
  const anime = findStoredAnime(id);

  if (!anime) {
    toast("Anime details haven't loaded yet.");
    return;
  }

  if (isSaved(id)) {
    state.watchlist = state.watchlist.filter(
      item => Number(item.id) !== Number(id)
    );

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

  if (
    $("#detailDialog")?.open &&
    activeId === Number(id)
  ) {
    openDetails(id);
  }
}

/* =========================
   WATCH HISTORY
========================= */

function addToHistory(anime) {
  state.history = [
    anime,
    ...state.history.filter(
      item => Number(item.id) !== Number(anime.id)
    )
  ].slice(0, 40);

  writeStore("animePHistory", state.history);

  renderHistory();
  renderContinue();
}

/* =========================
   ANIME DETAILS
========================= */

function openDetails(id) {
  const anime = findStoredAnime(id);
  if (!anime) return;

  activeId = Number(id);

  addToHistory(anime);

  const score = anime.score
    ? anime.score.toFixed(1)
    : "Not rated";

  const tags = anime.genres
    .slice(0, 8)
    .map(genre =>
      `<span class="tag">${escapeHTML(genre)}</span>`
    )
    .join("");

  $("#detailContent").innerHTML = `
    <div class="detail-layout">

      ${posterMarkup(anime, true)}

      <div class="detail-copy">
        <span class="eyebrow">ANIME:P DISCOVERY</span>

        <h2>${escapeHTML(anime.title)}</h2>

        ${
          anime.japanese
            ? `<p>${escapeHTML(anime.japanese)}</p>`
            : ""
        }

        <div class="detail-rating">
          ★ ${score} ·
          ${escapeHTML(String(anime.year || "Year unknown"))}
        </div>

        <div class="detail-tags">
          ${tags}
          <span class="tag">${escapeHTML(anime.type)}</span>
        </div>

        <p>${escapeHTML(anime.synopsis)}</p>

        <div class="detail-actions">
          <button
            class="btn btn-primary"
            data-action="official"
            data-id="${anime.id}"
          >Find where to watch ↗</button>

          <button
            class="btn btn-secondary"
            data-action="save"
            data-id="${anime.id}"
          >${isSaved(id) ? "♥ Saved" : "♡ My List"}</button>

          ${
            anime.malURL
              ? `
                <a
                  class="btn btn-secondary"
                  href="${escapeHTML(anime.malURL)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >More info ↗</a>
              `
              : ""
          }
        </div>
      </div>
    </div>

    <h3 class="episode-title">Anime information</h3>

    <div class="episode-list">

      <div class="episode-item">
        <span class="episode-number">★</span>
        <div>
          <strong>Community rating</strong>
          <small>${score}</small>
        </div>
      </div>

      <div class="episode-item">
        <span class="episode-number">EP</span>
        <div>
          <strong>Episodes</strong>
          <small>${anime.episodes || "Not announced"}</small>
        </div>
      </div>

      <div class="episode-item">
        <span class="episode-number">▶</span>
        <div>
          <strong>Streaming</strong>
          <small>
            Availability depends on your region and provider.
          </small>
        </div>
        <button
          class="mini-btn"
          data-action="official"
          data-id="${anime.id}"
        >Find</button>
      </div>

    </div>

    <p class="section-description">
      Anime:P is an anime discovery catalogue and does not
      host video episodes.
    </p>
  `;

  $("#detailDialog").showModal();
}

/* =========================
   OFFICIAL WATCH SEARCH
========================= */

function officialSearch(id) {
  const anime = findStoredAnime(id);
  if (!anime) return;

  const query = encodeURIComponent(
    `${anime.title} official streaming watch`
  );

  window.open(
    `https://www.google.com/search?q=${query}`,
    "_blank",
    "noopener,noreferrer"
  );
}

/* =========================
   DIALOGS
========================= */

function closeDialog(id) {
  const dialog = document.getElementById(id);

  if (dialog?.open) dialog.close();
}

/* =========================
   EVENT LISTENERS
========================= */

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
        button.classList.toggle(
          "active",
          button === genreButton
        );
      });

      renderCatalogue();
      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (actionButton) {
      const id = Number(actionButton.dataset.id);
      const action = actionButton.dataset.action;

      if (action === "save") toggleSave(id);
      if (action === "details") openDetails(id);
      if (action === "official") officialSearch(id);

      return;
    }

    const card = event.target.closest(".anime-card");

    if (card) {
      openDetails(Number(card.dataset.id));
    }
  });

  $("#exploreButton")?.addEventListener("click", () => {
    changeView("browse");
  });

  $("#heroListButton")?.addEventListener("click", () => {
    changeView("watchlist");
  });

  $("#aboutButton")?.addEventListener("click", () => {
    $("#aboutDialog")?.showModal();
  });

  $("#loadMoreButton")?.addEventListener("click", () => {
    loadAnime();
  });

  $("#clearFilters")?.addEventListener("click", () => {
    state.query = "";
    state.genre = "all";

    if ($("#searchInput")) {
      $("#searchInput").value = "";
    }

    $$(".genre-chip").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.genre === "all"
      );
    });

    changeView("browse");
    loadAnime(true);
  });

  $("#clearHistoryButton")?.addEventListener("click", () => {
    state.history = [];

    writeStore("animePHistory", []);

    renderHistory();
    renderContinue();

    toast("History cleared.");
  });

  $("#searchInput")?.addEventListener("input", event => {
    clearTimeout(searchTimer);

    state.query = event.target.value.trim();

    changeView("browse");

    searchTimer = setTimeout(() => {
      loadAnime(true);
    }, state.query ? 450 : 200);
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA"].includes(
        document.activeElement.tagName
      )
    ) {
      event.preventDefault();
      $("#searchInput")?.focus();
    }
  });

  [
    "detailDialog",
    "aboutDialog",
    "playerDialog"
  ].forEach(id => {
    const dialog = document.getElementById(id);

    if (!dialog) return;

    dialog.addEventListener("click", event => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
}

/* =========================
   START APPLICATION
========================= */

function start() {
  if ($("#listCount")) {
    $("#listCount").textContent =
      String(state.watchlist.length);
  }

  renderContinue();
  renderWatchlist();
  renderHistory();

  setupEvents();
  loadAnime(true);
}

start();
