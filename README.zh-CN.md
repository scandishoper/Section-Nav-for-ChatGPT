# Section Nav for ChatGPT

[English](README.md) | [简体中文](README.zh-CN.md)

一个适用于 Microsoft Edge、Google Chrome 和 Firefox 的 Manifest V3 浏览器扩展，为当前阅读的 ChatGPT 回答提供轻量级标题导航和本地章节书签。

## 安装依赖

环境要求：

- Node.js 22.12 或更高版本
- npm 10 或更高版本

安装依赖：

```bash
npm install
```

## 开发

启动监听构建：

```bash
npm run dev
```

每次重新构建后，请在 `edge://extensions` 或 `chrome://extensions` 中刷新扩展，然后刷新 ChatGPT 页面。

开发 Firefox 版本时，可以运行：

```bash
npm run dev:firefox
```

## 构建

运行严格的 TypeScript 类型检查，并生成 Edge/Chrome 生产版本：

```bash
npm run build
```

Edge/Chrome 扩展将输出到 `dist/`。Firefox 142 或更高版本需要单独构建：

```bash
npm run build:firefox
```

Firefox 扩展将输出到 `dist-firefox/`。

## 加载未打包扩展

### Microsoft Edge

1. 打开 `edge://extensions`。
2. 开启**开发人员模式**。
3. 选择**加载解压缩的扩展**。
4. 选择本项目的 `dist/` 目录。
5. 打开或刷新 `https://chatgpt.com/`。

### Google Chrome

1. 打开 `chrome://extensions`。
2. 开启**开发者模式**。
3. 选择**加载已解压的扩展程序**。
4. 选择本项目的 `dist/` 目录。
5. 打开或刷新 `https://chatgpt.com/`。

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 选择**临时载入附加组件**。
3. 选择 `dist-firefox/manifest.json`。
4. 打开或刷新 `https://chatgpt.com/`。

Firefox 会在浏览器重启后移除临时附加组件。普通 Firefox 的永久安装需要经过 Mozilla 签名。

扩展会从 ChatGPT 页面的计算样式中获取文字和表面颜色，并跟随页面或系统主题变化，不依赖 ChatGPT 的类名。较长的章节导航会自动保持当前条目可见；书签抽屉具备对话框语义和键盘焦点管理；同时支持减少动态效果和强制颜色模式。

## 发布包

生成的扩展包不会提交到 Git。已签名或可提交商店的 ZIP/XPI 文件应通过 GitHub Releases 发布。

- Edge/Chrome：运行 `npm run build:edge`，将 `dist/` 内的内容打包，并确保 `manifest.json` 位于压缩包根目录。
- Firefox：运行 `npm run build:firefox`，将 `dist-firefox/` 内的内容打包，并确保 `manifest.json` 位于压缩包根目录。
- Firefox 永久分发需要 Mozilla 签名；开发时可以从 `about:debugging` 临时加载 `dist-firefox/manifest.json`。
- 商店文案、审核说明、隐私披露和推广素材分别位于 `store-listing/`、`firefox-listing/` 和 `store-assets/`。

## 仓库内容

- `src/`：Edge、Chrome 和 Firefox 共用的扩展源码。
- `manifest.json`：Edge 和 Chrome 的 Manifest V3 配置。
- `manifest.firefox.json`：Firefox 的 Manifest V3 配置。
- `assets/` 和 `public/icons/`：可编辑的品牌素材和扩展运行时图标。
- `packaging/`：本地安装说明。
- 依赖、构建结果、临时包和发布归档通过 `.gitignore` 排除。

## 架构

- `manifest.json`：声明 Manifest V3 内容脚本，并将页面访问范围限制为 `https://chatgpt.com/*`。
- `manifest.firefox.json`：增加固定的 Gecko 扩展 ID 和 Mozilla 数据收集声明。
- `src/content/index.tsx`：内容脚本入口，只挂载一次 React 应用。
- `src/content/extensionRoot.ts`：创建可重复调用的宿主元素和开放式 Shadow DOM 根节点。
- `src/content/chatgptAdapter.ts`：集中管理所有 ChatGPT 专用选择器和 DOM 访问方法。
- `src/content/answerTracker.ts`：根据视口阅读带对缓存的助手消息评分，并通过滞后机制稳定切换当前回答。
- `src/content/sectionParser.ts`：只解析当前回答，生成稳定的章节键、ID、标题级别和相对层级。
- `src/content/sectionTracker.ts`：根据视口阅读线追踪当前章节，滚动时不重新查询 DOM 树。
- `src/content/sectionNavigation.ts`：执行带顶部偏移的平滑滚动和临时目标高亮。
- `src/content/positionManager.ts`：监听当前回答尺寸与视口变化，选择完整、紧凑、极简或隐藏模式。
- `src/content/bookmarkService.ts`：验证并串行处理 `chrome.storage.local` 书签操作。
- `src/content/bookmarkResolver.ts`：通过精确匹配和兼容性回退解析已保存书签。
- `src/content/components/BookmarkDrawer.tsx`：渲染当前对话的书签列表。
- `src/content/conversationRouteWatcher.ts`：检测单页应用中的对话键变化并提供清理逻辑。
- `src/content/conversationWatcher.ts`：对 DOM 变更进行防抖，并区分当前回答变化和消息结构变化。
- `src/content/themeManager.ts`：将 ChatGPT 的计算颜色同步为 Shadow DOM CSS 变量。
- `src/content/components/`：包含隔离的 React 章节导航组件。
- `src/content/styles/extension.css`：包含作用域限定在 Shadow DOM 内的导航样式。
- `src/shared/`：包含文本规范化、哈希和核心数据类型。
- `src/content/App.tsx`：组合章节导航界面。
- `vite.config.ts`：输出固定名称的 `content.js`，并将对应浏览器清单复制到构建目录。

## DOM 适配层

所有 ChatGPT 专用选择器和 DOM 遍历都集中在 `src/content/chatgptAdapter.ts`。适配层目前提供对话键、对话容器、助手消息、消息 ID、消息内容和标题查询方法。优先使用稳定的 `data-*` 属性和语义选择器，`.markdown` 类仅作为最后的内容回退方案。

## 书签存储

书签保存在 `chrome.storage.local` 的 `chatgptSectionNav.bookmarks.v1` 键下。记录按对话键隔离，包含章节元数据和简短的回答指纹哈希。扩展不会将数据上传到服务器。

## 已知限制

- 版本 1.0.0 已支持浅色/深色主题同步、长列表当前项可见、减少动态效果和强制颜色模式。
- ChatGPT 的 DOM 虚拟化可能导致书签目标在对应回答挂载前暂时不可用。此状态不会删除书签或使其永久失效，并会在消息结构变化或重新进入对话时清除。
- 扩展目前只匹配 `https://chatgpt.com/*`。

如果 ChatGPT 调整 DOM 结构，`src/content/chatgptAdapter.ts` 是主要的兼容层更新入口。

## 许可证

本项目基于 [MIT License](LICENSE) 发布。Copyright (c) 2026 scandishoper。
