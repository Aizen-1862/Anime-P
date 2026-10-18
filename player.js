
/* =========================================================
   ANIME:P — IN-SITE PLAYER ADD-ON
   Keeps the existing catalogue and UI intact.
   Sources: authorized YouTube embeds in streams.json.
========================================================= */

(() => {
  "use strict";

  const STREAMS_URL = "./streams.json";
  let streams = {};
  let currentVideoId = "";
  let currentAnimeId = null;
  let currentEpisode = null;

  const validYouTubeId = (id) =>
    typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);

  async function loadStreams() {
    try {
      const response = await fetch(
        `${STREAMS_URL}?v=${Date.now()}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Stream catalogue unavailable");

      const data = await response.json();
      streams = data && typeof data === "object" ? data : {};
    } catch (error) {
      console.warn("Anime:P player:", error.message);
      streams = {};
    }
  }

  function getStream(animeId, episodeNumber) {
    const entry = streams[String(animeId)]?.[String(episodeNumber)];

    if (
      !entry ||
      entry.provider !== "youtube" ||
      !validYouTubeId(entry.videoId) ||
      entry.videoId === "REPLACE_WITH_VERIFIED_VIDEO_ID"
    ) {
      return null;
    }

    return entry;
  }

  function ensurePlayer() {
    let modal = document.getElementById("animePlayerModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "animePlayerModal";
    modal.className = "ap-player-backdrop";
    modal.hidden = true;

    modal.innerHTML = `
      <section class="ap-player-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apPlayerTitle">

        <header class="ap-player-header">
          <div>
            <p class="ap-player-kicker">ANIME:P • NOW PLAYING</p>
            <h2 id="apPlayerTitle">Anime episode</h2>
          </div>
          <button type="button" class="ap-player-close"
            id="apPlayerClose" aria-label="Close player">×</button>
        </header>

        <div class="ap-player-screen" id="apPlayerScreen">
          <div class="ap-player-message" id="apPlayerMessage">
            Choose an available episode to begin.
          </div>
        </div>

        <div class="ap-player-controls">
          <button type="button" class="btn btn-secondary"
            id="apPreviousEpisode">← Previous</button>
          <span id="apEpisodeLabel">No episode selected</span>
          <button type="button" class="btn btn-primary"
            id="apNextEpisode">Next →</button>
        </div>

        <p class="ap-player-note">
          Playback is provided by the authorized video source.
          Availability and embedding permissions may vary.
        </p>
      </section>
    `;

    document.body.appendChild(modal);

    document.getElementById("apPlayerClose").addEventListener(
      "click", closePlayer
    );

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closePlayer();
    });

    document.getElementById("apPreviousEpisode").addEventListener(
      "click", () => changeEpisode(-1)
    );

    document.getElementById("apNextEpisode").addEventListener(
      "click", () => changeEpisode(1)
    );

    return modal;
  }

  function showMessage(message) {
    const screen = document.getElementById("apPlayerScreen");
    if (!screen) return;

    screen.replaceChildren();

    const messageElement = document.createElement("div");
    messageElement.className = "ap-player-message";
    messageElement.textContent = message;

    screen.appendChild(messageElement);
  }

  function updateControls() {
    const label = document.getElementById("apEpisodeLabel");
    if (label) {
      label.textContent = currentEpisode
        ? `Episode ${currentEpisode}`
        : "No episode selected";
    }

    const previous = document.getElementById("apPreviousEpisode");
    const next = document.getElementById("apNextEpisode");

    if (previous) {
      previous.disabled =
        !currentEpisode ||
        !getStream(currentAnimeId, currentEpisode - 1);
    }

    if (next) {
      next.disabled =
        !currentEpisode ||
        !getStream(currentAnimeId, currentEpisode + 1);
    }
  }

  function playEpisode(animeId, episodeNumber, animeTitle = "Anime") {
    ensurePlayer();

    currentAnimeId = Number(animeId);
    currentEpisode = Number(episodeNumber);

    const title = document.getElementById("apPlayerTitle");
    if (title) title.textContent = `${animeTitle} — Episode ${currentEpisode}`;

    const modal = document.getElementById("animePlayerModal");
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    const entry = getStream(currentAnimeId, currentEpisode);

    if (!entry) {
      currentVideoId = "";
      showMessage(
        `Episode ${currentEpisode} doesn't have a verified playable source yet. ` +
        "Add an authorized, embeddable video to streams.json to enable playback."
      );
      updateControls();
      return;
    }

    currentVideoId = entry.videoId;

    const screen = document.getElementById("apPlayerScreen");
    screen.replaceChildren();

    const frame = document.createElement("iframe");
    frame.className = "ap-player-frame";
    frame.title = `${animeTitle} — Episode ${currentEpisode}`;
    frame.src =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(entry.videoId)}`;
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";

    screen.appendChild(frame);
    updateControls();
  }

  function changeEpisode(direction) {
    if (!currentAnimeId || !currentEpisode) return;

    const nextEpisode = currentEpisode + direction;
    const entry = getStream(currentAnimeId, nextEpisode);

    if (!entry) {
      showToastSafe(
        direction > 0
          ? "The next episode has no verified stream yet."
          : "The previous episode has no verified stream yet."
      );
      return;
    }

    const title = document.getElementById("apPlayerTitle");
    const animeTitle = title?.textContent.split(" — Episode ")[0] || "Anime";

    playEpisode(currentAnimeId, nextEpisode, animeTitle);
  }

  function closePlayer() {
    const modal = document.getElementById("animePlayerModal");
    if (!modal) return;

    modal.hidden = true;

    // Remove the iframe so playback stops when the player closes.
    document.getElementById("apPlayerScreen")?.replaceChildren();
    document.body.style.overflow = "";

    currentVideoId = "";
  }

  function showToastSafe(message) {
    const toast = document.getElementById("toast");

    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2400);
    }
  }

  function getAnimeTitleFromModal() {
    return document.getElementById("detailTitle")?.textContent || "Anime";
  }

  function addEpisodeButtons() {
    const list = document.getElementById("episodeList");
    if (!list) return;

    list.querySelectorAll(".episode-item").forEach((item) => {
      if (item.dataset.apPlayerReady === "true") return;

      const strong = item.querySelector("strong");
      const match = strong?.textContent.match(/Episode\s+(\d+)/i);
      if (!match) return;

      const episodeNumber = Number(match[1]);
      if (!episodeNumber) return;

      item.dataset.apPlayerReady = "true";

      const controls = item.querySelector("div:last-child");
      if (!controls) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary ap-play-button";
      button.textContent = "▶ Play here";

      const entry = getStream(
        getCurrentAnimeId(),
        episodeNumber
      );

      if (!entry) {
        button.title = "No verified in-site stream is configured for this episode yet.";
      }

      button.addEventListener("click", () => {
        const animeId = getCurrentAnimeId();

        if (!animeId) {
          showToastSafe("Open the anime details again and retry.");
          return;
        }

        playEpisode(animeId, episodeNumber, getAnimeTitleFromModal());
      });

      controls.prepend(button);
    });
  }

  function getCurrentAnimeId() {
    // The original script exposes the selected anime through its detail view.
    // The anime ID is read from the current episode source buttons when possible.
    if (currentAnimeId) return currentAnimeId;

    const title = getAnimeTitleFromModal();

    try {
      const history = JSON.parse(
        localStorage.getItem("animep_history") || "[]"
      );

      const match = history.find((anime) => anime.title === title);
      return match?.id || null;
    } catch {
      return null;
    }
  }

  function watchEpisodeList() {
    const observer = new MutationObserver(() => {
      addEpisodeButtons();
    });

    const start = () => {
      const list = document.getElementById("episodeList");

      if (list) {
        observer.observe(list, {
          childList: true,
          subtree: true
        });

        addEpisodeButtons();
      }
    };

    start();

    // The episode list is created when the details modal opens.
    const detailModal = document.getElementById("detailModal");

    if (detailModal) {
      const detailObserver = new MutationObserver(start);
      detailObserver.observe(detailModal, {
        childList: true,
        subtree: true
      });
    }
  }

  document.addEventListener("keydown", (event) => {
    const modal = document.getElementById("animePlayerModal");

    if (event.key === "Escape" && modal && !modal.hidden) {
      closePlayer();
    }
  });

  async function initPlayer() {
    await loadStreams();
    ensurePlayer();
    watchEpisodeList();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlayer);
  } else {
    initPlayer();
  }
})();
