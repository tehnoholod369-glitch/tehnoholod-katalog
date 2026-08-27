/**
 * Сквозной поиск по всему каталогу.
 *
 * Поиск внутри группы уже есть в выдаче, но клиент, который знает модель или
 * артикул, ищет по всему каталогу сразу. Индекс — data/search-index.json,
 * колоночный: поля перечислены один раз, дальше только значения.
 * Грузится лениво, при первом открытии окна, и переиспользуется всеми страницами.
 *
 * Разметка страниц не трогается: любой элемент с атрибутом data-th-search
 * открывает окно поиска — обработчик висит на документе и переживает
 * перерисовку компонентов DC.
 */
(function () {
  var DATA = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var ID = "th-search-layer";
  var IDX = null;      // {fields, rows}
  var LOADING = null;
  var TITLES = null;

  function loadIndex() {
    if (IDX) return Promise.resolve(IDX);
    if (LOADING) return LOADING;
    LOADING = fetch(DATA + "search-index.json", {cache:"no-cache"})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.rows) return null;
        var f = {};
        d.fields.forEach(function (name, i) { f[name] = i; });
        IDX = { f: f, rows: d.rows, updated: d.updated };
        return IDX;
      })
      .catch(function () { return null; });
    fetch(DATA + "index.json", {cache:"no-cache"}).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        TITLES = {};
        ((d && d.groups) || []).forEach(function (g) { TITLES[g.slug] = g.title; });
      }).catch(function () { TITLES = {}; });
    return LOADING;
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/gi, " ").trim();
  }

  /** Ранг: точный артикул выше начала артикула, начало — выше вхождения в название. */
  function score(row, f, q, tokens) {
    var sku = norm(row[f.s]);
    var name = norm(row[f.n] + " " + row[f.b] + " " + row[f.sub]);
    var hay = sku + " " + name;
    for (var i = 0; i < tokens.length; i++) if (hay.indexOf(tokens[i]) < 0) return -1;
    var s = 0;
    if (sku === q) s += 1000;
    else if (sku.indexOf(q) === 0) s += 500;
    else if (sku.indexOf(q) >= 0) s += 200;
    if (name.indexOf(q) === 0) s += 120;
    else if (name.indexOf(q) >= 0) s += 60;
    if (row[f["in"]]) s += 25;          // в наличии — выше: его можно купить сегодня
    if (row[f.p]) s += 5;               // с ценой — выше, чем «по запросу»
    return s;
  }

  function href(row, f) {
    var g = row[f.g];
    if (g === "multisplit") return "Мультисплит - конструктор.dc.html";
    return "Карточка модели.dc.html?g=" + encodeURIComponent(g) + "&sl=" + encodeURIComponent(row[f.sl]);
  }

  function money(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₸";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function build() {
    var layer = document.createElement("div");
    layer.id = ID;
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-label", "Поиск по каталогу");
    layer.style.cssText = "position:fixed;inset:0;z-index:60;background:rgba(7,28,59,0.55);"
      + "display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px 16px 16px;font-family:inherit";
    layer.innerHTML =
      '<div style="background:#fff;border-radius:16px;width:100%;max-width:720px;max-height:86vh;display:flex;'
      + 'flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(7,28,59,0.32)">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #E9EFF7">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0872D3" stroke-width="1.8" stroke-linecap="round" style="display:block;flex:none"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>'
      + '<input id="th-search-input" type="search" autocomplete="off" placeholder="Модель, артикул или бренд — например TAC-FR09 или Ballu"'
      + ' style="flex:1;border:0;outline:none;font-family:inherit;font-size:16px;color:#18212F;min-width:0" />'
      + '<button type="button" data-th-search-close aria-label="Закрыть поиск"'
      + ' style="border:0;background:#F3F7FB;color:#5A6675;border-radius:8px;padding:7px 11px;font-size:13px;font-weight:600;cursor:pointer">Esc</button>'
      + '</div>'
      + '<div id="th-search-results" style="overflow:auto;padding:6px 8px 12px 8px"></div>'
      + '<div id="th-search-foot" style="border-top:1px solid #E9EFF7;padding:9px 16px;font-size:12px;color:#8593A6"></div>'
      + '</div>';
    layer.addEventListener("click", function (e) {
      if (e.target === layer || e.target.closest("[data-th-search-close]")) close();
    });
    return layer;
  }

  function render(q) {
    var box = document.getElementById("th-search-results");
    var foot = document.getElementById("th-search-foot");
    if (!box) return;
    if (!IDX) {
      box.innerHTML = '<div style="padding:22px;color:#5A6675;font-size:14px">Загружаем каталог…</div>';
      return;
    }
    var f = IDX.f;
    var qq = norm(q);
    if (qq.length < 2) {
      box.innerHTML = '<div style="padding:22px;color:#5A6675;font-size:14px;line-height:1.6">'
        + 'Введите модель, артикул или бренд. Поиск идёт по всем группам каталога сразу — '
        + 'позиций в индексе: ' + IDX.rows.length + '.</div>';
      foot.textContent = "Данные каталога от " + (IDX.updated || "—");
      return;
    }
    var tokens = qq.split(" ").filter(Boolean);
    var hits = [];
    for (var i = 0; i < IDX.rows.length; i++) {
      var s = score(IDX.rows[i], f, qq, tokens);
      if (s >= 0) hits.push([s, IDX.rows[i]]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    var shown = hits.slice(0, 30);
    if (!shown.length) {
      box.innerHTML = '<div style="padding:22px;color:#5A6675;font-size:14px;line-height:1.6">'
        + 'Ничего не нашли. Проверьте артикул или напишите площадь помещения в WhatsApp — подберём вручную.</div>';
      foot.textContent = "";
      return;
    }
    box.innerHTML = shown.map(function (h) {
      var r = h[1];
      var inStock = r[f["in"]];
      return '<a href="' + esc(href(r, f)) + '" style="display:flex;gap:12px;align-items:flex-start;'
        + 'padding:11px 12px;border-radius:10px;color:#18212F;text-decoration:none">'
        + '<span style="flex:1;min-width:0">'
        + '<span style="display:block;font-size:14px;font-weight:600;line-height:1.35">' + esc(r[f.n]) + '</span>'
        + '<span style="display:block;font-size:12px;color:#8593A6;margin-top:3px">'
        + (r[f.s] ? "арт. " + esc(r[f.s]) + " · " : "")
        + esc((TITLES && TITLES[r[f.g]]) || r[f.g]) + (r[f.sub] ? " · " + esc(r[f.sub]) : "")
        + '</span></span>'
        + '<span style="text-align:right;flex:none">'
        + '<span style="display:block;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums">'
        + (r[f.p] ? money(r[f.p]) : "по запросу") + '</span>'
        + '<span style="display:block;font-size:12px;font-weight:600;margin-top:3px;color:'
        + (inStock ? "#0E9F6E" : "#B25200") + '">' + (inStock ? "в наличии" : "под заказ") + '</span>'
        + '</span></a>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll("a"), function (a) {
      a.addEventListener("mouseenter", function () { a.style.background = "#F3F7FB"; });
      a.addEventListener("mouseleave", function () { a.style.background = ""; });
    });
    foot.textContent = "Показано " + shown.length + " из " + hits.length
      + " · данные каталога от " + (IDX.updated || "—");
  }

  function open(initial) {
    var layer = document.getElementById(ID);
    if (!layer) {
      layer = build();
      document.body.appendChild(layer);
      var input = document.getElementById("th-search-input");
      var t = null;
      input.addEventListener("input", function () {
        clearTimeout(t);
        var v = input.value;
        t = setTimeout(function () { render(v); }, 90);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          var first = document.querySelector("#th-search-results a");
          if (first) location.href = first.getAttribute("href");
        }
      });
    }
    layer.style.display = "flex";
    document.body.style.overflow = "hidden";
    var inp = document.getElementById("th-search-input");
    if (initial) inp.value = initial;
    inp.focus();
    inp.select();
    render(inp.value);
    loadIndex().then(function () { render(inp.value); });
  }

  function close() {
    var layer = document.getElementById(ID);
    if (layer) layer.style.display = "none";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-th-search]") : null;
    if (t) { e.preventDefault(); open(""); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
    if ((e.key === "k" || e.key === "л") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(""); }
  });

  window.THSearch = { open: open, close: close, load: loadIndex };
})();
