/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard.html",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/dashboard.html/:slug",
          destination: "/dashboard/:slug",
        },
      ],
    };
  },
}

export default nextConfig
