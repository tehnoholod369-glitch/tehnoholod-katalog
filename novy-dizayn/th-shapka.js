/**
 * Единая шапка для СТАРЫХ страниц сайта (статьи, разделы, /vozvrat).
 *
 * Зачем. 27.08.2026 на сайте 12 страниц остались в прежнем дизайне: своя шапка
 * `thnav` с другим логотипом, меню из четырёх пунктов и телефоном в четырёх
 * написаниях. Покупатель, перешедший из статьи, попадает будто на другой сайт,
 * а дойти до каталога, корзины или WhatsApp с этих страниц нельзя.
 *
 * Почему не перевести страницы на редизайн целиком: статьи отдают серверу
 * 4 000–5 600 знаков текста, а страница редизайна — 55–100. Перевод обменял бы
 * живой SEO-текст на пустую страницу. Поэтому меняется ТОЛЬКО шапка, а текст
 * статьи остаётся как есть, в HTML от сервера.
 *
 * Он же закрывает карточки магазина `/tproduct/` — туда ведут 3 307 офферов
 * Google-фида (95 % всех входов), а на странице была РОВНО ОДНА ссылка и ни
 * телефона, ни пути в каталог. Проверено 27.08.2026 на живой карточке: после
 * вставки ссылок стало 7, вылет за экран 0, товар и цена на месте.
 *
 * Вставлять в Tilda ОДНОЙ строкой — либо в «HTML-код в HEAD» настроек сайта
 * (тогда шапка появится сразу везде, включая /tproduct/), либо в самый верх
 * первого блока T123 конкретной старой страницы:
 *   <script src="https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/th-shapka.js"></script>
 *
 * Дальше правки едут сами — как у страниц редизайна.
 */
(function () {
  "use strict";
  var ТЕЛЕФОН_МАШИНЕ = "+77000369369";      // для tel: и wa.me
  var ТЕЛЕФОН_ЛЮДЯМ  = "+77 000 369 369";   // §13: единый формат витрины,
  // пробелы неразрывные — номер пишется одной строкой (правило 01.09.2026)
  var CDN = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/";

  // Посадочные страницы для подвала. Список переписывает gen_geo_landing.py
  // из PAGES — руками не править, разъедется с блоками.
  /* GEO-ПОДБОРКИ-НАЧАЛО */
  var ПОДБОРКИ = [
    ["https://tehnoholod369.kz/kondicionery-almaty", "Кондиционеры"],
    ["https://tehnoholod369.kz/teplovye-zavesy-almaty", "Тепловые завесы"],
    ["https://tehnoholod369.kz/teplovye-pushki-almaty", "Тепловые пушки"],
    ["https://tehnoholod369.kz/radiatory-otopleniya-almaty", "Радиаторы отопления"],
    ["https://tehnoholod369.kz/mobilnye-kondicionery-almaty", "Мобильные кондиционеры"],
    ["https://tehnoholod369.kz/osushiteli-vozduha-almaty", "Осушители воздуха"],
    ["https://tehnoholod369.kz/kondicioner-na-25-kvm", "Кондиционер на комнату 25 м²"],
    ["https://tehnoholod369.kz/kondicioner-do-200000", "Кондиционер до 200 000 ₸"],
    ["https://tehnoholod369.kz/tihiy-kondicioner", "Тихий кондиционер для спальни"],
    ["https://tehnoholod369.kz/kondicioner-obogrev-zimoy", "Кондиционер для обогрева зимой"],
    ["https://tehnoholod369.kz/kanalnye-kondicionery-almaty", "Канальные кондиционеры"],
    ["https://tehnoholod369.kz/kassetnye-kondicionery-almaty", "Кассетные кондиционеры"],
    ["https://tehnoholod369.kz/kondicioner-na-35-kvm", "Кондиционер на комнату 35 м²"],
    ["https://tehnoholod369.kz/ustanovka-kondicionera-talgar", "Установка кондиционера в Талгаре"],
    ["https://tehnoholod369.kz/ustanovka-kondicionera-otegen-batyr", "Установка кондиционера в Отеген батыре"],
    ["https://tehnoholod369.kz/ustanovka-kondicionera-burundai", "Установка кондиционера в Бурундае"],
    ["https://tehnoholod369.kz/kaminy-almaty", "Камины и электроочаги"],
    ["https://tehnoholod369.kz/vrf-sistemy-almaty", "VRF и мини-VRF системы"],
    ["https://tehnoholod369.kz/kondicionery-dlya-ofisa", "Кондиционеры для офиса"],
    ["https://tehnoholod369.kz/napolno-potolochnye-kondicionery-almaty", "Напольно-потолочные кондиционеры"],
    ["https://tehnoholod369.kz/pritochnaya-ustanovka-almaty", "Приточные установки"],
    ["https://tehnoholod369.kz/pritochno-vytyazhnye-ustanovki-almaty", "Приточно-вытяжные установки с рекуперацией"],
    ["https://tehnoholod369.kz/vytyazhnye-ventilyatory-almaty", "Вытяжные вентиляторы"],
    ["https://tehnoholod369.kz/invertornyy-kondicioner-almaty", "Инверторные кондиционеры"],
    ["https://tehnoholod369.kz/kondicioner-s-wifi", "Кондиционеры с Wi-Fi"],
    ["https://tehnoholod369.kz/kondicioner-na-50-kvm", "Кондиционер на комнату 50 м²"],
    ["https://tehnoholod369.kz/kondicioner-do-300000", "Кондиционеры до 300 000 ₸"],
    ["https://tehnoholod369.kz/nakopitelnyy-vodonagrevatel-almaty", "Накопительные водонагреватели"],
    ["https://tehnoholod369.kz/protochnyy-vodonagrevatel-almaty", "Проточные водонагреватели"],
    ["https://tehnoholod369.kz/radiatory-sekcionnye-almaty", "Секционные радиаторы отопления"],
    ["https://tehnoholod369.kz/konvektory-almaty", "Электрические конвекторы"],
    ["https://tehnoholod369.kz/kondicioner-s-pritokom", "Кондиционеры с притоком свежего воздуха"],
  ];
  /* GEO-ПОДБОРКИ-КОНЕЦ */


  // 1. Старая шапка убирается: она fixed и заняла бы место под новой.
  function убратьСтарую() {
    var с = document.createElement("style");
    с.textContent = ".thnav{display:none !important;} html{scroll-padding-top:0 !important;}"
      + "body{padding-top:0 !important;}";
    document.head.appendChild(с);
  }

  // 2. Битые якоря. 26.08.2026 «/» и «/katalog» переехали на редизайн, и ссылки
  //    вида /katalog#radiatory или /#rec1378414533 ведут в пустоту: таких блоков
  //    на новых страницах нет. Переводим на фильтр каталога, он существует.
  var ЯКОРЯ = {
    "#radiatory": "/katalog?g=radiatory",
    "#ventilyatory": "/katalog?g=ventilyaciya",
    "#vodonagrevateli": "/katalog?g=vodonagrevateli"
  };
  function починитьСсылки() {
    [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute("href") || "";
      for (var я in ЯКОРЯ) {
        if (h.indexOf("/katalog" + я) === 0) { a.setAttribute("href", ЯКОРЯ[я]); return; }
      }
      // якорь на блок старой Главной — она переведена, блока больше нет
      if (/^https?:\/\/tehnoholod369\.kz\/#rec\d+$/.test(h) || /^\/#rec\d+$/.test(h)) {
        a.setAttribute("href", "/");
      }
    });
  }

  // 3. Телефон на витрине пишется одинаково везде (правило проекта).
  function единыйТелефон() {
    var re = /\+?7\s*\(?700\)?[\s\-]*0?\s*3?36?\s*[\d\s\-]{5,}/g;
    [].forEach.call(document.querySelectorAll("a[href^='tel:']"), function (a) {
      a.setAttribute("href", "tel:" + ТЕЛЕФОН_МАШИНЕ);
      if (/\d/.test(a.textContent)) a.textContent = ТЕЛЕФОН_ЛЮДЯМ;
    });
  }

  function шапка() {
    var o = document.createElement("div");
    o.setAttribute("data-th-shapka", "1");
    o.innerHTML =
      '<div style="background:#071C3B;color:#fff;padding:9px 0;font-size:13px;font-family:TildaSans,Arial,sans-serif;">'
      + '<div style="max-width:1240px;margin:0 auto;padding:0 24px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 22px;">'
      + '<span style="opacity:.85;">Алматы · доставка по Казахстану</span>'
      + '<span style="margin-left:auto;opacity:.85;">Продажа · монтаж · сервис</span>'
      + '<a href="tel:' + ТЕЛЕФОН_МАШИНЕ + '" style="color:#fff;font-weight:700;text-decoration:none;">' + ТЕЛЕФОН_ЛЮДЯМ + '</a>'
      + '</div></div>'
      + '<div style="background:#fff;border-bottom:1px solid #DCE5F0;font-family:TildaSans,Arial,sans-serif;">'
      + '<div style="max-width:1240px;margin:0 auto;padding:12px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;">'
      + '<a href="/" style="text-decoration:none;"><img src="' + CDN + 'assets/logo-horizontal.png" alt="ИП «ТехноХолод»" style="height:40px;width:auto;display:block;" /></a>'
      + '<a href="/katalog" style="display:flex;align-items:center;gap:8px;background:#0872D3;color:#fff;border-radius:8px;padding:10px 15px;font-size:15px;font-weight:600;text-decoration:none;">'
      + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" style="display:block;flex:none;"><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/></svg>Каталог</a>'
      + '<div style="flex:1;"></div>'
      + '<a href="/korzina" style="color:#0A4EA7;font-size:15px;font-weight:600;text-decoration:none;">Корзина</a>'
      + '<a href="/baza-znaniy" style="color:#0A4EA7;font-size:15px;font-weight:600;text-decoration:none;">База знаний</a>'
      + '<a href="/kontakty" style="color:#0A4EA7;font-size:15px;font-weight:600;text-decoration:none;">Контакты</a>'
      + '<a href="https://wa.me/' + ТЕЛЕФОН_МАШИНЕ.replace("+", "") + '" style="background:#E6F2FD;color:#0A4EA7;border-radius:8px;padding:10px 16px;font-size:15px;font-weight:700;text-decoration:none;">WhatsApp</a>'
      + '</div></div>';
    return o;
  }

  // Вторая строка подвала: путь из карточки /tproduct/ в разделы.
  // До 31.08.2026 с карточки нельзя было попасть ни на одну посадочную —
  // они жили только в карте сайта.
  function строкаПодборок() {
    if (!ПОДБОРКИ.length) return "";
    var s = '<div style="max-width:1240px;margin:12px auto 0;padding:0 24px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;line-height:1.7;">'
      + '<span style="color:#6B7C93;">Подборки:</span>';
    for (var i = 0; i < ПОДБОРКИ.length; i++) {
      s += '<a href="' + ПОДБОРКИ[i][0] + '" style="color:#9FB0C4;text-decoration:none;">' + ПОДБОРКИ[i][1] + '</a>';
    }
    return s + '</div>';
  }

  function подвал() {
    var o = document.createElement("div");
    o.setAttribute("data-th-podval", "1");
    o.innerHTML =
      '<div style="background:#071C3B;color:#9FB0C4;padding:26px 0;margin-top:40px;font:14px/1.6 TildaSans,Arial,sans-serif;">'
      + '<div style="max-width:1240px;margin:0 auto;padding:0 24px;display:flex;flex-wrap:wrap;gap:10px 26px;align-items:center;">'
      + '<a href="/katalog" style="color:#fff;text-decoration:none;font-weight:600;">Каталог</a>'
      + '<a href="/uslugi" style="color:#9FB0C4;text-decoration:none;">Монтаж и сервис</a>'
      + '<a href="/kontakty" style="color:#9FB0C4;text-decoration:none;">Контакты</a>'
      // /vozvrat — юридическая страница; с нового сайта на неё не вело ни одной ссылки
      + '<a href="/vozvrat" style="color:#9FB0C4;text-decoration:none;">Возврат и обмен</a>'
      + '<span style="margin-left:auto;">ИП «ТехноХолод» · Алматы · '
      + '<a href="tel:' + ТЕЛЕФОН_МАШИНЕ + '" style="color:#fff;text-decoration:none;font-weight:700;">' + ТЕЛЕФОН_ЛЮДЯМ + '</a></span>'
      + '</div>' + строкаПодборок() + '</div>';
    return o;
  }

  // Плашка «сайт наполняется» — общая со страницами редизайна. Ставим ДО проверки
  // на data-th-page: на страницах редизайна свою шапку рисует th-page.js и дальше
  // мы не идём, а плашка нужна и там, и на старых страницах, и на /tproduct/.
  function плашка() {
    if (document.querySelector('script[src*="th-plashka.js"]')) return;
    var s = document.createElement("script");
    s.src = CDN + "th-plashka.js";
    document.head.appendChild(s);
  }

  function вставить() {
    плашка();
    // Страницы редизайна рисуют свою шапку сами (th-page.js) — там нам делать нечего.
    // Это важно: скрипт подключается в «HTML-код в HEAD» на весь сайт, чтобы попасть
    // и на карточки магазина /tproduct/, у которых своей шапки нет вообще.
    if (document.querySelector("[data-th-page]")) return;
    if (document.querySelector("[data-th-shapka]")) return;   // идемпотентно
    убратьСтарую();
    var тело = document.body;
    тело.insertBefore(шапка(), тело.firstChild);
    тело.appendChild(подвал());
    починитьСсылки();
    единыйТелефон();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", вставить);
  } else {
    вставить();
  }
})();
