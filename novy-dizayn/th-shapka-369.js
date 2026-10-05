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
 *   <script src="https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/th-shapka.js?v=369f1"></script>
 *
 * ⚠️ Только @main и только один адрес на весь сайт. 13.09.2026 замер показал
 * обратное: шесть страниц были приколоты к @d8719ad, двадцать — к @d3803911…,
 * и общий компонент разъехался по семействам страниц (дефект L-049
 * COMPONENT_DRIFT). Приколотый коммит не обновляется никогда — правка едет
 * только на те страницы, где ссылку переписали руками.
 *
 * Про ?v=. jsDelivr отдаёт файл с max-age=604800: у вернувшегося посетителя
 * он лежит в браузере неделю, и purge CDN этого не меняет. Ссылка вставлена
 * в Tilda руками, поэтому версию здесь тоже поднимают руками — как у
 * ВЕРСИЯ_ПЛАШКИ ниже. Меняешь подвал или шапку и нужно сразу всем —
 * подними ?v= в HEAD-коде проекта.
 *
 * Дальше правки едут сами — как у страниц редизайна.
 */
(function () {
  "use strict";
  var ТЕЛЕФОН_МАШИНЕ = "+77000369369";      // для tel: и wa.me
  var ТЕЛЕФОН_ЛЮДЯМ  = "+77 000 369 369";   // §13: единый формат витрины,
  // пробелы неразрывные — номер пишется одной строкой (правило 01.09.2026)
  var ЭтотСкрипт = document.currentScript;
  var CDN = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/";
  // Только для проверки с диска (file:): ресурсы берутся рядом со скриптом. На сайте адрес прежний.
  if (location.protocol === "file:" && ЭтотСкрипт && ЭтотСкрипт.src) { CDN = ЭтотСкрипт.src.replace(/[^\/]*$/, ""); }

  // FIRST-PAINT GUARD 22.09.2026: legacy .thnav приходит в server HTML и раньше
  // успевала отрисоваться до DOMContentLoaded. Скрипт подключён синхронно в HEAD,
  // поэтому скрываем только legacy chrome ещё до разбора BODY. Новые страницы без
  // .thnav этим правилом не затрагиваются.
  var стражПервогоКадра = document.createElement("style");
  стражПервогоКадра.setAttribute("data-th-guard", "1");
  стражПервогоКадра.textContent = ".thnav{display:none !important;}";
  (document.head || document.documentElement).appendChild(стражПервогоКадра);

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
    ["https://tehnoholod369.kz/kaminy-almaty", "Камины и каминокомплекты"],
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
  //    Но одинаково — про ОДИН номер, а не про все. До 02.09.2026 под гребёнку
  //    попадала каждая ссылка tel:, включая дополнительный +7 700 033 66 99:
  //    ему переписывался и href, и подпись. В статьях «До какой температуры»,
  //    «Как работает приток», «Обслуживание», «Приток или форточка» призыв
  //    показывал один и тот же номер дважды, а второго номера на витрине
  //    не существовало вовсе. Правим только основной, чужие не трогаем.
  function единыйТелефон() {
    var ОСНОВНОЙ = ТЕЛЕФОН_МАШИНЕ.replace(/\D/g, "");
    [].forEach.call(document.querySelectorAll("a[href^='tel:']"), function (a) {
      var цифры = (a.getAttribute("href") || "").replace(/\D/g, "");
      if (цифры && цифры !== ОСНОВНОЙ) return;
      a.setAttribute("href", "tel:" + ТЕЛЕФОН_МАШИНЕ);
      if (/\d/.test(a.textContent)) a.textContent = ТЕЛЕФОН_ЛЮДЯМ;
    });
  }

  // Шапка дизайна 369 (утверждена владельцем 03–04.10.2026). Единый источник — gen_shapka.py: он зашивает сюда
  // разметку и стили и пишет _shapka_369.html, который сборщик блоков подставляет в страницы редизайна.
  // В шапку входит только то, что на сайте работает: «Избранного» и страниц «Акции», «О компании» пока нет.
  /* ШАПКА-НАЧАЛО · генерирует gen_shapka.py, руками не править */
  var ШАПКА_HTML = "<div class=\"th-t1\"><div class=\"th-w\"><b>Доставка по Казахстану</b><span><a href=\"tel:+77000369369\">+77 000 369 369</a> · пн–пт 9:00–18:00 · <a href=\"https://wa.me/77000369369?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%9F%D1%80%D0%BE%D1%88%D1%83%20%D0%BF%D0%B5%D1%80%D0%B5%D0%B7%D0%B2%D0%BE%D0%BD%D0%B8%D1%82%D1%8C.\">Заказать звонок</a></span></div></div>\n<header class=\"th-hd\"><div class=\"th-w\"><button type=\"button\" class=\"th-bg\" data-th-burger aria-label=\"Меню\">☰<span>Меню</span></button><a class=\"th-lg\" href=\"/\"><img src=\"assets/logo-369-horizontal-compact.png\" alt=\"ТЕХНОХОЛОД 369\" /></a><button type=\"button\" class=\"th-sr\" data-th-search aria-label=\"Поиск по каталогу\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\"><circle cx=\"11\" cy=\"11\" r=\"7\" /><path d=\"M20 20l-4-4\" /></svg><span>Поиск по каталогу</span></button><nav class=\"th-ic\"><a href=\"/izbrannoe\"><svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><path d=\"M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z\" /></svg><span>Избранное</span><i class=\"th-bd\" data-th-fav-count style=\"display:none\"></i></a><a href=\"/sravnenie\"><svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><path d=\"M6 20V10M12 20V4M18 20v-7\" /></svg><span>Сравнение</span><i class=\"th-bd\" data-th-cmp-count style=\"display:none\"></i></a><a href=\"/korzina\"><svg viewBox=\"0 0 24 24\" width=\"24\" height=\"24\"><path d=\"M3 4h2l2.4 11h10.2L20 8H6.2\" /><circle cx=\"9\" cy=\"19\" r=\"1.5\" /><circle cx=\"17\" cy=\"19\" r=\"1.5\" /></svg><span>Корзина</span><i class=\"th-bd\" data-th-cart-count></i></a></nav></div></header>\n<nav class=\"th-mn\"><div class=\"th-w\"><a class=\"th-home\" href=\"/\" aria-label=\"На главную\" title=\"На главную\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\"><path d=\"M3 11l9-7 9 7\" /><path d=\"M5 10v10h5v-6h4v6h5V10\" /></svg><span>Главная</span></a><a class=\"th-cat\" href=\"/katalog\" data-th-cat aria-expanded=\"false\" aria-controls=\"th-panel\"><span class=\"th-ci\">☰</span><span class=\"th-ct\">Каталог товаров</span></a><div class=\"th-dd\"><a href=\"/kondicionery-almaty\">Кондиционирование</a><button type=\"button\" class=\"th-dt\" data-th-dd aria-label=\"Подразделы: Кондиционирование\" aria-expanded=\"false\">▾</button><div class=\"th-dm\"><a href=\"/katalog?g=bytovye\">Бытовые сплит-системы</a><a href=\"/poluprom\">Полупромышленные</a><a href=\"/multisplit\">Мультисплит-системы</a><a href=\"/katalog?g=mobilnye\">Мобильные</a><a href=\"/katalog?g=prom-mobilnye\">Промышленные мобильные</a><a href=\"/katalog?g=vozduhoohladiteli\">Воздухоохладители</a></div></div><div class=\"th-dd\"><a href=\"/otoplenie\">Отопление</a><button type=\"button\" class=\"th-dt\" data-th-dd aria-label=\"Подразделы: Отопление\" aria-expanded=\"false\">▾</button><div class=\"th-dm\"><a href=\"/katalog?g=radiatory\">Радиаторы Royal Thermo</a><a href=\"/katalog?g=teplovye-pushki\">Тепловые пушки</a><a href=\"/katalog?g=teplovye-zavesy\">Тепловые завесы</a><a href=\"/katalog?g=infrakrasnye-obogrevateli\">Инфракрасные обогреватели</a><a href=\"/katalog?g=vodyanye-teploventilyatory\">Водяные тепловентиляторы</a><a href=\"/katalog?g=kaminy\">Камины и электроочаги</a><a href=\"/katalog?g=obogrevateli\">Конвекторы и обогреватели</a><a href=\"/katalog?g=teplovye-nasosy\">Тепловые насосы</a></div></div><div class=\"th-dd\"><a href=\"/ventilyaciya\">Вентиляция</a><button type=\"button\" class=\"th-dt\" data-th-dd aria-label=\"Подразделы: Вентиляция\" aria-expanded=\"false\">▾</button><div class=\"th-dm\"><a href=\"/katalog?g=ventilyaciya\">Приточные и приточно-вытяжные установки</a><a href=\"/katalog?g=ventilyatory-prom\">Промышленные вентиляторы</a><a href=\"/katalog?g=osushiteli\">Осушители воздуха</a><a href=\"/katalog?g=uvlazhniteli\">Промышленные увлажнители</a><a href=\"/katalog?g=ventilyaciya&sub=%D0%A0%D0%B5%D0%BA%D1%83%D0%BF%D0%B5%D1%80%D0%B0%D1%82%D0%BE%D1%80%D1%8B\">Рекуператоры</a></div></div><div class=\"th-dd\"><a href=\"/vodonagrevateli\">Водонагреватели</a><button type=\"button\" class=\"th-dt\" data-th-dd aria-label=\"Подразделы: Водонагреватели\" aria-expanded=\"false\">▾</button><div class=\"th-dm\"><a href=\"/katalog?g=vodonagrevateli\">Водонагреватели и бойлеры</a><a href=\"/katalog?g=vodoochistka\">Водоочистка и фильтры</a></div></div><a href=\"/katalog?g=avtonomnoe-pitanie\">Автономное питание</a><a href=\"/brendy\">Бренды</a><a href=\"/baza-znaniy\">База знаний</a><a href=\"/kontakty\">Контакты</a></div><div class=\"th-pn\" id=\"th-panel\"><div class=\"th-w th-pg\"><div class=\"th-pc\"><b>Кондиционирование</b><a href=\"/katalog?g=bytovye\">Бытовые сплит-системы</a><a href=\"/poluprom\">Полупромышленные</a><a href=\"/multisplit\">Мультисплит-системы</a><a href=\"/katalog?g=mobilnye\">Мобильные</a><a href=\"/katalog?g=prom-mobilnye\">Промышленные мобильные</a><a href=\"/katalog?g=vozduhoohladiteli\">Воздухоохладители</a></div><div class=\"th-pc\"><b>Отопление</b><a href=\"/katalog?g=radiatory\">Радиаторы Royal Thermo</a><a href=\"/katalog?g=teplovye-pushki\">Тепловые пушки</a><a href=\"/katalog?g=teplovye-zavesy\">Тепловые завесы</a><a href=\"/katalog?g=infrakrasnye-obogrevateli\">Инфракрасные обогреватели</a><a href=\"/katalog?g=vodyanye-teploventilyatory\">Водяные тепловентиляторы</a><a href=\"/katalog?g=kaminy\">Камины и электроочаги</a><a href=\"/katalog?g=obogrevateli\">Конвекторы и обогреватели</a><a href=\"/katalog?g=teplovye-nasosy\">Тепловые насосы</a></div><div class=\"th-pc\"><b>Вентиляция</b><a href=\"/katalog?g=ventilyaciya\">Приточные и приточно-вытяжные установки</a><a href=\"/katalog?g=ventilyatory-prom\">Промышленные вентиляторы</a><a href=\"/katalog?g=osushiteli\">Осушители воздуха</a><a href=\"/katalog?g=uvlazhniteli\">Промышленные увлажнители</a><a href=\"/katalog?g=ventilyaciya&sub=%D0%A0%D0%B5%D0%BA%D1%83%D0%BF%D0%B5%D1%80%D0%B0%D1%82%D0%BE%D1%80%D1%8B\">Рекуператоры</a></div><div class=\"th-pc\"><b>Водонагреватели и водоочистка</b><a href=\"/katalog?g=vodonagrevateli\">Водонагреватели и бойлеры</a><a href=\"/katalog?g=vodoochistka\">Водоочистка и фильтры</a></div><div class=\"th-pc\"><b>Автономное питание</b><a href=\"/katalog?g=avtonomnoe-pitanie\">Зарядные станции и солнечные панели</a></div><div class=\"th-pc\"><b>VRF, фанкойлы, чиллеры</b><a href=\"/katalog?g=mini-vrf\">Мини-VRF и мультизональные</a><a href=\"/katalog?g=fankoyly\">Фанкойлы</a><a href=\"/katalog?g=chillery\">Чиллеры</a><a href=\"/katalog?g=precizionnye\">Прецизионные кондиционеры</a><a href=\"/proekt\">Расчёт под объект</a></div></div><div class=\"th-w th-pf\"><a href=\"/katalog\">Весь каталог →</a></div></div></nav>\n";
  var ШАПКА_CSS = ".th-t1{background:#F1F5F9;font:14px/22px Inter,TildaSans,Arial,sans-serif;color:#1A1A1A}.th-w{max-width:1248px;margin:0 auto;padding:0 24px;display:flex;align-items:center;gap:16px;box-sizing:border-box}.th-t1 .th-w{justify-content:space-between;padding-top:9px;padding-bottom:9px}.th-t1 a{color:#0033A0;font-weight:600;text-decoration:none}.th-t1 b{color:#0033A0}.th-hd{background:#fff;border-bottom:1px solid #E2E8F0;font-family:Inter,TildaSans,\"Segoe UI\",Arial,sans-serif}.th-hd .th-w{padding-top:14px;padding-bottom:14px;gap:24px}.th-lg{display:block;flex:none}.th-lg img{height:44px;width:auto;display:block}.th-sr{flex:1;display:flex;align-items:center;gap:10px;height:48px;border:1.5px solid #CBD5E1;border-radius:10px;background:#fff;padding:0 16px;font:400 16px/1 Inter,TildaSans,Arial,sans-serif;color:#94A3B8;cursor:pointer;text-align:left}.th-sr svg{flex:none;width:20px;height:20px;stroke:#0066FF;fill:none;stroke-width:2;stroke-linecap:round}.th-ic{display:flex;gap:22px}.th-ic a{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;font:600 13px/16px Inter,TildaSans,Arial,sans-serif;color:#0033A0;text-decoration:none}.th-ic svg{width:24px;height:24px;stroke:#0033A0;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.th-bd{display:none;position:absolute;top:-6px;right:-10px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E81C1C;color:#fff;font:700 11px/18px Inter,TildaSans,Arial,sans-serif;font-style:normal;text-align:center;box-sizing:border-box}.th-bd.th-on{display:block}.th-bg{display:none}.th-mn{background:#fff;border-bottom:1px solid #E2E8F0;font-family:Inter,TildaSans,\"Segoe UI\",Arial,sans-serif}.th-mn .th-w{padding-top:0;padding-bottom:0;gap:2px}.th-mn a{display:flex;align-items:center;height:48px;padding:0 8px;white-space:nowrap;font:600 14px/1 Inter,TildaSans,Arial,sans-serif;color:#0033A0;text-decoration:none}.th-mn a.th-cat{background:#0066FF;color:#fff;border-radius:8px;height:40px;margin:6px 6px 6px 0;padding:0 14px}@media(max-width:1247px){.th-t1{display:none}.th-hd .th-w{padding:10px 16px;gap:12px}.th-bg{display:flex;align-items:center;gap:6px;border:0;background:none;font:600 15px/1 Inter,TildaSans,Arial,sans-serif;color:#0033A0;padding:0;cursor:pointer}.th-lg{margin:0 auto}.th-lg img{height:34px}.th-sr{flex:none;width:44px;height:44px;padding:0;justify-content:center;border:0;background:none}.th-sr span{display:none}.th-ic span{display:none}.th-ic{gap:12px}.th-ic{gap:6px}.th-ic a{min-width:40px}@media(max-width:420px){.th-ic a:nth-child(2){display:none}.th-bg span{display:none}.th-lg img{height:30px}}.th-mn{display:none}.th-mn.th-open{display:block}.th-mn .th-w{flex-direction:column;align-items:stretch;gap:0;padding:6px 16px 12px}.th-mn a{height:46px;border-bottom:1px solid #EEF2F7;padding:0}.th-mn a.th-cat{margin:6px 0;justify-content:center;border-bottom:0}}.th-mn{position:relative}.th-mn a.th-cat .th-ci{margin-right:8px}.th-mn a.th-cat[aria-expanded=\"true\"]{background:#0033A0}.th-pn{position:absolute;left:0;right:0;top:100%;z-index:50;background:#fff;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;box-shadow:0 18px 34px rgba(0,51,160,.12);max-height:calc(100vh - 150px);overflow-y:auto}.th-pn{display:none}.th-pn.th-on{display:block}.th-pn .th-pg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 32px;align-items:start;padding-top:20px;padding-bottom:20px}.th-pn .th-pc{display:flex;flex-direction:column;gap:2px}.th-pn .th-pc b{font:700 16px/24px Inter,TildaSans,Arial,sans-serif;color:#0033A0;margin-bottom:4px}.th-pn .th-pc a{height:auto;min-height:0;padding:3px 0;font:500 15px/22px Inter,TildaSans,Arial,sans-serif;color:#1A1A1A}.th-pn .th-pc a:hover{color:#0066FF}.th-pn .th-pf{padding-top:0;padding-bottom:18px}.th-pn .th-pf a{height:auto;padding:0;font:600 15px/22px Inter,TildaSans,Arial,sans-serif;color:#0066FF}@media(max-width:1247px){.th-pn{position:static;box-shadow:none;max-height:none;border:0}.th-pn .th-pg{grid-template-columns:1fr;gap:14px;padding:6px 0 4px}.th-pn .th-pf{padding-bottom:6px}}.th-mn a.th-home{padding:0 10px 0 0;height:48px}.th-mn a.th-home svg{width:22px;height:22px;stroke:#0033A0;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.th-mn a.th-home span{display:none}.th-dd{position:relative;display:flex;align-items:center}.th-mn .th-dd>a{padding:0 2px 0 8px}.th-dt{width:22px;height:48px;padding:0;border:0;background:none;color:#0033A0;font:600 12px/1 Inter,TildaSans,Arial,sans-serif;cursor:pointer}.th-dm{display:none;position:absolute;left:0;top:100%;min-width:290px;z-index:60;padding:8px 0;background:#fff;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 10px 10px;box-shadow:0 16px 30px rgba(0,51,160,.12)}.th-mn .th-dm a{height:auto;padding:9px 18px;font:500 15px/22px Inter,TildaSans,Arial,sans-serif;color:#1A1A1A;white-space:nowrap}.th-mn .th-dm a:hover{color:#0066FF;background:#F1F5F9}@media(min-width:1248px){.th-dd:hover .th-dm,.th-dd:focus-within .th-dm,.th-dd.th-open .th-dm{display:block}}@media(max-width:1247px){.th-mn a.th-home{height:46px;padding:0;border-bottom:1px solid #EEF2F7;gap:8px}.th-mn a.th-home span{display:inline}.th-dd{flex-wrap:wrap;border-bottom:1px solid #EEF2F7}.th-mn .th-dd>a{flex:1;padding:0;border-bottom:0}.th-dt{width:46px;height:46px;font-size:15px}.th-dm{position:static;flex:0 0 100%;min-width:0;box-shadow:none;border:0;padding:0 0 8px 14px}.th-dd.th-open .th-dm{display:block}.th-mn .th-dm a{height:auto;padding:8px 0;border-bottom:0}}.th-mn .th-dd.th-cur>a{box-shadow:inset 0 -3px 0 #0066FF}.th-mn .th-dm a.th-cur{color:#0066FF;font-weight:700}.th-mn>.th-w>a.th-cur{box-shadow:inset 0 -3px 0 #0066FF}";
  /* ШАПКА-КОНЕЦ */

  // Стили шапки подключаем один раз и сразу: они нужны и шапке, которую рисует этот скрипт, и шапке из блока страницы редизайна.
  function подключитьСтилиШапки() {
    if (document.querySelector("style[data-th-shapka-css]")) return;
    var с = document.createElement("style");
    с.setAttribute("data-th-shapka-css", "1");
    с.textContent = ШАПКА_CSS;
    (document.head || document.documentElement).appendChild(с);
  }

  function шапка() {
    var o = document.createElement("div");
    o.setAttribute("data-th-shapka", "1");
    o.innerHTML = ШАПКА_HTML.replace('src="assets/', 'src="' + CDN + 'assets/');
    return o;
  }

  // Бургер работает в любой шапке на странице (нарисованной скриптом или пришедшей в блоке): обработчик на документе.
  document.addEventListener("click", function (e) {
    var б = e.target && e.target.closest ? e.target.closest("[data-th-burger]") : null;
    if (!б) return;
    var м = document.querySelector(".th-mn");
    if (м) м.classList.toggle("th-open");
  });

  // Подразделы направления: шеврон открывает/закрывает список (телефон, клавиатура); на широком экране ещё и по наведению (CSS).
  document.addEventListener("click", function (e) {
    var т = e.target && e.target.closest ? e.target.closest("[data-th-dd]") : null;
    var открытые = document.querySelectorAll(".th-dd.th-open");
    if (т) {
      var д = т.parentNode, был = d_has(д);
      [].forEach.call(открытые, function (x) { x.classList.remove("th-open"); x.querySelector("[data-th-dd]").setAttribute("aria-expanded", "false"); });
      if (!был) { д.classList.add("th-open"); т.setAttribute("aria-expanded", "true"); }
    } else if (!(e.target.closest && e.target.closest(".th-dd"))) {
      [].forEach.call(открытые, function (x) { x.classList.remove("th-open"); x.querySelector("[data-th-dd]").setAttribute("aria-expanded", "false"); });
    }
  });
  function d_has(д) { return д.classList.contains("th-open"); }

  // Панель каталога: кнопка «Каталог товаров» раскрывает/сворачивает разделы; Esc и клик вне панели закрывают. Без JS кнопка — обычная ссылка на /katalog.
  function панельЗакрыть() {
    var к = document.querySelector("[data-th-cat]"), п = document.getElementById("th-panel");
    if (!к || !п) return;
    п.classList.remove("th-on"); к.setAttribute("aria-expanded", "false");
    var т = к.querySelector(".th-ct"), и = к.querySelector(".th-ci");
    if (т) т.textContent = "Каталог товаров"; if (и) и.textContent = "☰";
  }
  document.addEventListener("click", function (e) {
    var к = e.target && e.target.closest ? e.target.closest("[data-th-cat]") : null;
    var п = document.getElementById("th-panel");
    if (!п) return;
    if (к) {
      e.preventDefault();
      if (п.classList.contains("th-on")) { панельЗакрыть(); return; }
      п.classList.add("th-on"); к.setAttribute("aria-expanded", "true");
      var т = к.querySelector(".th-ct"), и = к.querySelector(".th-ci");
      if (т) т.textContent = "Закрыть"; if (и) и.textContent = "✕";
    } else if (п.classList.contains("th-on") && !(e.target.closest && e.target.closest("#th-panel"))) {
      панельЗакрыть();
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") панельЗакрыть(); });

  // Счётчик корзины: данные в localStorage («th_cart_v1», как у cart.js), события «th-cart» и «storage».
  function корзинаЧисло() {
    var n = 0;
    try {
      var л = JSON.parse(window.localStorage.getItem("th_cart_v1") || "[]");
      if (Array.isArray(л)) n = л.reduce(function (с, x) { return с + (x.q || 1); }, 0);
    } catch (e) {}
    [].forEach.call(document.querySelectorAll("[data-th-cart-count]"), function (б) {
      б.textContent = n > 99 ? "99+" : String(n);
      б.classList.toggle("th-on", n > 0);
    });
  }
  function следитьЗаКорзиной() {
    window.addEventListener("th-cart", корзинаЧисло);
    window.addEventListener("storage", корзинаЧисло);
    // блок страницы редизайна рисуется шаблонизатором уже после загрузки: повторяем ~9 секунд
    var осталось = 30;
    (function ещё() { корзинаЧисло(); if (осталось-- > 0) setTimeout(ещё, 300); })();
  }

  function колонка(заголовок, ссылки) {
    return '<div><h4>' + заголовок + '</h4>' + ссылки.map(function (с) {
      return '<a href="' + с[0] + '">' + с[1] + '</a>';
    }).join('') + '</div>';
  }

  // Подвал дизайна 369: синий #0033A0, колонки. Отступ снизу на телефоне — под мобильную
  // панель «Позвонить · WhatsApp · Каталог»: она fixed и иначе накрывает последнюю строку.
  function подвал() {
    var o = document.createElement("div");
    o.setAttribute("data-th-podval", "1");
    var WA = "https://wa.me/" + ТЕЛЕФОН_МАШИНЕ.replace("+", "");
    o.innerHTML =
      '<style>.th-foot{background:#071C3B;color:#fff;margin-top:48px;font:14px/1.6 Inter,TildaSans,Arial,sans-serif}'
      + '.th-foot__cols{max-width:1248px;margin:0 auto;padding:44px 24px 28px;display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:32px;box-sizing:border-box}'
      + '.th-foot h4{margin:0 0 10px;font:700 15px/22px Inter,TildaSans,Arial,sans-serif;color:#fff}'
      + '.th-foot a{display:block;color:#CFE3FA;text-decoration:none;font-size:14px;line-height:30px}'
      + '.th-foot a:hover{color:#fff}'
      + '.th-foot img{height:44px;width:auto;display:block}'
      + '.th-foot .th-ph{font:800 22px/30px Inter,TildaSans,Arial,sans-serif;color:#fff;margin-top:14px;display:block}'
      + '.th-foot .th-sm{color:#CFE3FA;font-size:13px}'
      + '.th-foot__req{max-width:1248px;margin:0 auto;padding:18px 24px;border-top:1px solid rgba(255,255,255,.18);display:flex;flex-wrap:wrap;gap:6px 22px;font-size:13px;color:#CFE3FA;box-sizing:border-box}'
      + '.th-foot__req a{display:inline;line-height:1.6}'
      + '@media(max-width:760px){.th-foot{margin-top:32px}.th-foot__cols{grid-template-columns:1fr 1fr;padding:30px 18px 18px;gap:24px}'
      + '.th-foot__cols>div:first-child{grid-column:1/-1}.th-foot__cols>div:nth-child(3){order:5;grid-column:1/-1;display:flex;flex-wrap:wrap;gap:0 22px}.th-foot__cols>div:nth-child(3) h4{flex:0 0 100%}.th-foot__req{padding:16px 18px calc(86px + env(safe-area-inset-bottom,0px))}}</style>'
      + '<div class="th-foot"><div class="th-foot__cols">'
      + '<div><img src="' + CDN + 'assets/logo-369-horizontal-compact-dark.png" alt="ТЕХНОХОЛОД 369">'
      + '<a class="th-ph" href="tel:' + ТЕЛЕФОН_МАШИНЕ + '">' + ТЕЛЕФОН_ЛЮДЯМ + '</a><span class="th-sm">Звонки и WhatsApp</span></div>'
      + колонка("Каталог", [["/kondicionery-almaty", "Кондиционирование"], ["/otoplenie", "Отопление"], ["/ventilyaciya", "Вентиляция"], ["/vodonagrevateli", "Водонагреватели"]])
      + колонка("Компания", [["/brendy", "Бренды"], ["/baza-znaniy", "База знаний"], ["/kontakty", "Контакты"]])
      // /vozvrat — юридическая страница; её адрес указан в Google Merchant Center как политика возврата
      + колонка("Покупателям", [["/uslugi", "Монтаж и сервис"], ["/vozvrat", "Возврат и обмен"], ["/usloviya-ispolzovaniya", "Условия использования"], [WA, "Написать в WhatsApp"]])
      + '</div><div class="th-foot__req">'
      + '<span>ИП «ТехноХолод» · Алматы, ул. Какимжана Казыбаева, 286Б</span>'
      + '<a href="mailto:tehnoholod369@gmail.com">tehnoholod369@gmail.com</a>'
      + '</div></div>';
    return o;
  }

  // Плашка «сайт наполняется» для страниц СТАРОГО дизайна и карточек магазина.
  // На страницах редизайна её приносит сам блок, и притом с версией в адресе
  // (?v=<хэш>). Здесь версии нет и быть не может — th-shapka.js вставлен в Tilda
  // руками. Поэтому вторую копию отсюда НЕ грузим: 02.09.2026 на живой Главной
  // выигрывал этот, безверсионный адрес, браузер отдавал его из недельного кэша,
  // и правка плашки не доезжала. Версию у адреса ниже поднимать руками при каждой
  // правке th-plashka.js — иначе вернувшийся посетитель неделю видит старую.
  var ВЕРСИЯ_ПОИСКА = "?v=369a";   // поднимать руками при правке search.js (адрес в Tilda без версии)
  // Inter нужен шапке и подвалу; блоки редизайна подключают его сами, старые страницы (TildaSans) — нет.
  function подключитьШрифт() {
    if (document.querySelector('link[href*="family=Inter"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }
  function подключитьПоиск() {
    if (document.querySelector('script[src*="search.js"]')) return;
    var s = document.createElement("script");
    s.src = CDN + "search.js" + ВЕРСИЯ_ПОИСКА;
    document.head.appendChild(s);
  }
  var ВЕРСИЯ_ПЛАШКИ = "?v=20260902";
  // Нижняя панель телефона — на всех страницах сайта, а не только там, где скрипт вписан в страницу руками.
  function подключитьПанель() {
    if (document.querySelector('script[src*="mobile-bar"]') || document.getElementById("th-mobile-bar")) return;
    var s = document.createElement("script");
    s.src = CDN + "mobile-bar-369.js?v=20261005";
    document.head.appendChild(s);
  }
  function подключитьИзбранное() {
    if (document.querySelector('script[src*="th-izbrannoe.js"]') || window.THFav) return;
    var s = document.createElement("script");
    s.src = CDN + "th-izbrannoe.js?v=20261005";
    document.head.appendChild(s);
  }
  function плашка() {
    if (document.querySelector('script[src*="th-plashka.js"]')) return;
    var s = document.createElement("script");
    s.src = CDN + "th-plashka.js" + ВЕРСИЯ_ПЛАШКИ;
    document.head.appendChild(s);
  }

  // Локальная шапка блока — прочь, раз свою мы уже нарисовали.
  //
  // Зачем по логотипу, а не по классу. Блоки статей в Tilda вставлены в разное
  // время и устроены по-разному: у новых шапка помечена .art-local-chrome и скрыта
  // правилом самого блока, у старых класса нет вовсе и шапка видима. Пока правило
  // жило внутри блока, результат зависел от того, какой блок вставлен в страницу, —
  // и владелец три раза подряд видел то две шапки, то ни одной (03–05.09.2026).
  // Признак, общий для всех вариантов, один: логотип ИП «ТехноХолод» внутри блока.
  // Теперь дубль невозможен по построению, а не по состоянию блока.
  //
  // Скрываем только прямого потомка корня блока и только с краёв (первые два
  // сверху, последний снизу): логотип в СЕРЕДИНЕ статьи — это иллюстрация, её не трогаем.
  function снятьЛокальнуюШапку(осталось) {
    // Корень блока создаёт шаблонизатор — ПОСЛЕ DOMContentLoaded, и наполняется
    // не сразу, поэтому повторяем ~9 секунд.
    осталось = (осталось === undefined) ? 30 : осталось;
    if (осталось > 0) setTimeout(function () { снятьЛокальнуюШапку(осталось - 1); }, 300);
    var корень = document.querySelector("#dc-root") || document.querySelector("x-dc");
    if (!корень || !корень.children.length) return;

    // ⚠️ Скрываем НЕ прямого потомка корня. У части блоков корень имеет ровно
    // одного ребёнка — всю страницу, и такое «скрытие шапки» убрало бы статью
    // целиком. Поймано 05.09.2026 на /freshin-sravnenie до того, как сработало.
    //
    // Признак шапки надёжнее размера: это самый большой контейнер вокруг логотипа,
    // в котором ещё МАЛО текста. У шапки его пара десятков символов («Каталог»,
    // «Корзина», телефон), у статьи — тысячи. Поднимаемся от логотипа вверх, пока
    // текст короткий, и снимаем последний такой уровень.
    [].forEach.call(корень.querySelectorAll("img[alt*='ТехноХолод' i], img[alt*='ТЕХНОХОЛОД' i]"), function (лого) {
      var узел = лого, кандидат = null;
      while (узел && узел !== корень) {
        if ((узел.textContent || "").replace(/\s+/g, " ").trim().length < 400) кандидат = узел;
        else break;
        узел = узел.parentNode;
      }
      if (кандидат && кандидат !== корень) кандидат.style.display = "none";
    });
  }

  // Короткая страница (пустое «Избранное», сравнение из одной модели): подвал не должен висеть посреди экрана.
  // Добавляем верхний отступ ровно на недостающую высоту; на длинных страницах отступ нулевой.
  // Текущее место в меню: направление в полосе подчёркивается, раздел в списке выделяется. Адрес страницы читаем сами,
  // потому что каталог меняет его без перезагрузки (?g=…), поэтому проверяем и при смене адреса.
  var последнийАдрес = "";
  function отметитьТекущее() {
    if (!document.querySelector(".th-mn .th-dd")) return; // меню ещё не нарисовано (рендерер страницы приносит его позже)
    var адрес = location.pathname + location.search + "|" + document.querySelectorAll(".th-mn .th-dd").length;
    // рендерер страницы может пересоздать узлы меню и стереть класс: пока отметки нет, пробуем снова
    if (адрес === последнийАдрес && document.querySelector(".th-mn .th-cur")) return;
    последнийАдрес = адрес;
    var путь = location.pathname.replace(/\/+$/, "") || "/", g = (location.search.match(/[?&]g=([^&]+)/) || [])[1] || "";
    var сам = function (a) { try { return new URL(a.getAttribute("href"), location.href); } catch (e) { return null; } };
    [].forEach.call(document.querySelectorAll(".th-mn .th-cur"), function (x) { x.classList.remove("th-cur"); });
    [].forEach.call(document.querySelectorAll(".th-mn .th-dd"), function (дд) {
      var заг = дд.querySelector(":scope > a"), нашли = false, у = заг && сам(заг);
      if (у && у.pathname.replace(/\/+$/, "") === путь) нашли = true;
      [].forEach.call(дд.querySelectorAll(".th-dm a"), function (a) {
        var у2 = сам(a); if (!у2) return;
        var g2 = (у2.search.match(/[?&]g=([^&]+)/) || [])[1] || "";
        if ((g && g2 && g2 === g) || (!g2 && у2.pathname.replace(/\/+$/, "") === путь)) { a.classList.add("th-cur"); нашли = true; }
      });
      if (нашли) дд.classList.add("th-cur");
    });
    [].forEach.call(document.querySelectorAll(".th-mn > .th-w > a"), function (a) {
      var у = сам(a); if (!у || a.classList.contains("th-cat") || a.classList.contains("th-home")) return;
      var gA = (у.search.match(/[?&]g=([^&]+)/) || [])[1] || "";
      if (gA ? (g && gA === g) : у.pathname.replace(/\/+$/, "") === путь) a.classList.add("th-cur");
    });
  }

  function прижатьПодвал() {
    var п = document.querySelector("[data-th-podval]");
    if (!п) return;
    var был = parseFloat(п.style.marginTop) || 0;
    // scrollHeight на короткой странице равен высоте окна, поэтому меряем по нижнему краю самого подвала
    var высота = п.getBoundingClientRect().bottom + (window.pageYOffset || 0) - был;
    var нужно = Math.max(0, window.innerHeight - высота);
    if (Math.abs(нужно - был) > 1) п.style.marginTop = нужно + "px";
  }

  function вставить() {
    var редизайн = !!document.querySelector("[data-th-page]");
    if (!редизайн) {
      плашка();
      подключитьПоиск();
      подключитьИзбранное();
      подключитьШрифт();
      if (!document.querySelector("[data-th-shapka]")) {
        убратьСтарую();
        document.body.insertBefore(шапка(), document.body.firstChild);
        снятьЛокальнуюШапку();
        починитьСсылки();
        единыйТелефон();
      }
    }
    подключитьИзбранное();
    подключитьПанель();
    if (!document.querySelector("[data-th-podval]")) document.body.appendChild(подвал());
    отметитьТекущее(); setInterval(отметитьТекущее, 800);
    прижатьПодвал();
    window.addEventListener("resize", прижатьПодвал);
    window.addEventListener("load", прижатьПодвал);
    setTimeout(прижатьПодвал, 800); setTimeout(прижатьПодвал, 2500); setTimeout(прижатьПодвал, 6000);
    if (window.ResizeObserver) new ResizeObserver(прижатьПодвал).observe(document.body);
  }

  подключитьСтилиШапки();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", следитьЗаКорзиной); else следитьЗаКорзиной();

  // На legacy GEO-страницах новую шапку вставляем в microtask MutationObserver,
  // как только parser добавил .thnav. Observer выполняется до следующего paint.
  // НЕ используем x-dc как триггер: новые /otoplenie, /ventilyaciya,
  // /vodonagrevateli имеют свой server-rendered chrome и не должны менять layout.
  if (document.readyState === "loading" && window.MutationObserver) {
    var раннийНаблюдатель = new MutationObserver(function () {
      if (!document.body) return;
      if (document.querySelector("[data-th-page]")) {
        раннийНаблюдатель.disconnect();
        return;
      }
      if (!document.querySelector(".thnav")) return;
      if (!document.querySelector("[data-th-shapka]")) {
        убратьСтарую();
        var ранняя = шапка();
        ранняя.setAttribute("data-th-rano", "1");
        document.body.insertBefore(ранняя, document.body.firstChild);
      }
      раннийНаблюдатель.disconnect();
    });
    раннийНаблюдатель.observe(document.documentElement, {childList:true, subtree:true});
    document.addEventListener("DOMContentLoaded", function(){ раннийНаблюдатель.disconnect(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", вставить);
  } else {
    вставить();
  }
})();

/* Оглавление статьи: sticky ограничен контейнером сетки, поэтому у конца статьи упираем его вручную (05.10.2026) */
(function () {
  function fit() {
    var t = document.querySelector('.art-toc-wrap'), a = document.querySelector('.art');
    if (!t || !a) return;
    t.style.transform = '';
    if (getComputedStyle(t).position !== 'sticky') return;
    var o = t.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom;
    if (o > 0) t.style.transform = 'translateY(' + (-o) + 'px)';
  }
  addEventListener('scroll', fit, { passive: true });
  addEventListener('resize', fit);
  setInterval(fit, 250);
})();
