# Neural Network Visualizer

一个面向学习与技术汇报的交互式神经网络架构网页，用同一套交互方式展示 CNN、RNN、LSTM 和 GRU，并以连续背光帧演示“空间特征提取 → 时间建模 → 场景分类”的完整过程。

## 主要功能

- 切换并比较 CNN、RNN、LSTM、GRU 四种模型。
- 播放、暂停、单步推进和重置架构数据流。
- 调节 LSTM 三个门与 GRU 两个门，观察教学状态变化。
- 演示阅读、视频、游戏三类背光帧序列。
- 响应式布局，支持手机和桌面浏览器。
- GitHub Pages 自动部署。

## 本地运行

```bash
npm install
npm run serve
```

浏览器打开 `http://127.0.0.1:4173`。

## 测试

运行状态与场景数据单元测试：

```bash
npm test
```

运行真实 Chromium 浏览器交互测试：

```bash
npm run test:e2e
```

## 结构

```text
index.html              页面语义结构
assets/styles.css       响应式视觉样式
src/model-state.js      模型步骤与门值状态
src/renderers.js        SVG 架构图与播放计时器
src/scenarios.js        背光场景模拟数据
src/app.js              页面交互与渲染协调
tests/                  单元测试与浏览器测试
```

## 在线演示

仓库推送至 GitHub 后，Actions 会自动发布到该仓库的 GitHub Pages 地址。背光分类结果为教学模拟数据，不代表真实模型准确率。
