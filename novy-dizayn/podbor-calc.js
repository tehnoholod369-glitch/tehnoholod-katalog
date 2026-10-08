/**
 * Подбор кондиционера по площади — три шага и три модели (08.10.2026).
 * Живёт на странице /podbor-kondicionera, без рамки. Формула мощности — та же, что у подборщика
 * podbor.tehnoholod369.kz (calc): 100 Вт/м² × (потолок / 2,7) × (1 + солнце 0,2 + верхний этаж 0,1 + кухня 0,2),
 * перевод в BTU × 3,412, ближайший класс из ряда не ниже расчёта (сверка математики 09.10.2026: допуск 5 % «вниз» убран). Данные моделей — data/bytovye.json каталога.
 * Любая ошибка оставляет страницу рабочей: калькулятор просто не рисуется, текст страницы остаётся.
 */
(function () {
  "use strict";
  var ROOT = document.getElementById("pk-app");
  if (!ROOT || ROOT.getAttribute("data-ready")) return;
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/bytovye.json";
  var RAWP = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/poluprom.json";
  var CLASSES = [7000, 9000, 12000, 18000, 24000, 36000, 48000, 60000];
  var AREAS = [[20, "до 20 м²"], [25, "20–25 м²"], [35, "25–35 м²"], [50, "35–50 м²"], [70, "50–70 м²"], [100, "70–100 м²"], [150, "100–150 м²"], [999, "больше 150 м²"]];
  var HEIGHTS = [[2.5, "2,5 м"], [2.7, "2,7 м"], [3.0, "3 м"], [3.5, "3,5 м"], [4.0, "4 м и выше"]];
  var BUDGETS = [[150000, "до 150 000 ₸"], [250000, "до 250 000 ₸"], [350000, "до 350 000 ₸"], [0, "любой"]];
  var S = { area: 25, h: 2.7, sun: false, top: false, kit: false, quiet: false, econ: false, fresh: false, wifi: false, budget: 0 };
  var DATA = null, DATAP = null, PSTATE = 0;
  var TYPES = { "Кассетные": "кассетный", "Канальные": "канальный", "Напольно-потолочные": "напольно-потолочный", "Колонные": "колонный", "Консольные": "консольный" };

  // Стартовые значения из адреса: ?area=30&h=3&sun=1&top=1&kit=1&quiet=1&econ=1&fresh=1&wifi=1&budget=250000
  function initFromUrl() {
    try {
      var q = new URLSearchParams(location.search), n;
      n = Math.round(+q.get("area")); if (n >= 5 && n <= 300) S.area = n;
      n = +String(q.get("h") || "").replace(",", "."); if (n >= 2.4 && n <= 4.5) S.h = HEIGHTS.reduce(function (b, a) { return Math.abs(a[0] - n) < Math.abs(b - n) ? a[0] : b; }, 2.7);
      ["sun", "top", "kit", "quiet", "econ", "fresh", "wifi"].forEach(function (k) { if (q.get(k) === "1") S[k] = true; });
      n = +q.get("budget"); if (BUDGETS.some(function (b) { return b[0] === n; })) S.budget = n;
    } catch (e) { /* адрес без параметров — остаются значения по умолчанию */ }
  }

  function $(s, r) { return (r || ROOT).querySelector(s); }
  function photo(u) { u = String(u || ""); if (!u) return ""; return /^https?:\/\//.test(u) ? u : "https://img.tehnoholod369.kz/" + u.replace(/^\/+/, ""); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " "); }

  function calc() {
    var k = 1 + (S.sun ? 0.2 : 0) + (S.top ? 0.1 : 0) + (S.kit ? 0.2 : 0);
    var w = S.area * 100 * (S.h / 2.7) * k;
    var btu = Math.round(w * 3.412);
    var need = btu;   // класс берём не ниже расчётной потребности: допуска «вниз» нет
    var mode = S.area > 150 ? "proj" : S.area > 70 ? "big" : "std", cls = null;
    if (mode === "std") {
      for (var i = 0; i < CLASSES.length; i++) { if (CLASSES[i] >= need) { cls = CLASSES[i]; break; } }
      if (!cls) mode = "big";
    }
    return { k: k, w: Math.round(w), btu: btu, need: need, cls: cls, mode: mode };
  }
  function btuOf(m) { return Number(String(spv(m, /^btu$/i)).replace(/\s/g, "")) || 0; }

  function spv(m, re) {
    var r = (m.sp || []).filter(function (x) { return re.test(String(x[0])); })[0];
    return r ? String(r[1]) : "";
  }
  // Шум внутреннего блока, дБ: берём только внутренний блок и только режим охлаждения, значения меньше 10 — «нет данных»
  // (в данных LG встречается «нагрев … 0 дБ»), из диапазона берём минимум — самый тихий режим.
  function noiseOf(m) {
    var rows = (m.sp || []).filter(function (r) { return /^шум/i.test(String(r[0])) && !/наружн/i.test(String(r[0])); });
    if (!rows.length) return null;
    var v = String(rows[0][1]), part = v.match(/охлажд[^;]*/i);
    if (part) v = part[0];
    var n = (v.match(/\d+(?:[.,]\d+)?/g) || []).map(function (x) { return parseFloat(x.replace(",", ".")); }).filter(function (x) { return x >= 10; });
    return n.length ? Math.min.apply(null, n) : null;
  }
  function info(m) {
    return {
      m: m, noise: noiseOf(m), inv: m.inv === "inv",
      eff: (spv(m, /^класс энергоэфф/i).match(/A\+*/) || [""])[0],
      fresh: /^да/i.test(spv(m, /^приток/i)), wifi: /^(есть|встроен)/i.test(spv(m, /^wi-?fi/i))
    };
  }
  function effRank(e) { return e === "A+++" ? 3 : e === "A++" ? 2 : e === "A+" ? 1 : 0; }
  function score(x) {
    var s = 0;
    if (S.quiet && x.noise != null) s += 3 - Math.min(3, Math.max(0, (x.noise - 18) / 6));
    if (S.econ) s += (x.inv ? 2 : 0) + effRank(x.eff) / 2;
    if (S.fresh && x.fresh) s += 3;
    if (S.wifi && x.wifi) s += 2;
    return s;
  }
  // Пул моделей: до 70 м² — настенные нужного класса; 70–150 м² — настенные и полупромышленные в диапазоне [потребность; потребность × 1,4]
  function poolFor(c) {
    var pool = [];
    if (c.mode === "std") {
      pool = DATA.filter(function (m) { return !m.acc && m.sub === "Настенные" && m.p > 0 && m.num > 0 && btuOf(m) >= c.need && btuOf(m) <= c.cls * 1.15; }).map(function (m) { m.g = "bytovye"; return info(m); });
    } else {
      var lo = c.need, hi = c.need * 1.4;
      [[DATA, "bytovye", "Настенные"], [DATAP || [], "poluprom", null]].forEach(function (src) {
        src[0].forEach(function (m) {
          var v = btuOf(m);
          if (!m.acc && m.p > 0 && v >= lo && v <= hi && (!src[2] || m.sub === src[2])) { m.g = src[1]; pool.push(info(m)); }
        });
      });
    }
    return pool;
  }
  function pick(c) {
    var pool = poolFor(c);
    var inStock = pool.filter(function (x) { return x.m.st === "В наличии"; });
    var base = inStock.length >= 3 ? inStock : pool;
    var note = "";
    var cand = S.budget ? base.filter(function (x) { return x.m.p <= S.budget; }) : base;
    if (S.budget && !cand.length) { cand = base; note = "В выбранный бюджет моделей этого класса нет, показываем ближайшие по цене."; }
    cand = cand.slice().sort(function (a, b) { return a.m.p - b.m.p; });
    // Подписи карточек — факты по данным, а не оценки: самый доступный, самый тихий и т. д.
    var out = [], used = [];
    function add(x, tag) { if (x && used.indexOf(x) < 0 && out.length < 3) { used.push(x); out.push({ x: x, tag: tag }); } }
    function first(arr, fn, sortFn) { var f = arr.filter(fn); if (sortFn) f = f.slice().sort(sortFn); return f[0]; }
    var byPrice = function (a, b) { return a.m.p - b.m.p; };
    add(cand[0], "Самый доступный");
    var any = S.quiet || S.econ || S.fresh || S.wifi;
    var quiet = function () { add(first(cand, function (x) { return x.noise != null; }, function (a, b) { return a.noise - b.noise || a.m.p - b.m.p; }), "Самый тихий"); };
    var econ = function () { add(first(cand, function (x) { return x.inv && effRank(x.eff) >= 2; }, function (a, b) { return effRank(b.eff) - effRank(a.eff) || a.m.p - b.m.p; }), "Самый экономичный"); };
    if (S.quiet) quiet();
    if (S.econ) econ();
    if (S.fresh) add(first(cand, function (x) { return x.fresh; }, byPrice), "С притоком воздуха");
    if (S.wifi) add(first(cand, function (x) { return x.wifi; }, byPrice), "С Wi-Fi");
    if (!any) { quiet(); econ(); }
    for (var i = 0; i < cand.length && out.length < 3; i++) add(cand[i], "Ещё вариант");
    out.sort(function (a, b) { return a.x.m.p - b.x.m.p; });
    var cls = cand.length ? Math.min.apply(null, cand.map(function (x) { return btuOf(x.m); })) : null;
    return { list: out, note: note, total: cand.length, cls: cls };
  }
  function ensureP(cb) {
    if (DATAP || PSTATE === 1) return;
    PSTATE = 1;
    fetch(RAWP, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { DATAP = d; PSTATE = 2; cb(); })
      .catch(function () { DATAP = []; PSTATE = 2; cb(); });
  }

  function facts(x) {
    var f = [];
    if (TYPES[x.m.sub]) f.push(TYPES[x.m.sub]);
    f.push(x.inv ? "Инвертор" : "ON/OFF");
    if (x.noise != null) f.push("от " + String(x.noise).replace(".", ",") + " дБ");
    if (x.fresh) f.push("приток воздуха");
    if (x.wifi) f.push("Wi-Fi");
    if (x.eff) f.push("класс " + x.eff);
    return f.slice(0, 6);
  }
  function card(o) {
    var m = o.x.m, href = "/tovar?g=" + (m.g || "bytovye") + "&sl=" + encodeURIComponent(m.sl);
    var name = (m.b ? m.b + " " : "") + (m.nb || m.n);
    return '<article class="pkc-m"><a class="pkc-ph" href="' + href + '"><img src="' + esc(photo(m.i)) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'"></a>' +
      '<div class="pkc-tag">' + esc(o.tag) + '</div><h3><a href="' + href + '">' + esc(name) + '</a></h3>' +
      '<ul class="pkc-facts"><li>' + esc(fmt(Number(spv(m, /^btu$/i)))) + ' BTU</li><li>до ' + esc(m.num) + ' м²</li>' +
      facts(o.x).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul>' +
      '<div class="pkc-price">' + esc(fmt(m.p)) + ' ₸</div>' +
      '<div class="pkc-stock' + (m.st === "В наличии" ? "" : " pkc-stock--o") + '">' + esc(m.st) + '</div>' +
      '<a class="pkc-btn" href="' + href + '">Подробнее</a></article>';
  }

  function chips(list, cur, attr, labelFn) {
    return list.map(function (a) {
      return '<button type="button" class="pkc-chip' + (a[0] === cur ? " on" : "") + '" aria-pressed="' + (a[0] === cur) + '" data-' + attr + '="' + a[0] + '">' + a[1] + "</button>";
    }).join("");
  }
  function tog(key, label, on) {
    return '<button type="button" class="pkc-chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-tog="' + key + '">' + label + "</button>";
  }
  function opt(key, title, sub) {
    var on = S[key];
    return '<button type="button" class="pkc-opt' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-tog="' + key + '"><b>' + title + "</b><span>" + sub + "</span></button>";
  }
  function areaCur() { for (var i = 0; i < AREAS.length; i++) { if (S.area === AREAS[i][0]) return S.area; } return -1; }

  function render() {
    var c = calc();
    var steps =
      '<div class="pkc-sec"><div class="pkc-step"><i>1</i><b>Ваша комната</b></div>' +
      '<div class="pkc-lab">Площадь</div><div class="pkc-chips">' + chips(AREAS, areaCur(), "area") + "</div>" +
      '<label class="pkc-exact">или точнее: <input type="number" inputmode="numeric" min="5" max="300" value="' + (S.area > 300 ? "" : S.area) + '" aria-label="Площадь комнаты в квадратных метрах" data-exact> м²</label>' +
      '<div class="pkc-lab">Высота потолка</div><div class="pkc-chips">' + chips(HEIGHTS, S.h, "h") + "</div>" +
      '<div class="pkc-lab">Условия</div><div class="pkc-chips">' + tog("sun", "Солнечная сторона", S.sun) + tog("top", "Верхний этаж", S.top) + tog("kit", "Кухня или много техники", S.kit) + "</div></div>" +
      '<div class="pkc-sec"><div class="pkc-step"><i>2</i><b>Что для вас важно</b></div><div class="pkc-opts">' +
      opt("quiet", "Тихая работа", "для спальни") + opt("econ", "Экономия", "инвертор") + opt("fresh", "Свежий воздух", "приток с улицы") + opt("wifi", "Wi-Fi", "с телефона") + "</div></div>" +
      '<div class="pkc-sec"><div class="pkc-step"><i>3</i><b>Бюджет</b></div><div class="pkc-chips">' + chips(BUDGETS, S.budget, "budget") + "</div></div>";

    var conds = [];
    if (S.sun) conds.push("+20 % солнечная сторона");
    if (S.top) conds.push("+10 % верхний этаж");
    if (S.kit) conds.push("+20 % кухня или техника");
    var how = S.area + " м² × 100 Вт" + (S.h !== 2.7 ? " × " + String(S.h).replace(".", ",") + "/2,7 (потолок)" : "") + (conds.length ? ", " + conds.join(", ") : "") + " = " + fmt(c.w) + " Вт, это " + fmt(c.btu) + " BTU.";
    var res, models = "", p = null, cls = c.cls;
    if (c.mode === "big" && !DATAP) {
      ensureP(render);
      ROOT.innerHTML = '<div class="pkc-grid"><div class="pkc-card">' + steps + '</div><aside class="pkc-res"><div class="pkc-k">Считаем</div><div class="pkc-kw">Подбираем модели для большого помещения…</div></aside></div>';
      return;
    }
    if (c.mode !== "proj") {
      p = pick(c);
      if (c.mode === "big") cls = p.cls;
    }
    if (c.mode === "proj" || !cls) {
      res = '<aside class="pkc-res"><div class="pkc-k">Для такой площади</div><div class="pkc-kw">Нужен расчёт по проекту</div>' +
        '<div class="pkc-how">' + how + ' Для больших помещений и нескольких комнат подбираем <a href="/multisplit">мультисплит</a>, <a href="/katalog?g=poluprom">полупромышленные</a> и <a href="/vrf-sistemy-almaty">VRF-системы</a>: состав и цену считаем по проекту.</div>' +
        '<div class="pkc-note">Напишите в <a href="https://wa.me/77000369369">WhatsApp</a> или позвоните +77 000 369 369.</div></aside>';
    } else {
      res = '<aside class="pkc-res"><div class="pkc-k">Вам подойдёт' + (c.mode === "big" ? " от" : "") + '</div>' +
        '<div class="pkc-big"><b>' + String(Math.round(cls / 1000)).padStart(2, "0") + "</b><span>" + fmt(cls) + " BTU</span></div>" +
        '<div class="pkc-kw">нужно около ' + (c.btu / 3412).toFixed(1).replace(".", ",") + " кВт холода, класс даёт " + (cls / 3412).toFixed(1).replace(".", ",") + " кВт · помещение " + S.area + " м²</div>" +
        '<div class="pkc-how"><b>Как посчитано:</b> ' + how + (c.mode === "big" ? " Для таких площадей подходят полупромышленные кондиционеры (кассетные, канальные, напольно-потолочные, колонные) и крупные настенные." : " Берём ближайший стандартный класс не ниже этого значения.") + "</div>" +
        '<div class="pkc-note">Это ориентир. Точный расчёт подтвердим при замере.</div></aside>';
      var grp = c.mode === "big" ? "poluprom" : "bytovye";
      models = '<div class="pkc-models"><h3 class="pkc-h">Подходящие модели</h3>' + (p.note ? '<p class="pkc-info">' + esc(p.note) + "</p>" : "") +
        (p.list.length ? '<div class="pkc-cards">' + p.list.map(card).join("") + "</div>" :
          '<p class="pkc-info">Модели этого класса сейчас не найдены. Напишите нам в WhatsApp, подберём.</p>') +
        '<div class="pkc-more"><a class="pkc-btn pkc-btn--line" href="/katalog?g=' + grp + "&btu=" + cls + '&stock=in">Все подходящие модели в каталоге →</a>' +
        '<a class="pkc-btn pkc-btn--line" href="https://wa.me/77000369369">Нужна помощь? WhatsApp</a></div></div>';
    }
    ROOT.innerHTML = '<div class="pkc-grid"><div class="pkc-card">' + steps + "</div>" + res + "</div>" + models;
  }

  function onClick(e) {
    var b = e.target.closest("button"); if (!b || !ROOT.contains(b)) return;
    if (b.hasAttribute("data-area")) S.area = +b.getAttribute("data-area");
    else if (b.hasAttribute("data-h")) S.h = +b.getAttribute("data-h");
    else if (b.hasAttribute("data-budget")) S.budget = +b.getAttribute("data-budget");
    else if (b.hasAttribute("data-tog")) { var k = b.getAttribute("data-tog"); S[k] = !S[k]; }
    else return;
    render();
  }
  function onChange(e) {
    if (!e.target.hasAttribute("data-exact")) return;
    var v = Math.round(+e.target.value);
    if (v >= 5 && v <= 300) { S.area = v; render(); }
  }

  function start() {
    ROOT.setAttribute("data-ready", "1");
    initFromUrl();
    ROOT.innerHTML = '<p class="pkc-info">Загружаем подбор…</p>';
    fetch(RAW, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { DATA = d; ROOT.addEventListener("click", onClick); ROOT.addEventListener("change", onChange); render(); })
      .catch(function () { ROOT.setAttribute("data-ready", ""); ROOT.innerHTML = '<p class="pkc-info">Калькулятор временно не загрузился. Позвоните +77 000 369 369 или напишите в <a href="https://wa.me/77000369369">WhatsApp</a>, подберём кондиционер.</p>'; });
  }
  // Данные грузим, когда калькулятор подъезжает к экрану (запас 800 px): проверка при загрузке и прокрутке.
  var started = false;
  function check() {
    if (started) return;
    var r = ROOT.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800) + 800) {
      started = true;
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      start();
    }
  }
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  if (document.readyState === "complete") check(); else window.addEventListener("load", check);
  setTimeout(check, 1200);
})();
