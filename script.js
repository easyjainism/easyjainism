/* Easy Jainism - site script (plain JavaScript, no libraries). */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function store(key, value) {            // safe localStorage (works even if blocked)
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  function make(tag, className, text) {   // create an element safely (no innerHTML)
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  const page = document.body.dataset.page;

  /* ---------- site data ---------- */
  const SEARCH_INDEX = [
    ["Home", "./home.html"], ["About", "./about.html"], ["Books", "./books.html"],
    ["Videos", "./videos.html"], ["Paathshala", "./paathshala.html"], ["Posters", "./poster.html"],
    ["Ask Queries", "./ask-queries.html"], ["Sankalp & Confessions", "./sankalp-confessions.html"],
    ["Ahimsa", "./about.html#ahimsa"], ["Anekantavada", "./about.html#anekant"],
    ["Aparigraha", "./about.html#aparigraha"], ["Karma", "./about.html#karma"],
    ["Moksha", "./about.html#moksha"], ["Mahavir", "./about.html#mahavir"],
    ["Kids quiz", "./paathshala.html"], ["Sankalp vows", "./sankalp-confessions.html"],
    ["FAQ", "./ask-queries.html"]
  ];

  const QUOTES = [
    "Live and let live.", "Truth has many sides.", "Control anger, practice forgiveness.",
    "Own less, give more.", "Every soul is equal.", "Do not hurt any living being.",
    "Forgiveness is the ornament of the strong."
  ];

  const QUIZ = [
    { q: "How many Tirthankaras are there in this era?", options: ["12", "24", "36"], answer: 1 },
    { q: "What does Ahimsa mean?", options: ["Non-violence", "Charity", "Fasting"], answer: 0 },
    { q: "Who was the 24th Tirthankara?", options: ["Rishabhdev", "Parshvanath", "Mahavir"], answer: 2 },
    { q: "Anekantavada says truth has...", options: ["One side", "Many sides", "No sides"], answer: 1 },
    { q: "Aparigraha means...", options: ["Honesty", "Non-possessiveness", "Silence"], answer: 1 }
  ];

  /* ---------- mobile menu (drawer) ---------- */
  const nav = $("#nav");
  const scrim = $("#scrim");
  const burger = $("#burger");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    scrim.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  scrim.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- active menu link ---------- */
  $$("#nav a").forEach((a) => {
    if (a.dataset.p === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---------- dark / light mode ---------- */
  $("#theme").addEventListener("click", () => {
    const root = document.documentElement;
    const wasDark = root.dataset.theme === "dark";
    if (wasDark) delete root.dataset.theme; else root.dataset.theme = "dark";
    store("theme", wasDark ? "light" : "dark");
  });

  /* ---------- search ---------- */
  const searchBtn = $("#searchBtn");
  const searchBox = $("#searchBox");
  const searchInput = $("#q");
  const results = $("#results");

  searchBtn.addEventListener("click", () => {
    searchBox.hidden = !searchBox.hidden;
    searchBtn.setAttribute("aria-expanded", String(!searchBox.hidden));
    if (!searchBox.hidden) searchInput.focus();
  });

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    results.innerHTML = "";
    if (!term) return;
    const matches = SEARCH_INDEX.filter((item) => item[0].toLowerCase().includes(term));
    if (!matches.length) { results.appendChild(make("li", "", "No match. Try another word.")); return; }
    matches.forEach(([label, href]) => {
      const li = make("li");
      const a = make("a", "", label);
      a.href = href;
      li.appendChild(a);
      results.appendChild(li);
    });
  });

  /* ---------- language: Google Translate translates the whole page ---------- */
  const langSelect = $("#lang");
  const savedLang = store("lang") || "en";
  let translatorLoaded = false;

  function setTranslateCookie(lang) { document.cookie = `googtrans=/en/${lang};path=/`; }
  function clearTranslateCookie() {
    ["", `domain=${location.hostname};`, `domain=.${location.hostname};`].forEach((d) => {
      document.cookie = `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;${d}`;
    });
  }

  function loadTranslator() {                      // downloads Google's script only when a language is chosen
    if (translatorLoaded) return;
    translatorLoaded = true;
    const holder = make("div", "gt-hold");
    holder.id = "google_translate_element";
    holder.setAttribute("aria-hidden", "true");
    document.body.appendChild(holder);
    window.googleTranslateElementInit = () => {
      new google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "hi,gu,kn,ta,mr", autoDisplay: false },
        "google_translate_element"
      );
    };
    const tag = document.createElement("script");
    tag.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    tag.async = true;
    document.head.appendChild(tag);
  }

  function chooseLanguage(lang) {                  // wait for Google's hidden dropdown, then pick the language
    let tries = 0;
    const timer = setInterval(() => {
      const combo = $(".goog-te-combo");
      tries++;
      if (combo) {
        clearInterval(timer);
        if (combo.value !== lang) { combo.value = lang; combo.dispatchEvent(new Event("change")); }
      } else if (tries > 60) clearInterval(timer);
    }, 200);
  }

  function useLanguage(lang) {
    if (lang === "en") { clearTranslateCookie(); if (translatorLoaded) location.reload(); return; }
    setTranslateCookie(lang);
    loadTranslator();
    chooseLanguage(lang);
  }

  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener("change", () => { store("lang", langSelect.value); useLanguage(langSelect.value); });
  }
  if (savedLang !== "en") useLanguage(savedLang);

  /* ---------- read more / read less ---------- */
  $$("[data-more]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const extra = $(".more", btn.parentNode);
      const opening = extra.hidden;
      extra.hidden = !opening;
      btn.textContent = opening ? "Read less" : "Read more";
      btn.setAttribute("aria-expanded", String(opening));
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$(".faq button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;
      const opening = panel.hidden;
      panel.hidden = !opening;
      btn.setAttribute("aria-expanded", String(opening));
    });
  });

  /* ---------- random quote + copy ---------- */
  const quoteEl = $("#quote");
  if (quoteEl) {
    $("#newQuote").addEventListener("click", () => {
      quoteEl.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    });
    $("#copyQuote").addEventListener("click", () => {
      const note = $("#copied");
      const copy = navigator.clipboard ? navigator.clipboard.writeText(quoteEl.textContent) : Promise.reject();
      copy.then(
        () => { note.textContent = "Copied!"; },
        () => { note.textContent = "Copy failed. Select the text and copy it."; }
      );
    });
  }

  /* ---------- scroll to top ---------- */
  const topBtn = $("#top");
  window.addEventListener("scroll", () => { topBtn.hidden = window.scrollY < 400; }, { passive: true });
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Ask Queries form (opens the visitor's email app) ---------- */
  const askForm = $("#askForm");
  if (askForm) {
    askForm.addEventListener("submit", (e) => {
      e.preventDefault();
      location.href = "mailto:easyjainism@gmail.com?subject=" +
        encodeURIComponent("Question for Easy Jainism") +
        "&body=" + encodeURIComponent($("#aq").value);
    });
  }

  /* ---------- kids quiz ---------- */
  const quizBox = $("#quiz");
  if (quizBox) {
    let index = 0, score = 0;

    const showQuestion = () => {
      quizBox.innerHTML = "";
      if (index >= QUIZ.length) {
        quizBox.appendChild(make("h3", "", `You scored ${score} out of ${QUIZ.length}`));
        const again = make("button", "btn", "Play again");
        again.addEventListener("click", () => { index = 0; score = 0; showQuestion(); });
        quizBox.appendChild(again);
        return;
      }
      const item = QUIZ[index];
      quizBox.appendChild(make("h3", "", `${index + 1}/${QUIZ.length}. ${item.q}`));

      item.options.forEach((text, i) => {
        const opt = make("button", "opt", text);
        opt.addEventListener("click", () => {
          $$(".opt", quizBox).forEach((b, j) => {
            b.disabled = true;
            if (j === item.answer) b.classList.add("ok");
          });
          if (i === item.answer) score++; else opt.classList.add("no");
          const next = make("button", "btn", index < QUIZ.length - 1 ? "Next" : "See score");
          next.addEventListener("click", () => { index++; showQuestion(); });
          quizBox.appendChild(next);
          next.focus();
        });
        quizBox.appendChild(opt);
      });
    };
    showQuestion();
  }

  /* ---------- links to the current page: scroll instead of reloading ---------- */
  const currentFile = location.pathname.split("/").pop() || "index.html";
  $$("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (/^(#|https?:|mailto:)/.test(href)) return;
    const [file, hash] = href.replace("./", "").split("#");
    if (file !== currentFile) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = hash ? document.getElementById(hash) : null;
      if (target) target.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- back button ---------- */
  $$("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (history.length > 1 && document.referrer) history.back();
      else location.assign("home.html");
    });
  });

  /* ---------- click ripple + reveal on scroll ---------- */
  $$(".btn, .card, .opt, .rm, .faq button").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      const box = el.getBoundingClientRect();
      const dot = make("span", "rip");
      dot.style.left = e.clientX - box.left + "px";
      dot.style.top = e.clientY - box.top + "px";
      el.appendChild(dot);
      setTimeout(() => dot.remove(), 600);
    });
  });

  function revealOnScroll() {
    const items = $$(".sec h2, .sec .card, .sec p, .poster, .feat, .quote");
    items.forEach((el) => el.classList.add("rv"));
    if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    items.forEach((el) => observer.observe(el));
  }
  revealOnScroll();

  /* =====================================================================
     GOOGLE SHEET -> Books / Videos / Posters pages
     Sheet ID and tab names: set in config.js. Tabs: books, videos, posters.
     ===================================================================== */
  const SHEET_ID = window.EJ_SHEET_ID;
  const TAB = { books: "books", videos: "videos", poster: "posters" }[page];
  const grid = $("main .grid");

  /* --- read a CSV text into an array of {header: value} objects --- */
  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map((h) => h.trim().toLowerCase());
    return rows
      .filter((r) => r.join("").trim())
      .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
  }

  /* --- way 1: CSV through fetch --- */
  function loadCsv(id, tab) {
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${tab}`;
    return fetch(url).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }).then(parseCsv);
  }

  /* --- way 2 (backup): same data through a <script> tag, which needs no CORS --- */
  function loadScript(id, tab) {
    return new Promise((resolve, reject) => {
      const callback = "ejSheet" + Date.now();
      const tag = document.createElement("script");
      window[callback] = (res) => {
        tag.remove(); delete window[callback];
        if (!res || res.status === "error") return reject(new Error("sheet error"));
        const headers = res.table.cols.map((c) => (c.label || "").trim().toLowerCase());
        resolve(res.table.rows.map((r) => Object.fromEntries(
          headers.map((h, i) => [h, r.c[i] && r.c[i].v != null ? String(r.c[i].v).trim() : ""])
        )));
      };
      tag.onerror = () => { tag.remove(); reject(new Error("script blocked")); };
      tag.src = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?headers=1&sheet=${tab}&tqx=responseHandler:${callback}`;
      document.head.appendChild(tag);
    });
  }

  /* --- accept several column names so the sheet is easy to fill --- */
  function tidy(row) {
    return {
      title: row.title || row.name || "",
      description: row.description || row.author || "",
      link: row.link || row.url || row.youtube_link || row.yt_link || row.book_link || row.video_link || row.v_link || "",
      image: row.image || row.img_link || row.img || row.poster_link || ""
    };
  }

  const isWebLink = (u) => /^https?:\/\//i.test(u || "");

  function driveImage(url, width) {           // turn a Google Drive share link into a displayable image
    const m = (url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${width || 1200}` : url;
  }

  function addImage(card, url, alt, extraClass) {
    if (!isWebLink(driveImage(url))) return;
    const img = make("img", "pimg " + (extraClass || ""));
    img.src = driveImage(url);
    img.alt = alt || "";
    img.loading = "lazy";
    img.onerror = () => img.remove();   // hide the picture if it cannot be loaded
    card.appendChild(img);
  }

  function openButton(card, url, label) {
    if (!isWebLink(url)) return;
    const a = make("a", "btn", label || "Open");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    card.appendChild(a);
  }

  /* --- build one card per row --- */
  function bookCard(item) {
    const card = make("article", "card");
    addImage(card, item.image, item.title, "cover");
    card.appendChild(make("h3", "", item.title));
    if (item.description) card.appendChild(make("p", "", item.description));
    openButton(card, item.link, "Open book");
    return card;
  }

  function videoCard(item) {
    const card = make("article", "card");
    const link = item.link;
    const video = link.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
    const playlist = link.match(/[?&]list=([\w-]+)/);
    const drive = link.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    const embed = video ? "https://www.youtube-nocookie.com/embed/" + video[1]
                : playlist ? "https://www.youtube-nocookie.com/embed/videoseries?list=" + playlist[1]
                : drive ? "https://drive.google.com/file/d/" + drive[1] + "/preview" : "";

    if (embed) {                                   // a single video or playlist: play it on the page
      const frame = make("iframe", "vid");
      frame.src = embed; frame.title = item.title || "Video"; frame.loading = "lazy"; frame.allowFullscreen = true;
      card.appendChild(frame);
    } else if (isWebLink(link) && item.image) {    // a channel link: show the thumbnail, click opens YouTube
      const thumb = make("a", "thumb");
      thumb.href = link; thumb.target = "_blank"; thumb.rel = "noopener";
      card.appendChild(thumb);
      addImage(thumb, item.image, item.title);
    }
    card.appendChild(make("h3", "", item.title));
    if (item.description) card.appendChild(make("p", "", item.description));
    if (!embed) openButton(card, link, /youtu/.test(link) ? "Watch on YouTube" : "Watch");
    return card;
  }

  /* --- poster viewer: a clicked poster opens in a pop-up with a close button --- */
  let viewer = null, lastFocus = null;

  function closeViewer() {
    viewer.hidden = true;
    $("img", viewer).removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function buildViewer() {
    viewer = make("div", "modal");
    viewer.hidden = true;
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Poster viewer");
    const close = make("button", "close", "\u00d7");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    viewer.append(close, make("img"), make("p", "cap"));
    viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target === close) closeViewer(); });
    document.addEventListener("keydown", (e) => {
      if (viewer.hidden) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "Tab") { e.preventDefault(); close.focus(); }   // keep focus inside the pop-up
    });
    document.body.appendChild(viewer);
  }

  function openViewer(src, title, opener) {
    if (!viewer) buildViewer();
    const img = $("img", viewer);
    img.src = src;
    img.alt = title || "Poster";
    $(".cap", viewer).textContent = title || "";
    lastFocus = opener;
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    $(".close", viewer).focus();
  }

  function posterCard(item) {
    const full = driveImage(item.image, 1800);
    if (isWebLink(full)) {
      const card = make("figure", "card");
      const zoom = make("button", "zoom");
      zoom.type = "button";
      zoom.setAttribute("aria-label", "View poster: " + (item.title || "poster"));
      zoom.addEventListener("click", () => openViewer(full, item.title, zoom));
      card.appendChild(zoom);
      addImage(zoom, item.image, item.title || "Poster");
      if (item.title) card.appendChild(make("h3", "", item.title));
      return card;
    }
    const quote = make("figure", "poster");              // no image: show the title as a quote poster
    quote.appendChild(make("blockquote", "", item.title));
    return quote;
  }

  const statusEl = $("#status");
  const say = (text) => { if (statusEl) statusEl.textContent = text; };

  if (TAB && grid) {
    if (!SHEET_ID) {
      say("Content is not connected yet.");
    } else {
      loadCsv(SHEET_ID, TAB)
        .catch(() => loadScript(SHEET_ID, TAB))
        .then((rows) => {
          const items = rows.map(tidy).filter((i) => i.title || i.link || i.image);
          if (!items.length) { say("Nothing here yet. Please check back soon."); return; }
          const build = { books: bookCard, videos: videoCard, poster: posterCard }[page];
          grid.innerHTML = "";
          items.forEach((item) => grid.appendChild(build(item)));
          say("");
        })
        .catch(() => say("Could not load content right now. Please try again later."));
    }
  }
})();
