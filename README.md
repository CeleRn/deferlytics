# Deferlytics

[English](README.md) | [Русский](README_RU.md)

Performance-first delayed analytics bootstrapper for GA4 and Yandex Metrica.

Deferlytics starts with a tiny browser bootstrap, buffers explicit analytics events, delays heavy vendor scripts, then replays queued events through native vendor APIs after consent, bot checks and the selected load strategy allow loading.

It does not emulate GA4 or Yandex Metrica internals. Native vendor automatic tracking starts only after vendors load. Events before that moment are captured only if they are explicitly sent through Deferlytics.

## Why

Analytics scripts are useful, but they are often loaded in the critical path. That can compete with rendering, hydration, user interaction and Core Web Vitals.

Deferlytics keeps the early page path small:

```txt
tiny bootstrap
  -> event queue
  -> delayed loader
  -> vendor loading
  -> vendor init
  -> native replay
  -> live dispatch
```

The bootstrap captures only explicit calls such as `page()` and `track()`. GA4 and Yandex Metrica are loaded later, outside the critical path.

## Install

```bash
npm install deferlytics
```

## Browser Usage

Put the bootstrap as early as possible in `<head>`, configure analytics, then load the runtime later.

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

Before `loader.iife.js` runs, calls are written to `window.__fastAnalyticsQueue`. After vendors are ready, queued events are replayed once and future calls are dispatched live.

## ESM Usage

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

The ESM entrypoint is browser-safe on import. Runtime work starts when API methods are called.

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

The same methods are exported from the ESM entrypoint:

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

## Config

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

## Load Strategies

- `immediate`: load vendors as soon as runtime initializes.
- `load`: load after the `window.load` event.
- `idle`: load during `requestIdleCallback`, with a timeout fallback.
- `interaction`: load after the first user interaction.
- `timeout`: load after `loadTimeout`.
- `manual`: load only when `loadVendors()` is called.

Manual loading:

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

// Call this after the user grants analytics consent.
fastAnalytics.consent("granted");
```

When consent is `denied` or required and still `pending`, vendor scripts are not loaded. The queue can continue accepting explicit events. If consent is granted before the loader starts, that early consent event is used as the initial runtime consent state.

## Bot and Lighthouse Skip

By default, Deferlytics skips vendor loading for common bots, Lighthouse, PageSpeed, headless and webdriver-like environments:

```js
fastAnalytics.init({
  skipBots: true,
  skipLighthouse: true
});
```

When analytics are skipped, the queue can still accept events, but GA4 and Yandex Metrica scripts are not loaded.

## Vendor Mapping

GA4:

- `page()` -> `gtag("event", "page_view", ...)`
- `track(name, params)` -> `gtag("event", name, params)`
- `identify(userId, traits)` -> `gtag("set", "user_id", userId)`

Yandex Metrica:

- `page()` -> `ym(counterId, "hit", url, ...)`
- `track(name, params)` -> `ym(counterId, "reachGoal", name, params)`
- `identify(userId, traits)` -> `ym(counterId, "userParams", traits)`

If a vendor script is already present on the page, Deferlytics reuses it instead of adding a duplicate script tag.

## Vanilla Examples

See [examples/vanilla](examples/vanilla).

Available scenarios:

- [Basic idle loading](examples/vanilla/basic-idle.html): bootstrap queue, idle loading, replay and live events.
- [Manual loading with consent](examples/vanilla/manual-consent.html): pending consent, manual loading and queue replay.
- [Reusing an existing vendor script](examples/vanilla/existing-vendor.html): GA4 already exists on the page, Deferlytics avoids duplicate script tags.

## Next.js Example

See [examples/nextjs/README.md](examples/nextjs/README.md).

For SPA navigation, call `page()` on route changes. Deferlytics does not infer framework route transitions automatically.

## Performance Recommendations

- Put `bootstrap.iife.js` early, but keep the inline config small.
- Use `idle`, `interaction`, `timeout` or `manual` instead of `immediate` for production pages.
- Keep `sendPageView: false` for GA4 and call `page()` explicitly.
- Track only business-critical early events before vendors load.
- Avoid adding heavy custom plugins to the bootstrap layer.
- Keep consent checks outside the critical rendering path when possible.

## Limitations

- Deferlytics buffers explicit events, not every native vendor automatic event.
- Vendor automatic tracking starts only when the vendor script loads.
- SPA route changes should call `page()` manually.
- Scroll, click, visibility and performance plugins are not included in the MVP runtime yet.
- Deferlytics is a routing and replay layer, not a replacement analytics backend.

## Development

```bash
npm install
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

The package publishes only:

```txt
dist/
README.md
LICENSE
package.json
```
