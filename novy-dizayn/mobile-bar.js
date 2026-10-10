/**
 * Старое имя нижней панели телефона. 10.10.2026 панель одна на весь сайт: mobile-bar-369.js
 * (Главная · Каталог · Корзина · Позвонить · WhatsApp, дизайн-код 369, п. 6.6).
 * Тег mobile-bar.js вписан в 72 блока на GitHub и в страницы Tilda, поэтому файл не удаляем,
 * а превращаем в загрузчик новой панели: прежняя панель из трёх кнопок (Позвонить, WhatsApp,
 * Каталог) больше не рисуется, и у телефона не бывает двух разных нижних панелей.
 * Прежняя версия сохранена: Оптимизация сайта/_BAK_katalog_blok_20261010/mobile-bar.js.старый
 */
(function () {
  if (window.__thBar369 || document.querySelector('script[src*="mobile-bar-369"]')) return;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/mobile-bar-369.js?v=20261010b";
  document.head.appendChild(s);
})();
