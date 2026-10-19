(function () {
  "use strict";

  var WEDDING_DATE = new Date("2027-10-09T18:00:00-03:00");

  /* ---------- Utilidades ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer;
  window.showToast = function (text) {
    toastEl.textContent = text;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2200);
  };

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (html != null) node.innerHTML = html;
    return node;
  }

  function waLink(number) { return "https://wa.me/" + number.replace(/\D/g, ""); }

  var ICONS = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icoWhatsapp"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icoInstagram"/></svg>',
    web: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icoGlobe"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icoPin"/></svg>',
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12.5a1.8 1.8 0 1 0 0-.01"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16v3h3v-2h10v2h3v-3l-1.6-5.3A2 2 0 0 0 16.5 9h-9a2 2 0 0 0-1.9 1.7L4 16Zm0 0h16M7.5 13.5h.01M16.5 13.5h.01"/></svg>',
    brush: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2L14 4ZM9 9l6 6M4 20l2.5-2.5"/></svg>',
    comb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16v3H4zM6 12v7M9 12v7M12 12v7M15 12v7M18 12v7"/></svg>'
  };

  /* ---------- Navegación ---------- */
  var header = document.getElementById("siteHeader");
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    document.body.classList.toggle("no-scroll", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  toggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  function onScroll() { header.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.6); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a"));
  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) sectionObserver.observe(target);
    });
  }

  /* ---------- Calendario ---------- */
  (function renderCalendar() {
    var cal = document.getElementById("calendar");
    ["lu", "ma", "mi", "ju", "vi", "sá", "do"].forEach(function (d) { cal.appendChild(el("span", { class: "dow" }, d)); });
    var year = 2027, month = 9;
    var offset = (new Date(year, month, 1).getDay() + 6) % 7;
    var days = new Date(year, month + 1, 0).getDate();
    for (var i = 0; i < offset; i++) cal.appendChild(el("span", { class: "day", "aria-hidden": "true" }));
    for (var d = 1; d <= days; d++) {
      var isWedding = d === 9;
      cal.appendChild(el("span", { class: "day" + (isWedding ? " day--wedding" : "") }, isWedding ? "<span>9</span>" : String(d)));
    }
  })();

  /* ---------- Cuenta regresiva ---------- */
  var countdownEls = {};
  document.querySelectorAll("#countdown [data-unit]").forEach(function (n) { countdownEls[n.dataset.unit] = n; });
  function tick() {
    var diff = Math.max(0, WEDDING_DATE - new Date());
    var s = Math.floor(diff / 1000);
    countdownEls.days.textContent = Math.floor(s / 86400);
    countdownEls.hours.textContent = String(Math.floor(s % 86400 / 3600)).padStart(2, "0");
    countdownEls.minutes.textContent = String(Math.floor(s % 3600 / 60)).padStart(2, "0");
    countdownEls.seconds.textContent = String(s % 60).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Copiar datos bancarios ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy");
    if (!btn) return;
    var text = btn.dataset.copy;
    var done = function () {
      btn.classList.add("is-done");
      btn.textContent = "Copiado";
      showToast("¡Copiado al portapapeles!");
      setTimeout(function () { btn.classList.remove("is-done"); btn.textContent = "Copiar"; }, 1800);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = el("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (err) { showToast(text); }
      ta.remove();
    }
  });

  /* ---------- Galería / lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = lightbox.querySelector("img");
  var photos = Array.prototype.slice.call(document.querySelectorAll("#gallery .polaroid"));
  var current = 0;
  function showPhoto(i) {
    current = (i + photos.length) % photos.length;
    lbImg.src = photos[current].dataset.full;
    lbImg.alt = photos[current].querySelector("img").alt;
  }
  function closeLightbox() { lightbox.hidden = true; document.body.classList.remove("no-scroll"); photos[current].focus(); }
  photos.forEach(function (p, i) {
    p.addEventListener("click", function () {
      showPhoto(i);
      lightbox.hidden = false;
      document.body.classList.add("no-scroll");
      lightbox.querySelector(".lightbox__close").focus();
    });
  });
  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox__nav--prev").addEventListener("click", function () { showPhoto(current - 1); });
  lightbox.querySelector(".lightbox__nav--next").addEventListener("click", function () { showPhoto(current + 1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPhoto(current - 1);
    if (e.key === "ArrowRight") showPhoto(current + 1);
  });
  var touchX = null;
  lightbox.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Guía del invitado ---------- */
  var GUIDE = [
    {
      id: "hospedaje", label: "Hospedaje", icon: "bed",
      intro: "Hoteles que recomendamos para su estadía.",
      items: [
        { kicker: "Hotel", name: "Rincón del Cerro", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/rincondelcerrosalta/" }] },
        { kicker: "Hotel", name: "Solar de la Plaza", links: [{ type: "web", label: "Sitio web", href: "https://www.solardelaplaza.com.ar/" }] },
        { kicker: "Hotel", name: "El Bodeguero", links: [{ type: "web", label: "Sitio web", href: "https://www.elbodeguerohotel.com.ar/" }] }
      ]
    },
    {
      id: "autos", label: "Alquiler de autos", icon: "car",
      intro: "Para moverse con libertad por la ciudad y las rutas salteñas.",
      items: [
        { kicker: "Particular", name: "Arturo", note: "+54 9 387 509 6506", links: [{ type: "wa", label: "WhatsApp", href: waLink("5493875096506") }] },
        { kicker: "Rent a car", name: "Hertz", note: "Sucursal Salta", links: [{ type: "web", label: "Reservar", href: "https://www.hertz.com.ar/alquiler-de-autos/salta" }] },
        { kicker: "Rent a car", name: "Alamo", note: "Aeropuerto Int. Martín Miguel de Güemes", links: [{ type: "web", label: "Reservar", href: "https://www.alamo.com/es/oficinas-de-alquiler-de-autos/ar/apto-int-de-salta-martin-miguel-de-guemes-lkoa.html" }] }
      ]
    },
    {
      id: "maquillaje", label: "Maquillaje", icon: "brush",
      intro: "Maquilladoras de Salta para lucir divinas.",
      items: [
        { kicker: "Maquilladora", name: "Vicky Rodríguez", note: "@makeup.vickyrodriguez", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/makeup.vickyrodriguez/" }, { type: "wa", label: "WhatsApp", href: waLink("5493874027899") }] },
        { kicker: "Maquilladora", name: "Ceci Correa", note: "@cecicorreamakeup", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/cecicorreamakeup/" }, { type: "wa", label: "WhatsApp", href: waLink("5493874840060") }] },
        { kicker: "Maquilladora", name: "Rochi Vidal", note: "@makeup.byrosario", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/makeup.byrosario/" }, { type: "wa", label: "WhatsApp", href: waLink("5493875910405") }] }
      ]
    },
    {
      id: "peinado", label: "Peinado", icon: "comb",
      intro: "Peinadoras recomendadas.",
      items: [
        { kicker: "Peinadora", name: "CC Peinados", note: "@cc.peinados", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/cc.peinados/" }, { type: "wa", label: "WhatsApp", href: waLink("5493874552018") }] },
        { kicker: "Peinadora", name: "Maca Torino", note: "@macatorino_peinados", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/macatorino_peinados/" }, { type: "wa", label: "WhatsApp", href: waLink("5491165688842") }] },
        { kicker: "Peinadora", name: "Sarusola Peinados", note: "@sarusola.peinados", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/sarusola.peinados/" }] },
        { kicker: "Peinadora", name: "Des Peinate", note: "@des.peinate", links: [{ type: "ig", label: "Instagram", href: "https://www.instagram.com/des.peinate/" }, { type: "wa", label: "WhatsApp", href: waLink("5493875932200") }] }
      ]
    }
  ];

  (function renderGuide() {
    var tabs = document.getElementById("guideTabs");
    var panels = document.getElementById("guidePanels");
    GUIDE.forEach(function (cat, i) {
      var tab = el("button", {
        class: "tab", type: "button", role: "tab", id: "tab-" + cat.id,
        "aria-controls": "panel-" + cat.id, "aria-selected": String(i === 0), tabindex: i === 0 ? "0" : "-1"
      }, ICONS[cat.icon] + "<span>" + cat.label + "</span>");
      tabs.appendChild(tab);

      var panel = el("div", { class: "guide-panel", role: "tabpanel", id: "panel-" + cat.id, "aria-labelledby": "tab-" + cat.id });
      if (i !== 0) panel.hidden = true;
      panel.appendChild(el("p", { class: "guide-panel__intro" }, cat.intro));
      cat.items.forEach(function (item) {
        var links = item.links.map(function (l) {
          return '<a class="chip-link" href="' + l.href + '" target="_blank" rel="noopener">' + ICONS[l.type] + l.label + "</a>";
        }).join("");
        panel.appendChild(el("article", { class: "guide-card" },
          '<span class="guide-card__kicker">' + item.kicker + "</span>" +
          '<h3 class="guide-card__name">' + item.name + "</h3>" +
          (item.note ? '<p class="guide-card__note">' + item.note + "</p>" : "") +
          '<div class="guide-card__links">' + links + "</div>"));
      });
      panels.appendChild(panel);
    });

    var tabEls = Array.prototype.slice.call(tabs.querySelectorAll(".tab"));
    function select(tab) {
      tabEls.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
    tabs.addEventListener("click", function (e) { var t = e.target.closest(".tab"); if (t) select(t); });
    tabs.addEventListener("keydown", function (e) {
      var i = tabEls.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowRight") select(tabEls[(i + 1) % tabEls.length]);
      if (e.key === "ArrowLeft") select(tabEls[(i - 1 + tabEls.length) % tabEls.length]);
    });
  })();

  /* ---------- Excursiones ---------- */
  var EXCURSIONS = [
    { slug: "cafayate", title: "Cafayate", sub: "Ruta del Vino", map: "https://maps.app.goo.gl/zYsf9jkCqXnG8fqu7",
      text: "Un recorrido entre montañas, quebradas y paisajes únicos hasta llegar a Cafayate, una de las principales regiones vitivinícolas de Argentina. Ideal para disfrutar de los Valles Calchaquíes y descubrir sus vinos y sabores." },
    { slug: "cachi", title: "Cachi", sub: "La magia de los Valles Calchaquíes", map: "https://maps.app.goo.gl/B4nFdSBE7Mkmgg5M8",
      text: "Una de las rutas más espectaculares de Salta: la Cuesta del Obispo y el Parque Nacional Los Cardones hasta llegar al encantador pueblo de Cachi, rodeado de montañas." },
    { slug: "salinas", title: "Salinas Grandes + Purmamarca", sub: "Paisajes que impresionan", map: "https://maps.app.goo.gl/Vjw1aAe2rbBZ2Qwe8",
      text: "Las enormes Salinas Grandes y la pintoresca Purmamarca, al pie del famoso Cerro de los Siete Colores. Algunos de los paisajes más impresionantes del Norte Argentino." },
    { slug: "humahuaca", title: "Humahuaca", sub: "Historia y colores del Norte", map: "https://maps.app.goo.gl/FcYcCpTBsTceAKBC6",
      text: "Un recorrido por la Quebrada de Humahuaca, Patrimonio de la Humanidad, para conocer sus pueblos, cultura y paisajes. Imprescindible para descubrir la esencia del Norte." },
    { slug: "tren", title: "Tren a las Nubes", sub: "A más de 4.000 metros de altura", map: "https://maps.app.goo.gl/PPU586Zbo2VxtKi46",
      text: "Combina un recorrido en bus por la Quebrada del Toro con el ascenso en tren hasta el Viaducto La Polvorilla. ¡Una de las grandes experiencias de Salta!" },
    { slug: "rafting", title: "Rafting en el Río Juramento", sub: "Aventura y naturaleza", map: "https://maps.app.goo.gl/Nm1bscSAxRfGzuiL7",
      text: "Para quienes buscan algo distinto: rafting rodeados de naturaleza, con traslado desde Salta y, para completar el día, un delicioso asado." }
  ];

  (function renderExcursions() {
    var wrap = document.getElementById("excursions");
    EXCURSIONS.forEach(function (x) {
      var imgs = [1, 2, 3].map(function (n) {
        return '<img src="assets/salta/' + x.slug + "-" + n + '.jpg" alt="' + x.title + ", foto " + n + '" loading="lazy">';
      }).join("");
      var dots = [0, 1, 2].map(function (n) {
        return '<button type="button" aria-label="Ver foto ' + (n + 1) + '"' + (n === 0 ? ' aria-current="true"' : "") + "></button>";
      }).join("");
      var card = el("article", { class: "excursion reveal" },
        '<div class="excursion__media">' +
          '<div class="slides">' + imgs + "</div>" +
          '<button class="slide-arrow slide-arrow--prev" type="button" aria-label="Foto anterior">‹</button>' +
          '<button class="slide-arrow slide-arrow--next" type="button" aria-label="Foto siguiente">›</button>' +
          '<div class="slide-dots">' + dots + "</div>" +
        "</div>" +
        '<div class="excursion__body">' +
          '<span class="excursion__num"></span>' +
          '<h3 class="excursion__title">' + x.title + "</h3>" +
          '<p class="excursion__sub">' + x.sub + "</p>" +
          '<p class="excursion__text">' + x.text + "</p>" +
          '<a class="chip-link" href="' + x.map + '" target="_blank" rel="noopener">' + ICONS.pin + "Saliendo de Salta</a>" +
        "</div>");
      wrap.appendChild(card);

      var slides = card.querySelector(".slides");
      var dotEls = card.querySelectorAll(".slide-dots button");
      function go(i) { slides.scrollTo({ left: slides.clientWidth * i, behavior: "smooth" }); }
      function index() { return Math.round(slides.scrollLeft / slides.clientWidth); }
      dotEls.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
      card.querySelector(".slide-arrow--prev").addEventListener("click", function () { go((index() + 2) % 3); });
      card.querySelector(".slide-arrow--next").addEventListener("click", function () { go((index() + 1) % 3); });
      slides.addEventListener("scroll", function () {
        var i = index();
        dotEls.forEach(function (d, n) { if (n === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
      }, { passive: true });
    });
  })();

  /* ---------- Animaciones de entrada ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !/[?&]shot\b/.test(location.search)) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (n) { revealObserver.observe(n); });
  } else {
    revealEls.forEach(function (n) { n.classList.add("is-visible"); });
  }
})();
