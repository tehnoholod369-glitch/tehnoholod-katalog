/**
 * Единая точка сборки адреса фото.
 * В данных лежат ОТНОСИТЕЛЬНЫЕ пути: "img/bytovye/ballu.jpg", "img-dobor/poluprom/X_dob1.jpg".
 *
 * Файлы разделены между двумя хранилищами, причём в одной папке группы соседствуют
 * локальные и репозиторные файлы — поэтому источник выбирается ПО ФАКТУ наличия,
 * а не по префиксу пути: data/photo-local.json содержит точный список того,
 * что лежит в проекте. Пока список не загружен, отдаём CDN.
 *
 * После заливки папок img и img-dobor в GitHub достаточно заменить содержимое
 * data/photo-local.json на [] — всё уйдёт на CDN, правок в коде не нужно.
 */
// 26.08.2026: переехали с jsDelivr на своё хранилище. jsDelivr не отдаёт файлы
// из репозитория крупнее 50 МБ («403 Package size exceeded»), а фото каталога —
// 596 МБ в 8836 файлах: у первого посетителя редкой карточки вместо снимка
// стояло «Фото уточняется». img.tehnoholod369.kz — проект Netlify tehnoholod-img,
// подключённый к тому же репозиторию, поэтому относительные пути в данных
// («img/bytovye/…») остались как были. Скрипты по-прежнему идут с jsDelivr:
// raw отдаёт .js с nosniff, и браузер молча их не выполняет.
window.PHOTO_CDN = "https://img.tehnoholod369.kz/";
window.PHOTO_LOCAL = "uploads/";
window.PHOTO_LOCAL_SET = null;

window.PHOTO_LOCAL_LIST = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/photo-local.json";
// путь абсолютный по тому же правилу, что в cart.js и search.js:
// относительный на Tilda ведёт в tehnoholod369.kz/data/ и всегда 404
window.PHOTO_READY = fetch(window.PHOTO_LOCAL_LIST, {cache:"no-cache"})
  .then(function (r) { return r.ok ? r.json() : []; })
  .then(function (list) {
    var set = Object.create(null);
    for (var i = 0; i < list.length; i++) set[list[i]] = 1;
    window.PHOTO_LOCAL_SET = set;
    // страницы могли успеть подставить src до загрузки списка — переводим их на локальные файлы
    var imgs = document.querySelectorAll('img[src^="' + window.PHOTO_CDN + '"]');
    for (var k = 0; k < imgs.length; k++) {
      var rel = imgs[k].getAttribute("src").slice(window.PHOTO_CDN.length);
      if (set[rel]) imgs[k].setAttribute("src", window.PHOTO_LOCAL + rel);
    }
  })
  .catch(function () { window.PHOTO_LOCAL_SET = Object.create(null); });

window.photoUrl = function (u) {
  var s = String(u || "");
  if (!s) return "";
  if (/^https?:\/\//.test(s)) return s;
  s = s.replace(/^\/+/, "");
  var set = window.PHOTO_LOCAL_SET;
  var local = set ? !!set[s] : false;
  return (local ? window.PHOTO_LOCAL : window.PHOTO_CDN) + s;
};

/** Вторая попытка с альтернативным хранилищем перед показом заглушки. */
window.photoAlt = function (src) {
  var s = String(src || "");
  if (s.indexOf(window.PHOTO_LOCAL) === 0) return window.PHOTO_CDN + s.slice(window.PHOTO_LOCAL.length);
  if (s.indexOf(window.PHOTO_CDN) === 0) return window.PHOTO_LOCAL + s.slice(window.PHOTO_CDN.length);
  return "";
};
