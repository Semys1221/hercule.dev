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
        source: "/entreprise",
        destination: "/",
        permanent: true,
      },
      {
        source: "/dashboard.html",
        destination: "/",
        permanent: false,
      },
      {
        source: "/cvg_onboarding.md",
        destination: "/cvg/onboarding",
        permanent: true,
      },
      {
        source: "/cvg_site-sync.md",
        destination: "/cvg/site-sync",
        permanent: true,
      },
      {
        source: "/capacity/03-sla-client.md",
        destination: "/cvg/sla-client",
        permanent: true,
      },
      {
        source: "/constants-commercial.md",
        destination: "/cvg/constants-commercial",
        permanent: true,
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
        {
          source: "/modalites-hercule.html/:slug",
          destination: "/modalites-hercule.html?code=:slug",
        },
      ],
    };
  },
}

export default nextConfig
