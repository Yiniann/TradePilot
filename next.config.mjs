/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    middlewareClientMaxBodySize: "20mb",
    serverActions: {
      bodySizeLimit: "20mb"
    }
  },
  typedRoutes: true
};

export default nextConfig;
