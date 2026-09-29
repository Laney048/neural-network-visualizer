function activeClass(state, step) {
  return state.stepIndex === step ? "network-node is-active" : "network-node";
}

function svgFrame(model, description, content) {
  const titleId = `${model}-diagram-title`;
  const descriptionId = `${model}-diagram-description`;
  return `
    <svg class="network-diagram" viewBox="0 0 920 320" role="img" aria-labelledby="${titleId} ${descriptionId}">
      <title id="${titleId}">${model.toUpperCase()} 架构图</title>
      <desc id="${descriptionId}">${description}</desc>
      <defs>
        <marker id="arrow-${model}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      ${content}
    </svg>`;
}

function cnnDiagram(state) {
  const labels = ["输入图像", "卷积", "特征图", "ReLU", "池化", "分类"];
  const nodes = labels.map((label, index) => {
    const x = 20 + index * 150;
    return `
      <g class="${activeClass(state, index)}" data-step="${index}" transform="translate(${x} 118)">
        <rect width="116" height="76" rx="14"></rect>
        <text x="58" y="39">${label}</text>
      </g>`;
  }).join("");
  const lines = labels.slice(0, -1).map((_, index) => {
    const x1 = 136 + index * 150;
    const x2 = 166 + index * 150;
    return `<line class="network-edge" x1="${x1}" y1="156" x2="${x2}" y2="156" marker-end="url(#arrow-cnn)"></line>`;
  }).join("");

  return svgFrame("cnn", "图像依次经过卷积、激活和池化，再进入分类层。", `
    <text class="diagram-caption" x="20" y="52">空间维度：C × H × W</text>
    ${lines}${nodes}
    <text class="diagram-note" x="460" y="252">局部感受野 · 权重共享 · 层级特征</text>
  `);
}

function rnnDiagram(state) {
  return svgFrame("rnn", "当前输入和上一隐藏状态进入循环单元，产生新状态与输出。", `
    <line class="network-edge" x1="126" y1="180" x2="344" y2="180" marker-end="url(#arrow-rnn)"></line>
    <line class="network-edge" x1="218" y1="76" x2="344" y2="128" marker-end="url(#arrow-rnn)"></line>
    <line class="network-edge" x1="520" y1="180" x2="708" y2="180" marker-end="url(#arrow-rnn)"></line>
    <path class="network-edge network-edge--loop" d="M 510 128 C 650 25, 675 115, 520 145" marker-end="url(#arrow-rnn)"></path>
    <g class="${activeClass(state, 0)}" transform="translate(28 142)"><rect width="98" height="76" rx="14"></rect><text x="49" y="39">xₜ</text></g>
    <g class="${activeClass(state, 1)}" transform="translate(120 38)"><rect width="98" height="76" rx="14"></rect><text x="49" y="39">hₜ₋₁</text></g>
    <g class="${activeClass(state, 1)}" transform="translate(344 118)"><rect width="176" height="124" rx="18"></rect><text x="88" y="48">RNN 单元</text><text class="node-subtitle" x="88" y="80">tanh(Wxₜ + Uhₜ₋₁)</text></g>
    <g class="${activeClass(state, 2)}" transform="translate(708 68)"><rect width="126" height="70" rx="14"></rect><text x="63" y="36">hₜ</text></g>
    <g class="${activeClass(state, 2)}" transform="translate(708 190)"><rect width="126" height="70" rx="14"></rect><text x="63" y="36">yₜ</text></g>
    <line class="network-edge" x1="771" y1="138" x2="771" y2="190" marker-end="url(#arrow-rnn)"></line>
  `);
}

function lstmDiagram(state) {
  return svgFrame("lstm", "三个门控制遗忘、写入和输出，细胞状态提供长期记忆通道。", `
    <line class="memory-lane" x1="42" y1="66" x2="870" y2="66" marker-end="url(#arrow-lstm)"></line>
    <text class="lane-label" x="100" y="42">细胞状态 cₜ₋₁</text>
    <text class="lane-label" x="800" y="42">细胞状态 cₜ</text>
    <g class="${activeClass(state, 0)} gate-node" transform="translate(74 142)"><rect width="158" height="82" rx="16"></rect><text x="79" y="33">遗忘门</text><text class="node-subtitle" x="79" y="57">fₜ · 保留旧记忆</text></g>
    <g class="${activeClass(state, 1)} gate-node" transform="translate(282 142)"><rect width="158" height="82" rx="16"></rect><text x="79" y="33">输入门</text><text class="node-subtitle" x="79" y="57">iₜ · 写入新信息</text></g>
    <g class="${activeClass(state, 2)} memory-node" transform="translate(490 142)"><rect width="158" height="82" rx="16"></rect><text x="79" y="33">更新记忆</text><text class="node-subtitle" x="79" y="57">cₜ = fₜcₜ₋₁ + iₜc̃ₜ</text></g>
    <g class="${activeClass(state, 3)} gate-node" transform="translate(698 142)"><rect width="158" height="82" rx="16"></rect><text x="79" y="33">输出门</text><text class="node-subtitle" x="79" y="57">oₜ · 生成 hₜ</text></g>
    <line class="network-edge" x1="153" y1="142" x2="153" y2="78" marker-end="url(#arrow-lstm)"></line>
    <line class="network-edge" x1="361" y1="142" x2="500" y2="78" marker-end="url(#arrow-lstm)"></line>
    <line class="network-edge" x1="777" y1="78" x2="777" y2="142" marker-end="url(#arrow-lstm)"></line>
    <text class="diagram-note" x="460" y="278">[xₜ, hₜ₋₁] 同时送入三个门和候选记忆计算</text>
  `);
}

function gruDiagram(state) {
  return svgFrame("gru", "重置门筛选历史信息，更新门决定新旧隐藏状态的融合比例。", `
    <line class="memory-lane" x1="50" y1="70" x2="866" y2="70" marker-end="url(#arrow-gru)"></line>
    <text class="lane-label" x="108" y="44">历史状态 hₜ₋₁</text>
    <g class="${activeClass(state, 0)} gate-node" transform="translate(105 146)"><rect width="170" height="82" rx="16"></rect><text x="85" y="33">重置门</text><text class="node-subtitle" x="85" y="57">rₜ · 筛选历史</text></g>
    <g class="${activeClass(state, 1)}" transform="translate(375 146)"><rect width="170" height="82" rx="16"></rect><text x="85" y="33">候选状态</text><text class="node-subtitle" x="85" y="57">h̃ₜ · 新信息</text></g>
    <g class="${activeClass(state, 2)} gate-node" transform="translate(645 146)"><rect width="170" height="82" rx="16"></rect><text x="85" y="33">更新门</text><text class="node-subtitle" x="85" y="57">zₜ · 融合比例</text></g>
    <line class="network-edge" x1="190" y1="146" x2="190" y2="82" marker-end="url(#arrow-gru)"></line>
    <line class="network-edge" x1="275" y1="187" x2="375" y2="187" marker-end="url(#arrow-gru)"></line>
    <line class="network-edge" x1="545" y1="187" x2="645" y2="187" marker-end="url(#arrow-gru)"></line>
    <g class="${activeClass(state, 2)} memory-node" transform="translate(704 32)"><rect width="142" height="68" rx="14"></rect><text x="71" y="35">隐藏状态 hₜ</text></g>
    <line class="network-edge" x1="730" y1="146" x2="770" y2="100" marker-end="url(#arrow-gru)"></line>
    <text class="diagram-note" x="460" y="278">参数更少 · 计算路径更短 · 适合实时推理</text>
  `);
}

const RENDERERS = { cnn: cnnDiagram, rnn: rnnDiagram, lstm: lstmDiagram, gru: gruDiagram };

const MOBILE_DIAGRAMS = {
  cnn: {
    caption: "空间维度：C × H × W",
    note: "局部感受野 · 权重共享 · 层级特征",
    nodes: [
      ["输入图像", "原始像素"], ["卷积", "扫描局部邻域"], ["特征图", "提取空间模式"],
      ["ReLU", "加入非线性"], ["池化", "压缩空间尺寸"], ["分类", "输出类别概率"],
    ],
  },
  rnn: {
    caption: "输入 xₜ 与历史状态 hₜ₋₁ 共同参与计算",
    note: "新状态继续传递，并生成当前输出 yₜ",
    nodes: [
      ["当前输入 xₜ", "时间步 t 的观测"],
      ["RNN 单元", "融合 hₜ₋₁ 与 xₜ"],
      ["隐藏状态 hₜ", "保留序列上下文"],
      ["当前输出 yₜ", "生成时间步结果"],
    ],
  },
  lstm: {
    caption: "细胞状态 cₜ₋₁ → cₜ 形成长期记忆通道",
    note: "[xₜ, hₜ₋₁] 同时参与三个门的计算",
    nodes: [
      ["遗忘门", "fₜ · 保留旧记忆"],
      ["输入门", "iₜ · 写入新信息"],
      ["更新记忆", "合并旧记忆与候选记忆"],
      ["输出门", "oₜ · 生成 hₜ"],
    ],
  },
  gru: {
    caption: "历史状态 hₜ₋₁ 沿较短的门控路径更新",
    note: "参数更少 · 计算路径更短 · 适合实时推理",
    nodes: [
      ["重置门", "rₜ · 筛选历史"],
      ["候选状态", "h̃ₜ · 融合新信息"],
      ["更新门", "zₜ · 决定融合比例"],
      ["隐藏状态 hₜ", "传递到下一时间步"],
    ],
  },
};

function mobileDiagram(state) {
  const model = state.activeModel;
  const diagram = MOBILE_DIAGRAMS[model];
  const nodes = diagram.nodes.map(([label, subtitle], index) => `
    <div class="mobile-network-node${state.stepIndex === Math.min(index, MODEL_STEP_LIMITS[model]) ? " is-active" : ""}">
      <strong>${label}</strong><span>${subtitle}</span>
    </div>`).join("");
  return `
    <div class="mobile-network-diagram" data-model="${model}" role="img" aria-label="${model.toUpperCase()} 竖向架构图">
      <p class="mobile-network-caption">${diagram.caption}</p>
      <div class="mobile-network-flow">${nodes}</div>
      <p class="mobile-network-note">${diagram.note}</p>
    </div>`;
}

const MODEL_STEP_LIMITS = { cnn: 5, rnn: 2, lstm: 3, gru: 2 };

export function renderArchitecture(container, state) {
  container.innerHTML = `${RENDERERS[state.activeModel](state)}${mobileDiagram(state)}`;
}

const GATE_CONFIG = {
  lstm: [
    ["forget", "遗忘门 fₜ"],
    ["input", "输入门 iₜ"],
    ["output", "输出门 oₜ"],
  ],
  gru: [
    ["reset", "重置门 rₜ"],
    ["update", "更新门 zₜ"],
  ],
};

function gateValue(state, gate) {
  return state.gateValues[gate] ?? 0.5;
}

function teachingStateMarkup(state) {
  if (state.activeModel === "lstm") {
    const forget = gateValue(state, "forget");
    const input = gateValue(state, "input");
    const output = gateValue(state, "output");
    const cell = forget * 0.6 + input * 0.4;
    const hidden = output * Math.tanh(cell);
    return `
      <div class="teaching-state" aria-label="LSTM 教学状态">
        <span>细胞状态 cₜ <strong id="cell-state-value">${cell.toFixed(2)}</strong></span>
        <span>隐藏状态 hₜ <strong id="hidden-state-value">${hidden.toFixed(2)}</strong></span>
        <small>教学计算：cₜ = fₜ × 0.60 + iₜ × 0.40</small>
      </div>`;
  }

  const reset = gateValue(state, "reset");
  const update = gateValue(state, "update");
  const candidate = 0.2 + 0.6 * reset;
  const hidden = (1 - update) * 0.6 + update * candidate;
  return `
    <div class="teaching-state" aria-label="GRU 教学状态">
      <span>候选状态 h̃ₜ <strong>${candidate.toFixed(2)}</strong></span>
      <span>隐藏状态 hₜ <strong id="hidden-state-value">${hidden.toFixed(2)}</strong></span>
      <small>教学计算：hₜ = (1 − zₜ) × 0.60 + zₜ × h̃ₜ</small>
    </div>`;
}

export function renderGateControls(container, state, onGateChange) {
  const gates = GATE_CONFIG[state.activeModel];
  if (!gates) {
    container.replaceChildren();
    return;
  }

  const controls = gates.map(([gate, label]) => {
    const value = gateValue(state, gate);
    return `
      <div class="gate-control">
        <div class="gate-control__label">
          <label for="gate-${gate}">${label}</label>
          <output id="gate-${gate}-value" for="gate-${gate}">${value.toFixed(2)}</output>
        </div>
        <input id="gate-${gate}" aria-label="${label}" data-gate="${gate}" type="range" min="0" max="1" step="0.01" value="${value.toFixed(2)}" />
      </div>`;
  }).join("");

  container.innerHTML = `
    <div class="gate-panel">
      <div class="gate-panel__heading"><strong>门控实验</strong><span>拖动门值，观察状态变化</span></div>
      <div class="gate-grid">${controls}</div>
      ${teachingStateMarkup(state)}
    </div>`;

  for (const input of container.querySelectorAll("[data-gate]")) {
    input.addEventListener("input", () => onGateChange(input.dataset.gate, Number(input.value)));
  }
}

export function updateGateControls(container, state) {
  const gates = GATE_CONFIG[state.activeModel];
  if (!gates) return;

  for (const [gate] of gates) {
    const value = gateValue(state, gate).toFixed(2);
    const input = container.querySelector(`#gate-${gate}`);
    const output = container.querySelector(`#gate-${gate}-value`);
    if (input && input.value !== value) input.value = value;
    if (output) output.textContent = value;
  }

  const teachingState = container.querySelector(".teaching-state");
  if (teachingState) teachingState.outerHTML = teachingStateMarkup(state);
}

let playbackTimer = null;

export function stopPlayback() {
  if (playbackTimer !== null) {
    window.clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

export function startPlayback(dispatch) {
  stopPlayback();
  const interval = Number(window.__VISUALIZER_INTERVAL_MS__) || 850;
  playbackTimer = window.setInterval(() => {
    if (dispatch() === false) {
      stopPlayback();
    }
  }, interval);
}
