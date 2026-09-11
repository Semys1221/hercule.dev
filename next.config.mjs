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
    const niches = ["agence", "entreprise", "comptable", "cif"];
    const funnelRedirects = niches.flatMap((niche) => [
      {
        source: `/internal/funnels/${niche}`,
        destination: `/internal/funnels/session/${niche}`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/sales`,
        destination: `/internal/funnels/session/${niche}`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/bookings`,
        destination: `/internal/funnels/bookings/${niche}`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/clients`,
        destination: `/internal/funnels/clients/${niche}`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/emails`,
        destination: `/internal/funnels/emails/${niche}`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/emails/:slug*`,
        destination: `/internal/funnels/emails/${niche}/:slug*`,
        permanent: true,
      },
      {
        source: `/internal/funnels/${niche}/legal/:path*`,
        destination: `/internal/funnels/legal/${niche}/:path*`,
        permanent: true,
      },
    ]);

    return [
      ...funnelRedirects,
      {
        source: "/entreprise",
        destination: "/",
        permanent: true,
      },
      {
        source: "/agence",
        destination: "/",
        permanent: true,
      },
      {
        source: "/agence/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/cvg/comptable",
        destination: "/cvg",
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
          destination: "/modalites-hercule.html",
        },
      ],
    };
  },
}

export default nextConfig
