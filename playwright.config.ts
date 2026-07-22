import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3006' },
  webServer: {
    command: 'npm run build && npx http-server ./out -p 3006 -c-1 --silent',
    port: 3006,
    timeout: 240_000,
    reuseExistingServer: true,
  },
});
