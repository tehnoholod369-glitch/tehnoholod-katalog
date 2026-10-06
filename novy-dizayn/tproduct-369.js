/* tproduct-369.js — карточка товара Tilda (/tproduct/…) в дизайне 369. T-006, 07.10.2026.
   Только оформление: заголовок, текст, цена, артикул, адрес и каталог карточки не меняются.
   Скрипт подключается из служебной страницы «ШАПКА САЙТА» (Header для всех страниц). Любая ошибка — карточка остаётся как была. */
(function () {
  "use strict";
  if (window.__thProd369) return;
  window.__thProd369 = 1;
  var WA = "https://wa.me/77000369369";
  var TEL = "+77000369369";
  var PODBOR = "https://podbor.tehnoholod369.kz/";

  var CSS = [
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",
    "body.th-prod{background:#F1F5F9!important;font-family:Inter,'Segoe UI',Arial,sans-serif!important;color:#1A1A1A}",
    "body.th-prod #allrecords{background:transparent!important}",
    "body.th-prod .t-store__prod-snippet__container{max-width:1248px!important;margin:0 auto!important;padding:12px 24px 56px!important;box-sizing:border-box}",
    ".th-bc{font:500 14px/20px Inter,sans-serif;color:#606F85;margin:6px 0 14px}.th-bc a{color:#0066FF;text-decoration:none}.th-bc a:hover{text-decoration:underline}.th-bc i{font-style:normal;margin:0 6px;color:#9AA8BC}",
    "body.th-prod .t-store__product-snippet{background:#fff;border:1px solid #DCE5F0;border-radius:16px;padding:28px;box-shadow:0 3px 14px rgba(21,43,68,.06);box-sizing:border-box}",
    "body.th-prod .t-store__product-snippet>.t-container{width:100%!important;max-width:none!important;padding:0!important;margin:0!important}",
    "body.th-prod .t-store__product-snippet>.t-container>div{display:grid!important;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:36px;align-items:start;width:100%!important;max-width:none!important;padding:0!important;margin:0!important}",
    "body.th-prod .t-store__product-snippet>.t-container:before,body.th-prod .t-store__product-snippet>.t-container:after,body.th-prod .t-store__product-snippet>.t-container>div:before,body.th-prod .t-store__product-snippet>.t-container>div:after{display:none!important}",
    "body.th-prod .t-store__prod-popup__col-left,body.th-prod .t-store__prod-popup__col-right{width:auto!important;float:none!important;margin:0!important;padding:0!important;max-width:none!important}",
    "body.th-prod .t-store__prod-popup__slider{border-radius:12px;overflow:hidden;background:#fff}",
    "body.th-prod .js-product-name,body.th-prod .t-store__prod-popup__name{font:700 30px/38px Inter,sans-serif!important;color:#0033A0!important;margin:0 0 10px!important}",
    "body.th-prod .js-product-brand{font:700 12px/16px Inter,sans-serif!important;letter-spacing:.06em;text-transform:uppercase;color:#606F85!important;margin:0 0 4px!important}",
    "body.th-prod .js-product-sku{font:500 14px/20px Inter,sans-serif!important;color:#606F85!important;margin:0 0 16px!important}",
    "body.th-prod .js-store-price-wrapper{margin:0 0 18px!important}",
    "body.th-prod .js-product-price,body.th-prod .t-store__prod-popup__price-currency{font:800 36px/44px Inter,sans-serif!important;color:#1A1A1A!important}",
    "body.th-prod .t-store__prod-popup__price-currency{font-size:30px!important;margin-left:4px}",
    ".th-cta{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 6px}",
    ".th-cta a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:12px;font:700 15px/1 Inter,sans-serif;text-decoration:none;box-sizing:border-box}",
    ".th-cta .th-wa{background:#E81C1C;color:#fff}.th-cta .th-b{background:#E9F4FF;color:#0066FF;border:1px solid #DCE5F0}",
    ".th-note{font:400 13px/18px Inter,sans-serif;color:#606F85;margin:6px 0 18px}",
    ".th-h{font:700 20px/28px Inter,sans-serif;color:#0033A0;margin:22px 0 10px}",
    "body.th-prod .t-store__prod-popup__text,body.th-prod .js-store-prod-all-text{font:400 16px/24px Inter,sans-serif!important;color:#1A1A1A!important}",
    ".th-spec{width:100%;border-collapse:collapse;font:400 15px/22px Inter,sans-serif;margin:0}",
    ".th-spec td{padding:9px 10px;border-bottom:1px solid #EEF2F7;vertical-align:top}.th-spec td:first-child{color:#606F85;width:46%}.th-spec tr:nth-child(odd) td{background:#F8FAFC}",
    "body.th-prod .js-store-prod-all-charcs{margin-top:0!important}",
    "@media(max-width:760px){body.th-prod .t-store__prod-snippet__container{padding:8px 12px 40px!important}body.th-prod .t-store__product-snippet{padding:16px}body.th-prod .t-store__product-snippet>.t-container>div{grid-template-columns:1fr;gap:18px}body.th-prod .js-product-name{font-size:24px!important;line-height:32px!important}.th-cta a{flex:1 1 100%}}"
  ].join("\n");

  function $(s, r) { return (r || document).querySelector(s); }
  function txt(el) { return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : ""; }

  function build() {
    var snip = $(".t-store__product-snippet");
    if (!snip || snip.getAttribute("data-th369")) return;
    snip.setAttribute("data-th369", "1");
    document.body.classList.add("th-prod");
    if (!$("style[data-th-prod]")) {
      var st = document.createElement("style");
      st.setAttribute("data-th-prod", "1");
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var name = txt($(".js-product-name"));
    var brand = txt($(".js-product-brand"));
    var sku = txt($(".js-product-sku")).replace(/^Артикул:\s*/i, "");
    // валюта: «тг.» -> «₸»
    var cur = $(".t-store__prod-popup__price-currency");
    if (cur) cur.textContent = "₸";

    // хлебные крошки
    var bc = document.createElement("nav");
    bc.className = "th-bc";
    bc.setAttribute("aria-label", "Навигация");
    bc.innerHTML = '<a href="https://tehnoholod369.kz/">Главная</a><i>›</i><a href="https://tehnoholod369.kz/katalog">Каталог</a>' + (brand ? "<i>›</i><span>" + brand + "</span>" : "");
    var cont = $(".t-store__prod-snippet__container");
    if (cont && !$(".th-bc")) cont.insertBefore(bc, cont.firstChild);

    // кнопки действий под ценой
    var pw = $(".js-store-price-wrapper");
    if (pw && !$(".th-cta")) {
      var msg = "Здравствуйте! Цена и наличие: " + (brand ? brand + " " : "") + (sku || name);
      var cta = document.createElement("div");
      cta.className = "th-cta";
      cta.innerHTML = '<a class="th-wa" href="' + WA + "?text=" + encodeURIComponent(msg) + '">Написать в WhatsApp</a>' +
        '<a class="th-b" href="tel:' + TEL + '">Позвонить</a>' +
        '<a class="th-b" href="' + PODBOR + '">Подобрать по площади</a>';
      var note = document.createElement("p");
      note.className = "th-note";
      note.textContent = "Наличие и цену подтверждаем при заказе. Монтаж считаем отдельно, после замера.";
      pw.parentNode.insertBefore(cta, pw.nextSibling);
      cta.parentNode.insertBefore(note, cta.nextSibling);
    }

    // характеристики: строки «Название: значение» -> таблица
    var ps = [].slice.call(document.querySelectorAll(".js-store-prod-charcs"));
    if (ps.length && !$(".th-spec")) {
      var rows = "";
      ps.forEach(function (p) {
        var t = txt(p), i = t.indexOf(":");
        if (i > 0) rows += "<tr><td>" + t.slice(0, i) + "</td><td>" + t.slice(i + 1).trim() + "</td></tr>";
      });
      if (rows) {
        var wrap = $(".js-store-prod-all-charcs");
        var h = document.createElement("h2");
        h.className = "th-h";
        h.textContent = "Характеристики";
        var tb = document.createElement("table");
        tb.className = "th-spec";
        tb.innerHTML = "<tbody>" + rows + "</tbody>";
        ps.forEach(function (p) { p.style.display = "none"; });
        wrap.insertBefore(tb, wrap.firstChild);
        wrap.insertBefore(h, tb);
      }
    }
    var all = $(".js-store-prod-all-text");
    if (all && !$(".th-h.th-d")) {
      var hd = document.createElement("h2");
      hd.className = "th-h th-d";
      hd.textContent = "Описание";
      all.parentNode.insertBefore(hd, all);
    }
  }

  // облегчённое оформление: для карточек, у которых нет пары в полной карточке /tovar, и как запасной путь
  // Загрузчик в служебной шапке сразу прячет сырую страницу Tilda и старую шапку (стиль #th-prod-hide), чтобы клиент не видел
  // её, пока рисуется карточка. Здесь стиль снимаем, когда карточка встроена или включено облегчённое оформление.
  function unhide() { var h = document.getElementById("th-prod-hide"); if (h && h.parentNode) h.parentNode.removeChild(h); }

  function restyle() {
    try { build(); } catch (e) {}
    unhide();
    setTimeout(function () { try { build(); } catch (e) {} }, 800);
    setTimeout(function () { try { build(); } catch (e) {} }, 2500);
  }

  // Полная карточка /tovar внутри этой страницы. Адрес, заголовок, текст, цена и разметка страницы /tproduct остаются
  // как отдала Tilda (их читает поиск и Merchant Center); поверх них рисуется карточка из data/<группа>.json.
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/";
  var CDN = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/";
  function embed(g, sl) {
    var snip = $(".t-store__prod-snippet__container");
    if (!snip) { restyle(); return; }
    // место под карточку держим пустым, но не оставляем белую страницу: заглушка первого экрана — из th-page.js
    window.TH_CARD_EMBED = 1;
    window.TH_CARD_QS = "?g=" + encodeURIComponent(g) + "&sl=" + encodeURIComponent(sl);
    var st = document.createElement("style");
    st.setAttribute("data-th-prod", "embed");
    st.textContent = "body.th-embed{background:#F1F5F9!important}.th-vh{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important;padding:0!important;margin:-1px!important}";
    document.head.appendChild(st);
    document.body.classList.add("th-embed");
    var mount = document.createElement("div");
    mount.setAttribute("data-th-page", "tovar");
    snip.parentNode.insertBefore(mount, snip);
    snip.classList.add("th-vh"); // остаётся в DOM для поиска, но не двоит карточку на экране
    unhide();
    var s = document.createElement("script");
    s.src = CDN + "th-page.js";
    document.head.appendChild(s);
    // запасной путь: за 20 секунд карточка не отрисовалась — возвращаем прежнюю и оформляем её
    setTimeout(function () {
      var ok = document.documentElement.getAttribute("data-th-state") === "ready" && mount.querySelector("h1");
      if (!ok) {
        snip.classList.remove("th-vh");
        if (mount.parentNode) mount.parentNode.removeChild(mount);
        window.TH_CARD_EMBED = 0;
        restyle();
      }
    }, 20000);
  }

  function start() {
    var m = location.pathname.match(/\/tproduct\/(\d+)-/);
    if (!m) { restyle(); return; }
    fetch(RAW + "data/tproduct-map.json?x=" + Math.floor(Date.now() / 600000), { cache: "default" })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (map) {
        var e = map[m[1]];
        if (e && e[0] && e[1]) embed(e[0], e[1]); else restyle();
      })
      .catch(function () { restyle(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
