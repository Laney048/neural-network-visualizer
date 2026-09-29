import test from "node:test";
import assert from "node:assert/strict";

import {
  SCENARIOS,
  getClassProbabilities,
  getFrameFeatures,
  getScenario,
} from "../src/scenarios.js";

test("each_scenario_has_frames_and_normalized_probabilities", () => {
  for (const id of ["reading", "video", "gaming"]) {
    const scenario = SCENARIOS[id];
    assert.ok(scenario.frames.length >= 4);
    assert.equal(scenario.features.length, scenario.frames.length);
    assert.equal(scenario.probabilities.length, scenario.frames.length);

    for (let index = 0; index < scenario.frames.length; index += 1) {
      assert.equal(scenario.frames[index].length, 16);
      assert.ok(scenario.frames[index].every((value) => value >= 0 && value <= 1));
      const probabilities = getClassProbabilities(scenario, index);
      assert.deepEqual(Object.keys(probabilities), ["reading", "video", "gaming"]);
      const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
      assert.ok(Math.abs(total - 1) <= 0.001);
    }
  }
});

test("frame_index_saturates_at_last_frame", () => {
  const scenario = SCENARIOS.video;
  const lastIndex = scenario.frames.length - 1;

  assert.deepEqual(getFrameFeatures(scenario, 999), scenario.features[lastIndex]);
  assert.deepEqual(getClassProbabilities(scenario, 999), scenario.probabilities[lastIndex]);
  assert.deepEqual(getFrameFeatures(scenario, -4), scenario.features[0]);
});

test("unknown_scenario_falls_back_to_reading", () => {
  assert.equal(getScenario("unknown-id"), SCENARIOS.reading);
  assert.equal(getScenario(), SCENARIOS.reading);
});
