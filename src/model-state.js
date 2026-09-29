export const MODEL_STEPS = Object.freeze({
  cnn: Object.freeze(["输入", "卷积", "特征图", "激活", "池化", "分类"]),
  rnn: Object.freeze(["读取输入", "融合历史状态", "输出新状态"]),
  lstm: Object.freeze(["遗忘", "写入", "更新记忆", "输出"]),
  gru: Object.freeze(["重置历史", "生成候选状态", "融合新旧状态"]),
});

const MODELS = new Set(Object.keys(MODEL_STEPS));

function assertModel(model) {
  if (!MODELS.has(model)) {
    throw new RangeError(`Unknown model: ${model}`);
  }
}

export function createState(model) {
  assertModel(model);
  return {
    activeModel: model,
    stepIndex: 0,
    timeStep: 0,
    isPlaying: false,
    gateValues: {},
  };
}

export function nextStep(state) {
  assertModel(state.activeModel);
  const finalIndex = MODEL_STEPS[state.activeModel].length - 1;
  const stepIndex = Math.min(state.stepIndex + 1, finalIndex);

  return {
    ...state,
    stepIndex,
    timeStep: Math.min(state.timeStep + 1, finalIndex),
  };
}

export function resetState(state) {
  return createState(state.activeModel);
}

export function setGate(state, gate, value) {
  const clamped = Math.min(1, Math.max(0, Number(value)));
  const rounded = Math.round(clamped * 100) / 100;

  return {
    ...state,
    gateValues: {
      ...state.gateValues,
      [gate]: rounded,
    },
  };
}

export function selectModel(_state, model) {
  return createState(model);
}
