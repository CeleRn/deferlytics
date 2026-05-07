import { getBrowserWindow } from "./utils";

const pendingScripts = new Map<string, Promise<void>>();

export interface LoadScriptOptions {
  id?: string;
}

export function loadScript(src: string, options: LoadScriptOptions = {}): Promise<void> {
  const win = getBrowserWindow();
  if (!win) {
    return Promise.resolve();
  }

  const key = options.id ?? src;
  const existingPromise = pendingScripts.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  const existing = findExistingScript(win.document, src, options.id);
  if (existing) {
    return Promise.resolve();
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = win.document.createElement("script");
    script.async = true;
    script.src = src;

    if (options.id) {
      script.id = options.id;
    }

    script.addEventListener(
      "load",
      () => {
        script.dataset.deferlyticsLoaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        pendingScripts.delete(key);
        reject(new Error(`Failed to load script: ${src}`));
      },
      { once: true },
    );

    win.document.head.appendChild(script);
  });

  pendingScripts.set(key, promise);
  return promise;
}

function findExistingScript(
  documentRef: Document,
  src: string,
  id?: string,
): HTMLScriptElement | null {
  if (id) {
    const byId = documentRef.getElementById(id);
    if (byId instanceof HTMLScriptElement) {
      return byId;
    }
  }

  return documentRef.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}
