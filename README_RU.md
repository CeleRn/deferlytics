# Deferlytics

[English](README.md) | [Русский](README_RU.md)

Легкий загрузчик аналитики для GA4 и Яндекс.Метрики, который помогает не тащить тяжелые скрипты в критический путь загрузки страницы.

Deferlytics запускает маленький bootstrap-скрипт как можно раньше, складывает явно отправленные события в очередь, откладывает загрузку аналитики, а затем проигрывает накопленные события через нативные API GA4 и Яндекс.Метрики. Перед загрузкой библиотека проверяет, разрешил ли пользователь аналитические cookies, не является ли посетитель ботом или Lighthouse, и какую стратегию загрузки выбрал сайт.

Библиотека не пытается повторить внутреннюю логику GA4 или Яндекс.Метрики. Автоматический сбор данных самими сервисами начинается только после загрузки их скриптов. До этого момента сохраняются только события, которые сайт явно отправил через Deferlytics.

## Зачем

Скрипты аналитики полезны, но часто загружаются слишком рано. Они могут конкурировать с отрисовкой страницы, гидрацией, первым взаимодействием пользователя и Core Web Vitals.

Deferlytics оставляет ранний путь страницы коротким:

```txt
tiny bootstrap
  -> event queue
  -> delayed loader
  -> vendor loading
  -> vendor init
  -> native replay
  -> live dispatch
```

Bootstrap сохраняет только явные вызовы вроде `page()` и `track()`. GA4 и Яндекс.Метрика подключаются позже, когда это уже не мешает начальной загрузке.

## Установка

```bash
npm install deferlytics
```

## Использование в браузере

Подключите bootstrap как можно раньше в `<head>`, настройте аналитику и затем загрузите runtime-скрипт с `defer`.

```html
<script src="/node_modules/deferlytics/dist/bootstrap.iife.js"></script>
<script>
  fastAnalytics.init({
    loadStrategy: "idle",
    skipBots: true,
    skipLighthouse: true,
    consent: {
      required: false,
      defaultStatus: "granted"
    },
    vendors: {
      ga4: {
        enabled: true,
        measurementId: "G-XXXXXXX",
        sendPageView: false
      },
      yandexMetrica: {
        enabled: true,
        counterId: 12345678,
        webvisor: false,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        defer: true
      }
    }
  });

  fastAnalytics.page();
  fastAnalytics.track("hero_cta_click", { placement: "hero" });
</script>
<script defer src="/node_modules/deferlytics/dist/loader.iife.js"></script>
```

Пока `loader.iife.js` не запущен, вызовы попадают в `window.__fastAnalyticsQueue`. Когда сервисы аналитики готовы, очередь проигрывается один раз, а новые события начинают отправляться сразу.

## Использование через ESM

```ts
import { init, page, track } from "deferlytics";

init({
  loadStrategy: "idle",
  vendors: {
    ga4: {
      enabled: true,
      measurementId: "G-XXXXXXX",
    },
  },
});

page();
track("signup_click", { plan: "pro" });
```

ESM entrypoint безопасен при импорте: runtime начинает работу только после вызова API-методов.

## API

```ts
fastAnalytics.init(config);
fastAnalytics.page(params);
fastAnalytics.track(eventName, params);
fastAnalytics.identify(userId, traits);
fastAnalytics.consent(status);
fastAnalytics.flush();
fastAnalytics.loadVendors();
```

Те же методы доступны как ESM-экспорты:

```ts
import {
  init,
  page,
  track,
  identify,
  consent,
  flush,
  loadVendors,
} from "deferlytics";
```

## Конфигурация

```ts
fastAnalytics.init({
  debug: false,
  loadStrategy: "idle",
  loadTimeout: 3000,
  skipBots: true,
  skipLighthouse: true,
  maxQueueSize: 100,
  consent: {
    required: false,
    defaultStatus: "granted"
  },
  vendors: {
    ga4: {
      enabled: true,
      measurementId: "G-XXXXXXX",
      sendPageView: false
    },
    yandexMetrica: {
      enabled: true,
      counterId: 12345678,
      webvisor: false,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      defer: true
    }
  }
});
```

## Стратегии загрузки

- `immediate`: загрузить аналитику сразу после инициализации runtime.
- `load`: загрузить после события `window.load`.
- `idle`: загрузить через `requestIdleCallback`, с fallback по таймауту.
- `interaction`: загрузить после первого взаимодействия пользователя.
- `timeout`: загрузить после `loadTimeout`.
- `manual`: загружать только после явного вызова `loadVendors()`.

Ручная загрузка:

```js
fastAnalytics.init({
  loadStrategy: "manual",
  vendors: {
    ga4: { enabled: true, measurementId: "G-XXXXXXX" }
  }
});

fastAnalytics.track("early_event");
fastAnalytics.loadVendors();
```

## Согласие пользователя

```js
fastAnalytics.init({
  consent: {
    required: true,
    defaultStatus: "pending"
  },
  vendors: {
    ga4: { enabled: true, measurementId: "G-XXXXXXX" }
  }
});

fastAnalytics.track("lead_form_open");

// Вызовите после того, как пользователь разрешил аналитические cookies.
fastAnalytics.consent("granted");
```

Если согласие `denied`, либо согласие обязательно и еще находится в состоянии `pending`, скрипты аналитики не загружаются. Очередь при этом продолжает принимать явно отправленные события. Если пользователь дал согласие еще до запуска loader, это раннее событие используется как начальное состояние runtime.

## Пропуск ботов и Lighthouse

По умолчанию Deferlytics не загружает аналитику для распространенных ботов, Lighthouse, PageSpeed, headless-браузеров и окружений с `navigator.webdriver`:

```js
fastAnalytics.init({
  skipBots: true,
  skipLighthouse: true
});
```

Если аналитика пропущена, очередь может продолжать принимать события, но GA4 и Яндекс.Метрика не загружаются.

## Как события отправляются в сервисы аналитики

GA4:

- `page()` -> `gtag("event", "page_view", ...)`
- `track(name, params)` -> `gtag("event", name, params)`
- `identify(userId, traits)` -> `gtag("set", "user_id", userId)`

Яндекс.Метрика:

- `page()` -> `ym(counterId, "hit", url, ...)`
- `track(name, params)` -> `ym(counterId, "reachGoal", name, params)`
- `identify(userId, traits)` -> `ym(counterId, "userParams", traits)`

Если скрипт аналитики уже есть на странице, Deferlytics переиспользует его и не добавляет второй такой же `<script>`.

## Vanilla-примеры

См. [examples/vanilla](examples/vanilla).

Сценарии:

- [Basic idle loading](examples/vanilla/basic-idle.html): очередь bootstrap, загрузка в idle, replay и live events.
- [Manual loading with consent](examples/vanilla/manual-consent.html): ожидание согласия, ручная загрузка и replay очереди.
- [Reusing an existing vendor script](examples/vanilla/existing-vendor.html): GA4 уже есть на странице, Deferlytics не добавляет дубликат.

## Пример для Next.js

См. [examples/nextjs/README.md](examples/nextjs/README.md).

Для SPA-навигации вызывайте `page()` при смене route. Deferlytics не отслеживает переходы внутри фреймворка автоматически.

## Рекомендации по производительности

- Подключайте `bootstrap.iife.js` рано, но держите inline config маленьким.
- Для production-страниц используйте `idle`, `interaction`, `timeout` или `manual`, а не `immediate`.
- Для GA4 оставляйте `sendPageView: false` и вызывайте `page()` явно.
- До загрузки аналитики отслеживайте только действительно важные ранние бизнес-события.
- Не добавляйте тяжелую логику в bootstrap-слой.
- По возможности не блокируйте отрисовку страницы проверками согласия.

## Ограничения

- Deferlytics буферизует явно отправленные события, а не все автоматические события GA4 или Яндекс.Метрики.
- Автоматический сбор данных сервисами аналитики начинается только после загрузки их скриптов.
- В SPA переходы между страницами нужно отправлять через `page()` вручную.
- Scroll, click, visibility и performance plugins пока не входят в MVP runtime.
- Deferlytics это слой маршрутизации и replay событий, а не замена аналитическому backend.

## Разработка

```bash
npm install
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

В npm-пакет публикуются:

```txt
dist/
examples/
README.md
README_RU.md
LICENSE
package.json
```
