/**
 * Окна новой главной: заявка, подбор за 5 вопросов, политика конфиденциальности.
 *
 * Кнопки сайта — обычные ссылки #popup:zayavka, #popup:kviz, #popup:politika.
 * Заявка уходит в тот же приёмник, что корзина и формы на /kontakty, /proekt, /uslugi:
 * через window.TH_LEAD.send (lead.js) — строка в листе «Заявки» с номером ЗЯ-ГГММ-NNNN.
 * Окна Тильды не используются: их заявки шли бы мимо приёмника и без номера.
 *
 * Если lead.js не загрузился или приёмник не ответил — человек видит просьбу позвонить
 * или написать в WhatsApp, заявка не пропадает молча.
 */
(function () {
  "use strict";
  if (window.__thPopups) return;
  window.__thPopups = true;

  var CDN = "https://cdn.jsdelivr.net/gh/tehnoholod369-glitch/tehnoholod-katalog@main/novy-dizayn/";
  var PAMYATKA = CDN + "lead-magnity/tehnoholod-sem-strok-smety.pdf";
  var WA = "https://wa.me/77000369369";

  // Первый вопрос общий, вопросы 2–5 зависят от выбранной техники.
  // k: area — площадь, install — монтаж (уходят в заявку отдельными полями).
  var Q_WHAT = { q: "Что нужно?", v: ["Кондиционер", "Отопление", "Вентиляция", "Водонагреватель или фильтры для воды", "Не знаю, нужна консультация"] };
  var Q_PLACE = { q: "Для чего?", v: ["Квартира", "Частный дом", "Офис или магазин", "Другое"] };
  var Q_AREA = { k: "area", q: "Какая площадь помещения?", v: ["До 20 м²", "20–35 м²", "35–50 м²", "Больше 50 м²", "Не знаю"] };
  var Q_INST = { k: "install", q: "Нужен ли монтаж?", v: ["Да, с монтажом", "Только оборудование", "Не знаю"] };
  var Q_TERM = { q: "К какому сроку нужно?", v: ["В ближайшие дни", "В течение месяца", "Пока присматриваюсь"] };
  var BRANCH = {
    "Кондиционер": [Q_PLACE, Q_AREA, Q_INST, Q_TERM],
    "Отопление": [
      { q: "Что нужно обогреть?", v: ["Квартира или дом", "Магазин или офис", "Склад или цех", "Вход или дверной проём", "Другое"] },
      { k: "area", q: "Какая площадь помещения?", v: ["До 30 м²", "30–60 м²", "60–100 м²", "Больше 100 м²", "Не знаю"] },
      Q_INST, Q_TERM],
    "Вентиляция": [
      { q: "Какая задача?", v: ["Свежий воздух с улицы", "Вытяжка из кухни или санузла", "Приток и вытяжка вместе", "Не знаю, нужна консультация"] },
      Q_AREA, Q_INST, Q_TERM],
    "Водонагреватель или фильтры для воды": [
      { q: "Что подбираем?", v: ["Накопительный водонагреватель", "Проточный водонагреватель", "Фильтр или водоочистка", "Не знаю, нужна консультация"] },
      { q: "Где будет стоять?", v: ["Квартира", "Частный дом", "Офис или магазин", "Другое"] },
      Q_INST, Q_TERM]
  };
  var BRANCH_ANY = [
    Q_PLACE,
    { q: "Что хотите получить?", v: ["Прохладу", "Тепло", "Свежий воздух", "Горячую воду или чистую воду", "Не знаю"] },
    Q_INST, Q_TERM];
  function quizSteps() {
    return [Q_WHAT].concat(BRANCH[state && state.answers[0]] || BRANCH_ANY);
  }
  var POLITIKA = [
    "1. Кто обрабатывает данные. ИП «ТехноХолод», ИИН/БИН 770313000379, адрес: Алматы, ул. Какимжана Казыбаева, 286Б, почта tehnoholod369@gmail.com, телефон +77 000 369 369.",
    "2. Какие данные. Имя, номер телефона и ответы, которые вы оставляете в форме на сайте tehnoholod369.kz.",
    "3. Зачем. Чтобы связаться с вами, ответить на вопрос, сделать расчёт и договориться о замере, монтаже или заказе. Рассылок без вашего согласия не делаем.",
    "4. Как храним. Данные приходят нам в таблицу заявок и на электронную почту. Доступ — только у сотрудников, которые работают с заявками. Храним, пока это нужно для ответа и договора, и удаляем по вашей просьбе.",
    "5. Кому передаём. Никому, кроме сервисов, без которых заявка не дойдёт: хранилище таблиц и почта. Не продаём и не публикуем.",
    "6. Ваши права. Вы можете узнать, какие данные у нас есть, исправить их или попросить удалить — напишите на tehnoholod369@gmail.com или позвоните +77 000 369 369.",
    "7. Согласие. Оставляя заявку, вы соглашаетесь на обработку данных на этих условиях. В Казахстане — в соответствии с Законом РК «О персональных данных и их защите»."
  ];

  var CSS = ".thp-ov{position:fixed;inset:0;z-index:100000;background:rgba(7,28,59,.62);display:none;align-items:center;justify-content:center;padding:16px;overflow:auto;font-family:Inter,TildaSans,Arial,sans-serif}"
    + ".thp-ov.thp-on{display:flex}"
    + ".thp-box{position:relative;width:100%;max-width:480px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(0,51,160,.28);padding:30px 28px 26px;color:#1A1A1A;box-sizing:border-box}"
    + ".thp-x{position:absolute;right:12px;top:12px;width:40px;height:40px;border:0;border-radius:50%;background:#F1F5F9;color:#0033A0;font:400 22px/1 Arial,sans-serif;cursor:pointer}"
    + ".thp-x:hover{background:#E9F4FF}.thp-x:focus-visible,.thp-b:focus-visible,.thp-opt:focus-visible,.thp-in:focus-visible{outline:3px solid #0066FF;outline-offset:2px}"
    + ".thp-h{margin:0 40px 10px 0;font:700 22px/1.25 Inter,Arial,sans-serif;color:#0033A0}"
    + ".thp-t{margin:0 0 18px;font-size:15px;line-height:1.55;color:#475569}"
    + ".thp-f{display:grid;gap:12px}"
    + ".thp-in{width:100%;height:50px;padding:0 14px;border:1px solid #94A3B8;border-radius:8px;font:400 16px Inter,Arial,sans-serif;color:#1A1A1A;box-sizing:border-box;background:#fff}"
    + ".thp-b{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 22px;border:0;border-radius:8px;background:#E81C1C;color:#fff;font:600 16px/1.2 Inter,Arial,sans-serif;cursor:pointer;text-decoration:none;box-sizing:border-box;width:100%}"
    + ".thp-b:hover{background:#C41212}.thp-b[disabled]{background:#E5E9F0;color:#606F85;cursor:not-allowed}"
    + ".thp-b--blue{background:#0066FF}.thp-b--blue:hover{background:#0052D6}"
    + ".thp-b--line{background:#fff;color:#0066FF;box-shadow:inset 0 0 0 1.5px #0066FF}.thp-b--line:hover{background:#E9F4FF}"
    + ".thp-ck{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.45;color:#475569}"
    + ".thp-ck input{margin-top:2px;width:18px;height:18px;flex:none;accent-color:#0066FF}.thp-ck a{color:#0066FF;text-decoration:underline;cursor:pointer}"
    + ".thp-er{display:none;padding:10px 12px;border-radius:8px;background:#FFF3C4;color:#5C4400;font-size:14px;line-height:1.45}.thp-er.thp-on{display:block}"
    + ".thp-pr{display:flex;gap:6px;margin:0 52px 14px 0}.thp-pr i{flex:1;height:5px;border-radius:3px;background:#E5E9F0}.thp-pr i.thp-d{background:#0066FF}"
    + ".thp-qs{margin:0 0 12px;font:600 13px/1 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#606F85}"
    + ".thp-qq{margin:0 0 14px;font:700 20px/1.3 Inter,Arial,sans-serif;color:#0033A0}"
    + ".thp-opts{display:grid;gap:10px}"
    + ".thp-opt{display:block;box-sizing:border-box;width:100%;text-align:left;min-height:50px;padding:12px 16px;border:1.5px solid #CBD5E1;border-radius:10px;background:#fff;color:#1A1A1A;font:500 16px/1.35 Inter,Arial,sans-serif;cursor:pointer}"
    + ".thp-opt:hover{border-color:#0066FF;background:#E9F4FF}"
    + ".thp-bk{margin-top:14px;border:0;background:none;color:#0066FF;font:600 15px Inter,Arial,sans-serif;cursor:pointer;padding:6px 0}"
    + ".thp-ok{width:72px;height:72px;margin:0 0 14px;border-radius:50%;background:#178841;color:#fff;display:grid;place-items:center;font-size:38px;line-height:1}"
    + ".thp-pol{max-width:620px}.thp-pol p{margin:0 0 12px;font-size:14px;line-height:1.55;color:#334155}"
    + "@media(max-width:520px){.thp-box{padding:26px 18px 20px;border-radius:14px}.thp-h{font-size:20px}}"
    + "html.thp-lock{overflow:hidden}";

  var style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var ov, box, lastFocus = null, state = null;

  function build() {
    if (ov) return;
    ov = el("div", "thp-ov");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    box = el("div", "thp-box");
    ov.appendChild(box);
    document.body.appendChild(ov);
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ov.classList.contains("thp-on")) close(); });
  }

  function open(kind, from) {
    build();
    lastFocus = document.activeElement;
    state = { kind: kind, from: from || "", answers: [], step: 0 };
    if (kind === "kviz") renderQuiz(); else if (kind === "politika") renderPolitika(); else renderForm();
    ov.classList.add("thp-on");
    document.documentElement.classList.add("thp-lock");
    var f = box.querySelector("input,button.thp-opt,button.thp-x");
    if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, 30);
  }
  function close() {
    if (!ov) return;
    ov.classList.remove("thp-on");
    document.documentElement.classList.remove("thp-lock");
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function closer() {
    var b = el("button", "thp-x", "&times;");
    b.type = "button"; b.setAttribute("aria-label", "Закрыть");
    b.addEventListener("click", close);
    return b;
  }

  function contactFields(phoneLabel, btn) {
    var f = el("div", "thp-f");
    f.innerHTML = '<input class="thp-in" type="text" name="name" autocomplete="name" placeholder="Имя" aria-label="Имя">'
      + '<input class="thp-in" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="' + phoneLabel + '" aria-label="' + phoneLabel + '" required>'
      + '<label class="thp-ck"><input type="checkbox" name="agree"><span>Я согласен на обработку персональных данных (<a data-pol>ссылка на политику конфиденциальности</a>)</span></label>'
      + '<div class="thp-er" role="alert"></div>'
      + '<button type="button" class="thp-b" data-go>' + btn + '</button>';
    f.querySelector("[data-pol]").addEventListener("click", function (e) { e.preventDefault(); open("politika"); });
    return f;
  }

  function renderForm() {
    box.innerHTML = "";
    box.appendChild(closer());
    box.appendChild(el("h2", "thp-h", "Оставьте телефон, перезвоним с расчётом"));
    box.appendChild(el("p", "thp-t", "Перезвоним в рабочее время, Пн–Пт 9:00–18:00. Можно просто позвонить по номеру в шапке. Ни к чему не обязывает."));
    var f = contactFields("Телефон", "Получить расчёт");
    box.appendChild(f);
    bindSend(f, function () { return { channel: "сайт: главная, заявка", comment: state.from ? "Кнопка: " + state.from : "" }; });
  }

  function renderQuiz() {
    box.innerHTML = "";
    box.appendChild(closer());
    var n = state.step;
    if (n === 0) {
      box.appendChild(el("h2", "thp-h", "Ответьте на 5 вопросов: назовём модель, цену и срок монтажа"));
      box.appendChild(el("p", "thp-t", "Пять вопросов займут минуту, на каждый есть готовые варианты. После ответов назовём модель, цену и срок."));
    }
    var QUIZ = quizSteps();
    var pr = el("div", "thp-pr");
    for (var i = 0; i < QUIZ.length; i++) pr.appendChild(el("i", i <= n ? "thp-d" : ""));
    if (n >= QUIZ.length) {
      box.appendChild(el("h2", "thp-h", "Последний шаг"));
      box.appendChild(el("p", "thp-t", "Перезвоним с расчётом в рабочее время. Ни к чему не обязывает." + (state.answers[0] === "Кондиционер" ? " Памятку про смету пришлём сразу после заявки." : "")));
      var f = contactFields("Телефон или WhatsApp", "Получить расчёт");
      box.appendChild(f);
      bindSend(f, function () {
        var a = state.answers, area = "", install = "";
        QUIZ.forEach(function (s, k) { if (s.k === "area") area = a[k] || ""; if (s.k === "install") install = a[k] || ""; });
        return { channel: "сайт: главная, подбор за 5 вопросов", area: area, install: install,
          comment: QUIZ.map(function (s, k) { return s.q + " " + (a[k] || "—"); }).join("; ") };
      });
      back();
      return;
    }
    box.appendChild(pr);
    box.appendChild(el("p", "thp-qs", "Вопрос " + (n + 1) + " из " + QUIZ.length));
    box.appendChild(el("h3", "thp-qq", esc(QUIZ[n].q)));
    var list = el("div", "thp-opts");
    QUIZ[n].v.forEach(function (v) {
      var b = el("button", "thp-opt", esc(v));
      b.type = "button";
      b.addEventListener("click", function () {
        if (n === 0 && state.answers[0] !== v) state.answers = [];
        state.answers[n] = v; state.step = n + 1; renderQuiz();
      });
      list.appendChild(b);
    });
    box.appendChild(list);
    if (n > 0) back();
  }
  function back() {
    var b = el("button", "thp-bk", "← Назад");
    b.type = "button";
    b.addEventListener("click", function () { state.step = Math.max(0, state.step - 1); renderQuiz(); });
    box.appendChild(b);
  }

  function renderPolitika() {
    box.innerHTML = "";
    box.classList.add("thp-pol");
    box.appendChild(closer());
    box.appendChild(el("h2", "thp-h", "Политика конфиденциальности"));
    POLITIKA.forEach(function (p) { box.appendChild(el("p", "", esc(p))); });
    var b = el("button", "thp-b thp-b--blue", "Понятно");
    b.type = "button";
    b.addEventListener("click", close);
    box.appendChild(b);
  }

  function renderOk() {
    box.classList.remove("thp-pol");
    box.innerHTML = "";
    box.appendChild(closer());
    box.appendChild(el("div", "thp-ok", "&#10003;"));
    box.appendChild(el("h2", "thp-h", "Заявку получили. Перезвоним в рабочее время"));
    // памятка — про смету на монтаж кондиционера, остальным направлениям её не предлагаем
    var memo = state && state.kind === "kviz" && state.answers[0] === "Кондиционер";
    var g = el("div", "thp-f");
    if (memo) {
      box.appendChild(el("p", "thp-t", "Пока ждёте звонка, скачайте памятку: семь строк, которые нужно проверить в смете на монтаж кондиционера до предоплаты."));
      g.innerHTML = '<a class="thp-b" href="' + PAMYATKA + '" target="_blank" rel="noopener">Скачать памятку про смету</a>'
        + '<a class="thp-b thp-b--line" href="' + WA + '" target="_blank" rel="noopener">Написать в WhatsApp</a>';
    } else {
      box.appendChild(el("p", "thp-t", "Если хотите ускорить, напишите нам в WhatsApp: ответим в рабочее время, Пн–Пт 9:00–18:00."));
      g.innerHTML = '<a class="thp-b" href="' + WA + '" target="_blank" rel="noopener">Написать в WhatsApp</a>';
    }
    box.appendChild(g);
  }

  function bindSend(f, collect) {
    var go = f.querySelector("[data-go]"), er = f.querySelector(".thp-er");
    function fail(msg) { er.textContent = msg; er.classList.add("thp-on"); }
    go.addEventListener("click", function () {
      er.classList.remove("thp-on");
      var phone = f.querySelector('[name=phone]').value.trim();
      var digits = phone.replace(/\D/g, "");
      if (digits.length < 10) { fail("Проверьте номер: нужно не меньше 10 цифр."); f.querySelector('[name=phone]').focus(); return; }
      if (!f.querySelector('[name=agree]').checked) { fail("Поставьте галочку согласия, без неё мы не можем принять заявку."); return; }
      if (!window.TH_LEAD) { fail("Не удалось отправить. Позвоните +77 000 369 369 или напишите в WhatsApp."); return; }
      go.disabled = true; go.textContent = "Отправляем…";
      var p = collect();
      p.name = f.querySelector('[name=name]').value.trim();
      p.phone = phone;
      window.TH_LEAD.send(p).then(function (ok) {
        if (ok) { renderOk(); return; }
        go.disabled = false; go.textContent = "Получить расчёт";
        fail("Не удалось отправить. Позвоните +77 000 369 369 или напишите в WhatsApp, затем можно повторить.");
      });
    });
  }

  // подгружаем канал заявок, если его на странице ещё нет
  if (!window.TH_LEAD && !document.querySelector('script[src*="lead.js"]')) {
    var s = document.createElement("script");
    s.src = CDN + "lead.js";
    document.head.appendChild(s);
  }

  // кнопки и ссылки #popup:...
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#popup:"]') : null;
    if (!a) return;
    var kind = (a.getAttribute("href") || "").split(":")[1];
    if (kind !== "zayavka" && kind !== "kviz" && kind !== "politika") return;
    e.preventDefault();
    open(kind, (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80));
  });
  window.thPopup = open;
})();
