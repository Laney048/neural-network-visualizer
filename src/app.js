import {
  MODEL_STEPS,
  createState,
  nextStep,
  resetState,
  selectModel,
  setGate,
} from "./model-state.js";
import {
  renderArchitecture,
  renderGateControls,
  updateGateControls,
  startPlayback,
  stopPlayback,
} from "./renderers.js";
import {
  getClassProbabilities,
  getFrameFeatures,
  getScenario,
} from "./scenarios.js";

const MODEL_COPY = {
  cnn: {
    family: "卷积神经网络",
    title: "CNN 空间特征提取",
    description: "输入图像以通道、高度和宽度三个维度进入网络。",
  },
  rnn: {
    family: "循环神经网络",
    title: "RNN 循环状态传递",
    description: "当前输入与上一时刻隐藏状态共同参与计算。",
  },
  lstm: {
    family: "门控循环神经网络",
    title: "LSTM 长短期记忆",
    description: "独立细胞状态在多个时间步之间传递长期信息。",
  },
  gru: {
    family: "轻量门控循环网络",
    title: "GRU 门控循环单元",
    description: "更新门和重置门控制新旧隐藏状态的融合。",
  },
};

const STEP_DESCRIPTIONS = {
  cnn: [
    "输入图像以通道、高度和宽度三个维度进入网络。",
    "卷积核扫描局部邻域，并在整张图像上共享权重。",
    "多个卷积核生成不同通道的特征图。",
    "ReLU 保留正响应，为网络加入非线性表达能力。",
    "池化压缩空间尺寸，并保留显著响应。",
    "分类层把空间特征映射为各类别概率。",
  ],
  rnn: [
    "RNN 接收当前时刻输入 xₜ。",
    "当前输入与上一隐藏状态 hₜ₋₁ 在循环单元中融合。",
    "新隐藏状态 hₜ 继续向后传递，同时生成当前输出 yₜ。",
  ],
  lstm: [
    "遗忘门决定上一细胞状态需要保留多少。",
    "输入门选择需要写入长期记忆的新信息。",
    "旧记忆与候选记忆相加，形成新的细胞状态 cₜ。",
    "输出门从细胞状态中提取当前隐藏状态 hₜ。",
  ],
  gru: [
    "重置门决定生成候选状态时参考多少历史信息。",
    "当前输入与筛选后的历史共同生成候选状态 h̃ₜ。",
    "更新门在旧状态和候选状态之间进行加权融合。",
  ],
};

let state = createState("cnn");

const tabs = [...document.querySelectorAll("[data-model]")];
const family = document.querySelector("#model-family");
const title = document.querySelector("#model-title");
const description = document.querySelector("#step-description");
const stepNumber = document.querySelector("#step-number");
const diagram = document.querySelector("#model-diagram");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const stepButton = document.querySelector("#step-button");
const resetButton = document.querySelector("#reset-button");
const gateControls = document.querySelector("#gate-controls");

function finalStepIndex() {
  return MODEL_STEPS[state.activeModel].length - 1;
}

function renderShell() {
  const copy = MODEL_COPY[state.activeModel];
  family.textContent = copy.family;
  title.textContent = copy.title;
  description.textContent = STEP_DESCRIPTIONS[state.activeModel][state.stepIndex] ?? copy.description;
  stepNumber.textContent = String(state.stepIndex + 1).padStart(2, "0");
  playButton.setAttribute("aria-pressed", String(state.isPlaying));
  renderArchitecture(diagram, state);
  renderGateControls(gateControls, state, (gate, value) => {
    state = setGate(state, gate, value);
    updateGateControls(gateControls, state);
  });

  for (const tab of tabs) {
    const isSelected = tab.dataset.model === state.activeModel;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
  }
}

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    stopPlayback();
    state = selectModel(state, tab.dataset.model);
    renderShell();
  });
}

playButton.addEventListener("click", () => {
  if (state.stepIndex >= finalStepIndex()) {
    state = resetState(state);
  }
  state = { ...state, isPlaying: true };
  renderShell();

  startPlayback(() => {
    const advanced = nextStep(state);
    const reachedFinalStep = advanced.stepIndex >= MODEL_STEPS[advanced.activeModel].length - 1;
    state = { ...advanced, isPlaying: !reachedFinalStep };
    renderShell();
    return !reachedFinalStep;
  });
});

pauseButton.addEventListener("click", () => {
  stopPlayback();
  state = { ...state, isPlaying: false };
  renderShell();
});

stepButton.addEventListener("click", () => {
  stopPlayback();
  state = { ...nextStep(state), isPlaying: false };
  renderShell();
});

resetButton.addEventListener("click", () => {
  stopPlayback();
  state = resetState(state);
  renderShell();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopPlayback();
    state = { ...state, isPlaying: false };
    renderShell();
  }
});

renderShell();

let scenarioState = { id: "reading", frameIndex: 0, isPlaying: false };
let scenarioTimer = null;

const scenarioTabs = [...document.querySelectorAll("[data-scenario]")];
const scenarioTitle = document.querySelector("#scenario-title");
const scenarioDescription = document.querySelector("#scenario-description");
const scenarioFrameIndex = document.querySelector("#scenario-frame-index");
const scenarioFrame = document.querySelector("#scenario-frame");
const featureSummary = document.querySelector("#feature-summary");
const featureBrightness = document.querySelector("#feature-brightness");
const featureMotion = document.querySelector("#feature-motion");
const scenarioHiddenState = document.querySelector("#scenario-hidden-state");
const scenarioProbabilities = document.querySelector("#scenario-probabilities");
const scenarioPlay = document.querySelector("#scenario-play");
const scenarioPause = document.querySelector("#scenario-pause");
const scenarioReset = document.querySelector("#scenario-reset");

function stopScenarioPlayback() {
  if (scenarioTimer !== null) {
    window.clearInterval(scenarioTimer);
    scenarioTimer = null;
  }
}

function renderScenario() {
  const scenario = getScenario(scenarioState.id);
  const features = getFrameFeatures(scenario, scenarioState.frameIndex);
  const probabilities = getClassProbabilities(scenario, scenarioState.frameIndex);
  const frame = scenario.frames[scenarioState.frameIndex];

  scenarioTitle.textContent = scenario.label;
  scenarioDescription.textContent = scenario.description;
  scenarioFrameIndex.textContent = `${scenarioState.frameIndex + 1} / ${scenario.frames.length}`;
  featureSummary.textContent = features.summary;
  featureBrightness.textContent = features.meanBrightness.toFixed(2);
  featureMotion.textContent = features.motion.toFixed(2);
  scenarioHiddenState.textContent = (0.14 + features.motion * 0.7).toFixed(2);

  scenarioFrame.innerHTML = frame.map((level, index) =>
    `<span style="--level:${level}" aria-label="区域 ${index + 1}，亮度 ${level.toFixed(2)}"></span>`,
  ).join("");

  const labels = { reading: "阅读 / 浏览", video: "视频 / 电影", gaming: "游戏" };
  scenarioProbabilities.innerHTML = Object.entries(probabilities).map(([id, value]) => `
    <div class="probability-row">
      <div><span>${labels[id]}</span><strong>${Math.round(value * 100)}%</strong></div>
      <div class="probability-track" aria-hidden="true"><i style="width:${value * 100}%"></i></div>
    </div>`).join("");

  for (const tab of scenarioTabs) {
    const selected = tab.dataset.scenario === scenarioState.id;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
  }
}

for (const tab of scenarioTabs) {
  tab.addEventListener("click", () => {
    stopScenarioPlayback();
    scenarioState = { id: tab.dataset.scenario, frameIndex: 0, isPlaying: false };
    renderScenario();
  });
}

scenarioPlay.addEventListener("click", () => {
  stopScenarioPlayback();
  const scenario = getScenario(scenarioState.id);
  if (scenarioState.frameIndex >= scenario.frames.length - 1) {
    scenarioState = { ...scenarioState, frameIndex: 0 };
  }
  scenarioState = { ...scenarioState, isPlaying: true };
  renderScenario();
  const interval = Number(window.__SCENARIO_INTERVAL_MS__) || 720;
  scenarioTimer = window.setInterval(() => {
    const nextIndex = Math.min(scenarioState.frameIndex + 1, scenario.frames.length - 1);
    const reachedEnd = nextIndex === scenario.frames.length - 1;
    scenarioState = { ...scenarioState, frameIndex: nextIndex, isPlaying: !reachedEnd };
    renderScenario();
    if (reachedEnd) stopScenarioPlayback();
  }, interval);
});

scenarioPause.addEventListener("click", () => {
  stopScenarioPlayback();
  scenarioState = { ...scenarioState, isPlaying: false };
});

scenarioReset.addEventListener("click", () => {
  stopScenarioPlayback();
  scenarioState = { ...scenarioState, frameIndex: 0, isPlaying: false };
  renderScenario();
});

renderScenario();
