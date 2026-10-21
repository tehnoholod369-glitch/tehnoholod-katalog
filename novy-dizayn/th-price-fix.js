/* Цены в карточках «Модели в наличии» на SEO-страницах — по уникальному slug, а не по артикулу.
   Причина: скрипт самой страницы сопоставляет цену по артикулу (data-art), а у разных позиций артикул совпадает
   (очаг и каминокомплект с тем же очагом; GREE разных цветов; мобильные BPAC-09 и BPAC-12 с общим «CP/N1»).
   Побеждает последняя запись, и карточка показывает чужую цену: каминокомплект за 849 990 ₸ превращался в 499 990 ₸ (очаг без портала).
   Здесь каждая карточка берёт цену своей записи по slug из data/<группа>.json (slug стоит на кнопке «В избранное» той же карточки).
   Подключается в head страницы: <script src=".../th-price-fix.js" defer></script>. Запускается после скрипта страницы и перекрывает его результат.
   Цена «от …» в шапке (thgeo-pmin) пересчитывается так же, из карточек с этим артикулом. */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/";

  function fix(group, by) {
    var cards = document.querySelectorAll(".thgeo-card");
    var minByArt = {};
    Array.prototype.forEach.call(cards, function (c) {
      var b = c.querySelector('[data-sl][data-g="' + group + '"]');
      var pr = c.querySelector(".thgeo-card__price");
      if (!b || !pr) return;
      var x = by[b.getAttribute("data-sl")];
      if (!x || !x.pt) return;
      if (pr.textContent.trim() !== x.pt) pr.textContent = x.pt;
      var art = pr.getAttribute("data-art");
      if (art && x.p && (minByArt[art] === undefined || x.p < minByArt[art].p)) minByArt[art] = { p: x.p, pt: x.pt };
    });
    Array.prototype.forEach.call(document.querySelectorAll(".thgeo-pmin[data-min-art]"), function (el) {
      var v = minByArt[el.getAttribute("data-min-art")];
      // в шапке цена без знака тенге: знак стоит в тексте страницы рядом
      if (v) el.textContent = v.pt.replace(/\s*₸\s*$/, "");
    });
  }

  function run() {
    var groups = {};
    Array.prototype.forEach.call(document.querySelectorAll(".thgeo-card [data-sl][data-g]"), function (b) { groups[b.getAttribute("data-g")] = 1; });
    Object.keys(groups).forEach(function (g) {
      fetch(RAW + g + ".json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d) return;
        var by = {};
        d.forEach(function (x) { if (x.sl) by[x.sl] = x; });
        // скрипт страницы ставит свои цены, когда догрузит те же данные, и на медленной сети делает это позже нас.
        // Поэтому поправляем сразу и потом следим за страницей две минуты: любая перезапись цены правится обратно
        // (fix меняет текст только при расхождении, так что цикла нет).
        fix(g, by);
        if (window.MutationObserver) {
          var t = 0, mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { fix(g, by); }, 60); });
          mo.observe(document.body, { childList: true, subtree: true, characterData: true });
          setTimeout(function () { mo.disconnect(); }, 120000);
        } else {
          setTimeout(function () { fix(g, by); }, 1500);
          setTimeout(function () { fix(g, by); }, 4000);
        }
      }).catch(function () {});
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
