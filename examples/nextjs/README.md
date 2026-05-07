# Next.js Example

Use the bootstrap before the page becomes interactive and load `loader.iife.js` after the client is ready.

```tsx
import Script from "next/script";

export function AnalyticsScripts() {
  return (
    <>
      <Script src="/deferlytics/bootstrap.iife.js" strategy="beforeInteractive" />
      <Script id="deferlytics-config" strategy="beforeInteractive">
        {`
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
              }
            }
          });

          fastAnalytics.page();
        `}
      </Script>
      <Script src="/deferlytics/loader.iife.js" strategy="afterInteractive" />
    </>
  );
}
```

For App Router navigation, call `page()` from a client component when the pathname changes:

```tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.fastAnalytics?.page({
      path: pathname,
      search: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  return null;
}
```

For consent banners, initialize with pending consent:

```js
fastAnalytics.init({
  loadStrategy: "manual",
  consent: {
    required: true,
    defaultStatus: "pending"
  },
  vendors: {
    ga4: { enabled: true, measurementId: "G-XXXXXXX" }
  }
});
```

After the user grants analytics consent:

```js
window.fastAnalytics?.consent("granted");
window.fastAnalytics?.loadVendors();
```
