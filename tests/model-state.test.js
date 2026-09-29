import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_STEPS,
  createState,
  nextStep,
  resetState,
  selectModel,
  setGate,
} from "../src/model-state.js";

test("creates_initial_state_for_each_model", () => {
  const expectedLengths = { cnn: 6, rnn: 3, lstm: 4, gru: 3 };

  for (const [model, expectedLength] of Object.entries(expectedLengths)) {
    const state = createState(model);
    assert.equal(MODEL_STEPS[model].length, expectedLength);
    assert.deepEqual(state, {
      activeModel: model,
      stepIndex: 0,
      timeStep: 0,
      isPlaying: false,
      gateValues: {},
    });
  }
});

test("next_step_stops_at_last_stage", () => {
  let state = createState("gru");

  for (let index = 0; index < 10; index += 1) {
    state = nextStep(state);
  }

  assert.equal(state.stepIndex, 2);
  assert.equal(state.timeStep, 2);
});

test("reset_restores_step_and_time", () => {
  const advanced = {
    ...nextStep(createState("rnn")),
    isPlaying: true,
  };

  const reset = resetState(advanced);

  assert.equal(reset.activeModel, "rnn");
  assert.equal(reset.stepIndex, 0);
  assert.equal(reset.timeStep, 0);
  assert.equal(reset.isPlaying, false);
  assert.notEqual(reset, advanced);
});

test("gate_values_are_clamped_and_formatted", () => {
  let state = createState("lstm");

  state = setGate(state, "forget", -0.4);
  state = setGate(state, "input", 1.7);
  state = setGate(state, "output", 0.456);

  assert.deepEqual(state.gateValues, {
    forget: 0,
    input: 1,
    output: 0.46,
  });
});

test("select_model_resets_playback_state", () => {
  const playingLstm = {
    ...nextStep(createState("lstm")),
    isPlaying: true,
    gateValues: { forget: 0.25 },
  };

  const selected = selectModel(playingLstm, "gru");

  assert.deepEqual(selected, createState("gru"));
  assert.notEqual(selected, playingLstm);
});
