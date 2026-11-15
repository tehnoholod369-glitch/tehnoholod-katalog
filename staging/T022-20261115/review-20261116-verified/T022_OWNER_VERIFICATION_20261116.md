# T-022 · проверка тестовой страницы 16.11.2026

ТЕСТ: https://tehnoholod369.kz/vmeste-deshevle-t022-test-20261115

R5 размещён в Tilda с фиксом шапки на 320px. TEST/noindex сохраняется. Production /vmeste-deshevle: HOLD.

## Скриншоты реальной тестовой Tilda (весь лист)
- [320 px](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-v2-320-full.png)
- [768 px](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-v2-768-full.png)
- [1024 px](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-v2-1024-full.png)
- [1440 px](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/review-20261116-verified/T022-v2-1440-full.png)

## Контроль адаптивной верстки
| px | inner | document | purple saving | FAQ min | CTA bottom |
|---:|---:|---:|---|---:|---:|
|320|320|320|True|44px|642px|
|390|390|390|True|44px|541px|
|768|768|768|True|44px|732px|
|1024|1024|1009|True|44px|712px|
|1440|1440|1425|True|44px|810px|

Пункты 1-10: фиолетовая сумма, группа без разрывов, неперекрывающая плашка, мобильная шапка/CTA, резерв под низ сайта, NBSP и SKU, цели нажатия, скрытые скроллбары, +7 формат телефона/полная модель, фиолетовые шаги — выполнены в тестовой R5. Наличие настоящей нижней панели сайта не доказано; QA с её имитацией. Дополнительно Tilda шапка принудительно переносит иконки избранного/сравнения/корзины на 320px (не обрезает их).

## Подробные условия, пример расчёта, 8 FAQ
# T-022 · полный текст из отрисованной страницы out/index.html (16.11.2026, Chrome, 1440px; панели раскрыты скриптом)
# Неразрывные пробелы заменены обычными только для чтения. Числа подставлены скриптом из данных (фикстура 15.11.2026).

## ПАНЕЛИ «Условия участия» (2)

### Панель 1: Подробные условия
Штуки считаются по всей группе, из любых товаров акции. Каждый берёт столько, сколько нужно, хоть одну штуку.
Когда группа набирает 9 штук, она закрывается. Цена для всех участников — со скидкой 9 %.
Скидка считается от цены на сайте, наценки сверху нет. Если цена на сайте вырастет, группа считает по прежней.
Оплата и поставка — после набора группы и подтверждения менеджера.

### Панель 2: Пример расчёта
TCL FreshIN 3.0 (белый) TAC-FR09HSV/P7W, цена на сайте 323 942 ₸ с НДС.

Цена в группе, −9 %
294 787 ₸
экономия 29 155 ₸

## FAQ (8 вопросов)

### 1. Нужно ли платить при вступлении в группу?
Нет. Сначала согласовываются состав заказа, итоговая стоимость и условия. Оплата — после набора группы и подтверждения менеджера.

### 2. Нужно ли купить 9 штук, чтобы получить скидку 9 %?
Нет. Штуки считаются по всей группе, из любых товаров акции. Каждый берёт столько, сколько ему нужно, хоть одну штуку.

### 3. Что если группа набирается долго?
Заявка остаётся в группе, платить до набора не нужно. Подтверждённому участнику товар бронируем до закрытия группы.

### 4. Можно ли вступить в группу в любой день?
Да. Набор идёт постоянно, вступить можно в любой день. Когда группа набирает 9 штук, открывается следующая.

### 5. Есть ли наценка сверху?
Нет. Скидка считается от цены на сайте. Если цена на сайте вырастет, группа считает по прежней.

### 6. Что если товар закончится?
Подберём альтернативу или дождёмся поступления. Цену для вас зафиксируем.

### 7. Монтаж входит в групповую цену?
Нет. Оборудование и монтаж рассчитываются отдельно. Гарантия на монтаж — 12 месяцев, на оборудование — по паспорту изделия.

### 8. Нас много: жильцы дома, ЖК или офис. Как быть?
Напишите нам в WhatsApp: посчитаем цену на всю группу. Монтаж согласуем одной бригадой или несколькими, по числу заявок. Документы — по запросу.


## 23 карточки: проверка изображения, цены, −9 % и ссылки

Источник цен/товаров — демонстрационная фикстура 15 ноября, актуальные PIM/остатки не проверены. 403 — блокировка автозапроса, а не доказанный битый товар. Фото 23/23 HTTP200; формула 23/23; страницы 19 HTTP200 и 4 HTTP403.

| № | Товар | Цена с НДС | Скидка −9% | Фото | Ссылка | HTTP |
|---:|---|---:|---:|---|---|---|
|1|TCL FreshIN 3.0 (белый) TAC-FR09HSV/P7W|323 942 ₸|294 787 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/freshin-plus-white-6.jpg)|[товар](https://tehnoholod369.kz/tproduct/649355257894-konditsioner-tcl-freshin-30-belii-tac-fr)|200|
|2|TCL FreshIN 3.0 (белый) TAC-FR12HSV/P7W|340 992 ₸|310 303 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/freshin-plus-white-6.jpg)|[товар](https://tehnoholod369.kz/tproduct/350950348204-konditsioner-tcl-freshin-30-belii-tac-fr)|200|
|3|TCL FreshIN 3.0 (серебро) TAC-FR09HSV/P7S|340 992 ₸|310 303 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg)|[товар](https://tehnoholod369.kz/tproduct/938910378214-konditsioner-tcl-freshin-30-serebro-tac)|200|
|4|TCL FreshIN 3.0 (серебро) TAC-FR12HSV/P7S|375 092 ₸|341 334 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg)|[товар](https://tehnoholod369.kz/tproduct/506426247284-konditsioner-tcl-freshin-30-serebro-tac)|200|
|5|TCL FreshIN 3.0 (серебро) TAC-FR18HSV/P7S|409 192 ₸|372 365 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr09hsv-p7s.jpg)|[товар](https://tehnoholod369.kz/tproduct/992907639604-konditsioner-tcl-freshin-30-serebro-tac)|error|
|6|TCL FreshIN 3.0 (чёрный) TAC-FR10HSV/P7B|340 992 ₸|310 303 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png)|[товар](https://tehnoholod369.kz/tproduct/401535714334-konditsioner-tcl-freshin-30-chyornii-tac)|200|
|7|TCL FreshIN 3.0 (чёрный) TAC-FR13HSV/P7B|383 617 ₸|349 091 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png)|[товар](https://tehnoholod369.kz/tproduct/964967300964-konditsioner-tcl-freshin-30-chyornii-tac)|error|
|8|TCL FreshIN 3.0 (чёрный) TAC-FR18HSV/P7B|426 242 ₸|387 880 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr10hsv-p7b.png)|[товар](https://tehnoholod369.kz/tproduct/474881833054-konditsioner-tcl-freshin-30-chyornii-tac)|200|
|9|TCL FreshIN 3.0 (серебро 2025) TAC-FR12INV/R3|340 766 ₸|310 097 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tcl-tac-fr12inv-r3.jpg)|[товар](https://tehnoholod369.kz/tproduct/118900810324-konditsioner-tcl-freshin-30-serebro-2025)|200|
|10|Royal Clima GLORIA Inverter RCI-GLE35HN|203 500 ₸|185 185 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/rci-gle22hn.jpg)|[товар](https://tehnoholod369.kz/tproduct/783965063854-konditsioner-royal-clima-gloria-inverter)|error|
|11|Ballu Free Match: мультисплит на 2 комнаты|567 970 ₸|516 853 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-ba2oi-fm-out-18hn8-eu.jpg)|[товар](https://tehnoholod369.kz/multisplit-komplekty-almaty)|200|
|12|Royal Thermo Водонагреватель RWH 80 Optimal|71 750 ₸|65 293 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rwh-80-optimal.jpg)|[товар](https://tehnoholod369.kz/tproduct/348776780514-rwh-80-optimal)|200|
|13|Ballu Завеса тепловая BHC-L15-S09-M (пульт BRC-S)|181 690 ₸|165 338 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tz_1485658.jpg)|[товар](https://tehnoholod369.kz/tproduct/602341374234-ballu-bhc-l15-s09-m-pult-brc-s)|200|
|14|Ballu Завеса тепловая BHC-L10-S06 (пульт BRC-S)|144 990 ₸|131 941 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/tz_1485649.jpg)|[товар](https://tehnoholod369.kz/tproduct/363930138874-ballu-bhc-l10-s06-pult-brc-s)|200|
|15|Ballu ONEAIR ASP-200S|327 590 ₸|298 107 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-200s.jpg)|[товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-200s)|200|
|16|Ballu ONEAIR ASP-80|114 990 ₸|104 641 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-80.jpg)|[товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-80)|200|
|17|Ballu ONEAIR ASP-100|203 390 ₸|185 085 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/ballu-oneair-asp-100.jpg)|[товар](https://tehnoholod369.kz/tovar?g=ventilyaciya&sl=ballu-asp-100)|200|
|18|Electrolux Водонагреватель EWH 100 Major LZR 3|209 034 ₸|190 221 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/electrolux-ewh-100-major-lzr-3.jpg)|[товар](https://tehnoholod369.kz/tproduct/680059508224-ewh-100-major-lzr-3)|200|
|19|Royal Thermo Очаг электрический Aurora RTFP/P-AR50LS|429 990 ₸|391 291 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rtfp-p-ar50ls.jpg)|[товар](https://tehnoholod369.kz/tproduct/579347838434-ochag-elektricheskii-royal-thermo-aurora)|error|
|20|Royal Thermo Очаг электрический RTFP/P1000M 3D Cassette Mystery|599 990 ₸|545 991 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/royal-thermo-rtfp-p1000m.jpg)|[товар](https://tehnoholod369.kz/tproduct/275010969874-ochag-elektricheskii-royal-thermo-rtfpp1)|200|
|21|Firelight Биокамин BFP/P-3020|399 990 ₸|363 991 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/firelight-bfp-p-3020.jpg)|[товар](https://tehnoholod369.kz/tproduct/599405216204-biokamin-firelight-bfpp-3020)|200|
|22|Firelight Биокамин BFP/W-110|279 990 ₸|254 791 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/firelight-bfp-w-110.jpg)|[товар](https://tehnoholod369.kz/tproduct/693039877204-biokamin-firelight-bfpw-110)|200|
|23|Electrolux Панорамный очаг Sphere Plus EFP/P-3320RLS N|299 990 ₸|272 991 ₸|[фото](https://raw.githubusercontent.com/tehnoholod369-glitch/tehnoholod-katalog/t022-preview-20261115/staging/T022-20261115/assets/electrolux-panoramnyy-ochag-sphere-plus-efp-p-3320rls-n-diagonal-33-dy.jpg)|[товар](https://tehnoholod369.kz/tproduct/449475714854-panoramnii-ochag-sphere-plus-efpp-3320rl)|200|

## Отличия от утверждённого макета
- Media queries вместо container; работающий JS вместо демонстрационных радиокнопок.
- Реальная HTML-валидация формы, но submitUrl пуст: реальные данные не отправляются.
- Фильтры/каталог рендерятся JS из фиксированного 23 SKU снапшота; данные не являются live PIM.
- CTA фиксируется с резервом/детектором нижней панели, проверен симуляцией.
- Дополнительная тестовая коррекция глобальной шапки Tilda под 320px.
- Изолированные CSS стили, улучшенный контраст; маркировка TEST/noindex сохраняется.
- Логотип исходник не поставлен: текстовый дубль на телефоне скрыт.

## Что не подключено и запрещает production
1. Реальная форма заявок в действующей механике с согласием и проверенным финальным лидом.
2. Подтверждённый API групп и 9/9 переходы: 4/9 группы №12 пока только фикстура.
3. Источник динамического каталога, свежая цена с НДС, остатки/совместимость, особенно белый FreshIN P7W отмеченный отсутствующим; отдельные правильные фотографии.
4. Настоящие отзывы Kaspi; сейчас заглушка.
5. Снятие TEST/noindex и canonical на основную страницу — только отдельный OWNER APPROVE.
6. Подтверждённая GA4/UTM/SEO/счётчик и события при настоящих заявках.
7. Финансовый STOP при превышении 20% оплаченной месячной выручки со скидкой не реализован. Требуется атомарно сверять (сумма оплаченной скидочной выручки + планируемый скидочный платёж)/(вся оплаченная выручка + этот платёж) <=0.20 с учётом обязательств групп; при отсутствии надёжных данных STOP.
8. Полный тест реальной нижней панели звонок/WhatsApp и релевантность 23 карточек/наличие.

## Основная страница
Ни одно изменение или публикация на /vmeste-deshevle в этом цикле не выполнялись. Доступный baseline HTTP200 SHA256 2788ec4d558336349886fc61fa1874fc5a593516ac8b292cfbf73fc86cb97aef; последующий тест чтения иногда получал 410 блокировки — строгий до/после hash MATCH не доказан.

ИТОГ: TEST R5 QA PASS по пяти ширинам, production HOLD. T-022 — На проверке.