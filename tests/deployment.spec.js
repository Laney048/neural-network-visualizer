import { test, expect } from "@playwright/test";

test("all_local_assets_resolve_under_project_subpath", async ({ page }) => {
  const failedResponses = [];
  const loadedAssets = new Set();
  const requestedAssetPaths = [];
  const pageErrors = [];

  await page.route("http://127.0.0.1:4173/neural-network-visualizer/**", async (route) => {
    const original = new URL(route.request().url());
    original.pathname = original.pathname.replace("/neural-network-visualizer/", "/");
    await route.continue({ url: original.toString() });
  });

  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${url}`);
    for (const asset of ["assets/styles.css", "src/app.js", "src/model-state.js", "src/renderers.js", "src/scenarios.js"]) {
      if (url.endsWith(asset) && response.ok()) loadedAssets.add(asset);
    }
  });
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (/\.(?:css|js)$/.test(path)) requestedAssetPaths.push(path);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("http://127.0.0.1:4173/neural-network-visualizer/");
  await page.getByRole("tab", { name: "LSTM" }).first().click();
  await expect(page.getByRole("img", { name: "LSTM 架构图" })).toBeVisible();

  expect(failedResponses).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(requestedAssetPaths.length).toBeGreaterThanOrEqual(5);
  expect(requestedAssetPaths.every((path) => path.startsWith("/neural-network-visualizer/"))).toBe(true);
  expect([...loadedAssets].sort()).toEqual([
    "assets/styles.css",
    "src/app.js",
    "src/model-state.js",
    "src/renderers.js",
    "src/scenarios.js",
  ]);
});
