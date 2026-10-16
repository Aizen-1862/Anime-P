
/* =========================================================
   ANIME:P — COMPLETE FRONTEND + EPISODE VIEWING
   Catalogue: Tenrai API (Jikan-compatible)
   Storage: browser localStorage
   Viewing: external provider links; no video hosting
========================================================= */

const API_BASE = "https://api.tenrai.org/v1";
const PAGE_SIZE = 24;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let animeCatalog = [];
let searchResults = null;
let activeGenre = "All";
let currentView = "home";
let currentAnime = null;
let catalogPage = 1;
let searchPage = 1;
let hasMoreCatalog = true;
let hasMoreSearch = false;
let isLoadingMore = false;
let searchTimer = null;
let toastTimer = null;
let lastApiRequest = 0;
let detailRequestId = 0;

const GENRES = [
  "All", "Action", "Adventure", "Comedy", "Drama",
  "Fantasy", "Romance", "Sci-Fi", "Mystery", "Sports",
  "Horror", "Slice of Life", "Supernatural"
];

const GENRE_ALIASES = {
  "Sci-Fi": ["Sci-Fi", "Science Fiction"],
  "Slice of Life": ["Slice of Life"]
};

function readStorage(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Browser storage is unavailable.");
  }
}

function getWatchlist() {
  return readStorage("animep_watchlist", []);
}

function getHistory() {
  return readStorage("animep_history", []);
}

function normalizeAnime(item) {
  const images = item.images || {};
  const image =
    images.webp?.large_image_url ||
    images.jpg?.large_image_url ||
    images.webp?.image_url ||
    images.jpg?.image_url || "";

  return {
    id: Number(item.mal_id),
    title: item.title_english || item.title || "Untitled Anime",
    originalTitle: item.title || "",
    image,
    score: Number(item.score) || 0,
    year: item.year || item.aired?.prop?.from?.year || null,
    episodes: item.episodes ?? null,
    type: item.type || "Anime",
    status: item.status || "",
    synopsis: item.synopsis || "No synopsis is available for this title yet.",
    genres: (item.genres || []).map((g) => g.name),
    studios: (item.studios || []).map((s) => s.name),
    url: item.url || "",
    rating: item.rating || "",
    season: item.season || "",
    source: item.source || ""
  };
}

function mergeCatalog(items) {
  const existing = new Map(animeCatalog.map((a) => [a.id, a]));

  for (const item of items) {
    const anime = normalizeAnime(item);
    if (anime.id) {
      existing.set(anime.id, { ...existing.get(anime.id), ...anime });
    }
  }

  animeCatalog = [...existing.values()];
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function formatNumber(number) {
  return new Intl.NumberFormat().format(number);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function setStatus(message, visible = true) {
  const status = $("#statusMessage");
  if (!status) return;

  status.textContent = message;
  status.hidden = !visible;
}

async function fetchJSON(url) {
  const elapsed = Date.now() - lastApiRequest;
  const minimumGap = 400;

  if (elapsed < minimumGap) {
    await new Promise((resolve) =>
      setTimeout(resolve, minimumGap - elapsed)
    );
  }

  lastApiRequest = Date.now();

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "Could not connect to the anime database. Please try again."
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("The anime database is busy. Wait a moment and try again.");
    }

    throw new Error(`Anime database error (${response.status}). Try again later.`);
  }

  return response.json();
}

function filteredAnime(source = null) {
  let list = source || searchResults || animeCatalog;

  if (activeGenre !== "All") {
    const aliases = GENRE_ALIASES[activeGenre] || [activeGenre];

    list = list.filter((anime) =>
      anime.genres.some((genre) =>
        aliases.some((alias) =>
          genre.toLowerCase().includes(alias.toLowerCase())
        )
      )
    );
  }

  const sortMode = $("#sortSelect")?.value || "popular";
  list = [...list];

  if (sortMode === "score") {
    list.sort((a, b) => b.score - a.score);
  } else if (sortMode === "title") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }

  return list;
}

function renderGenres() {
  const bar = $("#genreBar");
  if (!bar) return;

  bar.innerHTML = GENRES.map((genre) => `
    <button class="genre-chip ${activeGenre === genre ? "active" : ""}"
      data-genre="${escapeHTML(genre)}" type="button">
      ${escapeHTML(genre)}
    </button>
  `).join("");

  $$("#genreBar [data-genre]").forEach((button) => {
    button.addEventListener("click", () => {
      activeGenre = button.dataset.genre || "All";
      renderCatalog();
    });
  });
}

function posterMarkup(anime) {
  const title = escapeHTML(anime.title);
  const image = escapeHTML(anime.image);
  const saved = getWatchlist().includes(anime.id);

  return `
    <div class="poster-wrap" data-open-anime="${anime.id}"
      tabindex="0" role="button" aria-label="View ${title}">
      ${image ? `
        <img class="poster-image" src="${image}" alt="${title} poster"
          loading="lazy" referrerpolicy="no-referrer"
          onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      ` : ""}
      <div class="poster-fallback" style="display:${image ? "none" : "grid"}">
        ${title}
      </div>
      <span class="score-badge">★ ${anime.score ? anime.score.toFixed(1) : "N/A"}</span>
      <button class="card-heart ${saved ? "saved" : ""}"
        type="button" data-toggle-watchlist="${anime.id}"
        aria-label="Toggle ${title} in watchlist">${saved ? "♥" : "♡"}</button>
      <button class="card-open" type="button"
        data-open-anime="${anime.id}" aria-label="Open ${title}">↗</button>
    </div>
  `;
}

function cardMarkup(anime, options = {}) {
  const year = anime.year || "Year unknown";
  const episodes = anime.episodes ? `${anime.episodes} eps` : "Episodes TBA";

  return `
    <article class="anime-card" data-card-id="${anime.id}">
      ${posterMarkup(anime)}
      <div class="card-info">
        <h3 class="card-title" data-open-anime="${anime.id}" tabindex="0">
          ${escapeHTML(anime.title)}
        </h3>
        <div class="card-meta">
          <span>${escapeHTML(String(year))}</span>
          <span class="dot">•</span>
          <span>${escapeHTML(anime.type)}</span>
        </div>
        <div class="card-meta">
          <span>${escapeHTML(episodes)}</span>
          ${anime.genres[0] ? `<span class="dot">•</span>
            <span>${escapeHTML(anime.genres[0])}</span>` : ""}
        </div>
        ${options.history ? `
          <div class="card-progress"><span></span></div>
          <button class="card-remove" data-remove-history="${anime.id}" type="button">
            ✕ Remove from history
          </button>` : ""}
      </div>
    </article>
  `;
}

function renderCards(containerSelector, list, emptySelector, options = {}) {
  const container = $(containerSelector);
  const empty = $(emptySelector);
  if (!container) return;

  container.innerHTML = list.map((anime) => cardMarkup(anime, options)).join("");

  if (empty) empty.hidden = list.length > 0;
}

function updateLoadMoreUI(displayedCount, totalCount) {
  const wrap = $("#loadMoreWrap");
  const button = $("#loadMoreButton");
  const status = $("#loadMoreStatus");
  if (!wrap || !button || !status) return;

  const hasMore = searchResults ? hasMoreSearch : hasMoreCatalog;
  wrap.hidden = !hasMore && totalCount > 0;

  if (isLoadingMore) {
    button.disabled = true;
    button.textContent = "Loading anime...";
    status.textContent = "Fetching more titles. One moment!";
    return;
  }

  button.disabled = !hasMore;
  button.innerHTML = hasMore
    ? 'Load More Anime <span>↓</span>'
    : "All available results loaded";

  status.textContent = `${formatNumber(totalCount)} anime currently available in this view.`;
}

function renderCatalog() {
  renderGenres();

  const matches = filteredAnime();
  renderCards("#animeGrid", matches, "#emptyState");

  if ($("#resultsCount")) {
    $("#resultsCount").textContent = `${formatNumber(matches.length)} anime shown`;
  }

  const heading = $("#catalogHeading");
  const description = $("#catalogDescription");

  if (heading) {
    heading.innerHTML = searchResults
      ? 'Search results <span class="heading-icon">⌕</span>'
      : currentView === "browse"
        ? 'Explore anime <span class="heading-icon">✦</span>'
        : 'Popular anime <span class="heading-icon">✦</span>';
  }

  if (description) {
    description.textContent = searchResults
      ? "Titles matching your search."
      : "Stories worth getting lost in.";
  }

  updateLoadMoreUI(matches.length, searchResults ? searchResults.length : animeCatalog.length);
}

function renderContinueWatching() {
  const history = getHistory();
  const section = $("#continueSection");
  if (!section) return;

  section.hidden = history.length === 0;

  const entries = history.slice(0, 12).map((entry) =>
    animeCatalog.find((a) => a.id === entry.id) || entry
  );

  renderCards("#continueGrid", entries, null, { history: true });
}

function renderWatchlist() {
  const entries = getWatchlist().map((id) =>
    animeCatalog.find((a) => a.id === id) || {
      id,
      title: `Anime #${id}`,
      image: "",
      score: 0,
      year: null,
      episodes: null,
      type: "Anime",
      genres: [],
      synopsis: "Open the details to explore this title."
    }
  );

  renderCards("#watchlistGrid", entries, "#watchlistEmpty");
}

function setView(view) {
  currentView = view;
  const home = view === "home";
  const browse = view === "browse";
  const watchlist = view === "watchlist";

  $("#heroSection").hidden = !home;
  $("#homeTrending").hidden = watchlist;
  $("#watchlistSection").hidden = !watchlist;

  $$(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (watchlist) {
    renderWatchlist();
  } else {
    renderCatalog();
    if (browse) {
      $("#homeTrending")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (home) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

function toggleWatchlist(id) {
  const saved = getWatchlist();
  const exists = saved.includes(id);

  writeStorage("animep_watchlist", exists
    ? saved.filter((savedID) => savedID !== id)
    : [...saved, id]);

  renderCatalog();
  renderWatchlist();
  updateDetailSaveButton();

  showToast(exists ? "Removed from your watchlist." : "Added to your watchlist ♡");
}

function addToHistory(anime) {
  if (!anime?.id) return;

  const history = getHistory().filter((item) => item.id !== anime.id);
  history.unshift({ ...anime, lastOpened: new Date().toISOString() });

  writeStorage("animep_history", history.slice(0, 30));
  renderContinueWatching();
}

function removeFromHistory(id) {
  writeStorage("animep_history", getHistory().filter((item) => item.id !== id));
  renderContinueWatching();
  showToast("Removed from Continue Watching.");
}

function clearHistory() {
  writeStorage("animep_history", []);
  renderContinueWatching();
  showToast("Continue Watching cleared.");
}

function findAnime(id) {
  return animeCatalog.find((a) => a.id === Number(id))
    || searchResults?.find((a) => a.id === Number(id))
    || getHistory().find((a) => a.id === Number(id))
    || null;
}

function updateDetailSaveButton() {
  const button = $("#detailSaveButton");
  if (!button || !currentAnime) return;

  button.textContent = getWatchlist().includes(currentAnime.id)
    ? "♥ Remove from watchlist"
    : "♡ Add to watchlist";
}

/* ---------------------------------------------------------
   VIEWING LINKS
   The episode buttons open provider search pages.
   They do not claim that a particular episode is available.
--------------------------------------------------------- */

function makeProviderSearches(anime, episodeNumber = null) {
  const episodeText = episodeNumber ? ` episode ${episodeNumber}` : "";
  const title = anime.title;

  return [
    {
      name: "YouTube — official sources",
      description: "Search official anime channels",
      url: "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(`${title}${episodeText} official Muse Asia Ani-One Asia`)
    },
    {
      name: "Crunchyroll",
      description: "Check licensed availability",
      url: "https://www.crunchyroll.com/search?q=" + encodeURIComponent(title)
    },
    {
      name: "Netflix",
      description: "Check the anime catalogue",
      url: "https://www.netflix.com/search?q=" + encodeURIComponent(title)
    }
  ];
}

function renderOfficialLinks(anime) {
  const links = $("#officialLinks");
  if (!links) return;

  const providers = [
    ...makeProviderSearches(anime),
    {
      name: "MyAnimeList",
      description: "Anime information",
      url: anime.url || `https://myanimelist.net/anime/${anime.id}`
    }
  ];

  links.innerHTML = providers.map((provider) => `
    <a class="official-link"
      href="${escapeHTML(provider.url)}"
      target="_blank" rel="noopener noreferrer">
      <span>↗</span>
      <span>
        ${escapeHTML(provider.name)}
        <small style="display:block;color:#8492b5;font-weight:500;margin-top:2px">
          ${escapeHTML(provider.description)}
        </small>
      </span>
    </a>
  `).join("");
}

function getEpisodeListContainer() {
  let container = $("#episodeList");

  if (!container) {
    container = document.createElement("div");
    container.id = "episodeList";
    container.className = "episode-list";

    const info = $("#episodeInfo");
    if (info) info.insertAdjacentElement("afterend", container);
  }

  return container;
}

function renderEpisodeList(anime, episodes, totalEpisodes) {
  const container = getEpisodeListContainer();
  if (!container) return;

  if (!episodes.length) {
    container.innerHTML = `
      <p class="fine-print">
        Episode names are not available from the catalogue right now.
        You can still search the providers above.
      </p>`;
    return;
  }

  const heading = document.createElement("h4");
  heading.textContent = "Choose an episode";
  heading.style.margin = "18px 0 10px";

  const note = document.createElement("p");
  note.className = "fine-print";
  note.textContent =
    `Showing ${episodes.length} listed episode${episodes.length === 1 ? "" : "s"}` +
    (totalEpisodes ? ` out of ${totalEpisodes}.` : ".") +
    " Play buttons open provider search results; availability varies.";

  const list = document.createElement("div");
  list.className = "episode-list-items";
  list.style.display = "grid";
  list.style.gap = "10px";

  list.innerHTML = episodes.map((episode) => {
    const number = Number(episode.mal_id) || 0;
    const title = episode.title || `Episode ${number || ""}`;
    const searches = makeProviderSearches(anime, number || null);

    return `
      <article class="episode-item"
        style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px;border:1px solid rgba(145,130,255,.22);border-radius:12px;background:rgba(20,24,48,.55)">
        <div style="min-width:130px;flex:1">
          <strong>${number ? `Episode ${number}` : "Episode"}</strong>
          <p style="margin:4px 0 0;color:#a9b4d5;font-size:.9rem">
            ${escapeHTML(title)}
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-primary"
            style="text-decoration:none"
            href="${escapeHTML(searches[0].url)}"
            target="_blank" rel="noopener noreferrer">
            ▶ Find Episode
          </a>
          <a class="btn btn-secondary"
            style="text-decoration:none"
            href="${escapeHTML(searches[1].url)}"
            target="_blank" rel="noopener noreferrer">
            Crunchyroll
          </a>
        </div>
      </article>`;
  }).join("");

  container.replaceChildren(heading, note, list);
}

async function loadEpisodeInfo(anime, requestId) {
  const info = $("#episodeInfo");
  const container = getEpisodeListContainer();

  if (info) {
    info.textContent = anime.episodes
      ? `This series is listed with ${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}.`
      : "Loading episode information...";
  }

  if (container) container.innerHTML = "";

  try {
    const result = await fetchJSON(
      `${API_BASE}/anime/${anime.id}/episodes?page=1`
    );

    if (requestId !== detailRequestId || currentAnime?.id !== anime.id) return;

    const episodes = result.data || [];
    const total = result.pagination?.items?.total || anime.episodes || null;

    if (info) {
      info.textContent = total
        ? `${total} episode${total === 1 ? "" : "s"} listed in the catalogue.`
        : "Episode information from the catalogue.";
    }

    renderEpisodeList(anime, episodes, total);
  } catch {
    if (requestId !== detailRequestId) return;

    if (info) {
      info.textContent = anime.episodes
        ? `${anime.episodes} episodes listed. Detailed episode data is temporarily unavailable.`
        : "Episode data is temporarily unavailable.";
    }

    if (container) {
      container.innerHTML = `
        <p class="fine-print">
          Couldn't load the episode list. Use the provider links above to search
          for this title, or try reopening its details later.
        </p>`;
    }
  }
}

function openDetails(id) {
  const anime = findAnime(id);

  if (!anime) {
    showToast("Anime details are not available yet.");
    return;
  }

  currentAnime = anime;
  const requestId = ++detailRequestId;

  addToHistory(anime);

  $("#detailTitle").textContent = anime.title;
  $("#detailType").textContent = anime.type.toUpperCase();

  const poster = $("#detailPoster");
  poster.alt = `${anime.title} poster`;

  if (anime.image) {
    poster.src = anime.image;
    poster.style.visibility = "visible";
    poster.onerror = () => poster.style.visibility = "hidden";
  } else {
    poster.removeAttribute("src");
    poster.style.visibility = "hidden";
  }

  const banner = $("#detailBanner");
  banner.style.backgroundImage = anime.image
    ? `linear-gradient(90deg, rgba(10,15,31,.65), rgba(10,15,31,.1)), url("${anime.image.replace(/["\\]/g, "")}")`
    : "";

  $("#detailStats").innerHTML = [
    `★ ${anime.score ? anime.score.toFixed(2) : "Not rated"}`,
    anime.year || "Year unknown",
    anime.type,
    anime.episodes ? `${anime.episodes} episodes` : "Episode count unknown"
  ].map((stat) => `<span>${escapeHTML(stat)}</span>`).join("");

  $("#detailGenres").innerHTML = anime.genres.length
    ? anime.genres.map((genre) => `<span>${escapeHTML(genre)}</span>`).join("")
    : "<span>Genres unavailable</span>";

  $("#detailSynopsis").textContent = anime.synopsis;
  $("#detailModal").hidden = false;
  document.body.style.overflow = "hidden";

  updateDetailSaveButton();
  renderOfficialLinks(anime);
  loadEpisodeInfo(anime, requestId);
}

function closeDetails() {
  detailRequestId++;
  $("#detailModal").hidden = true;
  document.body.style.overflow = "";
  currentAnime = null;
}

async function loadInitialCatalog() {
  setStatus("Loading popular anime from the database...");

  try {
    const result = await fetchJSON(
      `${API_BASE}/top/anime?filter=bypopularity&limit=${PAGE_SIZE}&page=1&sfw=true`
    );

    const items = result.data || [];
    mergeCatalog(items);

    catalogPage = 1;
    hasMoreCatalog = Boolean(result.pagination?.has_next_page);

    setStatus("", false);
    renderCatalog();
    renderContinueWatching();
    renderWatchlist();

    if (!items.length) {
      setStatus("The anime database returned no titles. Try again shortly.");
    }
  } catch (error) {
    setStatus(`${error.message} Refresh the page or try again shortly.`);
    if ($("#loadMoreStatus")) {
      $("#loadMoreStatus").textContent = "The anime catalogue could not be reached.";
    }
  }
}

async function loadMoreAnime() {
  if (isLoadingMore) return;

  const searching = Boolean(searchResults);
  if (searching && !hasMoreSearch) return;
  if (!searching && !hasMoreCatalog) return;

  isLoadingMore = true;
  updateLoadMoreUI(0, animeCatalog.length);

  try {
    if (searching) {
      const nextPage = searchPage + 1;
      const query = $("#searchInput").value.trim();

      const result = await fetchJSON(
        `${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&page=${nextPage}&sfw=true`
      );

      if ($("#searchInput").value.trim() !== query) return;

      const items = (result.data || []).map(normalizeAnime);
      const combined = new Map((searchResults || []).map((a) => [a.id, a]));
      items.forEach((a) => combined.set(a.id, a));

      searchResults = [...combined.values()];
      searchPage = nextPage;
      hasMoreSearch = Boolean(result.pagination?.has_next_page);
      mergeCatalog(result.data || []);
    } else {
      const nextPage = catalogPage + 1;

      const result = await fetchJSON(
        `${API_BASE}/top/anime?filter=bypopularity&limit=${PAGE_SIZE}&page=${nextPage}&sfw=true`
      );

      const items = result.data || [];

      if (!items.length) {
        hasMoreCatalog = false;
      } else {
        mergeCatalog(items);
        catalogPage = nextPage;
        hasMoreCatalog = Boolean(result.pagination?.has_next_page);
      }
    }

    setStatus("", false);
    renderCatalog();
    renderContinueWatching();
    renderWatchlist();
  } catch (error) {
    showToast(error.message);
  } finally {
    isLoadingMore = false;
    renderCatalog();
  }
}

async function performSearch(query) {
  const cleanQuery = query.trim();
  clearTimeout(searchTimer);

  if (!cleanQuery) {
    searchResults = null;
    searchPage = 1;
    hasMoreSearch = false;
    activeGenre = "All";
    renderCatalog();
    return;
  }

  setStatus(`Searching for "${cleanQuery}"...`);
  if ($("#loadMoreButton")) $("#loadMoreButton").disabled = true;

  try {
    const result = await fetchJSON(
      `${API_BASE}/anime?q=${encodeURIComponent(cleanQuery)}&limit=${PAGE_SIZE}&page=1&sfw=true`
    );

    if ($("#searchInput").value.trim() !== cleanQuery) return;

    searchResults = (result.data || []).map(normalizeAnime);
    searchPage = 1;
    hasMoreSearch = Boolean(result.pagination?.has_next_page);
    activeGenre = "All";

    mergeCatalog(result.data || []);
    setStatus("", false);
    renderCatalog();

    if (!searchResults.length) showToast("No matching anime found.");
  } catch (error) {
    setStatus(error.message);
  }
}

function surpriseMe() {
  const candidates = filteredAnime();

  if (!candidates.length) {
    showToast("Load some anime first, then try again.");
    return;
  }

  openDetails(candidates[Math.floor(Math.random() * candidates.length)].id);
}

function resetFilters() {
  activeGenre = "All";
  $("#searchInput").value = "";
  searchResults = null;
  searchPage = 1;
  hasMoreSearch = false;
  renderCatalog();
}

function setupEvents() {
  $$(".nav-link").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view || "home"));
  });

  $("#homeBrand")?.addEventListener("click", (event) => {
    event.preventDefault();
    setView("home");
  });

  $("#exploreButton")?.addEventListener("click", () => setView("browse"));
  $("#browseFromWatchlist")?.addEventListener("click", () => setView("browse"));

  $("#searchInput")?.addEventListener("input", (event) => {
    const query = event.target.value;
    clearTimeout(searchTimer);

    if (!query.trim()) {
      searchResults = null;
      searchPage = 1;
      hasMoreSearch = false;
      activeGenre = "All";
      renderCatalog();
      return;
    }

    searchTimer = setTimeout(() => performSearch(query), 650);
  });

  $("#searchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearTimeout(searchTimer);
      performSearch(event.target.value);
    }
  });

  $("#loadMoreButton")?.addEventListener("click", loadMoreAnime);
  $("#sortSelect")?.addEventListener("change", renderCatalog);
  $("#randomButton")?.addEventListener("click", surpriseMe);
  $("#resetFiltersButton")?.addEventListener("click", resetFilters);
  $("#clearHistoryButton")?.addEventListener("click", clearHistory);

  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeDetails);
  });

  $("#detailModal")?.addEventListener("click", (event) => {
    if (event.target === $("#detailModal")) closeDetails();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#detailModal") && !$("#detailModal").hidden) {
      closeDetails();
    }

    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      $("#searchInput")?.focus();
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target.matches("[data-open-anime]")
    ) {
      event.preventDefault();
      openDetails(Number(event.target.dataset.openAnime));
    }
  });

  document.addEventListener("click", (event) => {
    const watchlistButton = event.target.closest("[data-toggle-watchlist]");

    if (watchlistButton) {
      event.stopPropagation();
      toggleWatchlist(Number(watchlistButton.dataset.toggleWatchlist));
      return;
    }

    const removeButton = event.target.closest("[data-remove-history]");

    if (removeButton) {
      event.stopPropagation();
      removeFromHistory(Number(removeButton.dataset.removeHistory));
      return;
    }

    const openButton = event.target.closest("[data-open-anime]");

    if (openButton) openDetails(Number(openButton.dataset.openAnime));
  });

  $("#watchNowButton")?.addEventListener("click", () => {
    $("#officialLinks")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("#detailSaveButton")?.addEventListener("click", () => {
    if (currentAnime) toggleWatchlist(currentAnime.id);
  });
}

async function initAnimeP() {
  setupEvents();
  renderGenres();
  renderWatchlist();
  renderContinueWatching();
  await loadInitialCatalog();
}

document.addEventListener("DOMContentLoaded", initAnimeP);
