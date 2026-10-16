/* =========================================================
   ANIME:P — COMPLETE FRONTEND
   Anime catalogue: Jikan API
   Storage: browser localStorage
   Streaming: official provider links only
========================================================= */

const API_BASE = "https://api.jikan.moe/v4";
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

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Mystery",
  "Sports",
  "Horror",
  "Slice of Life",
  "Supernatural"
];

const GENRE_ALIASES = {
  "Sci-Fi": ["Sci-Fi", "Science Fiction"],
  "Slice of Life": ["Slice of Life"]
};

const OFFICIAL_PROVIDERS = [
  {
    name: "Crunchyroll",
    description: "Check official availability",
    url: "https://www.crunchyroll.com/"
  },
  {
    name: "Netflix",
    description: "Browse anime",
    url: "https://www.netflix.com/browse/genre/7424"
  },
  {
    name: "Muse Asia",
    description: "Official anime channel",
    url: "https://www.youtube.com/@MuseAsia"
  },
  {
    name: "Ani-One Asia",
    description: "Official anime channel",
    url: "https://www.youtube.com/@AniOneAsia"
  }
];

function readStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
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
    images.jpg?.image_url ||
    "";

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
    genres: (item.genres || []).map((genre) => genre.name),
    studios: (item.studios || []).map((studio) => studio.name),
    url: item.url || "",
    rating: item.rating || "",
    season: item.season || "",
    source: item.source || ""
  };
}

function mergeCatalog(items) {
  const existing = new Map(animeCatalog.map((anime) => [anime.id, anime]));

  for (const item of items) {
    const anime = normalizeAnime(item);

    if (anime.id) {
      existing.set(anime.id, {
        ...existing.get(anime.id),
        ...anime
      });
    }
  }

  animeCatalog = [...existing.values()];
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
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
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function setStatus(message, visible = true) {
  const status = $("#statusMessage");
  if (!status) return;

  status.textContent = message;
  status.hidden = !visible;
}

async function fetchJSON(url) {
  // Avoid sending requests too quickly to the public API.
  const elapsed = Date.now() - lastApiRequest;
  const minimumGap = 400;

  if (elapsed < minimumGap) {
    await new Promise((resolve) =>
      setTimeout(resolve, minimumGap - elapsed)
    );
  }

  lastApiRequest = Date.now();

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("The anime database is busy. Wait a moment and try again.");
    }

    throw new Error("Could not load anime right now. Please try again.");
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
    list.sort((a, b) => {
      const scoreDifference = b.score - a.score;
      if (scoreDifference !== 0) return scoreDifference;
      return a.title.localeCompare(b.title);
    });
  }

  return list;
}

function getGenreButtons() {
  return GENRES.map((genre) => `
    <button
      class="genre-chip ${activeGenre === genre ? "active" : ""}"
      data-genre="${escapeHTML(genre)}"
      type="button"
    >${escapeHTML(genre)}</button>
  `).join("");
}

function renderGenres() {
  const bar = $("#genreBar");
  if (!bar) return;

  bar.innerHTML = getGenreButtons();

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

  return `
    <div class="poster-wrap" data-open-anime="${anime.id}" tabindex="0" role="button" aria-label="View ${title}">
      ${image ? `
        <img
          class="poster-image"
          src="${image}"
          alt="${title} poster"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
        >
      ` : ""}

      <div class="poster-fallback" style="display:${image ? "none" : "grid"}">
        ${title}
      </div>

      <span class="score-badge">★ ${anime.score ? anime.score.toFixed(1) : "N/A"}</span>

      <button
        class="card-heart ${getWatchlist().includes(anime.id) ? "saved" : ""}"
        type="button"
        data-toggle-watchlist="${anime.id}"
        aria-label="Toggle ${title} in watchlist"
        title="Add or remove from watchlist"
      >${getWatchlist().includes(anime.id) ? "♥" : "♡"}</button>

      <button
        class="card-open"
        type="button"
        data-open-anime="${anime.id}"
        aria-label="Open ${title}"
      >↗</button>
    </div>
  `;
}

function cardMarkup(anime, options = {}) {
  const isHistory = options.history === true;
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
          ${anime.genres[0] ? `
            <span class="dot">•</span>
            <span>${escapeHTML(anime.genres[0])}</span>
          ` : ""}
        </div>

        ${isHistory ? `
          <div class="card-progress"><span></span></div>
          <button class="card-remove" data-remove-history="${anime.id}" type="button">
            ✕ Remove from history
          </button>
        ` : ""}
      </div>
    </article>
  `;
}

function renderCards(containerSelector, list, emptySelector, options = {}) {
  const container = $(containerSelector);
  const empty = $(emptySelector);

  if (!container) return;

  if (!list.length) {
    container.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  container.innerHTML = list
    .map((anime) => cardMarkup(anime, options))
    .join("");
}

function updateLoadMoreUI(displayedCount, totalCount) {
  const wrap = $("#loadMoreWrap");
  const button = $("#loadMoreButton");
  const status = $("#loadMoreStatus");

  if (!wrap || !button || !status) return;

  const isSearching = Boolean(searchResults);

  const hasMore = isSearching ? hasMoreSearch : hasMoreCatalog;

  // With search results, the API has its own pagination.
  // With the popular catalogue, the API has its own pagination too.
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

  const allMatches = filteredAnime();

  renderCards("#animeGrid", allMatches, "#emptyState");

  const resultsCount = $("#resultsCount");
  if (resultsCount) {
    resultsCount.textContent = `${formatNumber(allMatches.length)} anime shown`;
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

  const total = searchResults
    ? searchResults.length
    : animeCatalog.length;

  updateLoadMoreUI(allMatches.length, total);
}

function renderContinueWatching() {
  const history = getHistory();
  const section = $("#continueSection");

  if (!section) return;

  section.hidden = history.length === 0;

  const historyAnime = history
    .map((entry) => {
      const found = animeCatalog.find((anime) => anime.id === entry.id);
      return found || entry;
    })
    .slice(0, 12);

  renderCards(
    "#continueGrid",
    historyAnime,
    null,
    { history: true }
  );
}

function renderWatchlist() {
  const savedIDs = getWatchlist();

  const savedAnime = savedIDs.map((id) => {
    const found = animeCatalog.find((anime) => anime.id === id);

    if (found) return found;

    return {
      id,
      title: `Anime #${id}`,
      image: "",
      score: 0,
      year: null,
      episodes: null,
      type: "Anime",
      genres: [],
      synopsis: "Open the details to explore this title."
    };
  });

  renderCards("#watchlistGrid", savedAnime, "#watchlistEmpty");
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

  const updated = exists
    ? saved.filter((savedID) => savedID !== id)
    : [...saved, id];

  writeStorage("animep_watchlist", updated);

  renderCatalog();
  renderWatchlist();

  if (currentAnime?.id === id) {
    updateDetailSaveButton();
  }

  showToast(exists ? "Removed from your watchlist." : "Added to your watchlist ♡");
}

function addToHistory(anime) {
  if (!anime?.id) return;

  const history = getHistory().filter((item) => item.id !== anime.id);

  history.unshift({
    ...anime,
    lastOpened: new Date().toISOString()
  });

  writeStorage("animep_history", history.slice(0, 30));
  renderContinueWatching();
}

function removeFromHistory(id) {
  const history = getHistory().filter((item) => item.id !== id);

  writeStorage("animep_history", history);
  renderContinueWatching();

  showToast("Removed from Continue Watching.");
}

function clearHistory() {
  writeStorage("animep_history", []);
  renderContinueWatching();
  showToast("Continue Watching cleared.");
}

function findAnime(id) {
  return animeCatalog.find((anime) => anime.id === Number(id))
    || searchResults?.find((anime) => anime.id === Number(id))
    || getHistory().find((anime) => anime.id === Number(id))
    || null;
}

function updateDetailSaveButton() {
  const button = $("#detailSaveButton");
  if (!button || !currentAnime) return;

  const saved = getWatchlist().includes(currentAnime.id);

  button.textContent = saved
    ? "♥ Remove from watchlist"
    : "♡ Add to watchlist";
}

function renderOfficialLinks(anime) {
  const links = $("#officialLinks");
  if (!links) return;

  const title = anime.title;

  const officialSearches = [
    {
      name: "Crunchyroll",
      description: "Check this title",
      url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`
    },
    {
      name: "Netflix",
      description: "Search Netflix",
      url: `https://www.netflix.com/search?q=${encodeURIComponent(title)}`
    },
    {
      name: "YouTube",
      description: "Look for official uploads",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official anime")}`
    },
    {
      name: "MyAnimeList",
      description: "Anime information",
      url: anime.url || `https://myanimelist.net/anime/${anime.id}`
    }
  ];

  links.innerHTML = officialSearches.map((provider) => `
    <a
      class="official-link"
      href="${escapeHTML(provider.url)}"
      target="_blank"
      rel="noopener noreferrer"
    >
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

async function loadEpisodeInfo(anime) {
  const info = $("#episodeInfo");
  if (!info) return;

  info.textContent = anime.episodes
    ? `This series is listed with ${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}. Episode listings may vary by season and release.`
    : "The total episode count is not currently listed.";

  // Episode metadata is informational only; it is not a video stream.
  try {
    const result = await fetchJSON(
      `${API_BASE}/anime/${anime.id}/episodes?page=1`
    );

    if (currentAnime?.id !== anime.id) return;

    const episodes = result.data || [];

    if (episodes.length) {
      const names = episodes
        .slice(0, 5)
        .map((episode) => {
          const number = episode.mal_id ?? "?";
          const title = episode.title || "Episode title unavailable";
          return `Episode ${number}: ${title}`;
        });

      info.textContent =
        `${anime.episodes || result.pagination?.items?.total || "Listed"} total episode count where available. First listed episodes: ${names.join(" • ")}. Check official providers for playback.`;
    }
  } catch {
    // Keep the basic episode information if the API request fails.
  }
}

function openDetails(id) {
  const anime = findAnime(id);

  if (!anime) {
    showToast("Anime details are not available yet.");
    return;
  }

  currentAnime = anime;
  addToHistory(anime);

  $("#detailTitle").textContent = anime.title;
  $("#detailType").textContent = anime.type.toUpperCase();

  const poster = $("#detailPoster");
  poster.alt = `${anime.title} poster`;

  if (anime.image) {
    poster.src = anime.image;
    poster.style.visibility = "visible";
    poster.onerror = () => {
      poster.style.visibility = "hidden";
    };
  } else {
    poster.removeAttribute("src");
    poster.style.visibility = "hidden";
  }

  const banner = $("#detailBanner");

  banner.style.backgroundImage = anime.image
    ? `linear-gradient(90deg, rgba(10,15,31,.65), rgba(10,15,31,.1)), url("${anime.image.replace(/["\\]/g, "")}")`
    : "";

  const stats = [
    `★ ${anime.score ? anime.score.toFixed(2) : "Not rated"}`,
    anime.year || "Year unknown",
    anime.type,
    anime.episodes ? `${anime.episodes} episodes` : "Episode count unknown"
  ];

  $("#detailStats").innerHTML = stats
    .map((stat) => `<span>${escapeHTML(stat)}</span>`)
    .join("");

  $("#detailGenres").innerHTML = anime.genres.length
    ? anime.genres.map((genre) =>
        `<span>${escapeHTML(genre)}</span>`
      ).join("")
    : "<span>Genres unavailable</span>";

  $("#detailSynopsis").textContent = anime.synopsis;
  $("#detailModal").hidden = false;
  document.body.style.overflow = "hidden";

  updateDetailSaveButton();
  renderOfficialLinks(anime);
  loadEpisodeInfo(anime);
}

function closeDetails() {
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
    setStatus(
      `${error.message} Check your internet connection, then try loading again.`
    );

    $("#loadMoreStatus").textContent =
      "The anime catalogue could not be reached.";
  }
}

async function loadMoreAnime() {
  if (isLoadingMore) return;

  const isSearching = Boolean(searchResults);

  if (isSearching && !hasMoreSearch) return;
  if (!isSearching && !hasMoreCatalog) return;

  isLoadingMore = true;
  updateLoadMoreUI(0, animeCatalog.length);

  try {
    if (isSearching) {
      const nextPage = searchPage + 1;
      const query = $("#searchInput").value.trim();

      const result = await fetchJSON(
        `${API_BASE}/anime?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&page=${nextPage}&sfw=true`
      );

      const items = (result.data || []).map(normalizeAnime);

      const combined = new Map(
        (searchResults || []).map((anime) => [anime.id, anime])
      );

      items.forEach((anime) => combined.set(anime.id, anime));

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
  $("#loadMoreButton").disabled = true;

  try {
    const result = await fetchJSON(
      `${API_BASE}/anime?q=${encodeURIComponent(cleanQuery)}&limit=${PAGE_SIZE}&page=1&sfw=true`
    );

    // Ignore the response if the user has already changed the search.
    if ($("#searchInput").value.trim() !== cleanQuery) return;

    searchResults = (result.data || []).map(normalizeAnime);
    searchPage = 1;
    hasMoreSearch = Boolean(result.pagination?.has_next_page);
    activeGenre = "All";

    mergeCatalog(result.data || []);

    setStatus("", false);
    renderCatalog();

    if (!searchResults.length) {
      showToast("No matching anime found.");
    }
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

  const randomIndex = Math.floor(Math.random() * candidates.length);
  openDetails(candidates[randomIndex].id);
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
  // Navigation
  $$(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view || "home");
    });
  });

  $("#homeBrand")?.addEventListener("click", (event) => {
    event.preventDefault();
    setView("home");
  });

  $("#exploreButton")?.addEventListener("click", () => {
    setView("browse");
  });

  $("#browseFromWatchlist")?.addEventListener("click", () => {
    setView("browse");
  });

  // Search
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

    searchTimer = setTimeout(() => {
      performSearch(query);
    }, 650);
  });

  $("#searchInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearTimeout(searchTimer);
      performSearch(event.target.value);
    }
  });

  // Load more
  $("#loadMoreButton")?.addEventListener("click", loadMoreAnime);

  // Sort
  $("#sortSelect")?.addEventListener("change", renderCatalog);

  // Surprise button
  $("#randomButton")?.addEventListener("click", surpriseMe);

  // Reset filters
  $("#resetFiltersButton")?.addEventListener("click", resetFilters);

  // History
  $("#clearHistoryButton")?.addEventListener("click", clearHistory);

  // Details modal
  $$("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeDetails);
  });

  $("#detailModal")?.addEventListener("click", (event) => {
    if (event.target === $("#detailModal")) {
      closeDetails();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#detailModal").hidden) {
      closeDetails();
    }

    // Press / to focus search, unless already typing.
    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      $("#searchInput")?.focus();
    }
  });

  // Watchlist buttons, anime cards, and remove-history buttons.
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

    if (openButton) {
      openDetails(Number(openButton.dataset.openAnime));
    }
  });

  // Keyboard support for clickable anime titles and posters.
  document.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target.matches("[data-open-anime]")
    ) {
      event.preventDefault();
      openDetails(Number(event.target.dataset.openAnime));
    }
  });

  // The button opens the official viewing options; it does not fake playback.
  $("#watchNowButton")?.addEventListener("click", () => {
    $("#officialLinks")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  $("#detailSaveButton")?.addEventListener("click", () => {
    if (currentAnime) {
      toggleWatchlist(currentAnime.id);
    }
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
