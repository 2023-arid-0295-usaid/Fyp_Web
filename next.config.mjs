/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The original app talks to a LAN ASP.NET Core server over plain HTTP.
  images: {},
  eslint: {
    // CI build should not be blocked by lint noise during the clone phase.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // JS-only project; ignore TS checks emitted by external tooling.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
