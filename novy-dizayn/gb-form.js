/* GROUP BUY 369: форма «Присоединиться». Заявка уходит в приёмник (тот же /exec, что у lead.js), затем открывается WhatsApp.
   Кнопки <a data-gb="КОД" data-gbn="Название" href="wa.me/..."> без JS остаются обычной ссылкой на WhatsApp.
   На localhost заявка в приёмник НЕ отправляется (чтобы не мусорить в листе «Заявки»). */
(function () {
  if (window.__gbForm) { return; }
  window.__gbForm = 1;
  var EXEC = "https://script.google.com/macros/s/AKfycbzqoF8JVLc-OjrSLJbwZ8oBi0MbC5p89VHmLY9di3rcaK0TrTdEEPAduBqbYPRqWPwdgA/exec";
  var PHONE = "77000369369";
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  var CSS = ".gbf-o{position:fixed;inset:0;z-index:99999;background:rgba(7,28,59,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,'Segoe UI',sans-serif}" +
    ".gbf{background:#fff;border-radius:16px;max-width:440px;width:100%;box-sizing:border-box;padding:28px 28px 24px;max-height:calc(100vh - 32px);overflow:auto;color:#1A1A1A}" +
    ".gbf h3{margin:0;font:700 22px/30px Inter,sans-serif;color:#0033A0}" +
    ".gbf .gbf-p{margin:6px 0 16px;font:400 14px/21px Inter,sans-serif;color:#475569;overflow-wrap:anywhere}" +
    ".gbf label{display:block;margin:12px 0 4px;font:600 13px/18px Inter,sans-serif;color:#223046}" +
    ".gbf input,.gbf select{width:100%;box-sizing:border-box;height:46px;border:1.5px solid #CBD5E1;border-radius:8px;padding:0 12px;font:400 16px/1 Inter,sans-serif;color:#1A1A1A;background:#fff}" +
    ".gbf input:focus,.gbf select:focus{outline:none;border-color:#0066FF}" +
    ".gbf .gbf-e{margin:8px 0 0;min-height:18px;font:500 13px/18px Inter,sans-serif;color:#C41212}" +
    ".gbf .gbf-b{display:flex;width:100%;height:48px;margin-top:10px;border:0;border-radius:8px;background:#E81C1C;color:#fff;font:600 16px/1 Inter,sans-serif;align-items:center;justify-content:center;cursor:pointer}" +
    ".gbf .gbf-b:hover{background:#C41212}.gbf .gbf-b[disabled]{opacity:.6;cursor:default}" +
    ".gbf .gbf-c{background:none;color:#0066FF;border:1.5px solid #0066FF;margin-top:8px}.gbf .gbf-c:hover{background:#E9F4FF}" +
    ".gbf .gbf-n{margin:12px 0 0;font:400 12px/18px Inter,sans-serif;color:#64748B}" +
    ".gbf .gbf-ok b{display:block;margin:10px 0 4px;font:800 24px/30px Inter,sans-serif;color:#0033A0}";

  function sess(k, make) {
    try { var v = sessionStorage.getItem(k); if (!v) { v = make(); sessionStorage.setItem(k, v); } return v; } catch (e) { return ""; }
  }
  function aid() {
    try { var a = localStorage.getItem("th_aid"); if (!a) { a = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem("th_aid", a); } return a; } catch (e) { return ""; }
  }
  function src() {
    var first = sess("th_src", function () { return (document.referrer || "").slice(0, 180) || "direct"; });
    return first + " | " + location.pathname;
  }
  function phoneNorm(s) {
    var d = String(s || "").replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "8") { d = "7" + d.slice(1); }
    if (d.length === 10) { d = "7" + d; }
    return /^7\d{10}$/.test(d) ? d : "";
  }
  function h(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) { if (attrs.hasOwnProperty(k)) { n.setAttribute(k, attrs[k]); } }
    if (html) { n.innerHTML = html; }
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function openForm(code, title, waHref) {
    if (document.getElementById("gbf-o")) { return; }
    if (!document.getElementById("gbf-css")) { var st = h("style", { id: "gbf-css" }); st.appendChild(document.createTextNode(CSS)); document.head.appendChild(st); }
    var qty = ""; for (var i = 1; i <= 10; i++) { qty += "<option value='" + i + "'>" + i + "</option>"; }
    var o = h("div", { id: "gbf-o", "class": "gbf-o" });
    var box = h("div", { "class": "gbf", role: "dialog", "aria-modal": "true", "aria-labelledby": "gbf-t" },
      "<h3 id='gbf-t'>Присоединиться к группе</h3><p class='gbf-p'>" + esc(title) + "</p>" +
      "<form novalidate><label for='gbf-n'>Имя</label><input id='gbf-n' name='name' autocomplete='name'>" +
      "<label for='gbf-ph'>Телефон</label><input id='gbf-ph' name='phone' type='tel' inputmode='tel' autocomplete='tel' placeholder='+7'>" +
      "<label for='gbf-q'>Сколько штук нужно</label><select id='gbf-q' name='qty'>" + qty + "</select>" +
      "<p class='gbf-e' role='alert'></p><button class='gbf-b' type='submit'>Отправить заявку</button>" +
      "<p class='gbf-n'>Номер нужен только для связи по этой заявке. Участие подтверждает менеджер в WhatsApp.</p></form>");
    o.appendChild(box); document.body.appendChild(o);
    var prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    var form = box.querySelector("form"), err = box.querySelector(".gbf-e");
    function close() { document.body.style.overflow = prev; if (o.parentNode) { o.parentNode.removeChild(o); } document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") { close(); } }
    document.addEventListener("keydown", onKey);
    o.addEventListener("click", function (e) { if (e.target === o) { close(); } });
    box.querySelector("#gbf-n").focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), ph = phoneNorm(form.phone.value), q = parseInt(form.qty.value, 10) || 1;
      if (name.length < 2) { err.textContent = "Введите имя"; return; }
      if (!ph) { err.textContent = "Введите номер: +7 и 10 цифр"; return; }
      err.textContent = "";
      var btn = form.querySelector(".gbf-b"); btn.disabled = true; btn.textContent = "Отправляем…";
      var w = null; try { w = window.open("", "_blank"); } catch (x) { w = null; }
      var body = { kind: "lead", channel: "Вместе дешевле", name: name, phone: ph,
        comment: "GROUP BUY | " + code + " | " + q + " шт | " + title,
        src: src(), ses: sess("th_ses", function () { return Math.random().toString(36).slice(2, 10); }), aid: aid(),
        ua: (navigator.userAgent || "").slice(0, 260) };
      var send = LOCAL ? Promise.resolve("OK ЗЯ-TEST-0000") :
        fetch(EXEC, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
          .then(function (r) { return r.text(); }).catch(function () { return ""; });
      // Приёмник иногда отвечает 10+ секунд. Запрос не отменяем (заявка запишется), но ждём не дольше 8 секунд.
      var slow = new Promise(function (res) { setTimeout(function () { res("TIMEOUT"); }, 8000); });
      Promise.race([send, slow]).then(function (t) {
        var late = t === "TIMEOUT";
        var m = /ЗЯ-[\dA-Z]+-\d{4}/.exec(String(t)); var ok = String(t).indexOf("OK") === 0; var zy = m ? m[0] : "";
        try { if (ok && window.THTrack) { window.THTrack("lead_submit", { channel: "gb" }); } } catch (x) { /* счётчики не мешают */ }
        var text = "Здравствуйте. Хочу в группу «Вместе дешевле»: " + title + ", " + q + " шт. Меня зовут " + name + "." + (zy ? " Заявка " + zy + "." : "");
        var href = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
        box.innerHTML = "<div class='gbf-ok'><h3>" + (ok ? "Спасибо, заявка принята" : late ? "Заявка отправляется" : "Откройте WhatsApp") + "</h3>" +
          (zy ? "<b>" + esc(zy) + "</b>" : "") +
          "<p class='gbf-p'>" + (ok ? "Менеджер подтвердит участие и количество в WhatsApp по порядку подачи заявок. Платить сейчас не нужно." : late ?
            "Номер заявки придёт чуть позже. Напишите нам в WhatsApp, менеджер найдёт её по вашему номеру телефона." :
            "Заявка в таблицу не дошла, напишите нам в WhatsApp: так её не потеряем.") + "</p>" +
          "<a class='gbf-b' style='text-decoration:none' target='_blank' rel='noopener' href='" + esc(href) + "'>Открыть WhatsApp</a>" +
          "<button class='gbf-b gbf-c' type='button'>Закрыть</button></div>";
        box.querySelector(".gbf-c").addEventListener("click", close);
        if (ok) { celebrate(); }
        if (w) { w.location.href = href; } else if (!LOCAL) { /* попап заблокирован: остаётся кнопка выше */ }
      });
    });
  }

  // --- оживление: конфетти и тихий звонок после принятой заявки (звук только после клика, как требуют браузеры)
  var REDUCE = false;
  try { REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { REDUCE = false; }
  function chime() {
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) { return; }
      var a = new C(), t = a.currentTime;
      [[659.25, 0], [880, 0.12], [1318.5, 0.26]].forEach(function (n) {
        var o = a.createOscillator(), g = a.createGain();
        o.type = "sine"; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + n[1]);
        g.gain.exponentialRampToValueAtTime(0.07, t + n[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.55);
        o.connect(g); g.connect(a.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.6);
      });
    } catch (e) { /* звук не обязателен */ }
  }
  function confetti() {
    if (REDUCE) { return; }
    if (!document.getElementById("gbf-conf-css")) {
      var st = h("style", { id: "gbf-conf-css" });
      st.appendChild(document.createTextNode("@keyframes gbfConf{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),105vh) rotate(var(--rot));opacity:.9}}.gbf-cf{position:fixed;top:-12px;z-index:100000;width:9px;height:14px;border-radius:2px;animation:gbfConf 1.8s ease-in forwards;pointer-events:none}"));
      document.head.appendChild(st);
    }
    var cols = ["#E81C1C", "#8A35D6", "#0066FF", "#178841", "#FFFFFF", "#0033A0"], wrap = document.body;
    for (var i = 0; i < 46; i++) {
      var p = document.createElement("i");
      p.className = "gbf-cf";
      p.style.left = (10 + Math.random() * 80) + "vw";
      p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      p.style.setProperty("--rot", (360 + Math.random() * 720) + "deg");
      p.style.animationDelay = (Math.random() * 0.35) + "s";
      wrap.appendChild(p);
      (function (n) { setTimeout(function () { if (n.parentNode) { n.parentNode.removeChild(n); } }, 2600); })(p);
    }
  }
  function celebrate() { confetti(); chime(); }

  // ролик и видео канала: подгружаем только по клику (быстро и со звуком по жесту зрителя)
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) { return; }
    var pb = t.closest(".vd-play");
    if (pb) {
      e.preventDefault();
      var v = document.createElement("video");
      v.className = "vd-video"; v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.src = pb.getAttribute("data-vid");
      pb.parentNode.replaceChild(v, pb);
      try { var pr = v.play(); if (pr && pr.catch) { pr.catch(function () {}); } } catch (x) { /* пользователь нажмёт сам */ }
      return;
    }
    var yb = t.closest(".vd-yt");
    if (yb) {
      e.preventDefault();
      var f = document.createElement("iframe");
      f.src = "https://www.youtube.com/embed/" + yb.getAttribute("data-yt") + "?rel=0&autoplay=1";
      f.title = yb.getAttribute("aria-label") || "Видео";
      f.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen");
      f.setAttribute("allowfullscreen", "");
      yb.parentNode.replaceChild(f, yb);
    }
  });

  // появление блоков при прокрутке: контент виден и без JS; страховка снимает скрытие через 4 секунды
  function initAnim() {
    var root = document.querySelector(".vd-page");
    if (!root || root.__vdAnim) { return !!root; }
    root.__vdAnim = 1;
    if (REDUCE || !("IntersectionObserver" in window)) { return true; }
    var els = root.querySelectorAll(".vd-sec,.vd-c,.vd-step,.vd-rung,.vd-ex,.vd-faq,.vd-zhk,.vd-cta");
    document.documentElement.classList.add("vd-anim");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("vd-in"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    Array.prototype.forEach.call(els, function (n) { n.classList.add("vd-rv"); io.observe(n); });
    setTimeout(function () { Array.prototype.forEach.call(els, function (n) { n.classList.add("vd-in"); }); }, 4000);
    return true;
  }
  var tries = 0, iv = setInterval(function () { if (initAnim() || ++tries > 40) { clearInterval(iv); } }, 150);

  // живая шкала «набрано N из 9»: данные из файла прогресса (только код товара и число штук подтверждённых участников).
  // Пока файла нет, он недоступен или у товара 0 штук, шкала скрыта и страница выглядит как обычно.
  var PROGRESS = "https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/main/novy-dizayn/data/groupbuy-progress.json";
  function initProgress() {
    var boxes = document.querySelectorAll("[data-gbp]");
    if (!boxes.length) { return false; }
    if (document.documentElement.__gbp) { return true; }
    document.documentElement.__gbp = 1;
    fetch(PROGRESS + "?x=" + Math.floor(Date.now() / 300000)).then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) {
      Array.prototype.forEach.call(boxes, function (b) {
        var gg = d._g && d._g[b.getAttribute("data-gbp")];
        var dayNow = gg ? (gg.day || 1) + Math.floor((Date.now() / 1000 - (gg.t0 || 0)) / 86400) : 0;
        if (gg && (gg.closed || dayNow > 9)) {  // закрыта досрочно (лимит товара) или срок вышел: кнопку прячем
          b.innerHTML = '<span class="vd-pgt">Набор закрыт: ' + (gg.closed ? "лимит товара набран" : "группа завершена") + '. Цена зафиксирована</span>';
          b.hidden = false;
          var art = b.parentNode, jb = art && art.querySelector ? art.querySelector("a[data-gb]") : null;
          if (jb) { jb.style.display = "none"; }
          return;
        }
        var n = parseInt(d[b.getAttribute("data-gbp")], 10);
        if (!(n > 0)) { return; }
        var msg;
        if (n >= 9) { msg = "В группе " + n + " шт.: скидка 9 % действует у всех участников"; }
        else if (n >= 6) { msg = "В группе " + n + " шт.: скидка 6 % уже действует, до 9 % ещё " + (9 - n) + " шт."; }
        else { msg = "В группе " + n + " шт., до скидки 6 % ещё " + (6 - n) + " шт."; }
        b.innerHTML = '<span class="vd-pgt">' + msg + '</span><span class="vd-pgb"><i style="width:' + Math.min(100, Math.round(n / 9 * 100)) + '%"></i></span>';
        b.hidden = false;
      });
    }).catch(function () {});
    return true;
  }
  var tries2 = 0, iv2 = setInterval(function () { if (initProgress() || ++tries2 > 60) { clearInterval(iv2); } }, 250);

  // «Группа №1» вверху страницы: день группы и число участников из того же файла прогресса.
  // Пока данных нет, блок показывает только название, ступени цен и кнопку; день и участники скрыты.
  function plDays(n) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "день" : (m >= 2 && m <= 4 && (h < 12 || h > 14)) ? "дня" : "дней"; }
  function initFeatured() {
    var f = document.querySelector("[data-gbf]");
    if (!f) { return false; }
    if (document.documentElement.__gbf) { return true; }
    document.documentElement.__gbf = 1;
    var code = f.getAttribute("data-gbf");
    fetch(PROGRESS + "?x=" + Math.floor(Date.now() / 300000)).then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) {
      var g = d && d._g && d._g[code];
      if (!g) { return; }
      function q(n) { return f.querySelector('[data-fg="' + n + '"]'); }
      var units = parseInt(d[code], 10) || 0;
      var day = (g.day || 1) + Math.floor((Date.now() / 1000 - (g.t0 || 0)) / 86400);
      if (day < 1) { day = 1; }
      var early = !!g.closed;  // закрыта досрочно: набран лимит товара
      var closed = day > 9 || early, left = Math.max(0, 9 - day);
      // счёт по группе (решение владельца 26.10.2026): 3 % со 3-го дня всем, 6 и 9 % только по штукам всей группы
      var tierDay = day >= 3 ? 3 : 0;
      var tierUnits = units >= 9 ? 9 : units >= 6 ? 6 : 0;
      var tier = Math.max(tierDay, tierUnits);
      var dayEl = q("day"), bar = q("bar"), leftEl = q("left"), un = q("units"), join = q("join");
      if (closed) {
        dayEl.innerHTML = "<b>" + (early ? "Набор закрыт досрочно" : "Набор закрыт") + "</b>";
        bar.hidden = true;
        leftEl.textContent = early ? "Лимит товара набран, цена зафиксирована." : "Набор в группу закрыт.";
        if (join) { join.hidden = true; }
      } else {
        dayEl.innerHTML = "<b>День " + day + " из 9</b><span>" + (tier ? "Сейчас скидка " + tier + " %" : "Скидка 3 % включится с 3-го дня") + "</span>";
        var seg = bar.children;
        for (var k = 0; k < seg.length; k++) { seg[k].className = k < Math.min(day, 9) ? "on" : ""; }
        bar.hidden = false;
        leftEl.textContent = (left > 0 ? "До закрытия группы " + left + " " + plDays(left) + "." : "Группа закрывается сегодня.") + " Платить нужно после закрытия.";
      }
      dayEl.hidden = false; leftEl.hidden = false;
      if (units > 0) {
        var more = closed ? "Итоговая скидка группы " + tier + " %." : units >= 9 ? "Скидка 9 % действует у всех участников." : units >= 6 ? "Скидка 6 % уже действует, до 9 % ещё " + (9 - units) + " шт." : "До скидки 6 % ещё " + (6 - units) + " шт.";
        un.innerHTML = "<b>" + (closed ? "В группе" : "Присоединились") + ": " + units + " шт.</b>" + more + '<span class="fg-pb"><i style="width:' + Math.min(100, Math.round(units / 9 * 100)) + '%"></i></span>';
      } else {
        un.innerHTML = "<b>Участников пока нет</b>Станьте первым: заявки подтверждаем по порядку подачи, товар бронируем до закрытия группы.";
      }
      if (!closed || units > 0) { un.hidden = false; }
      var rungs = f.querySelectorAll("[data-t]");
      for (var j = 0; j < rungs.length; j++) { rungs[j].className = parseInt(rungs[j].getAttribute("data-t"), 10) === tier ? "now" : ""; }
    }).catch(function () {});
    return true;
  }
  var tries3 = 0, iv3 = setInterval(function () { if (initFeatured() || ++tries3 > 60) { clearInterval(iv3); } }, 250);

  // «Показать все» в длинных разделах (THAICON, TCL LCAC): раскрывает остальные карточки
  document.addEventListener("click", function (e) {
    var sb = e.target && e.target.closest ? e.target.closest(".vd-showall") : null;
    if (!sb) { return; }
    var sec = sb.closest(".vd-sec");
    if (sec) { sec.classList.remove("vd-collapsed"); }
    if (sb.parentNode) { sb.parentNode.style.display = "none"; }
  });

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[data-gb]") : null;
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) { return; }
    e.preventDefault();
    openForm(a.getAttribute("data-gb"), a.getAttribute("data-gbn") || "", a.getAttribute("href"));
  });
})();
