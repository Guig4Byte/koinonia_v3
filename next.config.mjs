import nextPwa from "next-pwa";
import defaultCache from "next-pwa/cache.js";

const runtimeCaching = defaultCache.map((entry) => {
  if (entry.options?.cacheName === "apis") {
    return {
      urlPattern: entry.urlPattern,
      handler: "NetworkOnly",
      method: "GET",
    };
  }
  return entry;
});

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig);
