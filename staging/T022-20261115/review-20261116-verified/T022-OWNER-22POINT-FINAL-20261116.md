# T-022 | Owner 16.11.2026 — итоговый аудит 22 пунктов (тестовая копия)

**ОБЛАСТЬ:** только https://tehnoholod369.kz/vmeste-deshevle-t022-test-20261115. Изменения production /vmeste-deshevle НЕ разрешались и НЕ выполнялись. TEST/noindex сохранены. Последняя опубликованная TEST сборка: маркер `T022_CONNECT7_20261116_TEST_ONLY`.

**LIVE browser QA:** 16.11.2026, Chrome, разрешения 320 / 768 / 1024 / 1440 px; все четыре PASS, без горизонтального переполнения. 23 товарные карточки, 23 строки источника PIM, 4 отзыва Kaspi, 8 FAQ, 2 раскрывающихся раздела.

## 1. Матрица 22 требований

| № | Требование владельца | Проверенный результат |
|---:|---|---|
| 1 | 53 999 ₸ крупным фиолетовым | PASS: `maxSave=53 999 ₸`; в Chrome computed цвет rgb(80,41,188), weight 800, шрифт 22 px. Совпадает с текущим стилем блока экономии. |
| 2 | Пробелы в группе | PASS: «Группа №12 · идёт набор» на тестовой странице. |
| 3 | Плашка и подпись | PASS по текущему визуальному и прежнему R5 QA; на desktop «Подбор · доставка · монтаж» расположен ниже блока «Климат под вашу задачу». |
| 4 | Мобильная шапка, навигация, CTA | PASS: дублирование названия внутри мобильного блока скрыто; внутренние ссылки идут одной горизонтальной строкой; красная CTA видна на первом экране 320 px. Фирменный логотип сайта остаётся. |
| 5 | Закреплённая CTA + панель сайта | PASS (отдельный живой scroll QA 320 px): CTA top=771/bottom=835, штатная панель сайта top=843/bottom=900, пересечения нет; после завершения блока CTA скрыта, штатная панель «Главная / Каталог / Корзина / Позвонить / WhatsApp» видна. |
| 6 | Неразрывные пробелы/артикулы | PASS по R5 CSS/HTML: 100 000 ₸, 7–10 дней, 4 шт., 9 %, SKU объединён в span.nw; «Для 23 моделей акции» без переноса в макете. |
| 7 | Сенсорные области от 44 px | PASS: на опубликованной странице 320/768/1024/1440 зафиксировано 0 областей <44 px среди проверенных элементов ссылок/FAQ. |
| 8 | Системные scrollbar под фильтрами | PASS по R5 CSS; отсутствие горизонтального переполнения на всех четырёх контрольных ширинах. |
| 9 | Валидация телефона, полное название SKU | PASS по существующим unit/browser тестам: формат KZ +7, согласие обязательно, полная модель показана отдельно, цвет поля изменён. Реальный POST в TEST намеренно заблокирован. |
| 10 | Цифры шагов и стрелки | PASS по предыдущей приёмке R5 и текущим стилям. Отклонение от эталона не обнаружено. |
| 11 | Отправка в действующую механику | STAGED_ONLY: клиентский адаптер существующего CRM Apps Script /exec подключён. Тестовая страница не отправляет реальные заявки (testOnly=true, allowRealSubmit=false). Реальный интеграционный E2E — HOLD. |
| 12 | Номер и количество группы | PARTIAL: №12 отображается как OWNER input, 4/9 не подтверждены реестром. Счётчик СКРЫТ (как требует OWNER) и не создаёт ложный прогресс; backend rollover 9→13 реализован локально, реального API нет. |
| 13 | Динамический каталог, наличие, P7W | PARTIAL: PIM read-only по 22 точным SKU; 1 комплект — составной без одного SKU. Снимок PIM обновлён 14.11.2026. Белый P7W по данным OWNER отсутствует, но PIM помечает «В наличии» — конфликт, нельзя обещать фактическое наличие. |
| 14 | Отзывы Kaspi | PASS в тесте: 4 настоящие записи из существующего публичного источника Kaspi с именами/датами/ссылками; это отзывы о товарах, не о групповом предложении. |
| 15 | TEST/noindex/canonical production | HOLD by OWNER: на тестовом адресе TEST/noindex СОХРАНЕНЫ правильно; снимать можно только после отдельного разрешения владельца на production, canonical также не переключался. |
| 16 | GA4, UTM, SEO-разметка | PARTIAL: UTM в коде формы, без генерации фальшивых `generate_lead`; noindex и состав проверены. Реальные события/конверсии GA4 и production SEO E2E пока не подтвердились. |
| 17 | Лимит ≤20% | STAGED_ONLY: backend алгоритм сравнивает долю всей дисконтированной выручки в общей оплаченной выручке с обязательствами в числителе; 37/37 юнит-тестов, fail-closed. НЕТ актуального выверенного знаменателя ноября и серверной интеграции. |
| 18 | 4 скриншота | PASS: новые full-page и viewport снимки реальной опубликованной TEST на 320/768/1024/1440. |
| 19 | Полные условия, пример, 8 FAQ | PASS: ниже приведены два раздела и 8 ответов с опубликованной страницы. |
| 20 | 23 карточки, фото/цена/-9%/ссылка | PASS URL+фото: 23/23 HTTP200. 23/23 расчёт по формуле округления 91%. Наличие свежих складских остатков не доказано; 3 generic-JS карточки ASP-80/100/200S раньше не подтверждались по имени в HTTP-тексте. |
| 21 | Основной production не менялся | PASS: после тестовой публикации GET 200, SHA-256 совпадает с предшествующей контрольной суммой 2788ec4d558336349886fc61fa1874fc5a593516ac8b292cfbf73fc86cb97aef. Маркера CONNECT7 на основной странице нет. |
| 22 | Отличия/неподключённое | PASS: отдельные разделы ниже; незавершённость бизнес-механики не скрыта. |

## 2. Снимки опубликованной тестовой страницы

- **320 px:** [полная страница](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-320-full.png) · [первый экран](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-320-viewport.png)
- **768 px:** [полная страница](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-768-full.png) · [первый экран](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-768-viewport.png)
- **1024 px:** [полная страница](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-1024-full.png) · [первый экран](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-1024-viewport.png)
- **1440 px:** [полная страница](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-1440-full.png) · [первый экран](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-CONNECT7-live-1440-viewport.png)

- **320 px, CTA при прокрутке:** [скриншот](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-320-mid-sticky-sitefooter.png). Плашка CTA и нижняя панель сайта не перекрываются.

## 3. Дословные тексты раскрывающихся разделов

### Подробные условия

- Штуки считаются по всей группе, из любых товаров акции. Каждый берёт столько, сколько нужно, хоть одну штуку.
- Когда группа набирает 9 штук, она закрывается. Цена для всех участников — со скидкой 9 %.
- Скидка считается от цены на сайте, наценки сверху нет. Если цена на сайте вырастет, группа считает по прежней.
- Оплата и поставка — после набора группы и подтверждения менеджера.

### Пример расчёта

Модель: TCL FreshIN 3.0 (белый) TAC-FR09HSV/P7W. Цена на сайте (с НДС): **323 942 ₸**. Групповая скидка: **9 %**. Цена в группе: **294 787 ₸**. Экономия: **29 155 ₸**.

## 4. Все восемь вопросов FAQ

**1. Нужно ли платить при вступлении в группу?**

Нет. Сначала согласовываются состав заказа, итоговая стоимость и условия. Оплата — после набора группы и подтверждения менеджера.

**2. Нужно ли купить 9 штук, чтобы получить скидку 9 %?**

Нет. Штуки считаются по всей группе, из любых товаров акции. Каждый берёт столько, сколько ему нужно, хоть одну штуку.

**3. Что если группа набирается долго?**

Заявка остаётся в группе, платить до набора не нужно. Подтверждённому участнику товар бронируем до закрытия группы.

**4. Можно ли вступить в группу в любой день?**

Да. Набор идёт постоянно, вступить можно в любой день. Когда группа набирает 9 штук, открывается следующая.

**5. Есть ли наценка сверху?**

Нет. Скидка считается от цены на сайте. Если цена на сайте вырастет, группа считает по прежней.

**6. Что если товар закончится?**

Подберём альтернативу или дождёмся поступления. Цену для вас зафиксируем.

**7. Монтаж входит в групповую цену?**

Нет. Оборудование и монтаж рассчитываются отдельно. Гарантия на монтаж — 12 месяцев, на оборудование — по паспорту изделия.

**8. Нас много: жильцы дома, ЖК или офис. Как быть?**

Напишите нам в WhatsApp: посчитаем цену на всю группу. Монтаж согласуем одной бригадой или несколькими, по числу заявок. Документы — по запросу.

## 5. Все 23 карточки — цена / цена после −9% / фото / ссылка

**Метод:** реальные изображения и ссылки проверены отдельными HTTP-запросами 16.11.2026, 23/23 вернули HTTP 200. Цена и −9 % — отображаемая тестовая сумма, она не подтверждает текущие складские цены. Наличие и актуальность требуют сверки.

| № | Модель / SKU | Цена с НДС | В группе −9 % | Экономия | Фото | Страница |
|---:|---|---:|---:|---:|---|---|
| 1 | TCL FreshIN 3.0 (белый) TAC-FR09HSV/P7W · `TAC-FR09HSV/P7W` | 323 942 ₸ | 294 787 ₸ | 29 155 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/freshin-plus-white-6.jpg) | [Товар](https://tehnoholod369.kz/tproduct/649355257894-konditsioner-tcl-freshin-30-belii-tac-fr) |
| 2 | TCL FreshIN 3.0 (белый) TAC-FR12HSV/P7W · `TAC-FR12HSV/P7W` | 340 992 ₸ | 310 303 ₸ | 30 689 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-200s.jpg) | [Товар](https://tehnoholod369.kz/tproduct/350950348204-konditsioner-tcl-freshin-30-belii-tac-fr) |
| 3 | TCL FreshIN 3.0 (серебро) TAC-FR09HSV/P7S · `TAC-FR09HSV/P7S` | 340 992 ₸ | 310 303 ₸ | 30 689 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/electrolux-panoramnyy-ochag-sphere-plus-efp-p-3320rls-n-diagonal-33-dy.jpg) | [Товар](https://tehnoholod369.kz/tproduct/938910378214-konditsioner-tcl-freshin-30-serebro-tac) |
| 4 | TCL FreshIN 3.0 (серебро) TAC-FR12HSV/P7S · `TAC-FR12HSV/P7S` | 375 092 ₸ | 341 334 ₸ | 33 758 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/rci-gle22hn.jpg) | [Товар](https://tehnoholod369.kz/tproduct/506426247284-konditsioner-tcl-freshin-30-serebro-tac) |
| 5 | TCL FreshIN 3.0 (серебро) TAC-FR18HSV/P7S · `TAC-FR18HSV/P7S` | 409 192 ₸ | 372 365 ₸ | 36 827 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-ba2oi-fm-out-18hn8-eu.jpg) | [Товар](https://tehnoholod369.kz/tproduct/992907639604-konditsioner-tcl-freshin-30-serebro-tac) |
| 6 | TCL FreshIN 3.0 (чёрный) TAC-FR10HSV/P7B · `TAC-FR10HSV/P7B` | 340 992 ₸ | 310 303 ₸ | 30 689 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rwh-80-optimal.jpg) | [Товар](https://tehnoholod369.kz/tproduct/401535714334-konditsioner-tcl-freshin-30-chyornii-tac) |
| 7 | TCL FreshIN 3.0 (чёрный) TAC-FR13HSV/P7B · `TAC-FR13HSV/P7B` | 383 617 ₸ | 349 091 ₸ | 34 526 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/freshin-plus-white-6.jpg) | [Товар](https://tehnoholod369.kz/tproduct/964967300964-konditsioner-tcl-freshin-30-chyornii-tac) |
| 8 | TCL FreshIN 3.0 (чёрный) TAC-FR18HSV/P7B · `TAC-FR18HSV/P7B` | 426 242 ₸ | 387 880 ₸ | 38 362 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg) | [Товар](https://tehnoholod369.kz/tproduct/474881833054-konditsioner-tcl-freshin-30-chyornii-tac) |
| 9 | TCL FreshIN 3.0 (серебро 2025) TAC-FR12INV/R3 · `TAC-FR12INV/R3` | 340 766 ₸ | 310 097 ₸ | 30 669 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg) | [Товар](https://tehnoholod369.kz/tproduct/118900810324-konditsioner-tcl-freshin-30-serebro-2025) |
| 10 | Royal Clima GLORIA Inverter RCI-GLE35HN · `RCI-GLE35HN` | 203 500 ₸ | 185 185 ₸ | 18 315 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg) | [Товар](https://tehnoholod369.kz/tproduct/783965063854-konditsioner-royal-clima-gloria-inverter) |
| 11 | Ballu Free Match: мультисплит на 2 комнаты · `COMPOSITE_NOT_UNIQUE` | 567 970 ₸ | 516 853 ₸ | 51 117 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png) | [Товар](https://tehnoholod369.kz/multisplit-komplekty-almaty) |
| 12 | Royal Thermo Водонагреватель RWH 80 Optimal · `RWH 80 Optimal` | 71 750 ₸ | 65 293 ₸ | 6 457 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png) | [Товар](https://tehnoholod369.kz/tproduct/348776780514-rwh-80-optimal) |
| 13 | Ballu Завеса тепловая BHC-L15-S09-M (пульт BRC-S) · `BHC-L15-S09-M (BRC-S)` | 181 690 ₸ | 165 338 ₸ | 16 352 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png) | [Товар](https://tehnoholod369.kz/tproduct/602341374234-ballu-bhc-l15-s09-m-pult-brc-s) |
| 14 | Ballu Завеса тепловая BHC-L10-S06 (пульт BRC-S) · `BHC-L10-S06 (BRC-S)` | 144 990 ₸ | 131 941 ₸ | 13 049 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr12inv-r3.jpg) | [Товар](https://tehnoholod369.kz/tproduct/363930138874-ballu-bhc-l10-s06-pult-brc-s) |
| 15 | Ballu ONEAIR ASP-200S · `ASP-200S` | 327 590 ₸ | 298 107 ₸ | 29 483 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tz_1485658.jpg) | [Товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-200s) |
| 16 | Ballu ONEAIR ASP-80 · `ASP-80` | 114 990 ₸ | 104 641 ₸ | 10 349 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tz_1485649.jpg) | [Товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-80) |
| 17 | Ballu ONEAIR ASP-100 · `ASP-100` | 203 390 ₸ | 185 085 ₸ | 18 305 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-80.jpg) | [Товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-100) |
| 18 | Electrolux Водонагреватель EWH 100 Major LZR 3 · `EWH 100 Major LZR 3` | 209 034 ₸ | 190 221 ₸ | 18 813 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-100.jpg) | [Товар](https://tehnoholod369.kz/tproduct/680059508224-ewh-100-major-lzr-3) |
| 19 | Royal Thermo Очаг электрический Aurora RTFP/P-AR50LS · `RTFP/P-AR50LS` | 429 990 ₸ | 391 291 ₸ | 38 699 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/electrolux-ewh-100-major-lzr-3.jpg) | [Товар](https://tehnoholod369.kz/tproduct/579347838434-ochag-elektricheskii-royal-thermo-aurora) |
| 20 | Royal Thermo Очаг электрический RTFP/P1000M 3D Cassette Mystery · `RTFP/P1000M` | 599 990 ₸ | 545 991 ₸ | 53 999 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rtfp-p-ar50ls.jpg) | [Товар](https://tehnoholod369.kz/tproduct/275010969874-ochag-elektricheskii-royal-thermo-rtfpp1) |
| 21 | Firelight Биокамин BFP/P-3020 · `BFP/P-3020` | 399 990 ₸ | 363 991 ₸ | 35 999 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rtfp-p1000m.jpg) | [Товар](https://tehnoholod369.kz/tproduct/599405216204-biokamin-firelight-bfpp-3020) |
| 22 | Firelight Биокамин BFP/W-110 · `BFP/W-110` | 279 990 ₸ | 254 791 ₸ | 25 199 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/firelight-bfp-p-3020.jpg) | [Товар](https://tehnoholod369.kz/tproduct/693039877204-biokamin-firelight-bfpw-110) |
| 23 | Electrolux Панорамный очаг Sphere Plus EFP/P-3320RLS N · `EFP/P-3320RLS N` | 299 990 ₸ | 272 991 ₸ | 26 999 ₸ | [Фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/firelight-bfp-w-110.jpg) | [Товар](https://tehnoholod369.kz/tproduct/449475714854-panoramnii-ochag-sphere-plus-efpp-3320rl) |

**CSV для отдельной сверки:** [23 SKU, цена, −9%, фото, ссылка, HTTP статус и PIM-пометка](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-OWNER22-23-CARDS-LIVE-20261116.csv).

## 6. Отличия от утверждённого макета

1. Сохранена широкая пометка TEST, чтобы посетитель не принимал текущие цены/индикатор за рабочую акцию. В продакшене её не будет после отдельной приёмки.
2. Счётчик 4/9 не показан, поскольку не существует подтверждённого авторитетного реестра. Отображаемый номер 12 — owner-reported, а не API-верифицированный.
3. Товарный каталог теперь сверяется с публичным снимком PIM и сообщает о расхождениях, а не притворяется live-складом.
4. Отзывы Kaspi показываются с атрибуцией и оговоркой, без неподтверждённого количества отзывов/агрегированного рейтинга.
5. Форма в тесте имитирует принятие только как тестовое состояние с явной пометкой, реальный CRM POST отключён.
6. Мобильная закреплённая CTA автоматически размещается выше штатной панели Tilda и скрывается после блока акции.
7. Для одного комплекта нет уникального SKU, так что PIM не подтверждает состав комплекта как отдельный готовый товар.

## 7. Неподключённое до отдельного разрешения production

- **CRM E2E:** действующий приёмник подтверждён только через GET; настоящую отправку реальной заявки с проверкой CRM-номера не выполняли.
- **API групп:** нет серверного проверенного реестра участников группы №12 и подтверждённых 4/9, транзакционного закрытия и перевода в №13.
- **Финансовый STOP:** отсутствует подтверждённый ноябрьский общий оплаченный оборот, дисконтированный оборот и резервы; backend V2 не развернут с серверной авторизацией/замками.
- **Склад/цены:** нет обновлённых подтверждённых остатков поставщиков; FreshIN P7W — противоречие OWNER vs PIM. Для мультисплит-комплекта состав требует отдельной проверки.
- **GA4/UTM:** нет независимого сквозного подтверждения события после реально принятой заявки; production canonical/meta/indexing остаются HOLD.
- **Ссылки ASP-80/ASP-100/ASP-200S:** HTTP200 не доказывает, что JavaScript карточки покажет точный нужный SKU; нужна проверка по отрендеренной товарной странице.

## 8. Доказательства и итог

- Test Chrome 4/4 viewport: `evidence/T022-OWNER22-LIVE-READBACK-20261116.json`.
- 320 px sticky/Footer readback: `evidence/T022-CTA-FOOTER-READBACK-20261116.json`; CTA (771–835), штатная панель (843–900), нет перекрытия.
- Продукты 23/23 photos+links HTTP200: `evidence/T022-OWNER22-23-CARDS-STATUS-20261116.json`.
- Предыдущая интеграционная Chrome QA 166/166 PASS: `evidence/c7/qa-connect7.json`, чистый smoke TEST. Backend group/finance 37/37 PASS: `evidence/c7/test_group_core.log`.
- Основная production GET SHA256 (после TEST): `2788ec4d558336349886fc61fa1874fc5a593516ac8b292cfbf73fc86cb97aef`; без изменений.

**VERDICT:** тестовая вёрстка принята с замечаниями; опубликованный TEST на четырёх ширинах прошёл Chrome QA. Production publish /vmeste-deshevle по-прежнему **HOLD**, пока не появятся подтверждённые backend CRM, группа, финансовый лимит и настоящий атрибуционный E2E. Не трактовать STAGED_ONLY как подключённую боевую продажу.
