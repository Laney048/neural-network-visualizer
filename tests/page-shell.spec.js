import { test, expect } from "@playwright/test";

test("shows_four_model_choices", async ({ page }) => {
  await page.goto("/");

  const tabs = page.locator(".model-tabs").getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(tabs).toHaveText(["CNN", "RNN", "LSTM", "GRU"]);
  await expect(page.getByRole("heading", { name: "CNN 空间特征提取" })).toBeVisible();
});

test("switches_active_model", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "LSTM" }).click();

  await expect(page.getByRole("tab", { name: "LSTM" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "LSTM 长短期记忆" })).toBeVisible();
});

test("keyboard_navigation_reaches_controls", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "播放", exact: true }).focus();
  await expect(page.getByRole("button", { name: "播放", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "暂停", exact: true })).toBeFocused();
});

test("shows_static_model_summaries_without_javascript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:4173/");

  const fallback = page.locator("#static-model-summaries");
  await expect(fallback).toContainText("CNN");
  await expect(fallback).toContainText("RNN");
  await expect(fallback).toContainText("LSTM");
  await expect(fallback).toContainText("GRU");
  await expect(fallback).toContainText("空间");
  await expect(fallback).toContainText("记忆");

  await context.close();
});

test("mobile_layout_has_no_horizontal_overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
