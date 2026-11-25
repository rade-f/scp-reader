# SCP-Reader · 控制 收容 保护

专为 SCP 基金会研究员设计的现代化优雅文档阅读器，遵循 **Apple Human Interface Guidelines (HIG)** 设计美学，融合极简拟态毛玻璃质感与高保真收容档案排版。

---

## 🌟 核心特性

- 🍎 **Apple HIG 视觉设计**：连续曲率超椭圆圆角（Squircle）、高饱和拟态毛玻璃（Liquid Glass Blur）、SF Pro 字体渲染体系与沉浸式黑白/深色双模。
- 📦 **高保真富排版隔离**：彻底解决 Wikidot 复杂主题（Sigma-9、Black Highlighter、ACS 异常等级盒、终端模拟器）对应用 UI 的污染，完整保留 100% 原始视觉震撼。
- ⚡ **三级自动降级数据链路**：
  1. **本地 SQLite 毫秒级缓存**：已阅即离线，断网秒开。
  2. **中文分部（SCP-CN）实时解析**：覆盖全量人工精校翻译及 CN 原创系列。
  3. **主站（SCP-EN）+ Gemini 3 Flash 深度译制**：未翻译文档自动嗅探并由 Google AI Studio 提供的 `gemini-3-flash-preview` 进行结构化翻译，严苛保护所有 HTML 标签与基金会专用术语。
- 🔍 **Spotlight 全局快搜 (⌘K / Ctrl+K)**：输入任意数字或代号，支持一键直达与模糊检索。
- 📑 **个人中心**：书签一键收藏、自动阅读历史足迹追踪。
- 📱 **多端就绪**：预留 PWA 与 Capacitor 支持，可一键输出 Android 原生 APK。

---

## 🚀 快速启动指南

### 1. 启动后端缓存服务 (Fastify + SQLite)
```bash
cd server
npm install
npm run dev
# 后端服务将运行在 http://localhost:3001
```

### 2. 启动前端阅读界面 (React + Vite + Tailwind)
```bash
cd client
npm install
npm run dev
# 前端服务将运行在 http://localhost:5173
```

---

## ☁️ 免安装 Android Studio 的云端打包 APK 方案 (GitHub Actions)

本机无需安装庞大的 Android Studio 或 Java 环境，只需将本仓库推送到 GitHub，即可利用 GitHub Actions 免费云端服务器自动完成 APK 打包并下载安装：

### 极速使用步骤：
1. **创建 GitHub 仓库并推送代码**：
   ```bash
   git add .
   git commit -m "feat: complete scp reader with offline data and android workflow"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
   git push -u origin main
   ```
2. **云端自动编译 (约 3~4 分钟)**：
   * 代码推送后，GitHub 会自动触发 `.github/workflows/build-apk.yml` 任务。
   * 你也可以在 GitHub 网页的 **Actions** 标签页中，手动点击 **Run workflow**。
3. **一键下载安装**：
   * 编译完成后，在 Actions 该次运行详情页底部的 **Artifacts** 区域，直接点击下载 `SCP-Reader-Offline-APK`。
   * 解压得到 `app-debug.apk`，传输到安卓手机上即可直接点击安装运行！

---

## 📦 离线全量数据打包说明

* **全量目录预装**：已将全量 12,400+ 篇官方中文标题与目录（涵盖 Series I~IX、CN I~III、-J）打包进 APK。
* **经典全文预装**：已预载前 28 篇最具代表性的经典收容档案（SCP-173, 096, 682, 049, 087, 999, 106, 3008, 2000, 3000, 5000, 6000, CN-2000 等）及其完整的富排版样式与图片。
* **独立内存渲染**：应用通过 `srcDoc` 在本地沙箱内存中直接渲染文档，在手机断网环境下完全独立运行，无需手机本地开启任何后台服务器！


---

## 🛠 技术栈一览

- **后端**：Node.js v22 + TypeScript + Fastify + Better-SQLite3 + Cheerio + Axios
- **AI 引擎**：Google AI Studio API (`gemini-3-flash-preview`)
- **前端**：React 18 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons
- **设计风格**：Apple Human Interface Guidelines (HIG)
