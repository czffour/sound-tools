# 音频设备管理工具 v1.1.1

这是一个基于 Vue 3 + Electron 开发的桌面应用程序，用于快速管理和切换 Windows 系统的音频设备。通过全局热键，你可以在不同的音频设备之间快速切换，提高工作效率。

## ✨ 主要功能

### 🎵 音频设备管理
- 自动检测和显示系统所有音频设备
- 实时监控设备连接状态
- 一键刷新设备列表
- 支持默认设备切换

### ⌨️ 热键绑定
- 为每个设备设置独立的全局快捷键
- 智能的快捷键冲突检测
- 一键清除热键设置
- 支持组合键（如 Ctrl+Alt+K）
- 支持媒体控制键（如 MediaPreviousTrack, MediaNextTrack）
- 支持音量控制键（如 AudioVolumeMute）

### 💾 配置管理
- 手动保存设备配置
- 配置持久化存储
- 一键清空所有配置
- 配置实时生效

## 🚀 快速开始

### 系统要求
- Windows 10 及以上
- 4GB 内存及以上
- 100MB 可用磁盘空间

### 安装步骤
1. 下载最新版本的安装包
2. 运行安装程序
3. 根据向导完成安装

## 💻 开发环境

### 环境要求
- Node.js >= 16
- npm >= 8 或 pnpm >= 8

### 开发命令
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建应用
pnpm build
pnpm electron:build
```

## 📖 使用指南

### 设备管理
1. 启动应用后，会自动扫描并显示所有可用的音频设备
2. 点击"刷新设备列表"可以更新设备列表
3. 设备列表显示每个设备的名称和当前状态

### 热键设置
1. 点击设备右侧的热键输入框
2. 在弹出的输入框中按下想要设置的按键组合
3. 设置完成后，可以通过该热键快速切换到对应设备
4. 点击 × 按钮可以清除已设置的热键

### 配置管理
1. 点击"保存配置"按钮保存当前设置
2. 点击"清空配置"可以重置所有设置
3. 重启应用后会加载上次保存的配置

## 🔧 常见问题

### 设备检测问题
- 确保设备已正确连接到系统
- 在系统声音设置中确认设备状态
- 尝试重新插拔设备
- 使用刷新按钮更新设备列表

### 热键问题
- 确保热键未被其他程序占用
- 检查设备是否已启用
- 尝试使用不同的热键组合
- 如果热键无响应，可以尝试重新设置

### 配置问题
- 如果配置出现异常，可以尝试清空配置
- 确保程序有足够的权限访问配置文件
- 重启应用后查看配置是否正确加载

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！在参与贡献之前，请确保：
1. Issue 中没有相同的问题
2. Pull Request 遵循项目的代码规范
3. 添加了必要的测试和文档

## 📄 许可证

[MIT License](LICENSE)

## 🔄 更新日志

### v1.1.1
- 优化了媒体键的支持
- 添加了对 MediaPreviousTrack/MediaNextTrack 等媒体控制键的支持
- 添加了对 AudioVolumeMute 等音量控制键的支持
- 修复了媒体键命名兼容性问题

### v1.1.0
- 优化了热键绑定功能
- 修复了清空配置后热键无法设置的问题
- 改进了设备状态监控的稳定性
- 优化了用户界面响应速度

### v1.0.0
- 首次发布
- 基础的音频设备管理功能
- 热键绑定功能
- 配置管理功能