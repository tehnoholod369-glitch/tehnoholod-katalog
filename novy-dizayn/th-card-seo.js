/**
 * Карточки /tproduct: счётчик Метрики, язык страницы и разметка Product (черновик 29.10.2026, НЕ опубликован).
 *
 * Зачем. Шаблон карточек Tilda собирает страницу без кода Метрики и GA: просмотры карточек не считаются,
 * а цели из th-track.js (в корзину, заявка, клики по телефону и WhatsApp) молча теряются, потому что
 * window.ym на карточке не существует. Ещё у шаблона lang="en" и нет JSON-LD Product.
 *
 * Что делает (только при адресе /tproduct/…, на других страницах ничего):
 *  1. lang страницы -> ru.
 *  2. Если window.ym нет — загружает штатный tag.js и инициализирует тот же счётчик (просмотр считается сам).
 *  3. Добавляет JSON-LD Product из того, что видно на карточке: название, артикул, марка, цена, наличие, фото, описание.
 *     Нет цены или названия — разметку не ставит. Один раз, повторный вызов ничего не дублирует.
 *
 * Откат: убрать подключение этого файла (строка <script> в коде магазина), файл можно удалить.
 * Персональных данных нет. Любая ошибка глотается.
 */
(function () {
  if (window.__thCardSeo) return;
  if (!/^\/tproduct\//.test(location.pathname)) return;
  window.__thCardSeo = 1;

  var YM_ID = 109494414;

  try { document.documentElement.setAttribute("lang", "ru"); } catch (e) {}

  function metrika() {
    try {
      if (typeof window.ym === "function") return;
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      window.ym(YM_ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    } catch (e) {}
  }

  function txt(el) { return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : ""; }

  function product() {
    try {
      if (document.querySelector('script[data-th-card-ld]')) return true;
      var h1 = document.querySelector("h1");
      var name = txt(h1);
      // Только блок самого товара: ближайший предок заголовка, где уже есть цена (рядом бывают карточки похожих).
      var box = h1;
      while (box && !/₸/.test(box.innerText || "")) box = box.parentElement;
      var body = (box || document.body).innerText || "";
      var pm = body.match(/(\d[\d\s ]{2,})\s*₸/);
      var price = pm ? pm[1].replace(/[\s ]/g, "") : "";
      if (!name || !price) return false;
      var sku = (body.match(/арт\.\s*([A-Za-z0-9\-_.]+)/) || [])[1] || "";
      var brand = (body.match(/(?:^|\n)\s*(Ballu|Royal Thermo|Electrolux|TCL|Hisense)\s*(?:\n|$)/) || [])[1] || "";
      // Нет в наличии проверяем первым: «В наличии» входит в эту фразу не как слово, но порядок страхует.
      var av = /Нет в наличии/.test(body) ? "https://schema.org/OutOfStock"
        : /В наличии/.test(body) ? "https://schema.org/InStock"
        : /Под заказ/.test(body) ? "https://schema.org/PreOrder" : "";
      var img = (document.querySelector('meta[property="og:image"]') || {}).content || "";
      var desc = (document.querySelector('meta[name="description"]') || {}).content || "";
      var url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href.split("?")[0];
      var o = {
        "@context": "https://schema.org", "@type": "Product", "name": name, "url": url,
        "offers": { "@type": "Offer", "price": price, "priceCurrency": "KZT", "url": url }
      };
      if (sku) o.sku = sku;
      if (brand) o.brand = { "@type": "Brand", "name": brand };
      if (img) o.image = img;
      if (desc) o.description = desc;
      if (av) o.offers.availability = av;
      var s = document.createElement("script");
      s.type = "application/ld+json"; s.setAttribute("data-th-card-ld", "1");
      s.textContent = JSON.stringify(o);
      document.head.appendChild(s);
      return true;
    } catch (e) { return true; }
  }

  function start() {
    metrika();
    var n = 0;
    (function tick() { if (product() || ++n > 12) return; setTimeout(tick, 500); })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
