(function () {
  "use strict";

  var CFG = window.SOLTEROS_CONFIG || {};
  var API = CFG.SUPABASE_URL;
  var HEADERS = { apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY };
  var DEMO = new URLSearchParams(location.search).has("demo");
  var SEEN_KEY = "solteros-vistos-" + CFG.EVENT_SLUG;

  var deck = document.getElementById("deck");
  var likeBtn = document.getElementById("likeBtn");
  var passBtn = document.getElementById("passBtn");
  var filterBtns = document.querySelectorAll(".singles-filter button");

  var profiles = [];
  var queue = [];
  var filter = "todos";
  var seen = readSeen();

  function readSeen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch (e) { return []; }
  }
  function markSeen(id) {
    if (seen.indexOf(id) === -1) seen.push(id);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* sin almacenamiento */ }
  }

  function cleanIg(value) {
    return String(value || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
  }

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- Carga de perfiles ---------- */
  var DEMO_PROFILES = [
    { id: "d1", nombre: "Sofía", edad: 29, genero: "mujer", descripcion: "Prima de la novia. Amo el vino de Cafayate y bailar hasta que prendan las luces.", instagram: "instagram" },
    { id: "d2", nombre: "Martín", edad: 32, genero: "hombre", descripcion: "Amigo de Gabi desde el colegio. Prometo no pisarte en el vals.", instagram: "instagram" },
    { id: "d3", nombre: "Valentina", edad: 27, genero: "mujer", descripcion: "Vengo desde Ecuador. Busco compañero de excursión al Tren a las Nubes.", instagram: "instagram" }
  ];

  function loadProfiles() {
    if (DEMO) { profiles = DEMO_PROFILES; buildQueue(); return; }
    renderMessage("Cargando perfiles…", "");
    var url = API + "/rest/v1/" + CFG.TABLE +
      "?select=id,nombre,edad,genero,descripcion,instagram,foto_url" +
      "&event_slug=eq." + encodeURIComponent(CFG.EVENT_SLUG) +
      "&visible=eq.true&order=created_at.desc";
    fetch(url, { headers: HEADERS })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { profiles = rows || []; buildQueue(); })
      .catch(function () { profiles = []; buildQueue(); });
  }

  function buildQueue() {
    queue = profiles.filter(function (p) {
      return seen.indexOf(String(p.id)) === -1 && (filter === "todos" || p.genero === filter);
    });
    renderDeck();
  }

  /* ---------- Render ---------- */
  function renderMessage(title, text, withRestart) {
    deck.innerHTML = "";
    var box = node("div", "deck-empty");
    box.appendChild(node("span", "script", title));
    if (text) box.appendChild(node("p", null, text));
    if (withRestart) {
      var again = node("button", "btn btn--outline-light", "Volver a ver todos");
      again.type = "button";
      again.addEventListener("click", function () {
        seen = [];
        try { localStorage.removeItem(SEEN_KEY); } catch (e) { /* nada */ }
        buildQueue();
      });
      box.appendChild(again);
    }
    deck.appendChild(box);
    likeBtn.disabled = passBtn.disabled = true;
  }

  function renderDeck() {
    if (!queue.length) {
      var hasAny = profiles.some(function (p) { return filter === "todos" || p.genero === filter; });
      if (hasAny) renderMessage("¡Eso es todo!", "Ya viste todos los perfiles. Volvé más tarde: se suman nuevos solteros todo el tiempo.", true);
      else renderMessage("Todavía no hay perfiles", "¡Sé el primero en sumarte y animá al resto!");
      return;
    }
    deck.innerHTML = "";
    // Las últimas tarjetas del DOM quedan arriba: se agregan en orden inverso.
    queue.slice(0, 3).reverse().forEach(function (p) { deck.appendChild(buildCard(p)); });
    likeBtn.disabled = passBtn.disabled = false;
    attachDrag(deck.lastElementChild);
  }

  function buildCard(p) {
    var card = node("article", "card");
    card.dataset.id = p.id;
    card.setAttribute("aria-label", p.nombre + ", " + p.edad + " años");
    if (p.foto_url) {
      var img = node("img");
      img.src = p.foto_url;
      img.alt = "Foto de " + p.nombre;
      img.draggable = false;
      card.appendChild(img);
    } else {
      card.appendChild(node("div", "card__placeholder", (p.nombre || "?").charAt(0)));
    }
    if (DEMO) card.appendChild(node("span", "card__badge", "Ejemplo"));
    card.appendChild(node("span", "stamp stamp--like", "Me gusta"));
    card.appendChild(node("span", "stamp stamp--pass", "Paso"));
    var info = node("div", "card__info");
    var name = node("h3", "card__name", p.nombre);
    name.appendChild(node("small", null, String(p.edad)));
    info.appendChild(name);
    info.appendChild(node("p", "card__desc", p.descripcion));
    card.appendChild(info);
    return card;
  }

  /* ---------- Swipe ---------- */
  function attachDrag(card) {
    var startX = 0, startY = 0, dx = 0, dragging = false;
    var like = card.querySelector(".stamp--like");
    var pass = card.querySelector(".stamp--pass");

    card.addEventListener("pointerdown", function (e) {
      dragging = true; startX = e.clientX; startY = e.clientY; dx = 0;
      card.setPointerCapture(e.pointerId);
      card.classList.add("is-dragging");
    });
    card.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      var dy = (e.clientY - startY) * 0.3;
      card.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx / 18 + "deg)";
      like.style.opacity = Math.max(0, Math.min(1, dx / 90));
      pass.style.opacity = Math.max(0, Math.min(1, -dx / 90));
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");
      if (dx > 100) decide(true);
      else if (dx < -100) decide(false);
      else { card.style.transform = ""; like.style.opacity = pass.style.opacity = 0; }
    }
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  function decide(liked) {
    var card = deck.querySelector(".card:last-of-type");
    if (!card) return;
    var p = queue[0];
    card.querySelector(liked ? ".stamp--like" : ".stamp--pass").style.opacity = 1;
    card.style.transform = "translate(" + (liked ? 140 : -140) + "%, -20px) rotate(" + (liked ? 24 : -24) + "deg)";
    card.style.opacity = "0";
    likeBtn.disabled = passBtn.disabled = true;
    markSeen(String(p.id));
    queue.shift();
    setTimeout(function () {
      if (liked) showMatch(p); else renderDeck();
    }, 320);
  }

  function showMatch(p) {
    renderDeck();
    var box = node("div", "deck-match");
    if (p.foto_url) {
      var img = node("img", "deck-match__photo");
      img.src = p.foto_url; img.alt = "";
      box.appendChild(img);
    }
    box.appendChild(node("span", "script", "¡Te gustó " + p.nombre + "!"));
    box.appendChild(node("p", null, "Animate a escribirle antes de la boda."));
    var ig = cleanIg(p.instagram);
    var link = node("a", "btn btn--cream", "@" + ig);
    link.href = "https://www.instagram.com/" + encodeURIComponent(ig) + "/";
    link.target = "_blank"; link.rel = "noopener";
    box.appendChild(link);
    var next = node("button", "btn btn--outline-light", "Seguir mirando");
    next.type = "button";
    next.addEventListener("click", function () { box.remove(); likeBtn.disabled = passBtn.disabled = !queue.length; });
    box.appendChild(next);
    deck.appendChild(box);
    likeBtn.disabled = passBtn.disabled = true;
  }

  likeBtn.addEventListener("click", function () { decide(true); });
  passBtn.addEventListener("click", function () { decide(false); });

  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      filter = b.dataset.filter;
      filterBtns.forEach(function (o) { o.setAttribute("aria-checked", String(o === b)); });
      buildQueue();
    });
  });

  /* ---------- Formulario ---------- */
  var modal = document.getElementById("singlesModal");
  var form = document.getElementById("singlesForm");
  var msg = document.getElementById("singlesMsg");
  var preview = document.getElementById("photoPreview");
  var photoBlob = null;

  function openModal() { modal.hidden = false; document.body.classList.add("no-scroll"); form.querySelector("input[name=nombre]").focus(); }
  function closeModal() { modal.hidden = true; document.body.classList.remove("no-scroll"); }
  document.getElementById("openSinglesForm").addEventListener("click", openModal);
  modal.addEventListener("click", function (e) { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  // Comprime la foto en el navegador (máx. 1000 px, JPEG) antes de subirla.
  function compress(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, 1000 / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("blob")); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("img")); };
      img.src = url;
    });
  }

  form.foto.addEventListener("change", function () {
    var file = form.foto.files[0];
    photoBlob = null;
    if (!file) return;
    compress(file).then(function (blob) {
      photoBlob = blob;
      preview.innerHTML = "";
      var img = node("img");
      img.src = URL.createObjectURL(blob);
      img.alt = "Vista previa de tu foto";
      preview.appendChild(img);
    }).catch(function () { setMsg("No pudimos leer esa imagen. Probá con otra (JPG o PNG)."); });
  });

  function setMsg(text, ok) { msg.textContent = text; msg.classList.toggle("is-ok", !!ok); }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      nombre: form.nombre.value.trim(),
      edad: parseInt(form.edad.value, 10),
      genero: (form.querySelector("input[name=genero]:checked") || {}).value,
      descripcion: form.descripcion.value.trim(),
      instagram: cleanIg(form.instagram.value)
    };
    if (!photoBlob) return setMsg("Subí una foto para tu perfil.");
    if (!data.nombre) return setMsg("Contanos tu nombre.");
    if (!(data.edad >= 18 && data.edad <= 99)) return setMsg("Ingresá una edad válida (18 o más).");
    if (!data.genero) return setMsg("Elegí una opción en “Soy”.");
    if (!data.descripcion) return setMsg("Contá algo de vos.");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(data.instagram)) return setMsg("Revisá tu usuario de Instagram.");
    if (!form.consent.checked) return setMsg("Necesitamos tu autorización para mostrar el perfil.");

    var submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    setMsg("Publicando tu perfil…", true);

    if (DEMO) {
      setTimeout(function () { finish(Object.assign({ id: "demo-" + uuid(), foto_url: URL.createObjectURL(photoBlob) }, data)); }, 600);
      return;
    }

    var path = CFG.EVENT_SLUG + "/" + uuid() + ".jpg";
    fetch(API + "/storage/v1/object/" + CFG.BUCKET + "/" + path, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "image/jpeg", "x-upsert": "false" }, HEADERS),
      body: photoBlob
    })
      .then(function (r) { if (!r.ok) throw new Error("upload " + r.status); })
      .then(function () {
        var row = Object.assign({ event_slug: CFG.EVENT_SLUG, foto_url: API + "/storage/v1/object/public/" + CFG.BUCKET + "/" + path }, data);
        return fetch(API + "/rest/v1/" + CFG.TABLE, {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=representation" }, HEADERS),
          body: JSON.stringify(row)
        });
      })
      .then(function (r) { if (!r.ok) throw new Error("insert " + r.status); return r.json(); })
      .then(function (rows) { finish(rows[0]); })
      .catch(function () {
        submit.disabled = false;
        setMsg("No pudimos publicar tu perfil. Revisá tu conexión e intentá de nuevo.");
      });

    function finish(profile) {
      submit.disabled = false;
      form.reset();
      photoBlob = null;
      preview.innerHTML = "<span>Subí tu mejor foto</span>";
      setMsg("");
      closeModal();
      markSeen(String(profile.id)); // no te mostramos tu propio perfil
      profiles.unshift(profile);
      buildQueue();
      if (window.showToast) showToast("¡Listo! Tu perfil ya está publicado");
    }
  });

  loadProfiles();
})();
