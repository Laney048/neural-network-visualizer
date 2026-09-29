import { test, expect } from "@playwright/test";

test("renders_cnn_pipeline", async ({ page }) => {
  await page.goto("/");

  const diagram = page.locator("#model-diagram");
  const svg = diagram.getByRole("img", { name: "CNN 架构图" });
  await expect(svg).toBeVisible();
  for (const label of ["输入图像", "卷积", "特征图", "ReLU", "池化", "分类"]) {
    await expect(svg.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(diagram.locator(".network-node.is-active")).toHaveCount(1);
});

test("renders_rnn_recurrence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "RNN" }).click();

  const diagram = page.locator("#model-diagram");
  const svg = diagram.getByRole("img", { name: "RNN 架构图" });
  await expect(svg).toBeVisible();
  for (const label of ["xₜ", "hₜ₋₁", "RNN 单元", "hₜ", "yₜ"]) {
    await expect(svg.getByText(label, { exact: true })).toBeVisible();
  }
});

test("renders_lstm_three_gates_and_cell_state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "LSTM" }).click();

  const diagram = page.locator("#model-diagram");
  const svg = diagram.getByRole("img", { name: "LSTM 架构图" });
  await expect(svg).toBeVisible();
  for (const label of ["遗忘门", "输入门", "输出门", "细胞状态 cₜ"]) {
    await expect(svg.getByText(label, { exact: true })).toBeVisible();
  }
});

test("renders_gru_two_gates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "GRU" }).click();

  const diagram = page.locator("#model-diagram");
  const svg = diagram.getByRole("img", { name: "GRU 架构图" });
  await expect(svg).toBeVisible();
  for (const label of ["更新门", "重置门", "候选状态", "隐藏状态 hₜ"]) {
    await expect(svg.getByText(label, { exact: true })).toBeVisible();
  }
});

test("step_advances_once", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "单步" }).click();

  await expect(page.locator("#step-number")).toHaveText("02");
  await expect(page.locator("#model-diagram .network-node.is-active")).toHaveAttribute("data-step", "1");
});

test("autoplay_stops_at_final_stage", async ({ page }) => {
  await page.addInitScript(() => { window.__VISUALIZER_INTERVAL_MS__ = 30; });
  await page.goto("/");

  await page.getByRole("button", { name: "播放", exact: true }).click();

  await expect(page.locator("#step-number")).toHaveText("06", { timeout: 2_000 });
  await expect(page.getByRole("button", { name: "播放", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("reset_returns_to_initial_stage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "单步" }).click();
  await expect(page.locator("#step-number")).toHaveText("02");
  await page.getByRole("button", { name: "重置", exact: true }).click();

  await expect(page.locator("#step-number")).toHaveText("01");
  await expect(page.locator("#model-diagram .network-node.is-active")).toHaveAttribute("data-step", "0");
});

test("switching_model_cancels_old_autoplay", async ({ page }) => {
  await page.addInitScript(() => { window.__VISUALIZER_INTERVAL_MS__ = 180; });
  await page.goto("/");

  await page.getByRole("button", { name: "播放", exact: true }).click();
  await page.getByRole("tab", { name: "LSTM" }).click();
  await page.waitForTimeout(260);

  await expect(page.getByRole("heading", { name: "LSTM 长短期记忆" })).toBeVisible();
  await expect(page.locator("#step-number")).toHaveText("01");
  await expect(page.getByRole("button", { name: "播放", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("lstm_gate_slider_updates_cell_state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "LSTM" }).click();

  const forgetGate = page.getByRole("slider", { name: "遗忘门 fₜ" });
  await expect(page.locator("#cell-state-value")).toHaveText("0.50");
  await forgetGate.evaluate((input) => {
    input.value = "0.20";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(page.locator("#gate-forget-value")).toHaveText("0.20");
  await expect(page.locator("#cell-state-value")).toHaveText("0.32");
});

test("gru_gate_slider_updates_hidden_state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "GRU" }).click();

  const updateGate = page.getByRole("slider", { name: "更新门 zₜ" });
  await updateGate.evaluate((input) => {
    input.value = "0.80";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(page.locator("#gate-update-value")).toHaveText("0.80");
  await expect(page.locator("#hidden-state-value")).toHaveText("0.52");
});

test("gate_input_clamps_out_of_range_values", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "LSTM" }).click();

  const outputGate = page.getByRole("slider", { name: "输出门 oₜ" });
  await outputGate.evaluate((input) => {
    input.value = "1.70";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(page.locator("#gate-output-value")).toHaveText("1.00");
});

test("gate_slider_keeps_focus_during_repeated_keyboard_input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "LSTM" }).click();

  const forgetGate = page.getByRole("slider", { name: "遗忘门 fₜ" });
  await forgetGate.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  await expect(forgetGate).toBeFocused();
  await expect(forgetGate).toHaveValue("0.52");
  await expect(page.locator("#gate-forget-value")).toHaveText("0.52");
});

test("gate_slider_supports_continuous_pointer_drag", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "GRU" }).click();

  const slider = page.getByRole("slider", { name: "更新门 zₜ" });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.5, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, y, { steps: 3 });
  await page.mouse.move(box.x + box.width * 0.85, y, { steps: 4 });
  await page.mouse.up();

  expect(Number(await slider.inputValue())).toBeGreaterThan(0.7);
});

test("mobile_uses_readable_vertical_diagrams_for_every_model", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  for (const model of ["CNN", "RNN", "LSTM", "GRU"]) {
    await page.getByRole("tab", { name: model }).click();
    const mobileDiagram = page.locator(".mobile-network-diagram:visible");
    await expect(mobileDiagram).toHaveAttribute("data-model", model.toLowerCase());
    const nodes = mobileDiagram.locator(".mobile-network-node");
    expect(await nodes.count()).toBeGreaterThanOrEqual(3);
    const fontSize = await nodes.first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(14);
    const first = await nodes.first().boundingBox();
    const last = await nodes.last().boundingBox();
    expect(last.y).toBeGreaterThan(first.y + first.height);
  }
});
