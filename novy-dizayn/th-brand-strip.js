/* Полоса брендов раздела на любой странице: <div data-th-brands="группа1,группа2"></div> + этот скрипт.
   Тот же вид и те же данные, что у голубой шапки раздела в /katalog: логотипы из data/brand-logos.json (у Royal Thermo — чистый
   вариант из brand-logos-clean.json), высота по равной оптической площади (brand-logo-ratio.json), порядок как в фильтре каталога
   (brand-priority.json, дальше по алфавиту). Бренды берутся из data/index.json (brandList групп) — только те, у кого в группах есть модели.
   Атрибуты:
     data-th-brands="vodonagrevateli,vodoochistka"   группы каталога; бренды складываются, повторы убираются
     data-title="Текст"                              заголовок над логотипами (по умолчанию «Бренды в каталоге»)
   Без правки блока: в head страницы window.THBS = {after:".селектор", groups:"g1,g2", title:"Текст", brands:"Ballu,Electrolux"} (или массив; brands — необязательный список, чтобы показать только эти бренды) — полоса встанет после этого элемента.
   Логотипы и подпись всегда по центру (правило владельца от 20.10.2026).
   Логотип ведёт в /katalog?g=<группа>&brand=<бренд>. Счётчиков наличия и числа моделей нет: см. правило владельца от 06.10.2026.
   Меньше двух брендов с логотипом — блок не рисуется (одна марка в полосе выглядит пусто).
   Данные грузятся, когда блок подходит к экрану: brand-logos.json тяжёлый (~640 КБ), на первом экране он не нужен. */
(function () {
  "use strict";
  var BASE = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";
  var MARK = "data-th-bs-done";

  var CSS = ".thbs{font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;margin:24px auto 0;max-width:1248px;box-sizing:border-box}" +
    ".thbs *{box-sizing:border-box}" +
    ".thbs-box{background:#E9F4FF;border:1px solid #DCE5F0;border-radius:16px;padding:20px 24px}" +
    ".thbs-t{margin:0 0 14px;font:600 14px/20px Inter,system-ui,sans-serif;color:#0033A0;letter-spacing:.02em;text-align:center}" +
    ".thbs-pre{min-height:140px}" +
    ".thbs-g{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}" +
    ".thbs-a{display:flex;align-items:center;justify-content:center;width:132px;height:64px;padding:8px 12px;background:#fff;border:1px solid #DCE5F0;border-radius:12px;transition:.15s}" +
    ".thbs-a:hover{border-color:#0066FF;box-shadow:0 4px 16px rgba(0,102,255,.12)}" +
    ".thbs-a img{display:block;max-width:100%;width:auto;object-fit:contain}" +
    "@media(max-width:760px){.thbs-pre{min-height:188px}.thbs-box{padding:16px}.thbs-g{gap:8px}.thbs-a{width:calc(33.333% - 6px);min-width:96px;height:56px;padding:6px 8px}}";

  function injectCss() {
    if (document.getElementById("thbs-css")) return;
    var s = document.createElement("style"); s.id = "thbs-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function getJson(name) {
    return fetch(BASE + name, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  var dataP = null;
  function loadData() {
    if (!dataP) dataP = Promise.all([getJson("index.json"), getJson("brand-logos.json"), getJson("brand-logos-clean.json"), getJson("brand-logo-ratio.json"), getJson("brand-priority.json")]);
    return dataP;
  }

  function build(box, d) {
    var idx = d[0], logos = d[1], clean = d[2], ratio = d[3] || {}, prio = (d[4] && d[4].priority) || [];
    var drop = function () { box.className = box.className.replace(/\s*\bthbs(-pre)?\b/g, ""); };
    if (!idx || !logos) { drop(); return; }
    var want = String(box.getAttribute("data-th-brands") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    var L = {}, k;
    for (k in logos) L[k] = logos[k];
    if (clean && clean.logos) for (k in clean.logos) L[k] = clean.logos[k];
    // бренд → первая из заданных групп, где он есть (туда и ведёт ссылка)
    var from = {}, order = [];
    // data-brands="Ballu,Electrolux" — оставить только эти бренды (страницы одного типа товара внутри группы: проточные, накопительные)
    var only = String(box.getAttribute("data-brands") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    want.forEach(function (slug) {
      var g = (idx.groups || []).filter(function (x) { return x.slug === slug; })[0];
      if (!g) return;
      (g.brandList || []).forEach(function (b) {
        if (!b || /^без марки$/i.test(b) || !L[b] || from[b]) return;
        if (only.length && only.indexOf(b) < 0) return;
        from[b] = slug; order.push(b);
      });
    });
    if (order.length < 2) { drop(); return; }
    function rank(b) { var i = prio.indexOf(b); return i < 0 ? 999 : i; }
    order.sort(function (a, b) { return rank(a) - rank(b) || a.localeCompare(b, "ru"); });
    var items = order.map(function (b) {
      var lh = Math.max(22, Math.min(46, Math.round(Math.sqrt(3000 / (ratio[b] || 2.5)))));
      return '<a class="thbs-a" href="/katalog?g=' + encodeURIComponent(from[b]) + "&brand=" + encodeURIComponent(b) + '" title="' + esc(b) + ' в каталоге">' +
        '<img src="' + esc(L[b]) + '" alt="' + esc(b) + '" style="height:' + lh + 'px" loading="lazy" decoding="async"></a>';
    }).join("");
    var title = box.getAttribute("data-title") || "Бренды в каталоге";
    box.className = box.className.replace(/\s*\bthbs-pre\b/g, "");
    box.innerHTML = '<div class="thbs-box"><p class="thbs-t">' + esc(title) + '</p><div class="thbs-g">' + items + "</div></div>";
  }

  function init() {
    var boxes = document.querySelectorAll("[data-th-brands]:not([" + MARK + "])");
    if (!boxes.length) return;
    Array.prototype.forEach.call(boxes, function (box) {
      box.setAttribute(MARK, "1");
      // место под полосу резервируем сразу, иначе она сдвигает страницу, когда догрузятся данные (если брендов меньше двух, резерв снимается)
      injectCss();
      box.className = (box.className ? box.className + " " : "") + "thbs thbs-pre";
      var run = function () { loadData().then(function (d) { build(box, d); }); };
      // пустой блок нулевого размера IntersectionObserver не замечает (на DC-страницах он так и не срабатывал), поэтому смотрим на положение сами
      var near = function () { var r = box.getBoundingClientRect(); return r.top < (window.innerHeight || 800) + 600; };
      if (near()) { run(); return; }
      var busy = false, check = function () {
        if (busy) return; busy = true;
        requestAnimationFrame(function () {
          busy = false;
          if (!near()) return;
          window.removeEventListener("scroll", check); window.removeEventListener("resize", check); run();
        });
      };
      window.addEventListener("scroll", check, { passive: true });
      window.addEventListener("resize", check);
    });
  }

  // Режим без правки блока: в head страницы задаётся window.THBS = {after:"селектор", groups:"g1,g2", title:"Текст"} (или массив таких),
  // скрипт сам ставит полосу после найденного элемента (ждёт его до 10 секунд — на DC-страницах блок рисуется скриптом)
  function auto() {
    var cfg = window.THBS; if (!cfg) return;
    (Array.isArray(cfg) ? cfg : [cfg]).forEach(function (c) {
      if (!c || !c.after || !c.groups) return;
      var tries = 0;
      (function put() {
        var anchor = document.querySelector(c.after);
        if (!anchor) { if (++tries < 100) setTimeout(put, 100); return; }
        var nx = anchor.nextElementSibling;
        if (nx && nx.hasAttribute("data-th-brands")) return;
        var d = document.createElement("div");
        d.setAttribute("data-th-brands", c.groups);
        if (c.title) d.setAttribute("data-title", c.title);
        if (c.brands) d.setAttribute("data-brands", c.brands);
        anchor.parentNode.insertBefore(d, anchor.nextSibling);
        init();
      })();
    });
  }

  function start() { auto(); init(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  // блоки Тильды и DC-страниц дорисовываются позже: один повторный проход
  setTimeout(init, 1500);
})();
