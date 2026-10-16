/* =========================================================
   Anime:P v2 — discovery + authorized playback handoff
   GitHub Pages compatible. No backend or API key required.

   IMPORTANT:
   - Metadata comes from the public Jikan API (MyAnimeList data).
   - Anime:P does not host or scrape copyrighted episodes.
   - Add a video only after verifying the uploader/provider is authorized
     and the video is permitted to be embedded.
   - Licensed services are offered as official search/availability links.
   ========================================================= */

const STORAGE = {
  watchlist: "animep_watchlist_v1",
  history: "animep_history_v1"
};
const JIKAN = "https://api.jikan.moe/v4";
const FEATURED_MAL_ID = 16498; // Attack on Titan, Season 1
const genres = ["All", "Action", "Adventure", "Fantasy", "Drama", "Comedy", "Sci-Fi", "Romance", "Mystery", "Sports", "Slice of Life"];

/* Add only verified authorized sources here.
   YouTube example:
   "mal-16498": { "1": [{ type: "youtube", videoId: "VIDEO_ID_HERE", title: "Official Episode 1", authorized: true, externalUrl: "https://www.youtube.com/watch?v=VIDEO_ID_HERE" }] }

   Licensed-provider embed example (ONLY if that provider explicitly permits embedding):
   { type: "licensed-embed", embedUrl: "https://provider.example/embed/VIDEO", title: "Licensed player", authorized: true, externalUrl: "https://provider.example/title/..." }

   Never paste pirated stream URLs. If no authorized embed is configured, the app
   offers official platform search links instead of pretending an episode can play.
*/
const AUTHORIZED_SOURCES = {};

const providerSearches = [
  { name: "Muse India · YouTube", kind: "free", url: title => `https://www.youtube.com/@MuseIndia/search?query=${encodeURIComponent(title)}` },
  { name: "Ani-One Asia · YouTube", kind: "free", url: title => `https://www.youtube.com/@AniOneAsia/search?query=${encodeURIComponent(title)}` },
  { name: "Crunchyroll · Check availability", kind: "licensed", url: title => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}` },
  { name: "Netflix · Check availability", kind: "licensed", url: title => `https://www.netflix.com/search?q=${encodeURIComponent(title)}` },
  { name: "Prime Video · Check availability", kind: "licensed", url: title => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}` }
];

const fallbackCatalog = [
  { mal_id: 16498, title: "Attack on Titan", title_english: "Attack on Titan", year: 2013, score: 8.54, type: "Action", genres: ["Action", "Drama", "Fantasy"], status: "Finished Airing", synopsis: "Humanity lives behind enormous walls to protect itself from the Titans. When the walls are breached, a young survivor joins the fight to reclaim the world.", episodes: 25 },
  { mal_id: 5114, title: "Fullmetal Alchemist: Brotherhood", title_english: "Fullmetal Alchemist: Brotherhood", year: 2009, score: 9.1, type: "Adventure", genres: ["Action", "Adventure", "Fantasy"], status: "Finished Airing", synopsis: "Two brothers search for the Philosopher's Stone after a forbidden alchemical experiment changes their lives.", episodes: 64 },
  { mal_id: 40748, title: "Jujutsu Kaisen", title_english: "Jujutsu Kaisen", year: 2020, score: 8.5, type: "Action", genres: ["Action", "Fantasy"], status: "Finished Airing", synopsis: "A student enters the dangerous world of curses after an extraordinary encounter changes his fate.", episodes: 24 },
  { mal_id: 38000, title: "Demon Slayer: Kimetsu no Yaiba", title_english: "Demon Slayer", year: 2019, score: 8.4, type: "Action", genres: ["Action", "Fantasy"], status: "Finished Airing", synopsis: "A determined young swordsman searches for a way to save his sister and confront the demons that changed his family.", episodes: 26 },
  { mal_id: 21, title: "One Piece", title_english: "One Piece", year: 1999, score: 8.7, type: "Adventure", genres: ["Action", "Adventure", "Fantasy"], status: "Currently Airing", synopsis: "A spirited pirate crew sails toward the world's greatest treasure and a dream of freedom.", episodes: 1100 },
  { mal_id: 11061, title: "Hunter x Hunter (2011)", title_english: "Hunter x Hunter", year: 2011, score: 9.0, type: "Adventure", genres: ["Action", "Adventure", "Fantasy"], status: "Finished Airing", synopsis: "A young boy sets out to become a Hunter and find the father he barely knows.", episodes: 148 },
  { mal_id: 51009, title: "Chainsaw Man", title_english: "Chainsaw Man", year: 2022, score: 8.4, type: "Action", genres: ["Action", "Fantasy"], status: "Finished Airing", synopsis: "A debt-ridden young man becomes entangled with devils and the people who hunt them.", episodes: 12 },
  { mal_id: 9253, title: "Steins;Gate", title_english: "Steins;Gate", year: 2011, score: 9.0, type: "Sci-Fi", genres: ["Drama", "Sci-Fi", "Thriller"], status: "Finished Airing", synopsis: "A group of friends discovers a strange way to send messages into the past, with consequences they could not predict.", episodes: 24 }
].map(item => mapAnime(item));

let animeCatalog = [...fallbackCatalog];
let activeGenre = "All";
let currentView = "home";
let toastTimer = null;
let searchTimer = null;
let searchRequest = 0;
let catalogLoading = false;
let featuredAnimeId = `mal-${FEATURED_MAL_ID}`;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function mapAnime(item) {
  const malId = Number(item.mal_id || item.malId || 0);
  const genreNames = Array.isArray(item.genres) ? item.genres.map(g => typeof g === "string" ? g : g.name).filter(Boolean) : [];
  const title = item.title_english || item.title || "Untitled anime";
  const year = item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : "—");
  const episodeCount = Number(item.episodes) || 1;
  const poster = item.images?.jpg?.large_image_url || item.images?.webp?.large_image_url || item.poster || "";
  return {
    id: `mal-${malId || slugify(title)}`,
    malId,
    title,
    originalTitle: item.title || title,
    year,
    rating: typeof item.score === "number" ? item.score.toFixed(1) : (item.rating || "—"),
    type: genreNames[0] || item.type || "Anime",
    genres: genreNames.length ? genreNames : (item.genreList || [item.type || "Anime"]),
    status: item.status || "Availability varies",
    language: ["Japanese audio", "Subtitles/dubs vary by provider"],
    description: item.synopsis || item.description || "Synopsis is not available from the metadata source yet.",
    poster,
    featured: malId === FEATURED_MAL_ID,
    episodeCount,
    episodes: Array.from({ length: Math.min(episodeCount, 24) }, (_, index) => ({
      number: index + 1,
      title: `Episode ${index + 1}`,
      duration: "Varies by episode",
      languages: ["Check provider listing"]
    }))
  };
}
function slugify(text) { return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anime"; }
function readStorage(key, fallback = []) {
  try { const parsed = JSON.parse(localStorage.getItem(key)); return Array.isArray(parsed) ? parsed : fallback; }
  catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { showToast("Browser storage is unavailable in this session."); }
}
function getWatchlist() { return readStorage(STORAGE.watchlist); }
function getHistory() { return readStorage(STORAGE.history); }
function getAnime(id) { return animeCatalog.find(item => item.id === id); }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function posterMarkup(anime, extraClass = "") {
  const safeTitle = escapeHTML(anime.title);
  if (anime.poster) return `<img class="${extraClass}" src="${escapeHTML(anime.poster)}" alt="${safeTitle} poster" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('hidden')"><div class="poster-fallback hidden"><span class="fallback-symbol">${escapeHTML(anime.title.split(/\s+/).slice(0, 2).map(word => word[0]).join(""))}</span><strong>${safeTitle}</strong><small>ANIME:P</small></div>`;
  return `<div class="poster-fallback ${extraClass}"><span class="fallback-symbol">${escapeHTML(anime.title.split(/\s+/).slice(0, 2).map(word => word[0]).join(""))}</span><strong>${safeTitle}</strong><small>ANIME:P</small></div>`;
}
function cardMarkup(anime) {
  const saved = getWatchlist().includes(anime.id);
  const history = getHistory().find(entry => entry.id === anime.id);
  const progress = history ? `EP ${history.episode}` : (anime.featured ? "FEATURED" : "DISCOVER");
  return `<article class="anime-card" data-anime="${escapeHTML(anime.id)}">
    <div class="poster" data-open="${escapeHTML(anime.id)}">
      ${posterMarkup(anime)}<div class="poster-overlay"></div>
      <div class="poster-top"><span class="tag ${anime.featured ? "featured" : ""}">${anime.featured ? "FEATURED" : escapeHTML(String(anime.type).toUpperCase())}</span>
      <button class="heart-btn ${saved ? "saved" : ""}" data-favorite="${escapeHTML(anime.id)}" aria-label="${saved ? "Remove from" : "Add to"} watchlist" title="${saved ? "Remove from" : "Add to"} watchlist">${saved ? "♥" : "♡"}</button></div>
      <div class="poster-bottom"><span>${escapeHTML(progress)}</span><span class="rating">☆ ${escapeHTML(anime.rating)}</span></div>
    </div>
    <div class="card-info"><h3 class="card-title" title="${escapeHTML(anime.title)}" data-open="${escapeHTML(anime.id)}">${escapeHTML(anime.title)}</h3>
      <div class="card-subtitle"><span>${escapeHTML(String(anime.year))} · ${escapeHTML(anime.type)}</span><span>${anime.episodeCount || anime.episodes.length} eps</span></div>
      <div class="card-actions"><button class="mini-btn watch" data-open="${escapeHTML(anime.id)}">Details ↗</button><button class="mini-btn" data-favorite="${escapeHTML(anime.id)}" aria-label="Toggle watchlist">${saved ? "♥" : "♡"}</button></div>
    </div></article>`;
}
function renderCards(target, items, emptyTarget = null) {
  const node = $(target);
  if (!node) return;
  node.innerHTML = items.map(cardMarkup).join("");
  if (emptyTarget) $(emptyTarget)?.classList.toggle("hidden", items.length > 0);
}
function renderGenres() {
  const node = $("#genreChips");
  if (!node) return;
  node.innerHTML = genres.map(genre => `<button class="genre-chip ${activeGenre === genre ? "active" : ""}" data-genre="${escapeHTML(genre)}">${escapeHTML(genre)}</button>`).join("");
}
function filteredAnime() {
  const query = $("#searchInput")?.value.trim().toLowerCase() || "";
  return animeCatalog.filter(anime => {
    const matchesQuery = !query || `${anime.title} ${anime.originalTitle} ${anime.type} ${anime.genres.join(" ")} ${anime.description}`.toLowerCase().includes(query);
    const matchesGenre = activeGenre === "All" || anime.genres.some(genre => genre.toLowerCase() === activeGenre.toLowerCase()) || anime.type.toLowerCase() === activeGenre.toLowerCase();
    return matchesQuery && matchesGenre;
  });
}
function renderCatalog() {
  renderGenres();
  renderCards("#animeGrid", filteredAnime(), "#emptyState");
  const status = $("#catalogStatus");
  if (status) status.textContent = catalogLoading ? "Loading anime details…" : `${animeCatalog.length} anime loaded · streaming availability depends on your region`;
}
function renderWatchlist() {
  const items = getWatchlist().map(getAnime).filter(Boolean);
  renderCards("#watchlistGrid", items);
  $("#watchlistEmpty")?.classList.toggle("hidden", items.length > 0);
  const count = $("#listCount");
  if (count) count.textContent = String(items.length);
}
function renderHistory() {
  const items = getHistory().map(entry => getAnime(entry.id)).filter(Boolean);
  renderCards("#historyGrid", items);
  $("#historyEmpty")?.classList.toggle("hidden", items.length > 0);
  renderCards("#continueGrid", items.slice(0, 4));
  $("#continueSection")?.classList.toggle("hidden", items.length === 0);
}
function renderAll() { renderCatalog(); renderWatchlist(); renderHistory(); }
function toggleWatchlist(id) {
  const current = getWatchlist();
  const saved = current.includes(id);
  writeStorage(STORAGE.watchlist, saved ? current.filter(item => item !== id) : [id, ...current]);
  renderAll();
  if (currentView === "watchlist") renderWatchlist();
  showToast(saved ? "Removed from your list" : "Added to your watchlist");
}
function setView(view) {
  currentView = view;
  const sectionMap = {
    home: ["hero", "homeTrending", "continueSection"],
    browse: ["hero", "homeTrending", "continueSection"],
    watchlist: ["watchlistSection"],
    history: ["historySection"]
  };
  ["hero", "homeTrending", "continueSection", "watchlistSection", "historySection"].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.classList.toggle("hidden", !(sectionMap[view] || sectionMap.home).includes(id));
  });
  $$(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === view || ((view === "browse" || view === "home") && button.dataset.view === "home")));
  if (view === "watchlist") renderWatchlist();
  if (view === "history") renderHistory();
  if (view === "browse" || view === "home") renderCatalog();
  if (view !== "home") window.scrollTo({ top: 0, behavior: "smooth" });
}
function getSources(anime, episodeNumber) {
  const sources = AUTHORIZED_SOURCES[anime.id]?.[String(episodeNumber)] || [];
  return sources.filter(source => source && source.authorized === true && (source.type === "youtube" || source.type === "licensed-embed" || source.type === "external"));
}
function officialSearchLinks(anime, episodeNumber) {
  const query = `${anime.title} episode ${episodeNumber}`;
  return providerSearches.map(provider => `<a class="source-link ${provider.kind}" href="${escapeHTML(provider.url(query))}" target="_blank" rel="noopener noreferrer"><span>${provider.kind === "free" ? "FREE / OFFICIAL CHANNEL" : "LICENSED SERVICE"}</span><strong>${escapeHTML(provider.name)}</strong><small>Check regional availability ↗</small></a>`).join("");
}
function openDetails(id) {
  const anime = getAnime(id);
  if (!anime) return;
  const saved = getWatchlist().includes(id);
  const count = Math.min(anime.episodeCount || anime.episodes.length, 24);
  const episodes = anime.episodes.slice(0, count).map(episode => {
    const sources = getSources(anime, episode.number);
    return `<div class="episode-item"><div class="episode-number">${String(episode.number).padStart(2, "0")}</div><div><strong>${escapeHTML(episode.title)}</strong><small>${escapeHTML(episode.duration)} · ${sources.length ? "Verified source configured" : "Find an authorized stream"}</small></div><button data-play="${escapeHTML(id)}" data-episode="${episode.number}">▶ ${sources.length ? "Watch" : "Find stream"}</button></div>`;
  }).join("");
  $("#detailContent").innerHTML = `<div class="detail-layout">
    <div class="detail-poster">${posterMarkup(anime)}</div>
    <div class="detail-copy"><p class="section-eyebrow">ANIME:P · ANIME GUIDE</p><h2>${escapeHTML(anime.title)}</h2>
    <div class="detail-rating">☆ ${escapeHTML(anime.rating)} <span class="rating-note">· MyAnimeList score when available</span></div>
    <div class="detail-tags"><span class="tag">${escapeHTML(String(anime.year))}</span><span class="tag">${escapeHTML(anime.type)}</span><span class="tag">${escapeHTML(anime.status)}</span></div>
    <p>${escapeHTML(anime.description)}</p><p><strong>Genres:</strong> ${escapeHTML(anime.genres.join(", ") || anime.type)}</p>
    <p><strong>Episodes:</strong> ${escapeHTML(String(anime.episodeCount || anime.episodes.length))} listed by metadata. Exact titles and availability vary by provider.</p>
    <button class="btn btn-ghost" data-favorite="${escapeHTML(id)}">${saved ? "♥ Remove from my list" : "♡ Add to my list"}</button>
    <h3 class="episode-title">Episodes <span class="episode-count">(first ${count}${(anime.episodeCount || count) > count ? " shown" : ""})</span></h3>
    <div class="episode-list">${episodes}</div></div></div>`;
  $("#detailDialog").showModal();
}
function buildEmbed(source, anime, episode) {
  if (source.type === "youtube" && /^[\w-]{11}$/.test(source.videoId || "")) {
    return { url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}?autoplay=1&rel=0`, title: source.title || "Authorized YouTube embed", externalUrl: source.externalUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(source.videoId)}` };
  }
  if (source.type === "licensed-embed" && source.embedUrl && source.authorized === true) {
    try {
      const parsed = new URL(source.embedUrl);
      if (parsed.protocol === "https:") return { url: parsed.href, title: source.title || "Licensed provider embed", externalUrl: source.externalUrl || parsed.origin };
    } catch { /* invalid embed URL: fall back to provider links */ }
  }
  return null;
}
function openPlayer(id, episodeNumber) {
  const anime = getAnime(id);
  const episode = anime?.episodes.find(item => item.number === Number(episodeNumber));
  if (!anime || !episode) return;
  const sources = getSources(anime, episode.number);
  const embedSource = sources.find(source => source.type === "youtube" || source.type === "licensed-embed");
  const embed = embedSource ? buildEmbed(embedSource, anime, episode) : null;
  const externalSource = sources.find(source => source.type === "external" && source.url && /^https:\/\//.test(source.url));
  const embedMarkup = embed ? `<iframe src="${escapeHTML(embed.url)}" title="${escapeHTML(anime.title)} — ${escapeHTML(episode.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : `<div class="player-empty"><div class="player-empty-icon">▷</div><h3>No verified in-site player yet</h3><p>Anime:P only embeds sources that have been checked for authorization. Choose an official free channel or a licensed service below.</p></div>`;
  const fallbackLink = embed ? `<a class="btn btn-primary" href="${escapeHTML(embed.externalUrl)}" target="_blank" rel="noopener noreferrer">Open source directly ↗</a>` : (externalSource ? `<a class="btn btn-primary" href="${escapeHTML(externalSource.url)}" target="_blank" rel="noopener noreferrer">Open official source ↗</a>` : "");
  $("#playerContent").innerHTML = `<div class="player-wrap"><p class="section-eyebrow">ANIME:P PLAYER</p><h2>${escapeHTML(anime.title)} · ${escapeHTML(episode.title)}</h2><p>Official free streams and licensed providers, where available.</p><div class="video-frame ${embed ? "has-embed" : ""}">${embedMarkup}</div>
    <div class="player-actions">${fallbackLink}<button class="btn btn-ghost" data-close="playerDialog">Back to episodes</button></div>
    <div class="player-notice"><strong>Playback fallback</strong><p>If an embed is blocked, unavailable in your region, or removed by its provider, use one of the official source links below. Anime:P does not bypass access restrictions.</p></div>
    <h3 class="sources-heading">Official free sources & licensed services</h3><div class="source-grid">${officialSearchLinks(anime, episode.number)}</div>
    <p class="source-disclaimer">These links open the provider's own search or catalog. They do not guarantee that a title or episode is available in your country or free to watch.</p></div>`;
  $("#playerDialog").showModal();
  const history = getHistory().filter(entry => entry.id !== id);
  history.unshift({ id, episode: episode.number, updatedAt: Date.now() });
  writeStorage(STORAGE.history, history.slice(0, 12));
  renderHistory();
}
function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }

async function fetchJikan(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Anime metadata request failed (${response.status})`);
  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
}
function mergeCatalog(items) {
  const mapped = items.map(mapAnime).filter(item => item.malId);
  const byId = new Map(animeCatalog.map(item => [item.id, item]));
  mapped.forEach(item => {
    const old = byId.get(item.id);
    byId.set(item.id, { ...old, ...item, featured: item.malId === FEATURED_MAL_ID || Boolean(old?.featured) });
  });
  animeCatalog = [...byId.values()];
  const featured = getAnime(featuredAnimeId);
  if (featured) featured.featured = true;
}
async function loadInitialCatalog() {
  catalogLoading = true;
  renderCatalog();
  try {
    const popular = await fetchJikan(`${JIKAN}/top/anime?filter=bypopularity&limit=24`);
    mergeCatalog(popular);
    renderAll();
  } catch (error) {
    console.warn("Anime:P is using its offline starter catalog:", error);
    const status = $("#catalogStatus");
    if (status) status.textContent = "Showing starter catalog · live metadata is temporarily unavailable";
  } finally {
    catalogLoading = false;
    renderAll();
  }
  // Refresh the Attack on Titan feature after the first request to respect API rate limits.
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const result = await fetchJikan(`${JIKAN}/anime/${FEATURED_MAL_ID}/full`);
    if (result[0]) {
      const featured = mapAnime(result[0]);
      featured.featured = true;
      mergeCatalog([result[0]]);
      featuredAnimeId = featured.id;
      updateHero(featured);
      renderAll();
    }
  } catch (error) {
    const featured = getAnime(featuredAnimeId);
    if (featured) updateHero(featured);
  }
}
function updateHero(anime) {
  if (!anime) return;
  const title = $("#heroTitle");
  const description = $("#heroDescription");
  const poster = $("#heroPoster");
  const rating = $("#heroRating");
  if (title) title.innerHTML = `${escapeHTML(anime.title)}<span>.</span>`;
  if (description) description.textContent = anime.description;
  const heroFallback = $(".hero-poster-fallback");
  if (poster && anime.poster) {
    poster.src = anime.poster;
    poster.alt = `${anime.title} poster`;
    poster.classList.remove("hidden");
    heroFallback?.classList.add("hidden");
  } else {
    poster?.classList.add("hidden");
    heroFallback?.classList.remove("hidden");
  }
  if (rating) rating.textContent = anime.rating !== "—" ? `★ ${anime.rating} · FEATURED` : "FEATURED ANIME";
  // Hero buttons are handled directly below; avoid duplicate delegated clicks.
}
async function searchRemote(query) {
  const requestId = ++searchRequest;
  if (!query || query.length < 2) return;
  try {
    await new Promise(resolve => setTimeout(resolve, 450));
    if (requestId !== searchRequest) return;
    const result = await fetchJikan(`${JIKAN}/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`);
    if (requestId !== searchRequest) return;
    if (result.length) {
      mergeCatalog(result);
      renderCatalog();
    }
  } catch (error) {
    console.warn("Anime search temporarily unavailable:", error);
    const status = $("#catalogStatus");
    if (status) status.textContent = "Showing matching saved catalog entries · online search is temporarily unavailable";
  }
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) { setView(viewButton.dataset.view); return; }
  const genreButton = event.target.closest("[data-genre]");
  if (genreButton) { activeGenre = genreButton.dataset.genre; renderCatalog(); return; }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.preventDefault(); event.stopPropagation();
    const wasOpen = $("#detailDialog")?.open;
    const id = favoriteButton.dataset.favorite;
    toggleWatchlist(id);
    if (wasOpen) openDetails(id);
    return;
  }
  const openButton = event.target.closest("[data-open]");
  if (openButton) { openDetails(openButton.dataset.open); return; }
  const playButton = event.target.closest("[data-play]");
  if (playButton) { openPlayer(playButton.dataset.play, playButton.dataset.episode); return; }
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) { closeDialog(closeButton.dataset.close); return; }
});
$("#searchInput")?.addEventListener("input", () => {
  activeGenre = "All";
  renderCatalog();
  if (currentView !== "browse") setView("browse");
  clearTimeout(searchTimer);
  const query = $("#searchInput").value.trim();
  searchTimer = setTimeout(() => searchRemote(query), 500);
});
$("#exploreButton")?.addEventListener("click", () => setView("browse"));
$("#heroListButton")?.addEventListener("click", () => toggleWatchlist(featuredAnimeId));
$("#heroWatchButton")?.addEventListener("click", event => {
  const id = event.currentTarget.dataset.open || featuredAnimeId;
  openDetails(id);
});
$("#clearFilters")?.addEventListener("click", () => { $("#searchInput").value = ""; activeGenre = "All"; renderCatalog(); });
$("#aboutButton")?.addEventListener("click", () => $("#aboutDialog")?.showModal());
$("#profileButton")?.addEventListener("click", () => showToast("Your list and history are saved in this browser — no account needed."));
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { event.preventDefault(); $("#searchInput")?.focus(); }
  if (event.key === "Escape") $$("dialog[open]").forEach(dialog => dialog.close());
});
$$("dialog").forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));

renderAll();
const initialFeatured = getAnime(featuredAnimeId);
if (initialFeatured) updateHero(initialFeatured);
loadInitialCatalog();
