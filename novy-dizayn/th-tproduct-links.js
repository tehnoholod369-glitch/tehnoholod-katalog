/* ТехноХолод: ссылки на карточку товара ведут на /tproduct/<id>-<slug>.
 * Каталог, поиск, избранное, сравнение и корзина строят ссылки вида /tovar?g=<раздел>&sl=<слаг>.
 * Скрипт подменяет такую ссылку на адрес страницы магазина, если для позиции есть проверенная пара
 * (data/tproduct-forward.json: «раздел|слаг» -> «id-слаг»; пара = высокая уверенность, одна страница магазина,
 * цена каталога = цене магазина). Нет пары — ссылка остаётся как есть. Ничего не пишет на сервер. */
(function () {
  if (window.__thTpLinks) return;
  window.__thTpLinks = 1;
  var MAP_URL = (window.TH_TP_MAP_URL) || "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/data/tproduct-forward.json";
  var map = null;

  function conv(a) {
    var h = a.getAttribute("href");
    if (!h || h.indexOf("/tovar?") < 0) return;
    var g = h.match(/[?&]g=([^&#]+)/), s = h.match(/[?&]sl=([^&#]+)/);
    if (!g || !s) return;
    var v;
    try { v = map[decodeURIComponent(g[1]) + "|" + decodeURIComponent(s[1])]; } catch (e) { return; }
    if (v) {
      a.setAttribute("href", "/tproduct/" + v);
      a.setAttribute("data-th-tp", "1");
    }
  }

  function scan() {
    var list = document.querySelectorAll('a[href*="/tovar?"]');
    for (var i = 0; i < list.length; i++) conv(list[i]);
  }

  fetch(MAP_URL).then(function (r) { return r.json(); }).then(function (j) {
    map = j;
    scan();
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(scan, 150);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }).catch(function () { /* без карты ссылки остаются прежними */ });
})();
