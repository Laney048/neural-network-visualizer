const readingFrames = [
  [0.82, 0.82, 0.78, 0.78, 0.86, 0.86, 0.81, 0.81, 0.84, 0.84, 0.8, 0.8, 0.78, 0.78, 0.74, 0.74],
  [0.81, 0.81, 0.77, 0.77, 0.85, 0.85, 0.8, 0.8, 0.84, 0.84, 0.79, 0.79, 0.78, 0.78, 0.73, 0.73],
  [0.8, 0.8, 0.76, 0.76, 0.85, 0.85, 0.79, 0.79, 0.83, 0.83, 0.78, 0.78, 0.77, 0.77, 0.72, 0.72],
  [0.79, 0.79, 0.75, 0.75, 0.84, 0.84, 0.78, 0.78, 0.82, 0.82, 0.77, 0.77, 0.76, 0.76, 0.71, 0.71],
];

const videoFrames = [
  [0.15, 0.24, 0.55, 0.78, 0.18, 0.3, 0.62, 0.82, 0.12, 0.28, 0.58, 0.76, 0.1, 0.2, 0.46, 0.68],
  [0.22, 0.5, 0.76, 0.42, 0.26, 0.58, 0.8, 0.38, 0.2, 0.54, 0.72, 0.32, 0.16, 0.44, 0.63, 0.28],
  [0.58, 0.75, 0.4, 0.18, 0.64, 0.8, 0.36, 0.16, 0.6, 0.72, 0.3, 0.14, 0.5, 0.62, 0.24, 0.12],
  [0.74, 0.42, 0.2, 0.52, 0.78, 0.38, 0.18, 0.6, 0.68, 0.32, 0.16, 0.55, 0.58, 0.26, 0.12, 0.48],
];

const gamingFrames = [
  [0.12, 0.15, 0.18, 0.2, 0.14, 0.86, 0.92, 0.22, 0.16, 0.78, 0.88, 0.24, 0.12, 0.18, 0.2, 0.22],
  [0.14, 0.18, 0.72, 0.88, 0.16, 0.22, 0.8, 0.94, 0.18, 0.2, 0.3, 0.76, 0.12, 0.16, 0.2, 0.24],
  [0.82, 0.9, 0.24, 0.18, 0.76, 0.86, 0.2, 0.16, 0.28, 0.68, 0.22, 0.18, 0.14, 0.2, 0.16, 0.12],
  [0.18, 0.24, 0.2, 0.16, 0.22, 0.34, 0.78, 0.9, 0.16, 0.26, 0.72, 0.86, 0.12, 0.18, 0.2, 0.28],
];

function features(summaries, means, motions) {
  return summaries.map((summary, index) => ({
    summary,
    meanBrightness: means[index],
    motion: motions[index],
  }));
}

export const SCENARIOS = Object.freeze({
  reading: Object.freeze({
    id: "reading",
    label: "阅读 / 浏览",
    description: "大面积亮度稳定，仅有轻微滚动变化。",
    frames: readingFrames,
    features: features(
      ["稳定高亮区域", "轻微内容滚动", "结构基本保持", "变化频率较低"],
      [0.81, 0.8, 0.79, 0.78],
      [0.04, 0.08, 0.06, 0.05],
    ),
    probabilities: [
      { reading: 0.72, video: 0.16, gaming: 0.12 },
      { reading: 0.78, video: 0.13, gaming: 0.09 },
      { reading: 0.84, video: 0.1, gaming: 0.06 },
      { reading: 0.88, video: 0.08, gaming: 0.04 },
    ],
  }),
  video: Object.freeze({
    id: "video",
    label: "视频 / 电影",
    description: "亮暗区域连续移动，帧间变化平滑。",
    frames: videoFrames,
    features: features(
      ["横向亮区移动", "主体连续位移", "亮度梯度反转", "镜头区域重组"],
      [0.42, 0.47, 0.43, 0.41],
      [0.48, 0.56, 0.61, 0.58],
    ),
    probabilities: [
      { reading: 0.22, video: 0.58, gaming: 0.2 },
      { reading: 0.14, video: 0.68, gaming: 0.18 },
      { reading: 0.09, video: 0.76, gaming: 0.15 },
      { reading: 0.07, video: 0.81, gaming: 0.12 },
    ],
  }),
  gaming: Object.freeze({
    id: "gaming",
    label: "游戏",
    description: "局部高亮快速跳变，运动与操作触发变化明显。",
    frames: gamingFrames,
    features: features(
      ["中心区域突发高亮", "高亮区域快速右移", "局部亮区反向跳变", "高亮区域再次聚集"],
      [0.35, 0.42, 0.39, 0.4],
      [0.72, 0.83, 0.88, 0.81],
    ),
    probabilities: [
      { reading: 0.16, video: 0.24, gaming: 0.6 },
      { reading: 0.1, video: 0.2, gaming: 0.7 },
      { reading: 0.06, video: 0.16, gaming: 0.78 },
      { reading: 0.04, video: 0.12, gaming: 0.84 },
    ],
  }),
});

export function getScenario(id = "reading") {
  return SCENARIOS[id] ?? SCENARIOS.reading;
}

function boundedIndex(scenario, frameIndex) {
  return Math.min(scenario.frames.length - 1, Math.max(0, Math.trunc(frameIndex)));
}

export function getFrameFeatures(scenario, frameIndex) {
  return scenario.features[boundedIndex(scenario, frameIndex)];
}

export function getClassProbabilities(scenario, frameIndex) {
  return scenario.probabilities[boundedIndex(scenario, frameIndex)];
}
