/* Метка «N отзывов на Kaspi» на карточках и строках подборок (посадочные страницы), только отопление.
   Отзывы есть именно на эту модель (совпадение по артикулу с границами, как в card-kaspi-reviews.js) -> под названием
   появляется ссылка на карточку товара, где отзывы показывает card-kaspi-reviews.js.
   Рейтинг не считаем: если оценки одинаковые, показываем её, если разные, диапазон «от и до». Разметку Review не пишем.
   Данные: data/kaspi-reviews.json (тот же файл, что на /otzyvy). Тип техники: камины, инфракрасные и газовые обогреватели,
   тепловые пушки, конвекторы и масляные радиаторы. Остальные группы подключаются расширением списка HEAT. */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/kaspi-reviews.json";
  var MARK = "data-th-rv";
  var HEAT = [
    /электрокамин|очаг|каминокомплект|\bEFP\//i,
    /инфракрасн|газов.*обогреват|\bBIGH|\bBOGH|\bLQ-H|\bBIH-/i,
    /тепловая пушка|\bBHP-|электрическая\s+BHP/i,
    /конвектор|\bREC-|масляный радиатор|\bROR-/i
  ];
  function isHeat(n) { for (var i = 0; i < HEAT.length; i++) if (HEAT[i].test(n || "")) return true; return false; }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9а-яё]+/g, ""); }

  // Отзыв относится к этой модели, если артикул стоит в названии с границами и сразу за ним не идёт короткий
  // суффикс другой модели («BIGH-55» не должен цепляться за «BIGH-55 H»).
  function matches(code, name) {
    var toks = String(code || "").toLowerCase().split(/[^a-z0-9а-яё]+/).filter(Boolean);
    if (!toks.length || norm(code).length < 5) return false;
    var p = String(name || "").toLowerCase();
    var re = new RegExp("(^|[^a-z0-9а-яё])(" + toks.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("[^a-z0-9а-яё]*") + ")($|[^a-z0-9а-яё])");
    var m = re.exec(p);
    if (!m) return false;
    var rest = p.slice(m.index + m[1].length + m[2].length).replace(/^\s+/, "");
    var s = /^([a-z0-9]{1,3})(?=$|[\s(,])/.exec(rest);
    return !(s && !/^\d+$/.test(s[1]));
  }

  function plural(n) {
    var a = n % 10, b = n % 100;
    return n + (a === 1 && b !== 11 ? " отзыв" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? " отзыва" : " отзывов");
  }

  function label(list) {
    var min = 5, max = 1;
    list.forEach(function (r) { var v = +r.r || 0; if (v < min) min = v; if (v > max) max = v; });
    var rate = min === max ? String(min) : "от " + min + " до " + max;
    return "★ " + rate + " · " + plural(list.length) + " на Kaspi";
  }

  function run(D) {
    var H = D.filter(function (r) { return isHeat(r.p); });
    if (!H.length) return;
    [].forEach.call(document.querySelectorAll(".thgeo-p[data-art]"), function (pe) {
      var art = pe.getAttribute("data-art");
      var ctx = pe.closest("article, tr, .thgeo-card, .thv-card");
      if (!ctx || ctx.querySelector("[" + MARK + "]")) return;
      var list = H.filter(function (r) { return matches(art, r.p); });
      if (!list.length) return;
      var link = ctx.querySelector("a.thv-pn, a.thgeo-card__name, td a[href*='/tovar'], td a[href*='/tproduct']");
      if (!link) return;
      var b = document.createElement("a");
      b.setAttribute(MARK, "1");
      b.href = link.getAttribute("href");
      b.textContent = label(list);
      b.style.cssText = "display:block;margin-top:2px;font:600 13px/18px Inter,system-ui,sans-serif;color:#0033A0;text-decoration:none;white-space:normal;";
      link.insertAdjacentElement("afterend", b);
    });
  }

  function start() {
    fetch(RAW, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (D) {
      if (!D || !D.length) return;
      run(D);
      setTimeout(function () { run(D); }, 1500);
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
