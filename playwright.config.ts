import { defineConfig } from "@playwright/test";

// Set E2E_BASE_URL to run the same tests against a deployed site instead of a local build.
const deployedUrl = process.env.E2E_BASE_URL;
const localUrl = "http://localhost:3111";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: deployedUrl ?? localUrl },
  webServer: deployedUrl
    ? undefined
    : {
        command: "npm run build && npm run start -- -p 3111",
        url: localUrl,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
