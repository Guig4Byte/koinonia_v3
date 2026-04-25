import nextPwa from "next-pwa";
import defaultCache from "next-pwa/cache.js";

const apiRuntimeCaching = {
  urlPattern: ({ url }) => url.origin === self.origin && url.pathname.startsWith("/api/"),
  handler: "NetworkOnly",
  method: "GET",
  options: {
    cacheName: "apis-network-only",
  },
};

const runtimeCaching = [
  apiRuntimeCaching,
  ...defaultCache
    .filter((entry) => entry.options?.cacheName !== "apis")
    .map((entry) => {
      if (entry.options?.cacheName === "others") {
        return {
          ...entry,
          urlPattern: ({ url }) =>
            url.origin === self.origin && !url.pathname.startsWith("/api/"),
        };
      }

      return entry;
    }),
];

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  },
  {
    key: "Pragma",
    value: "no-cache",
  },
  {
    key: "Expires",
    value: "0",
  },
  {
    key: "Surrogate-Control",
    value: "no-store",
  },
];

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/, /app\/api\/.*\/route.*\.js$/],
  cacheStartUrl: false,
  dynamicStartUrl: false,
  cleanupOutdatedCaches: true,
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default withPWA(nextConfig);
