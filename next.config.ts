import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native addons (prebuilt .node binaries) can't be bundled — they must be
  // require()'d from node_modules at runtime. sodium-native (secure-password's
  // dependency, lib/hash.ts) fails under Turbopack's default bundling with a
  // spurious "no native build for runtime=electron" error without this.
  serverExternalPackages: ["sodium-native", "secure-password"],
};

export default nextConfig;
