import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Races to watch was removed once nearly every race was called.
  redirects: async () => [{ source: "/watch", destination: "/members", permanent: true }],
};

export default nextConfig;
