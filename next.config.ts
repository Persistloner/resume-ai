import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth uses native Node.js features for DOCX parsing
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
