export type SmokeResponse = {
  ok: () => boolean;
  status: () => number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

export type SmokeRequestContext = {
  get: (url: string, options?: { timeout?: number }) => Promise<SmokeResponse>;
  post: (url: string, options?: { data?: unknown; timeout?: number }) => Promise<SmokeResponse>;
  patch: (url: string, options?: { data?: unknown }) => Promise<SmokeResponse>;
  delete: (url: string) => Promise<SmokeResponse>;
  fetch: (
    url: string,
    options?: { method?: string; headers?: Record<string, string> },
  ) => Promise<SmokeResponse>;
};

function wrapResponse(response: Response): SmokeResponse {
  return {
    ok: () => response.ok,
    status: () => response.status,
    json: () => response.json(),
    text: () => response.text(),
  };
}

function resolveUrl(baseURL: string, url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = baseURL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

export function createSmokeRequestContext(baseURL: string): SmokeRequestContext {
  const get = async (url: string, options?: { timeout?: number }): Promise<SmokeResponse> => {
    const controller = options?.timeout ? new AbortController() : undefined;
    const timeoutId =
      controller && options?.timeout
        ? setTimeout(() => controller.abort(), options.timeout)
        : undefined;
    try {
      const response = await fetch(resolveUrl(baseURL, url), {
        method: "GET",
        signal: controller?.signal,
      });
      return wrapResponse(response);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return {
    get,
    post: async (url, options) => {
      const response = await fetch(resolveUrl(baseURL, url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: options?.data === undefined ? undefined : JSON.stringify(options.data),
        signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined,
      });
      return wrapResponse(response);
    },
    patch: async (url, options) => {
      const response = await fetch(resolveUrl(baseURL, url), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: options?.data === undefined ? undefined : JSON.stringify(options.data),
      });
      return wrapResponse(response);
    },
    delete: async (url) => {
      const response = await fetch(resolveUrl(baseURL, url), { method: "DELETE" });
      return wrapResponse(response);
    },
    fetch: async (url, options) => {
      const response = await fetch(resolveUrl(baseURL, url), {
        method: options?.method ?? "GET",
        headers: options?.headers,
      });
      return wrapResponse(response);
    },
  };
}
