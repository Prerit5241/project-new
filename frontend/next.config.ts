import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "CodeShelf",
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },

  // ✅ Experimental server actions with allowedOrigins
  experimental: {
    forceSwcTransforms: true,
    serverActions: {
      allowedOrigins: [
        "http://192.168.10.84:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
    },
  },

  webpack: (config: Configuration, { dev }: { dev: boolean }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**"],
      };
    }

    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      },
    };

    return config;
  },

  images: {
    domains: [
      "imgs.search.brave.com",
      "example.com",
      "localhost",
      "192.168.10.87",
      "192.168.10.84",
      "10.32.83.199",
      "10.219.223.199",
      "127.0.0.1",
    ],
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/webp", "image/avif"],
  },

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false, dirs: ["src"] },

  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/student/dashboard",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },

  output: "standalone",
  compress: true,
  onDemandEntries: { maxInactiveAge: 25 * 1000, pagesBufferLength: 2 },
};

export default nextConfig;
