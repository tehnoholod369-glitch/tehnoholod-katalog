/**
 * Кнопка «Поделиться» (07.10.2026, решение владельца). Подключается на страницах, где есть кнопки:
 *   <button type="button" data-th-share data-g="ventilyaciya" data-sl="gree-fhbqg-d5b-k" data-n="Название" data-b="Бренд">
 * Поведение: на телефоне открывает системное меню «Поделиться» (WhatsApp, Telegram и др.);
 * на компьютере (или если меню недоступно) копирует ссылку на товар и показывает «Ссылка скопирована».
 * Ссылка ведёт на карточку товара: /tovar?g=<раздел>&sl=<артикул-слаг>. Без data-g/data-sl берётся адрес текущей страницы.
 * Стили значка берутся у кнопок .th-act из th-izbrannoe.js (тот же круглый значок 36 px).
 */
(function () {
  if (window.THShare) return;

  function адрес(к) {
    var d = к.dataset || {};
    if (d.url) return d.url;
    if (d.g && d.sl) return location.origin + "/tovar?g=" + encodeURIComponent(d.g) + "&sl=" + encodeURIComponent(d.sl);
    return location.href;
  }

  function сообщить(текст) {
    var т = document.getElementById("th-share-toast");
    if (!т) {
      т = document.createElement("div");
      т.id = "th-share-toast";
      т.setAttribute("role", "status");
      т.style.cssText = "position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:90;max-width:min(92vw,420px);padding:12px 16px;border-radius:10px;background:#0033A0;color:#fff;font:600 14px/20px Inter,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,51,160,.28);display:none";
      document.body.appendChild(т);
    }
    т.textContent = текст;
    т.style.display = "block";
    clearTimeout(т._t);
    т._t = setTimeout(function () { т.style.display = "none"; }, 3000);
  }

  function копировать(текст) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(текст);
    }
    return new Promise(function (ok, fail) {
      try {
        var a = document.createElement("textarea");
        a.value = текст;
        a.setAttribute("readonly", "");
        a.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
        document.body.appendChild(a);
        a.select();
        var сделано = document.execCommand("copy");
        document.body.removeChild(a);
        сделано ? ok() : fail();
      } catch (e) { fail(e); }
    });
  }

  function поделиться(к) {
    var d = к.dataset || {};
    var url = адрес(к);
    var название = ((d.b ? d.b + " " : "") + (d.n || document.title || "")).trim();
    var запасной = function () {
      копировать(url).then(function () { сообщить("Ссылка скопирована"); }, function () { window.prompt("Скопируйте ссылку:", url); });
    };
    // системное меню — на телефонах и в части браузеров; отмена пользователем (AbortError) ошибкой не считается
    if (navigator.share) {
      navigator.share({ title: название, text: название, url: url }).catch(function (e) {
        if (e && e.name === "AbortError") return;
        запасной();
      });
    } else {
      запасной();
    }
  }

  document.addEventListener("click", function (e) {
    var к = e.target && e.target.closest ? e.target.closest("[data-th-share]") : null;
    if (!к) return;
    e.preventDefault();
    e.stopPropagation();
    поделиться(к);
  }, true);

  window.THShare = { поделиться: поделиться };
})();
