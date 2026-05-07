# Deferlytics

[English](README.md) | [Русский](README_RU.md)

Performance-first bootstrapper для отложенной загрузки GA4 и Яндекс.Метрики.

Deferlytics запускается через маленький browser bootstrap, буферизует явно отправленные analytics events, откладывает загрузку тяжелых vendor scripts, а затем проигрывает накопленную очередь через нативные API vendors после проверки consent, bots и выбранной стратегии загрузки.

Библиотека не эмулирует внутреннюю работу GA4 или Яндекс.Метрики. Нативный automatic tracking vendors начинается только после загрузки vendor scripts. События до этого момента сохраняются только если сайт явно отправил их через Deferlytics.

## Зачем

Analytics scripts полезны, но часто попадают в critical path. Они могут конкурировать с rendering, hydration, user interaction и Core Web Vitals.

Deferlytics оставляет ранний путь страницы маленьким:

```txt
tiny bootstrap
  -> event queue
  -> delayed loader
  -> vendor loading
  -> vendor init
  -> native replay
  -> live dispatch
```

Bootstrap сохраняет только явные вызовы вроде `page()` и `track()`. GA4 и Яндекс.Метрика загружаются позже, вне critical path.

## Установка

```bash
npm install deferlytics
```

## Использование в браузере

Подключите bootstrap как можно раньше в `<head>`, настройте аналитику и загрузите runtime позже.

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

До запуска `loader.iife.js` вызовы записываются в `window.__fastAnalyticsQueue`. После готовности vendors очередь проигрывается один раз, а новые события отправляются live.

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

ESM entrypoint безопасен для browser-only сценариев: работа runtime начинается при вызове API methods.

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

Те же методы экспортируются из ESM entrypoint:

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

- `immediate`: загрузить vendors сразу после инициализации runtime.
- `load`: загрузить после события `window.load`.
- `idle`: загрузить через `requestIdleCallback`, с fallback по timeout.
- `interaction`: загрузить после первого взаимодействия пользователя.
- `timeout`: загрузить после `loadTimeout`.
- `manual`: загружать только после вызова `loadVendors()`.

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

## Consent

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

// Вызвать после согласия пользователя на analytics cookies.
fastAnalytics.consent("granted");
```

Когда consent равен `denied` или требуется consent и он еще `pending`, vendor scripts не загружаются. Очередь при этом продолжает принимать explicit events. Если consent был выдан до запуска loader, раннее consent-событие используется как initial runtime consent state.

## Bot и Lighthouse Skip

По умолчанию Deferlytics пропускает загрузку vendors для common bots, Lighthouse, PageSpeed, headless и webdriver-like окружений:

```js
fastAnalytics.init({
  skipBots: true,
  skipLighthouse: true
});
```

Если analytics skipped, очередь может принимать события, но GA4 и Яндекс.Метрика не загружаются.

## Vendor Mapping

GA4:

- `page()` -> `gtag("event", "page_view", ...)`
- `track(name, params)` -> `gtag("event", name, params)`
- `identify(userId, traits)` -> `gtag("set", "user_id", userId)`

Яндекс.Метрика:

- `page()` -> `ym(counterId, "hit", url, ...)`
- `track(name, params)` -> `ym(counterId, "reachGoal", name, params)`
- `identify(userId, traits)` -> `ym(counterId, "userParams", traits)`

Если vendor script уже есть на странице, Deferlytics переиспользует его и не добавляет duplicate script tag.

## Vanilla Examples

См. [examples/vanilla](examples/vanilla).

Сценарии:

- [Basic idle loading](examples/vanilla/basic-idle.html): bootstrap queue, idle loading, replay и live events.
- [Manual loading with consent](examples/vanilla/manual-consent.html): pending consent, manual loading и queue replay.
- [Reusing an existing vendor script](examples/vanilla/existing-vendor.html): GA4 уже есть на странице, Deferlytics не добавляет duplicate script tag.

## Next.js Example

См. [examples/nextjs/README.md](examples/nextjs/README.md).

Для SPA navigation вызывайте `page()` при смене route. Deferlytics не определяет route transitions фреймворка автоматически.

## Performance Recommendations

- Подключайте `bootstrap.iife.js` рано, но держите inline config маленьким.
- Для production страниц используйте `idle`, `interaction`, `timeout` или `manual`, а не `immediate`.
- Для GA4 оставляйте `sendPageView: false` и вызывайте `page()` явно.
- До загрузки vendors отслеживайте только business-critical early events.
- Не добавляйте тяжелые custom plugins в bootstrap layer.
- По возможности держите consent checks вне critical rendering path.

## Ограничения

- Deferlytics буферизует explicit events, а не все native vendor automatic events.
- Vendor automatic tracking начинается только после загрузки vendor script.
- SPA route changes нужно отправлять через `page()` вручную.
- Scroll, click, visibility и performance plugins пока не входят в MVP runtime.
- Deferlytics это routing/replay layer, а не замена analytics backend.

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
LICENSE
package.json
```
