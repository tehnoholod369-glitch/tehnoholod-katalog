/**
 * Пункт «Акции» в меню и подвале всех страниц (07.10.2026, решение владельца: раздела не было видно).
 * Шапка и подвал на страницах собираются разными файлами и разными версиями, поэтому пункт добавляется
 * отсюда один раз для всех: если «Акции» уже есть — ничего не делаем. Подгружается из th-plashka.js.
 * Красный — только у слова «Акции» в меню (акция = допустимое место красного по дизайн-коду 369).
 */
(function () {
  "use strict";
  var ГОТОВО = { меню: false, подвал: false };

  function меню() {
    if (ГОТОВО.меню) return;
    var mn = document.querySelector(".th-mn");
    if (!mn) return;
    if (mn.querySelector('a[href="/akcii"]')) { ГОТОВО.меню = true; return; }
    var бренды = [].filter.call(mn.querySelectorAll("a"), function (a) { return a.getAttribute("href") === "/brendy"; })[0];
    if (!бренды) return;
    var a = document.createElement("a");
    a.href = "/akcii";
    a.textContent = "Акции";
    a.style.cssText = "color:#E81C1C;font-weight:700";
    бренды.parentNode.insertBefore(a, бренды);
    ГОТОВО.меню = true;
  }

  function подвал() {
    if (ГОТОВО.подвал) return;
    var f = document.querySelector("[data-th-podval], footer");
    if (!f) return;
    if (f.querySelector('a[href="/akcii"]')) { ГОТОВО.подвал = true; return; }
    var возврат = [].filter.call(f.querySelectorAll("a"), function (a) { return a.getAttribute("href") === "/vozvrat"; })[0];
    if (!возврат) return;
    var a = document.createElement("a");
    a.href = "/akcii";
    a.textContent = "Акции";
    возврат.parentNode.insertBefore(a, возврат);
    ГОТОВО.подвал = true;
  }

  function шаг() { меню(); подвал(); }
  var n = 0;
  var t = setInterval(function () { шаг(); if ((ГОТОВО.меню && ГОТОВО.подвал) || ++n > 40) clearInterval(t); }, 400);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", шаг); else шаг();
})();
