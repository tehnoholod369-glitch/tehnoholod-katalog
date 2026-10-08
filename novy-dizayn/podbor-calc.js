/**
 * Подбор кондиционера по площади — три шага и три модели (v3, 09.10.2026).
 * Живёт на странице /podbor-kondicionera, без рамки.
 *
 * Расчёт: 100 Вт/м² × (потолок / 2,7) × (1 + солнце 0,2 + верхний этаж 0,1 + кухня 0,2) → Вт; × 3,412 → BTU.
 * Класс — ближайший из ряда НЕ НИЖЕ расчёта (допуска «вниз» нет). Подбор моделей: паспортная мощность не ниже
 * потребности и не выше класса + 15 % (до 70 м²), для 70–150 м² — в диапазоне [потребность; потребность × 1,4]
 * из настенных (data/bytovye.json) и полупромышленных (data/poluprom.json). Больше 150 м² — «по проекту».
 *
 * Выбор трёх карточек. Если выбраны пожелания: первой идёт модель с лучшим совпадением (затем меньший запас
 * мощности, затем цена), дальше самая доступная и ближайшая по мощности. Без пожеланий: самая доступная,
 * самая тихая, самая экономичная. Подписи — факты по данным. Совпадения: тишина = не громче 25 дБ в тихом режиме,
 * экономия = инвертор класса A++ и выше, приток = «да» в данных, Wi-Fi = «встроенный»; «есть, комплектацию уточняйте»
 * считается за половину и подписывается как «уточните комплектацию».
 * Любая ошибка оставляет страницу рабочей: калькулятор просто не рисуется, текст страницы остаётся.
 */
(function () {
  "use strict";
  var ROOT = document.getElementById("pk-app");
  if (!ROOT || ROOT.getAttribute("data-ready")) return;
  var BASE = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var CLASSES = [7000, 9000, 12000, 18000, 24000, 36000, 48000, 60000];
  var AREAS = [[20, "до 20 м²"], [25, "20–25 м²"], [35, "25–35 м²"], [50, "35–50 м²"], [70, "50–70 м²"], [100, "70–100 м²"], [150, "100–150 м²"], [999, "больше 150 м²"]];
  var HEIGHTS = [[2.5, "2,5 м"], [2.7, "2,7 м"], [3.0, "3 м"], [3.5, "3,5 м"], [4.0, "4 м и выше"]];
  var BUDGETS = [[150000, "до 150 000 ₸"], [250000, "до 250 000 ₸"], [350000, "до 350 000 ₸"], [0, "любой"]];
  var PREFS = [["quiet", "тишина"], ["econ", "экономия"], ["fresh", "приток"], ["wifi", "Wi-Fi"]];
  var QUIET_DB = 25;
  var S = { area: 25, h: 2.7, sun: false, top: false, kit: false, quiet: false, econ: false, fresh: false, wifi: false, budget: 0, color: "" };
  // цвет корпуса: имя -> [код для адреса, цвет кружка-образца]; кружок показывает цвет товара, это не цвет интерфейса
  var COLORS = { "Белый": ["white", "#FFFFFF"], "Чёрный": ["black", "#1A1A1A"], "Серебристый": ["silver", "#C5CCD6"], "Серый": ["gray", "#8A94A3"], "Красный": ["red", "#E81C1C"], "Золотистый": ["gold", "#D4A93A"], "Тёмно-синий": ["navy", "#0B2A6B"], "Бежевый": ["beige", "#E8D9BF"], "Зелёный": ["green", "#3D8F4F"] };
  var DATA = null, DATAP = null, PSTATE = 0;
  var TYPES = { "Кассетные": "кассетный", "Канальные": "канальный", "Напольно-потолочные": "напольно-потолочный", "Колонные": "колонный", "Консольные": "консольный" };

  // Стартовые значения из адреса: ?area=30&h=3&sun=1&top=1&kit=1&quiet=1&econ=1&fresh=1&wifi=1&budget=250000
  function initFromUrl() {
    try {
      var q = new URLSearchParams(location.search), n;
      n = Math.round(+q.get("area")); if (n >= 5 && n <= 300) S.area = n;
      n = +String(q.get("h") || "").replace(",", "."); if (n >= 2.4 && n <= 4.5) S.h = HEIGHTS.reduce(function (b, a) { return Math.abs(a[0] - n) < Math.abs(b - n) ? a[0] : b; }, 2.7);
      ["sun", "top", "kit", "quiet", "econ", "fresh", "wifi"].forEach(function (k) { if (q.get(k) === "1") S[k] = true; });
      var cq = q.get("color"); Object.keys(COLORS).forEach(function (k) { if (COLORS[k][0] === cq) S.color = k; });
      n = +q.get("budget"); if (BUDGETS.some(function (b) { return b[0] === n; })) S.budget = n;
    } catch (e) { /* адрес без параметров — остаются значения по умолчанию */ }
  }

  function photo(u) { u = String(u || ""); if (!u) return ""; return /^https?:\/\//.test(u) ? u : "https://img.tehnoholod369.kz/" + u.replace(/^\/+/, ""); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " "); }
  function kw(btu) { return (btu / 3412).toFixed(1).replace(".", ","); }

  function calc() {
    var k = 1 + (S.sun ? 0.2 : 0) + (S.top ? 0.1 : 0) + (S.kit ? 0.2 : 0);
    var w = S.area * 100 * (S.h / 2.7) * k;
    var btu = Math.round(w * 3.412);
    var mode = S.area > 150 ? "proj" : S.area > 70 ? "big" : "std", cls = null;
    if (mode === "std") {
      for (var i = 0; i < CLASSES.length; i++) { if (CLASSES[i] >= btu) { cls = CLASSES[i]; break; } }
      if (!cls) mode = "big";
    }
    return { k: k, w: Math.round(w), btu: btu, need: btu, cls: cls, mode: mode };
  }

  function spv(m, re) {
    var r = (m.sp || []).filter(function (x) { return re.test(String(x[0])); })[0];
    return r ? String(r[1]) : "";
  }
  function btuOf(m) { return Number(String(spv(m, /^btu$/i)).replace(/\s/g, "")) || 0; }
  // Шум внутреннего блока, дБ: только внутренний блок и режим охлаждения, значения меньше 10 — «нет данных»
  // (в данных LG встречается «нагрев … 0 дБ»), из диапазона берём минимум — самый тихий режим.
  function noiseOf(m) {
    var rows = (m.sp || []).filter(function (r) { return /^шум/i.test(String(r[0])) && !/наружн/i.test(String(r[0])); });
    if (!rows.length) return null;
    var v = String(rows[0][1]), part = v.match(/охлажд[^;]*/i);
    if (part) v = part[0];
    var n = (v.match(/\d+(?:[.,]\d+)?/g) || []).map(function (x) { return parseFloat(x.replace(",", ".")); }).filter(function (x) { return x >= 10; });
    return n.length ? Math.min.apply(null, n) : null;
  }
  function colorOf(m) {
    var v = String(spv(m, /^цвет/i) || "").toLowerCase();
    if (!v) return "";
    if (/серебр/.test(v)) return "Серебристый";
    if (/бел/.test(v)) return "Белый";
    if (/ч[её]рн/.test(v)) return "Чёрный";
    if (/красн/.test(v)) return "Красный";
    if (/золот/.test(v)) return "Золотистый";
    if (/син/.test(v)) return "Тёмно-синий";
    if (/беж/.test(v)) return "Бежевый";
    if (/зел[её]н/.test(v)) return "Зелёный";
    if (/сер/.test(v)) return "Серый";
    return "";
  }
  function effRank(e) { return e === "A+++" ? 3 : e === "A++" ? 2 : e === "A+" ? 1 : 0; }
  function info(m, c) {
    var wf = spv(m, /^wi-?fi/i), v = btuOf(m);
    var x = {
      m: m, btu: v, noise: noiseOf(m), inv: m.inv === "inv", color: colorOf(m),
      eff: (spv(m, /^класс энергоэфф/i).match(/A\+*/) || [""])[0],
      fresh: /^да/i.test(spv(m, /^приток/i)),
      wifi: /встроен/i.test(wf) ? 1 : /^есть/i.test(wf) ? 0.5 : 0
    };
    x.marg = c && c.need ? v / c.need - 1 : 0;
    x.hit = {
      quiet: x.noise != null && x.noise <= QUIET_DB ? 1 : 0,
      econ: x.inv && effRank(x.eff) >= 2 ? 1 : 0,
      fresh: x.fresh ? 1 : 0,
      wifi: x.wifi
    };
    var sc = 0, nSel = 0;
    PREFS.forEach(function (p) { if (S[p[0]]) { nSel++; sc += x.hit[p[0]]; } });
    x.score = sc; x.nSel = nSel;
    return x;
  }

  // Пул моделей: до 70 м² — настенные не ниже потребности и не выше класса + 15 %;
  // 70–150 м² — настенные и полупромышленные в диапазоне [потребность; потребность × 1,4]
  function poolFor(c) {
    var pool = [];
    if (c.mode === "std") {
      DATA.forEach(function (m) {
        var v = btuOf(m);
        if (!m.acc && m.sub === "Настенные" && m.p > 0 && m.num > 0 && v >= c.need && v <= c.cls * 1.15) { m.g = "bytovye"; pool.push(info(m, c)); }
      });
    } else {
      [[DATA, "bytovye", "Настенные"], [DATAP || [], "poluprom", null]].forEach(function (src) {
        src[0].forEach(function (m) {
          var v = btuOf(m);
          if (!m.acc && m.p > 0 && v >= c.need && v <= c.need * 1.4 && (!src[2] || m.sub === src[2])) { m.g = src[1]; pool.push(info(m, c)); }
        });
      });
    }
    return pool;
  }

  // Выбранное пожелание — условие, а не «баллы»: модель без притока при выбранном «Свежем воздухе» не показываем.
  // Wi-Fi «есть, комплектацию уточняйте» считаем подходящим (с пометкой на карточке).
  function fullMatch(x) {
    for (var i = 0; i < PREFS.length; i++) {
      var k = PREFS[i][0];
      if (S[k] && x.hit[k] < (k === "wifi" ? 0.5 : 1)) return false;
    }
    return true;
  }
  function pick(c) {
    var poolAll = poolFor(c), cc = {};
    poolAll.forEach(function (x) { if (x.color) cc[x.color] = (cc[x.color] || 0) + 1; });
    var colors = Object.keys(cc).sort(function (a, b) { return cc[b] - cc[a]; });
    var pool = S.color ? poolAll.filter(function (x) { return x.color === S.color; }) : poolAll;
    var inStock = pool.filter(function (x) { return x.m.st === "В наличии"; });
    var nSel = pool.length ? pool[0].nSel : 0;
    function budgeted(arr) { return S.budget ? arr.filter(function (x) { return x.m.p <= S.budget; }) : arr; }
    var note = "", cand = [], strict = false;
    if (nSel > 0) {
      var sets = inStock.length ? [inStock, pool] : [pool];
      for (var si = 0; si < sets.length && !strict; si++) {
        var st = budgeted(sets[si]).filter(fullMatch);
        if (st.length) { cand = st; strict = true; }
      }
      if (!strict) {
        var exists = sets.some(function (s) { return s.some(fullMatch); });
        var b0 = budgeted(sets[0]);
        if (S.budget && !b0.length) b0 = sets[0];
        cand = b0;
        note = (exists ? "Модели, закрывающие все пожелания, есть, но не в выбранный бюджет." : "Модели, которая закрывает все выбранные пожелания, нет.") + " Показываем ближайшие по совпадению: чего не хватает, видно в строке «Ваш выбор».";
      }
    } else {
      var base = inStock.length >= 3 ? inStock : pool;
      cand = budgeted(base);
      if (S.budget && !cand.length) { cand = base; note = "В выбранный бюджет моделей этого класса нет, показываем ближайшие по цене."; }
    }
    cand = cand.slice().sort(function (a, b) { return a.m.p - b.m.p; });
    var out = [], used = [];
    function add(x, tag, best) { if (x && used.indexOf(x) < 0 && out.length < 3) { used.push(x); out.push({ x: x, tag: tag, best: !!best }); } }
    function first(arr, fn, sortFn) { var f = arr.filter(fn); if (sortFn) f = f.slice().sort(sortFn); return f[0]; }
    if (nSel > 0 && cand.length) {
      var ranked = cand.slice().sort(function (a, b) { return b.score - a.score || a.marg - b.marg || a.m.p - b.m.p; });
      var top = ranked[0], P2 = ranked;
      if (!strict) {
        // полного совпадения нет: берём ближайшие — не хуже «лучший результат минус 1» и не меньше половины выбранного
        var thr = Math.max(top.score - 1, nSel / 2);
        P2 = ranked.filter(function (x) { return x.score >= thr; });
        while (P2.length < 3 && thr > 0) { thr -= 0.5; P2 = ranked.filter(function (x) { return x.score >= thr; }); }
        if (P2.length < 3) P2 = ranked;
      }
      var byP = P2.slice().sort(function (a, b) { return a.m.p - b.m.p; });
      add(top, strict ? "Подходит под все ваши пожелания" : "Лучшее совпадение с вашим выбором", true);
      add(byP[0], strict ? "Самый доступный из подходящих" : "Самый доступный из ближайших");
      // если лучшая модель идёт «на пределе» мощности (запас меньше 5 %), добавляем подходящую с запасом от 15 %
      if (top.marg < 0.05) add(first(P2, function (x) { return x.marg >= 0.15; }), "С запасом мощности");
      add(first(P2, function (x) { return x.marg >= 0; }, function (a, b) { return a.marg - b.marg || a.m.p - b.m.p; }), "Ближе всего по мощности");
      P2.forEach(function (x) { add(x, "Ещё вариант"); });
    } else {
      add(cand[0], "Самый доступный");
      add(first(cand, function (x) { return x.noise != null; }, function (a, b) { return a.noise - b.noise || a.m.p - b.m.p; }), "Самый тихий");
      add(first(cand, function (x) { return x.inv && effRank(x.eff) >= 2; }, function (a, b) { return effRank(b.eff) - effRank(a.eff) || a.m.p - b.m.p; }), "Самый экономичный");
      add(first(cand, function (x) { return x.marg >= 0; }, function (a, b) { return a.marg - b.marg || a.m.p - b.m.p; }), "Ближе всего по мощности");
      cand.forEach(function (x) { add(x, "Ещё вариант"); });
    }
    // лучшее совпадение слева, остальные по цене
    var best = out.filter(function (o) { return o.best; }), rest = out.filter(function (o) { return !o.best; }).sort(function (a, b) { return a.x.m.p - b.x.m.p; });
    var btus = pool.length ? pool.map(function (x) { return x.btu; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }) : [];
    return { list: best.concat(rest), note: note, strict: strict, colors: colors, poolN: poolAll.length, total: cand.length, btus: btus, cls: btus.length ? btus[0] : null };
  }
  function ensureP(cb) {
    if (DATAP || PSTATE === 1) return;
    PSTATE = 1;
    fetch(BASE + "poluprom.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { DATAP = d; PSTATE = 2; cb(); })
      .catch(function () { DATAP = []; PSTATE = 2; cb(); });
  }

  function pct(v) { return (v >= 0 ? "+" : "") + Math.round(v * 100) + " %"; }
  function facts(x) {
    var m = x.m, f = [];
    if (TYPES[m.sub]) f.push([TYPES[m.sub], 0]);
    f.push([fmt(x.btu) + " BTU", 0]);
    f.push(["до " + m.num + " м²", 0]);
    if (x.color) f.push([x.color.toLowerCase(), S.color === x.color]);
    f.push([x.inv ? "Инвертор" : "ON/OFF", S.econ && x.hit.econ]);
    if (x.noise != null) f.push(["от " + String(x.noise).replace(".", ",") + " дБ", S.quiet && x.hit.quiet]);
    if (x.fresh) f.push(["приток воздуха", S.fresh && x.hit.fresh]);
    if (x.wifi === 1) f.push(["Wi-Fi", S.wifi && x.hit.wifi === 1]);
    if (x.eff) f.push(["класс " + x.eff, 0]);
    return f.slice(0, 8);
  }
  function matchRow(x) {
    if (!x.nSel) return "";
    var cells = PREFS.filter(function (p) { return S[p[0]]; }).map(function (p) {
      var v = x.hit[p[0]];
      if (p[0] === "wifi" && v === 0.5) return '<span class="pkc-mh pkc-mh--p">◐ Wi-Fi: уточните комплектацию</span>';
      return v >= 1 ? '<span class="pkc-mh pkc-mh--y">✓ ' + p[1] + "</span>" : '<span class="pkc-mh pkc-mh--n">— ' + p[1] + "</span>";
    });
    return '<div class="pkc-match"><b>Ваш выбор:</b> ' + cells.join("") + "</div>";
  }
  function margLine(x) {
    var cls = "pkc-marg", txt = "Запас мощности " + pct(x.marg);
    if (x.marg < 0.05) { cls += " pkc-marg--w"; txt += ": на пределе"; }
    else if (x.marg > 0.35) { cls += x.inv ? " pkc-marg--n" : " pkc-marg--w"; txt += x.inv ? "" : ": возможны частые включения"; }
    else cls += " pkc-marg--y";
    return '<div class="' + cls + '">' + txt + "</div>";
  }
  function card(o) {
    var x = o.x, m = x.m, href = "/tovar?g=" + (m.g || "bytovye") + "&sl=" + encodeURIComponent(m.sl);
    var name = (m.b ? m.b + " " : "") + (m.nb || m.n);
    return '<article class="pkc-m' + (o.best ? " pkc-m--best" : "") + '"><a class="pkc-ph" href="' + href + '"><img src="' + esc(photo(m.i)) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'"></a>' +
      '<div class="pkc-tag' + (o.best ? " pkc-tag--best" : "") + '">' + esc(o.tag) + '</div><h3><a href="' + href + '">' + esc(name) + "</a></h3>" +
      '<ul class="pkc-facts">' + facts(x).map(function (t) { return "<li" + (t[1] ? ' class="m"' : "") + ">" + esc(t[0]) + "</li>"; }).join("") + "</ul>" +
      matchRow(x) + margLine(x) +
      '<div class="pkc-price">' + esc(fmt(m.p)) + ' ₸</div>' +
      '<div class="pkc-stock' + (m.st === "В наличии" ? "" : " pkc-stock--o") + '">' + esc(m.st) + "</div>" +
      '<a class="pkc-btn" href="' + href + '">Подробнее</a></article>';
  }

  function chips(list, cur, attr) {
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
  function howRows(c) {
    var rows = [["Площадь", S.area + " м² × 100 Вт", fmt(Math.round(S.area * 100)) + " Вт"]];
    if (S.h !== 2.7) rows.push(["Потолок " + String(S.h).replace(".", ",") + " м", "× " + String((S.h / 2.7).toFixed(2)).replace(".", ","), ""]);
    var add = (S.sun ? 20 : 0) + (S.top ? 10 : 0) + (S.kit ? 20 : 0);
    if (add) {
      var parts = [];
      if (S.sun) parts.push("солнце 20 %");
      if (S.top) parts.push("верхний этаж 10 %");
      if (S.kit) parts.push("кухня и техника 20 %");
      rows.push(["Условия", "+ " + add + " % (" + parts.join(", ") + ")", ""]);
    }
    rows.push(["Итого", fmt(c.w) + " Вт", fmt(c.btu) + " BTU"]);
    return '<dl class="pkc-dl">' + rows.map(function (r, i) {
      return "<div" + (i === rows.length - 1 ? ' class="t"' : "") + "><dt>" + r[0] + "</dt><dd>" + r[1] + (r[2] ? " <b>" + r[2] + "</b>" : "") + "</dd></div>";
    }).join("") + "</dl>";
  }

  function colorRow(cols) {
    var list = cols.slice();
    if (S.color && list.indexOf(S.color) < 0) list.push(S.color);
    if (!list.length) return "";
    var btns = '<button type="button" class="pkc-chip' + (S.color ? "" : " on") + '" aria-pressed="' + !S.color + '" data-color="">Любой</button>' + list.map(function (n) {
      var on = S.color === n;
      return '<button type="button" class="pkc-chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-color="' + esc(n) + '"><i class="pkc-sw" style="background:' + COLORS[n][1] + '"></i>' + esc(n) + "</button>";
    }).join("");
    return '<div class="pkc-lab">Цвет корпуса</div><div class="pkc-chips">' + btns + '</div><p class="pkc-hint">Цвет указан не у всех моделей. Если нужного цвета нет в списке, напишите нам в <a href="https://wa.me/77000369369">WhatsApp</a>.</p>';
  }
  function stepsHtml(cols) {
    return '<div class="pkc-sec"><div class="pkc-step"><i>1</i><b>Ваша комната</b></div>' +
      '<div class="pkc-lab">Площадь</div><div class="pkc-chips">' + chips(AREAS, areaCur(), "area") + "</div>" +
      '<label class="pkc-exact">или точнее: <input type="number" inputmode="numeric" min="5" max="300" value="' + (S.area > 300 ? "" : S.area) + '" aria-label="Площадь комнаты в квадратных метрах" data-exact> м²</label>' +
      '<div class="pkc-lab">Высота потолка</div><div class="pkc-chips">' + chips(HEIGHTS, S.h, "h") + "</div>" +
      '<div class="pkc-lab">Условия</div><div class="pkc-chips">' + tog("sun", "Солнечная сторона", S.sun) + tog("top", "Верхний этаж", S.top) + tog("kit", "Кухня или много техники", S.kit) + "</div></div>" +
      '<div class="pkc-sec"><div class="pkc-step"><i>2</i><b>Что для вас важно</b></div><div class="pkc-opts">' +
      opt("quiet", "Тихая работа", "не громче " + QUIET_DB + " дБ") + opt("econ", "Экономия", "инвертор A++ и выше") + opt("fresh", "Свежий воздух", "приток с улицы") + opt("wifi", "Wi-Fi", "встроенный модуль") + "</div>" +
      colorRow(cols) + "</div>" +
      '<div class="pkc-sec"><div class="pkc-step"><i>3</i><b>Бюджет</b></div><div class="pkc-chips">' + chips(BUDGETS, S.budget, "budget") + "</div></div>";
  }

  function render() {
    var c = calc(), p = null, res, models = "";
    if (c.mode === "big" && !DATAP) {
      ensureP(render);
      ROOT.innerHTML = '<div class="pkc-grid"><div class="pkc-card">' + stepsHtml([]) + '</div><aside class="pkc-res"><div class="pkc-k">Считаем</div><div class="pkc-kw">Подбираем модели для большого помещения…</div></aside></div>';
      return;
    }
    if (c.mode !== "proj") p = pick(c);
    var steps = stepsHtml(p ? p.colors : []);
    if (!p || (!p.list.length && c.mode !== "std" && !p.poolN)) {
      res = '<aside class="pkc-res"><div class="pkc-k">Для такой площади</div><div class="pkc-kw">Нужен расчёт по проекту</div>' + (c.mode === "proj" ? "" : "") +
        '<div class="pkc-how"><b>Как посчитано</b>' + howRows(c) + 'Для больших помещений и нескольких комнат подбираем <a href="/multisplit">мультисплит</a>, <a href="/katalog?g=poluprom">полупромышленные</a> и <a href="/vrf-sistemy-almaty">VRF-системы</a>: состав и цену считаем по проекту.</div>' +
        '<div class="pkc-note">Напишите в <a href="https://wa.me/77000369369">WhatsApp</a> или позвоните +77 000 369 369.</div></aside>';
    } else {
      var btus = p.btus.length ? p.btus : (c.cls ? [c.cls] : []);
      var cls = c.mode === "std" ? c.cls : p.cls;
      res = '<aside class="pkc-res"><div class="pkc-k">Нужно не менее</div>' +
        '<div class="pkc-big"><b>' + kw(c.btu) + '</b><span>кВт холода</span></div>' +
        '<div class="pkc-kw">≈ ' + fmt(Math.round(c.btu / 100) * 100) + " BTU · помещение " + S.area + " м²</div>" +
        (c.mode === "std" ? '<div class="pkc-cls">Ближайший класс по таблице: <b>' + String(c.cls / 1000).padStart(2, "0") + "</b> (" + fmt(c.cls) + " BTU, " + kw(c.cls) + " кВт)</div>" : "") +
        (btus.length ? '<div class="pkc-cls">Подходят модели на: <b>' + btus.slice(0, 5).map(fmt).join(" · ") + "</b> BTU" + (btus.length > 5 ? " и больше" : "") + "</div>" : "") +
        '<div class="pkc-how"><b>Как посчитано</b>' + howRows(c) + (c.mode === "big" ? "Для таких площадей подходят полупромышленные кондиционеры (кассетные, канальные, напольно-потолочные, колонные) и крупные настенные." : "Берём ближайший стандартный класс не ниже этого значения.") + "</div>" +
        '<div class="pkc-note">Это ориентир. Точный расчёт подтвердим при замере.</div></aside>';
      var grp = c.mode === "big" ? "poluprom" : "bytovye";
      models = '<div class="pkc-models"><h3 class="pkc-h">Подходящие модели</h3>' + (p.note ? '<p class="pkc-info">' + esc(p.note) + "</p>" : "") + (p.strict ? '<p class="pkc-info">Показаны только модели, которые закрывают все выбранные пожелания.</p>' : "") +
        (p.list.length ? '<div class="pkc-cards">' + p.list.map(card).join("") + "</div>" :
          '<p class="pkc-info">' + (S.color ? "Подходящей мощности в цвете «" + esc(S.color) + "» сейчас нет. Выберите другой цвет или напишите нам в WhatsApp: подберём под заказ." : "Модели этого класса сейчас не найдены. Напишите нам в WhatsApp, подберём.") + '</p>') +
        '<div class="pkc-more"><a class="pkc-btn pkc-btn--line" href="/katalog?g=' + grp + "&btu=" + (cls || c.btu) + '&stock=in">Все подходящие модели в каталоге →</a>' +
        '<a class="pkc-btn pkc-btn--line" href="https://wa.me/77000369369">Нужна помощь? WhatsApp</a></div></div>';
    }
    ROOT.innerHTML = '<div class="pkc-grid"><div class="pkc-card">' + steps + "</div>" + res + "</div>" + models;
  }

  function onClick(e) {
    var b = e.target.closest("button"); if (!b || !ROOT.contains(b)) return;
    if (b.hasAttribute("data-area")) S.area = +b.getAttribute("data-area");
    else if (b.hasAttribute("data-h")) S.h = +b.getAttribute("data-h");
    else if (b.hasAttribute("data-budget")) S.budget = +b.getAttribute("data-budget");
    else if (b.hasAttribute("data-color")) S.color = b.getAttribute("data-color");
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
    fetch(BASE + "bytovye.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
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
