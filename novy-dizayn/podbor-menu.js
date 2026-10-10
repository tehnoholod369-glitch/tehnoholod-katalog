/* Окно «Что подбираем?» — открывается по клику на ссылку с атрибутом data-th-podbor-open.
   Без JS ссылка работает как обычная (href на подборщик кондиционеров).
   Новая плитка = одна строка в массиве ITEMS. */
(function () {
  if (window.__thPodborMenu) return;
  window.__thPodborMenu = true;

  var ITEMS = [
    { t: 'Кондиционер', d: 'Квартира, дом, офис: площадь и модель', h: '/podbor-kondicionera' },
    { t: 'Мультисплит', d: 'Несколько комнат — один наружный блок', h: '/multisplit' },
    { t: 'Вентиляция', d: 'Приток, вытяжка, расчёт по площади', h: '/podbor-ventilyacii' },
    { t: 'Отопление и камины', d: 'Радиаторы, котлы, электрокамины', h: '/otoplenie' },
    { t: 'Водонагреватель', d: 'Накопительный и проточный', h: '/vodonagrevateli' },
    { t: 'Офис, объект, проект', d: 'Полупром, VRF, расчёт под ключ', h: '/proekt' }
  ];
  var WA = 'https://wa.me/77000369369?text=' + encodeURIComponent('Здравствуйте! Помогите подобрать технику.');

  var box = null, lastFocus = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var css = document.createElement('style');
    css.textContent =
      '[data-th-pm]{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(7,28,59,.55);font-family:Inter,"Segoe UI",sans-serif}' +
      '[data-th-pm][data-open]{display:flex}' +
      '[data-th-pm] .pm-card{position:relative;box-sizing:border-box;width:100%;max-width:760px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:#fff;border-radius:16px;padding:28px;color:#1A1A1A}' +
      '[data-th-pm] .pm-x{position:absolute;top:10px;right:10px;width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:#606F85;font-size:26px;line-height:1;cursor:pointer}' +
      '[data-th-pm] .pm-x:hover{background:#F1F5F9}' +
      '[data-th-pm] h2{margin:0 44px 4px 0;font-size:24px;font-weight:800;letter-spacing:-.015em;color:#0033A0}' +
      '[data-th-pm] .pm-sub{margin:0 0 18px;font-size:14px;line-height:1.5;color:#606F85}' +
      '[data-th-pm] .pm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr));gap:10px}' +
      '[data-th-pm] .pm-grid a{display:block;box-sizing:border-box;padding:14px 16px;border:1px solid #DCE5F0;border-radius:12px;background:#fff;color:#1A1A1A;text-decoration:none}' +
      '[data-th-pm] .pm-grid a:hover,[data-th-pm] .pm-grid a:focus-visible{border-color:#0066FF;background:#E9F4FF;outline:0}' +
      '[data-th-pm] .pm-grid b{display:block;font-size:16px;font-weight:700;color:#0033A0}' +
      '[data-th-pm] .pm-grid span{display:block;margin-top:3px;font-size:13px;line-height:1.4;color:#606F85}' +
      '[data-th-pm] .pm-wa{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1px solid #DCE5F0;font-size:14px;color:#606F85}' +
      '[data-th-pm] .pm-wa a{display:inline-flex;align-items:center;height:44px;padding:0 20px;border-radius:8px;background:#0066FF;color:#fff;font-weight:600;text-decoration:none}' +
      '@media (max-width:520px){[data-th-pm]{align-items:flex-end;padding:0}[data-th-pm]{height:100vh;height:100dvh}[data-th-pm] .pm-card{max-width:none;max-height:calc(100vh - 56px);max-height:calc(100dvh - 56px);border-radius:16px 16px 0 0;padding:22px 16px calc(28px + env(safe-area-inset-bottom))}[data-th-pm] h2{font-size:21px}}';
    document.head.appendChild(css);

    box = document.createElement('div');
    box.setAttribute('data-th-pm', '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'th-pm-h');
    box.innerHTML =
      '<div class="pm-card">' +
      '<button type="button" class="pm-x" aria-label="Закрыть">×</button>' +
      '<h2 id="th-pm-h">Что подбираем?</h2>' +
      '<p class="pm-sub">Выберите направление — откроется подбор именно под него.</p>' +
      '<div class="pm-grid">' +
      ITEMS.map(function (i) { return '<a href="' + esc(i.h) + '"><b>' + esc(i.t) + '</b><span>' + esc(i.d) + '</span></a>'; }).join('') +
      '</div>' +
      '<div class="pm-wa"><span>Не знаете, что нужно? Пришлите фото помещения.</span><a href="' + WA + '" target="_blank" rel="noopener">Написать в WhatsApp</a></div>' +
      '</div>';
    document.body.appendChild(box);

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.pm-x')) close();
    });
  }

  function open() {
    if (!box) build();
    lastFocus = document.activeElement;
    box.setAttribute('data-open', '');
    document.documentElement.style.overflow = 'hidden';
    var first = box.querySelector('.pm-grid a');
    if (first) first.focus();
  }

  function close() {
    if (!box) return;
    box.removeAttribute('data-open');
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-th-podbor-open]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    open();
  });

  document.addEventListener('keydown', function (e) {
    if (!box || !box.hasAttribute('data-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      var f = box.querySelectorAll('a[href],button');
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
})();
