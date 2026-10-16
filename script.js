:root {
  --bg: #080b18;
  --panel: #10162a;
  --panel-2: #151d35;
  --line: rgba(155, 177, 255, .13);
  --text: #f3f5ff;
  --muted: #919bb9;
  --blue: #58a6ff;
  --cyan: #65f2ff;
  --violet: #9672ff;
  --radius: 18px;
  --shadow: 0 18px 55px rgba(0, 0, 0, .25);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 90px;
}

body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}

button:disabled {
  cursor: not-allowed;
  opacity: .6;
}

[hidden] {
  display: none !important;
}

.ambient {
  position: fixed;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: .1;
  pointer-events: none;
  z-index: -1;
}

.ambient-one {
  top: 90px;
  left: -190px;
  background: #496eff;
}

.ambient-two {
  right: -200px;
  top: 550px;
  background: #8a4cff;
}

.topbar {
  height: 76px;
  padding: 0 5%;
  display: flex;
  align-items: center;
  gap: 34px;
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(8, 11, 24, .88);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(20px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  text-decoration: none;
  color: var(--text);
}

.brand-mark,
.footer-logo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  color: #fff;
  font-weight: 900;
  font-size: 18px;
  box-shadow: 0 0 22px rgba(88, 166, 255, .2);
}

.brand-name {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 1.4px;
}

.brand-name span,
.site-footer span:not(.footer-divider) {
  color: var(--cyan);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  transition: .2s;
}

.nav-link:hover,
.nav-link.active {
  color: var(--text);
  background: rgba(112, 147, 255, .12);
}

.header-search {
  margin-left: auto;
  width: min(290px, 28vw);
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #11182b;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--muted);
}

.header-search > span {
  font-size: 25px;
  line-height: 1;
}

.header-search input {
  min-width: 0;
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--text);
  font-size: 12px;
}

.header-search input::placeholder {
  color: #7f89a8;
}

.header-search kbd {
  font-size: 10px;
  padding: 2px 5px;
  border: 1px solid var(--line);
  border-radius: 4px;
}

.page-shell {
  width: min(1600px, 92%);
  margin: 0 auto;
}

.hero {
  min-height: 350px;
  margin: 32px 0 50px;
  border: 1px solid rgba(124, 151, 255, .18);
  border-radius: 28px;
  background:
    radial-gradient(ellipse at 75% 50%, rgba(81, 105, 255, .21), transparent 44%),
    linear-gradient(120deg, #121a34, #0c1124 68%, #17102f);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  padding: clamp(28px, 5vw, 65px);
  box-shadow: var(--shadow);
}

.hero-content {
  max-width: 570px;
  position: relative;
  z-index: 2;
}

.eyebrow,
.section-kicker {
  color: var(--cyan);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 12px var(--cyan);
}

.hero h1 {
  margin: 19px 0 14px;
  font-size: clamp(36px, 5vw, 66px);
  line-height: 1.07;
  letter-spacing: -3px;
  font-weight: 900;
}

.hero h1 span {
  background: linear-gradient(90deg, #7ebaff, #a894ff, #67efff);
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
}

.hero-content > p {
  max-width: 420px;
  color: #aeb8d6;
  font-size: 14px;
  line-height: 1.8;
}

.hero-actions,
.hero-meta,
.detail-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.hero-actions {
  margin-top: 25px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 43px;
  padding: 11px 17px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  transition: transform .2s, box-shadow .2s, background .2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  color: #07101d;
  background: linear-gradient(100deg, var(--cyan), #7eb4ff);
  box-shadow: 0 7px 24px rgba(79, 173, 255, .15);
}

.btn-primary:hover {
  box-shadow: 0 8px 30px rgba(79, 173, 255, .28);
}

.btn-secondary {
  color: var(--text);
  background: rgba(255, 255, 255, .045);
  border-color: var(--line);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, .09);
}

.hero-meta {
  margin-top: 25px;
  gap: 18px;
  color: #919dbd;
  font-size: 10px;
  font-weight: 600;
}

.hero-art {
  position: absolute;
  width: 44%;
  height: 100%;
  right: 0;
  top: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  background: radial-gradient(circle, rgba(96, 114, 255, .1), transparent 65%);
}

.hero-orbit {
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  border: 1px solid rgba(106, 168, 255, .24);
  box-shadow: inset 0 0 60px rgba(98, 111, 255, .05), 0 0 70px rgba(98, 111, 255, .06);
}

.orbit-two {
  width: 190px;
  height: 310px;
  transform: rotate(54deg);
  border-color: rgba(124, 101, 255, .38);
}

.hero-symbol {
  font-size: clamp(100px, 16vw, 200px);
  line-height: 1;
  font-weight: 900;
  color: transparent;
  -webkit-text-stroke: 2px rgba(110, 215, 255, .6);
  text-shadow: 0 0 45px rgba(97, 146, 255, .2);
  transform: rotate(-9deg);
}

.hero-chip {
  position: absolute;
  padding: 8px 11px;
  border-radius: 8px;
  background: rgba(15, 23, 49, .9);
  border: 1px solid rgba(140, 170, 255, .2);
  color: #b4c8ff;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1px;
}

.chip-top {
  top: 27%;
  right: 11%;
}

.chip-bottom {
  bottom: 21%;
  left: 10%;
}

.section {
  margin: 0 0 54px;
  scroll-margin-top: 95px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  margin-bottom: 21px;
}

.section-heading h2 {
  margin-top: 6px;
  font-size: clamp(22px, 3vw, 29px);
  line-height: 1.3;
  font-weight: 850;
  letter-spacing: -.8px;
}

.heading-icon {
  color: var(--cyan);
  font-size: .8em;
}

.section-description {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

.catalog-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-count {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

.catalog-tools select {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 11px;
  max-width: 155px;
  font-size: 11px;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--cyan);
  font-size: 11px;
  font-weight: 700;
}

.genre-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 13px;
  margin-bottom: 14px;
  scrollbar-width: thin;
  scrollbar-color: #293657 transparent;
}

.genre-chip {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: #10162a;
  color: #a6b0cb;
  border: 1px solid var(--line);
  font-size: 10px;
  font-weight: 700;
  transition: .2s;
}

.genre-chip:hover,
.genre-chip.active {
  color: #07101d;
  background: var(--cyan);
  border-color: var(--cyan);
}

.anime-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 23px 16px;
}

.anime-card {
  min-width: 0;
  position: relative;
  animation: card-in .35s ease both;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.poster-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(145deg, #1b2850, #101425 60%, #26204a);
  border: 1px solid rgba(151, 175, 255, .12);
  cursor: pointer;
}

.poster-wrap::after {
  content: "";
  position: absolute;
  inset: 40% 0 0;
  background: linear-gradient(transparent, rgba(4, 7, 16, .45));
  pointer-events: none;
}

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .4s;
}

.anime-card:hover .poster-image {
  transform: scale(1.055);
}

.poster-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 16px;
  color: #b6c9ff;
  font-weight: 800;
  font-size: 14px;
  background:
    radial-gradient(circle at 20% 20%, rgba(101, 242, 255, .18), transparent 38%),
    linear-gradient(145deg, #1b2850, #101425 60%, #26204a);
}

.score-badge {
  position: absolute;
  z-index: 2;
  top: 9px;
  left: 9px;
  padding: 5px 7px;
  border-radius: 7px;
  color: #08121f;
  background: rgba(112, 242, 255, .95);
  font-size: 10px;
  font-weight: 900;
}

.card-heart {
  position: absolute;
  z-index: 3;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: rgba(6, 10, 24, .78);
  border: 1px solid rgba(255, 255, 255, .17);
  color: white;
  font-size: 16px;
  backdrop-filter: blur(8px);
}

.card-heart.saved {
  color: #ff7ab6;
  background: rgba(65, 17, 49, .92);
}

.card-open {
  position: absolute;
  z-index: 2;
  bottom: 9px;
  right: 9px;
  width: 31px;
  height: 31px;
  border: 0;
  border-radius: 50%;
  background: var(--cyan);
  color: #06101c;
  font-size: 17px;
  font-weight: 900;
  opacity: 0;
  transform: translateY(5px);
  transition: .2s;
}

.anime-card:hover .card-open,
.card-open:focus-visible {
  opacity: 1;
  transform: translateY(0);
}

.card-info {
  padding: 10px 2px 0;
}

.card-title {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}

.card-title:hover {
  color: var(--cyan);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-top: 6px;
  color: var(--muted);
  font-size: 10px;
}

.card-meta .dot {
  color: #566486;
}

.card-progress {
  height: 3px;
  margin-top: 10px;
  border-radius: 99px;
  background: #26314d;
  overflow: hidden;
}

.card-progress span {
  display: block;
  height: 100%;
  width: 45%;
  background: linear-gradient(90deg, var(--blue), var(--cyan));
}

.card-remove {
  margin-top: 9px;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: #ff91b8;
  font-size: 10px;
  font-weight: 700;
}

.load-more-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 13px;
  margin: 36px 0 0;
  text-align: center;
}

.load-more-wrap p {
  color: var(--muted);
  font-size: 11px;
}

.load-more-wrap .btn {
  min-width: 190px;
}

.status-message {
  margin: 0 0 20px;
  padding: 12px 15px;
  border-radius: 12px;
  color: #c3d8ff;
  background: rgba(87, 136, 255, .09);
  border: 1px solid rgba(87, 136, 255, .17);
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 55px 18px;
  border: 1px dashed rgba(151, 175, 255, .2);
  border-radius: 18px;
  background: rgba(17, 23, 43, .5);
}

.empty-icon {
  margin-bottom: 10px;
  color: var(--cyan);
  font-size: 35px;
}

.empty-state h3 {
  font-size: 17px;
}

.empty-state p {
  margin: 8px 0 18px;
  color: var(--muted);
  font-size: 12px;
}

.footer-note {
  margin: 65px 0 28px;
  padding: 22px 0;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 13px;
}

.footer-logo {
  width: 32px;
  height: 32px;
  font-size: 14px;
  flex-shrink: 0;
}

.footer-note p {
  color: var(--muted);
  font-size: 11px;
}

.api-note {
  margin-left: auto;
  color: #6f7b9a;
  font-size: 9px;
  text-align: right;
}

.site-footer {
  border-top: 1px solid var(--line);
  padding: 19px 5%;
  text-align: center;
  color: #73809f;
  font-size: 10px;
  letter-spacing: .6px;
}

.footer-divider {
  padding: 0 6px;
  color: #3c4968;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  padding: 24px;
  display: grid;
  place-items: center;
  background: rgba(3, 5, 13, .82);
  backdrop-filter: blur(12px);
  overflow-y: auto;
}

.detail-modal {
  position: relative;
  width: min(900px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  border: 1px solid rgba(143, 169, 255, .2);
  border-radius: 22px;
  background: #0e1427;
  box-shadow: 0 25px 100px rgba(0, 0, 0, .5);
}

.modal-close {
  position: sticky;
  float: right;
  top: 12px;
  right: 12px;
  z-index: 5;
  width: 36px;
  height: 36px;
  margin: 12px 12px -48px 0;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 50%;
  background: rgba(6, 9, 20, .85);
  color: white;
  font-size: 23px;
}

.detail-banner {
  height: 170px;
  background:
    radial-gradient(ellipse at 70% 10%, rgba(95, 132, 255, .4), transparent 45%),
    linear-gradient(130deg, #1d2b52, #15142f, #101426);
  background-position: center;
  background-size: cover;
}

.detail-body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 25px;
  padding: 0 28px 30px;
}

.detail-poster-wrap {
  margin-top: -80px;
  position: relative;
  z-index: 2;
}

.detail-poster {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  object-fit: cover;
  border-radius: 13px;
  background: #182341;
  border: 2px solid #252f50;
}

.detail-copy {
  padding-top: 20px;
  min-width: 0;
}

.detail-copy h2 {
  margin: 5px 0 10px;
  font-size: clamp(22px, 4vw, 32px);
  line-height: 1.2;
}

.detail-stats,
.detail-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-stats span,
.detail-genres span {
  padding: 5px 8px;
  border-radius: 7px;
  background: #18213b;
  color: #c1cce8;
  font-size: 10px;
}

.detail-genres {
  margin-top: 10px;
}

.detail-genres span {
  background: rgba(87, 174, 255, .1);
  color: #9edbff;
}

.detail-synopsis {
  margin: 17px 0;
  color: #abb6d1;
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-line;
}

.detail-actions {
  margin: 18px 0 25px;
}

.official-panel {
  border-top: 1px solid var(--line);
  padding-top: 20px;
}

.official-panel h3 {
  margin-bottom: 7px;
  font-size: 14px;
}

.official-panel > p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

.official-links {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin: 13px 0;
}

.official-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: #c8d8ff;
  background: #141c33;
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
}

.official-link:hover {
  border-color: var(--cyan);
  color: var(--cyan);
}

.official-panel .fine-print {
  margin-top: 13px;
  font-size: 10px;
  color: #7583a3;
}

.toast {
  position: fixed;
  z-index: 100;
  left: 50%;
  bottom: 25px;
  transform: translate(-50%, 20px);
  opacity: 0;
  pointer-events: none;
  max-width: calc(100% - 30px);
  padding: 12px 17px;
  border: 1px solid rgba(101, 242, 255, .28);
  border-radius: 12px;
  background: #141f38;
  color: var(--text);
  font-size: 12px;
  box-shadow: var(--shadow);
  transition: .25s;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 1200px) {
  .anime-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .topbar {
    gap: 20px;
  }
}

@media (max-width: 950px) {
  .anime-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .hero-art {
    opacity: .65;
    width: 40%;
  }

  .main-nav {
    gap: 0;
  }

  .nav-link {
    padding: 9px;
  }
}

@media (max-width: 700px) {
  .topbar {
    height: auto;
    min-height: 70px;
    padding: 12px 4%;
    flex-wrap: wrap;
    gap: 10px;
  }

  .brand-mark {
    width: 34px;
    height: 34px;
  }

  .main-nav {
    order: 3;
    width: 100%;
    justify-content: space-between;
  }

  .nav-link {
    flex: 1;
    font-size: 11px;
  }

  .header-search {
    width: auto;
    min-width: 0;
    flex: 1;
  }

  .header-search kbd {
    display: none;
  }

  .page-shell {
    width: 92%;
  }

  .hero {
    min-height: 355px;
    margin-top: 20px;
    padding: 28px 22px;
  }

  .hero h1 {
    letter-spacing: -1.8px;
  }

  .hero-art {
    width: 50%;
    opacity: .2;
  }

  .hero-meta {
    gap: 10px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 13px;
  }

  .catalog-tools {
    width: 100%;
    justify-content: space-between;
  }

  .anime-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 19px 11px;
  }

  .card-title {
    font-size: 11px;
  }

  .card-meta {
    font-size: 9px;
  }

  .card-open {
    opacity: 1;
    transform: none;
    width: 28px;
    height: 28px;
  }

  .footer-note {
    flex-wrap: wrap;
  }

  .api-note {
    width: 100%;
    margin-left: 45px;
    text-align: left;
  }

  .detail-body {
    grid-template-columns: 105px minmax(0, 1fr);
    gap: 15px;
    padding: 0 16px 23px;
  }

  .detail-poster-wrap {
    margin-top: -48px;
  }

  .detail-banner {
    height: 130px;
  }

  .detail-copy {
    padding-top: 14px;
  }

  .detail-copy h2 {
    font-size: 21px;
  }

  .detail-actions {
    gap: 8px;
  }

  .detail-actions .btn {
    padding: 10px;
    font-size: 10px;
  }

  .modal-backdrop {
    padding: 10px;
  }
}

@media (max-width: 430px) {
  .anime-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 13px;
  }

  .hero {
    min-height: 370px;
  }

  .hero-content > p {
    max-width: 290px;
    font-size: 12px;
  }

  .hero-actions .btn {
    padding: 10px 12px;
    font-size: 10px;
  }

  .result-count {
    font-size: 10px;
  }

  .detail-body {
    grid-template-columns: 1fr;
  }

  .detail-poster-wrap {
    display: none;
  }

  .detail-copy {
    padding-top: 0;
  }

  .detail-banner {
    height: 95px;
  }

  .footer-note p {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
