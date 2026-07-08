import type { NextConfig } from "next";
import { buildCSPHeader, buildPermissionsPolicy } from "./security";

export const nextConfig: NextConfig = {
  output: "standalone",
  //devIndicators: false,
  images: {},
  logging: {
    browserToTerminal: false,
  },
  allowedDevOrigins: [],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCSPHeader(),
          },
          {
            key: "Permissions-Policy",
            value: buildPermissionsPolicy(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};
