/**
 * Нижняя панель для телефона: Позвонить · WhatsApp · Каталог.
 * @media в инлайн-стилях DC недоступен, поэтому ширина проверяется в рантайме
 * и панель монтируется скриптом — одинаково на всех страницах сайта.
 */
(function () {
  var ID = "th-mobile-bar";
  var BREAK = 640;

  function svg(inner) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + inner + '</svg>';
  }

  function build() {
    var bar = document.createElement("div");
    bar.id = ID;
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid #DCE5F0;box-shadow:0 -4px 16px rgba(7,28,59,0.08);display:grid;grid-template-columns:repeat(3,1fr);font-family:inherit";
    bar.innerHTML =
      '<a href="tel:+77000369369" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px;color:#0A4EA7;font-size:12px;font-weight:600;text-decoration:none">'
        + svg('<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"/>') + 'Позвонить</a>'
      + '<a href="https://wa.me/77000369369" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px;color:#0B6B45;font-size:12px;font-weight:600;text-decoration:none">'
        + '<svg viewBox="0 0 24 24" width="20" height="20" style="display:block"><path d="M12 2.5a9.4 9.4 0 0 0-8 14.3L2.5 21.5l4.8-1.4A9.4 9.4 0 1 0 12 2.5z" fill="#25D366"/><path d="M8.6 7.4c.3-.1.7 0 .9.4l.8 1.5c.1.3.1.6-.1.8l-.5.6c-.2.2-.2.4-.1.6.5 1 1.3 1.8 2.4 2.3.2.1.5 0 .6-.1l.6-.5c.2-.2.5-.2.8-.1l1.5.8c.4.2.5.6.4.9-.3.9-1.3 1.5-2.3 1.4-3-.3-5.6-2.8-5.9-5.9-.1-1 .5-2 1.4-2.3z" fill="#fff"/></svg>WhatsApp</a>'
      + '<a href="/katalog" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px;color:#0A4EA7;font-size:12px;font-weight:600;text-decoration:none">'
        + svg('<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/>') + 'Каталог</a>';
    return bar;
  }

  function sync() {
    var need = window.innerWidth <= BREAK;
    var bar = document.getElementById(ID);
    if (need && !bar) {
      document.body.appendChild(build());
      document.body.style.paddingBottom = "64px";
    } else if (!need && bar) {
      bar.parentNode.removeChild(bar);
      document.body.style.paddingBottom = "";
    }
  }

  window.addEventListener("resize", sync);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync);
  else sync();
  setTimeout(sync, 300);
})();
