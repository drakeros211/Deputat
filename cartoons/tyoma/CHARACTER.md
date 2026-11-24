# Тёма — главный рассказчик

## Профиль TikTok (от лица Тёмы)
- **Имя в профиле:** Тёма | Истории
- **Ник (варианты):** `@tyoma.rasskazhet` · `@tyoma_istorii` · `@tyoma.govorit` · `@tyoma7etazh`
- **Аватарка:** `png/avatar_blogger.png` (как выглядит в круге: `png/avatar_blogger_circle.png`, макет профиля: `png/profile_mockup.png`)
- **Био:**
  ```
  Привет, я Тёма 👋 14 лет, панелька, 7 этаж
  Рассказываю истории: смешные, жизненные,
  странные и немного страшные 🎧
  Пиши в комменты — о чём рассказать дальше 👇
  ```
- **Начало каждого ролика:** «Йоу, это Тёма. Короче, слушай…»
- **Конец каждого ролика:** «Пиши в комменты, о чём рассказать дальше. Пока!»

Тёма рассказывает истории на любую тему, жанр задаётся в каждом выпуске:
смешная, жизненная, школьная, страшная, фантастика, мистика и т.д.

## Паспорт персонажа
- **Имя:** Артём, все зовут Тёма. 14 лет, 8 класс.
- **Живёт:** 9-этажная панелька на окраине, 7 этаж, квартира 47. Мама работает посменно медсестрой, папы нет. Часто ночью дома один.
- **Внешность:** худой, растрёпанные тёмно-каштановые волосы с торчащим вихром на макушке, карие глаза, пластырь на правой щеке (каждую серию на месте — фирменная деталь).
- **Одежда (всегда одна и та же):** зелёная худи с капюшоном и светлыми шнурками, большие тёмно-серые наушники с оранжевыми точками висят на шее, синие джинсы, белые кроссовки с тремя красными полосками.
- **Предмет:** телефон, на который он всё снимает → в кадре интерфейс записи `● REC 03:03 НОЧЬ`.
- **Характер:** любопытный, упрямый, шутит, когда страшно. Сначала делает — потом думает.
- **Голос:** подростковый, живой, короткие фразы, немного сарказма.
- **Коронные фразы:**
  - «Короче. Это было в 03:03.»
  - «Да ладно, что может пойти не так?»
  - «Вот тут я и понял, что зря.»
  - Финал серии: «Если досмотрел — значит, ты тоже не спишь.»

## Палитра
| Элемент | Цвет |
|---|---|
| Кожа / тень | `#f0c39b` / `#d79f78` |
| Волосы | `#2a211d` |
| Худи / тень | `#3f7d68` / `#2c5b4c` |
| Шнурки | `#e8e2d0` |
| Наушники / акцент | `#3a3d45` / `#f08a3c` |
| Джинсы | `#3c5a8c` |
| Кроссовки / полоски | `#f2f0ea` / `#c8343a` |
| Контур | `#1d1a1c` |

## Файлы
- `png/avatar.png` — аватарка 1024×1024 (для профиля TikTok).
- `png/emotions.png` — 6 эмоций: спокоен, ухмылка, страх, шок, устал, злится.
- `png/fullbody.png` — персонаж в полный рост.
- `png/palette.png` — палитра.
- `gen.py` + `render.js` — исходники (векторные SVG, правятся и перерисовываются: `python3 gen.py && node render.js`).

## Промпты для генераторов картинок
Базовое описание персонажа (вставлять в каждый промпт без изменений — так он будет одинаковым в разных кадрах):

```
14-year-old skinny boy Tyoma, messy dark brown hair with a cowlick sticking up on top,
big round brown eyes, a beige band-aid on his right cheek, green hoodie with hood and
cream drawstrings, large dark grey headphones with orange dots around his neck,
blue jeans, white sneakers with three red stripes
```

Стиль (добавлять в конец каждого промпта):

```
flat 2D vector cartoon, clean thin dark outlines, simple shapes, soft gradients,
subtle grain texture, muted desaturated palette, moody dim lighting, Russian
post-soviet setting, vertical 9:16, horror story animation style --ar 9:16
```

Негативный промпт: `3d, realistic, photo, anime, chibi, extra fingers, text, watermark`

Примеры сцен:
1. `[персонаж] standing in a dark Soviet apartment stairwell at night, green painted lower walls, whitewashed upper walls, flickering ceiling lamp, scared expression, holding a phone with flashlight on, [стиль]`
2. `[персонаж] looking through the peephole of a padded brown apartment door, back view, dim hallway light, [стиль]`
3. `close-up of [персонаж] face lit by phone screen in dark bedroom, shocked expression, sweat drop, [стиль]`
4. `[персонаж] inside an old elevator with burnt buttons, floor number display shows 13, nervous expression, [стиль]`
