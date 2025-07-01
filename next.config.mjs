/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/getSharedDocs", // your frontend will call /api/getSharedDocs
        destination: "http://13.200.72.144/getSharedDocs", // backend plain HTTP
      },
    ];
  },
};

export default nextConfig;
