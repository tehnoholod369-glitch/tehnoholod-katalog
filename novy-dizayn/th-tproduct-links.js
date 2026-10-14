/* ТехноХолод: ссылки на карточку товара ведут на /tproduct/<id>-<slug>.
 * Каталог, поиск, избранное, сравнение и корзина строят ссылки вида /tovar?g=<раздел>&sl=<слаг>.
 * Скрипт подменяет такую ссылку на адрес страницы магазина, если для позиции есть проверенная пара
 * (data/tproduct-forward.json: «раздел|слаг» -> «id-слаг»; пара = высокая уверенность, одна страница магазина,
 * цена каталога = цене магазина). Нет пары — ссылка остаётся как есть. Ничего не пишет на сервер. */
(function () {
  if (window.__thTpLinks) return;
  window.__thTpLinks = 1;
  var MAP_URL = (window.TH_TP_MAP_URL) || "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@3de9d42bceb72814a1c4a418b6afb048da7b2aa9/novy-dizayn/data/tproduct-forward.json";
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

  /* Страница /tovar?g=&sl=: если у позиции есть страница магазина, canonical ведёт на неё.
   * Свой canonical страница ставит после отрисовки, поэтому следим за <head> и возвращаем адрес магазина. */
  function canon() {
    if (location.pathname.replace(/\/$/, "") !== "/tovar") return;
    var q = new URLSearchParams(location.search), g = q.get("g"), s = q.get("sl");
    if (!g || !s || !map[g + "|" + s]) return;
    var target = location.origin + "/tproduct/" + map[g + "|" + s];
    var apply = function () {
      var l = document.querySelector('link[rel="canonical"]');
      if (!l) { l = document.createElement("link"); l.setAttribute("rel", "canonical"); document.head.appendChild(l); }
      if (l.getAttribute("href") !== target) l.setAttribute("href", target);
    };
    apply();
    new MutationObserver(apply).observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  }

  fetch(MAP_URL).then(function (r) { return r.json(); }).then(function (j) {
    map = j;
    canon();
    scan();
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(scan, 150);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }).catch(function () { /* без карты ссылки остаются прежними */ });
})();
