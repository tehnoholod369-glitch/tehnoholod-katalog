/**
 * «Читайте дальше» в статьях базы знаний — по живым статьям, а не по вчерашним.
 *
 * Зачем. Статья вставляется в Tilda ПОЛНЫМ блоком и сама не обновляется: что
 * владелец скопировал в день публикации, то и лежит. Статей 35, публикуются они
 * волнами, и соседняя статья появляется позже — значит ссылка на неё в уже
 * вставленном блоке ведёт в 404 ровно до дня её заведения. Держать в блоке
 * только те, что живы на момент сборки, — половина решения: список стареет
 * в другую сторону, у ранних статей навсегда останутся три соседа из первой волны.
 *
 * Поэтому блок собирается заново при каждом открытии страницы — из
 * data/articles.json, который пересобирает gen_stati.py и в который попадают
 * ТОЛЬКО заведённые в Tilda адреса. Правило то же, что у dir-counts.js
 * и art-offers.js: число и ссылка живут в данных, а не в тексте.
 *
 * Не пришли данные — оставляем то, что собрал генератор. Пустой блок хуже
 * устаревшего: там ссылки были живыми на момент сборки.
 *
 * Отдельным файлом, а не строкой в блоке: th-page.js вставляет блок через
 * innerHTML и оживляет только скрипты со ссылкой (грабли dir-counts, 27.08.2026).
 *
 * ⚠️ Ломаешь договор разметки — меняй ИМЯ файла: jsDelivr держит скрипт
 * у посетителя долго, и старый кэш встретит новую разметку.
 *
 * Разметка:
 *   <div class="art-cards"
 *        data-art-next="<слуг>|<кластер>|<группа>|<соседи из текста через запятую>">
 * Порядок выбора соседей повторяет генератор: ссылки, которые автор поставил
 * в самом тексте → свой кластер (по кругу от текущей статьи, иначе младшие
 * номера собирают все ссылки) → своя группа каталога → соседний кластер
 * из карты в самих данных.
 *
 * Второе дело того же файла — ссылки ВНУТРИ текста:
 *   <span data-art-link="<слуг>">Тепловой насос воздух-вода</span>
 * Генератор снимает ссылку со статьи, которой ещё нет в Tilda (замечание
 * владельца 03.09.2026: «не открывает ссылки» — в тексте про отопление
 * автор сослался на четыре статьи следующих волн). Здесь она возвращается
 * обратно ссылкой в тот день, когда адрес появится в данных, — блок в Tilda
 * перевставлять не нужно.
 */
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/tehnoholod369-glitch/" +
            "tehnoholod-katalog/main/novy-dizayn/data/articles.json";
  var САЙТ = "https://tehnoholod369.kz";

  function покруг(список, слуг) {
    var i = -1, k;
    for (k = 0; k < список.length; k++) if (список[k].s === слуг) i = k;
    if (i < 0) return список.slice();
    return список.slice(i + 1).concat(список.slice(0, i + 1));
  }

  function собрать(все, соседи, слуг, кластер, группа, изТекста) {
    var взято = {}, беру = [];
    взято[слуг] = 1;
    function добавить(кандидаты) {
      for (var i = 0; i < кандидаты.length && беру.length < 3; i++) {
        var a = кандидаты[i];
        if (взято[a.s]) continue;
        взято[a.s] = 1;
        беру.push(a);
      }
    }
    function где(поле, значение) {
      if (!значение) return [];
      return все.filter(function (a) { return a[поле] === значение; });
    }
    добавить((изТекста || []).map(function (s) {
      for (var i = 0; i < все.length; i++) if (все[i].s === s) return все[i];
      return null;
    }).filter(Boolean));
    добавить(покруг(где("c", кластер), слуг));
    добавить(покруг(где("g", группа), слуг));
    добавить(где("c", соседи[кластер] || ""));
    добавить(покруг(все, слуг));
    return беру;
  }

  function экран(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function нарисовать(узел, статьи) {
    узел.innerHTML = статьи.map(function (a) {
      return '<a class="art-card" href="' + САЙТ + "/" + экран(a.s) + '">' +
             '<div class="art-card__t">' + экран(a.t) + "</div>" +
             '<div class="art-card__s">' + экран((a.d || "").slice(0, 110)) + "</div>" +
             '<div class="art-card__go">Читать →</div></a>';
    }).join("");
  }

  function оживить(все) {
    var карта = {}, i;
    for (i = 0; i < все.length; i++) карта[все[i].s] = все[i];
    [].forEach.call(document.querySelectorAll("[data-art-link]"), function (у) {
      var слуг = у.getAttribute("data-art-link");
      if (!карта[слуг]) return;
      var a = document.createElement("a");
      a.href = САЙТ + "/" + слуг;
      a.innerHTML = у.innerHTML;
      у.parentNode.replaceChild(a, у);
    });
  }

  // Копирайт. Блоки, вставленные в Tilda до 03.09.2026, его не несут, а перевставлять
  // сорок страниц ради одной строки — не работа. Шаблон её теперь рисует сам,
  // поэтому сначала проверяем, нет ли её уже.
  //
  // ⚠️ Цепляем в конец #dc-root, а НЕ в .art-local-chrome: тот подвал в Tilda скрыт
  // (display:none — глобальный подвал сайта рисуется отдельно), и строка внутри него
  // не видна никому. Первая версия этой функции ошиблась ровно так, поймано на живой
  // /brizer-ili-konditsioner-s-pritokom в тот же день.
  function копирайт() {
    // Проверяем не «есть ли», а «видно ли». Блоки, собранные днём 03.09.2026,
    // несут копирайт ВНУТРИ .art-local-chrome, а тот в Tilda скрыт — строка есть
    // в разметке и не видна никому. Простое «уже есть — выходим» на таких
    // страницах молча оставляло невидимую строку.
    var был = document.querySelector("[data-th-copyright]");
    if (был && был.offsetHeight > 0) return;
    var корень = document.querySelector("#dc-root");
    // Корень статьи создаёт шаблонизатор блока — ПОСЛЕ DOMContentLoaded. Ждём его,
    // иначе выходим впустую: ровно на этом 04.09.2026 копирайт не появлялся,
    // хотя скрипт был свежий. Та же грабля, что у th-shapka.js часом раньше.
    if (!корень) { setTimeout(копирайт, 300); return; }
    if (был && был.parentNode) был.parentNode.removeChild(был);
    var о = document.createElement("div");
    о.setAttribute("data-th-copyright", "1");
    о.style.cssText = "max-width:888px;margin:0 auto;padding:18px 24px 40px;" +
                      "font-size:12px;line-height:1.7;color:#6B7C93;";
    о.innerHTML = "© " + new Date().getFullYear() + " ИП «ТехноХолод». Тексты и таблицы " +
      "базы знаний — наши собственные. Перепечатка целиком или существенной частью — " +
      "только с письменного разрешения. Цитата с активной ссылкой на источник разрешена " +
      'без запроса. <a href="' + САЙТ + '/usloviya-ispolzovaniya" style="color:#9FB0C4;">' +
      "Условия использования</a>";
    корень.appendChild(о);
  }

  // Дата первой публикации в разметку. Поле datePublished появилось в генераторе
  // 03.09.2026 — блоки, вставленные раньше, его не несут, а перевставлять сорок
  // страниц ради одной строки JSON-LD не работа. Дописываем на лету: Google
  // разбирает structured data после исполнения скриптов.
  // Если поле уже есть — не трогаем: в блоке оно точнее, чем что-либо здесь.
  function датаВРазметку(все) {
    var адрес = location.pathname.replace(/^\/+|\/+$/g, ""), дата = "", i;
    for (i = 0; i < все.length; i++) if (все[i].s === адрес) { дата = все[i].pub || ""; break; }
    if (!дата) return;
    [].forEach.call(document.querySelectorAll('script[type="application/ld+json"]'), function (у) {
      var j;
      try { j = JSON.parse(у.textContent); } catch (e) { return; }
      if (!j || j["@type"] !== "Article" || j.datePublished) return;
      j.datePublished = дата;
      у.textContent = JSON.stringify(j);
    });
  }

  function пуск() {
    копирайт();
    var узлы = document.querySelectorAll("[data-art-next]");
    var спящие = document.querySelectorAll("[data-art-link]");
    if (!узлы.length && !спящие.length) return;
    fetch(RAW, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.items || !d.items.length) return;
        var соседи = d.neighbours || {};
        [].forEach.call(узлы, function (узел) {
          var части = (узел.getAttribute("data-art-next") || "").split("|");
          var изТекста = (части[3] || "").split(",").filter(Boolean);
          var выбор = собрать(d.items, соседи, части[0] || "", части[1] || "",
                              части[2] || "", изТекста);
          if (выбор.length) нарисовать(узел, выбор);
        });
        оживить(d.items);
        датаВРазметку(d.items);
      })
      .catch(function () { /* оставляем то, что собрал генератор */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", пуск);
  } else {
    пуск();
  }
})();
