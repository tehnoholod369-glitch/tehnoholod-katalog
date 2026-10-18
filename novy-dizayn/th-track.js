/**
 * События конверсий для GA4 и Яндекс.Метрики (TASK-07, 18.10.2026).
 *
 * Зачем. Клики по телефону и WhatsApp, добавление в корзину, отправка заказа и заявки
 * уже пишутся в таблицу «События»/«Заявки» приёмника, но не доходили до GA4 и Метрики:
 * в аналитике не было ни одной цели. Этот файл зеркалит те же действия в счётчики.
 *
 * Правила.
 *  - Персональных данных нет: ни имени, ни телефона, ни адреса, ни текста сообщения, ни номера заказа.
 *  - Ничего не ждём и ничего не ломаем: любая ошибка счётчика глотается, звонок, переход
 *    в WhatsApp и отправка заказа идут как раньше.
 *  - Вызов: window.THTrack(имя, параметры). Если файл ещё не загрузился, вызывающий
 *    код проверяет наличие функции и просто пропускает событие.
 *
 * События (имя GA4 = имя цели Метрики):
 *  phone_click      клик по ссылке tel:                  place = панель / шапка / страница
 *  whatsapp_click   клик по ссылке wa.me                 place = панель / шапка / страница
 *  add_to_cart      товар добавлен в корзину             value, currency, items[]
 *  lead_submit      заявка из формы записана в приёмник  channel
 *  order_submit     заказ из корзины отправлен           value, currency, items_count
 */
(function () {
  if (window.THTrack) return;

  var YM_ID = 109494414;          // счётчик Яндекс.Метрики сайта
  var GA4_ID = "G-Q8G1ECPC0W";    // потоковый идентификатор GA4
  // Tilda подключает GA старой библиотекой analytics.js (ga('create','G-…')): для GA4 она не годится.
  // Поэтому загружаем штатный gtag.js. Просмотры страниц здесь НЕ шлём (send_page_view: false),
  // чтобы не задвоить их, если у владельца в GA4 они уже приходят; включается решением владельца.
  var LOAD_GTAG = true;
  var SEND_PAGEVIEW = false;

  var gtagReady = false;
  function ensureGtag() {
    if (typeof window.gtag === "function") { gtagReady = true; return true; }
    if (!LOAD_GTAG) return false;
    try {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
      document.head.appendChild(s);
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID, { send_page_view: SEND_PAGEVIEW });
      gtagReady = true;
      return true;
    } catch (e) { return false; }
  }

  function ym(name, p) {
    try {
      if (typeof window.ym === "function") { window.ym(YM_ID, "reachGoal", name, p || {}); }
    } catch (e) { /* счётчик не должен мешать действию */ }
  }

  function ga4(name, p) {
    try {
      if (ensureGtag()) { window.gtag("event", name, p || {}); }
    } catch (e) { /* то же */ }
  }

  window.THTrack = function (name, p) {
    if (!name) return;
    p = p || {};
    ga4(name, p);
    // В Метрику уходят только простые параметры (без массива items).
    var simple = {};
    for (var k in p) {
      if (Object.prototype.hasOwnProperty.call(p, k) && k !== "items") simple[k] = p[k];
    }
    ym(name, simple);
  };
})();
