import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    // Désactive les source maps en production pour ne pas exposer le code source
    productionBrowserSourceMaps: false,
};

export default nextConfig;
