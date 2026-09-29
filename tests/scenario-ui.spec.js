import { test, expect } from "@playwright/test";

test("switches_between_three_scenarios", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#scenario-reading")).toHaveAttribute("aria-selected", "true");
  await page.locator("#scenario-video").click();
  await expect(page.locator("#scenario-video")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#scenario-title")).toHaveText("视频 / 电影");

  await page.locator("#scenario-gaming").click();
  await expect(page.locator("#scenario-gaming")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#scenario-title")).toHaveText("游戏");
});

test("animates_frames_through_cnn_and_gru_pipeline", async ({ page }) => {
  await page.addInitScript(() => { window.__SCENARIO_INTERVAL_MS__ = 30; });
  await page.goto("/");

  for (const label of ["背光帧", "CNN 空间特征", "GRU 时间建模", "场景概率"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await page.locator("#scenario-play").click();

  await expect(page.locator("#scenario-frame-index")).toHaveText("4 / 4", { timeout: 2_000 });
  for (const label of ["阅读 / 浏览", "视频 / 电影", "游戏"]) {
    await expect(page.locator("#scenario-probabilities").getByText(label, { exact: true })).toBeVisible();
  }
});

test("shows_simulation_disclaimer", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#scenario-disclaimer")).toContainText("教学模拟数据");
  await expect(page.locator("#scenario-disclaimer")).toContainText("不代表真实模型准确率");
});
