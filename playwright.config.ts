import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3111" },
  webServer: {
    command: "npm run build && npm run start -- -p 3111",
    url: "http://localhost:3111",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
