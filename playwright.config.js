import { defineConfig } from "@playwright/test";
import { inflate } from "@sparticuz/chromium";
import { fileURLToPath } from "node:url";

const archivePath = fileURLToPath(
  new URL("./node_modules/@sparticuz/chromium/bin/chromium.br", import.meta.url),
);
const executablePath = await inflate(archivePath);

export default defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--use-gl=disabled",
      ],
    },
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
