import type { NextConfig } from 'next';
import { execSync } from 'node:child_process';

const buildHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  env: { NEXT_PUBLIC_BUILD_HASH: buildHash },
};

export default nextConfig;
