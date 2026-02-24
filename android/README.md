# ChatterBox Android 版本

这是 ChatterBox 的 Android 版本，基于 Capacitor 构建。

## 功能特性

- ✅ 实时聊天
- ✅ 成员列表
- ✅ 本地通知（新消息提醒）
- ✅ 用户注册/登录
- ✅ 头像和个性签名

## 环境要求

- Node.js 18+
- Java 17+
- Android SDK（可选，用于构建 APK）

## 快速开始

### 一键构建 APK

```
node build.js
```

构建完成后，APK 文件位于：
- `android/app/build/outputs/apk/debug/app-debug.apk`

## 手动构建步骤

如果需要手动控制构建过程，可以按以下步骤操作：

1. **安装依赖**
```bash
npm install
```

2. **初始化 Android 平台**（首次运行）
```bash
npx cap add android
```

3. **构建前端**
```bash
npm run build
```

4. **同步到 Android**
```bash
npx cap sync android
```

5. **打开 Android Studio**（可选）
```bash
npm run open
```

6. **在连接的设备上运行**
```bash
npm run run
```

## 配置说明

编辑 `capacitor.config.json` 可以修改应用配置：

```json
{
  "appId": "com.syntrx.chatterbox",
  "appName": "ChatterBox",
  "webDir": "dist"
}
```

编辑 `src/config.js` 可以修改应用设置：

```javascript
export default {
  API_BASE_URL: 'http://localhost:3000',
  chatRoomName: 'ChatterBox',
  defaultAvatar: '/default-avatar.png',
  faviconUrl: '/favicon.png'
}
```

## 与前端版本的区别

- ❌ 移除了管理员界面
- ✅ 添加了本地通知功能
- ✅ 集成了 Capacitor 用于打包 Android 应用

## 注意事项

1. **后端地址**：确保 `src/config.js` 中的 `API_BASE_URL` 指向正确的后端地址
2. **通知权限**：首次启动应用时会请求通知权限
3. **网络连接**：确保设备可以访问后端服务器

## 故障排除

### 构建失败

如果遇到构建问题，请确保：
- Node.js 版本 >= 18
- Java 版本 >= 17
- 已安装 Android SDK（如果需要构建 APK）

### 通知不工作

检查：
- 应用是否有通知权限
- 设备是否启用了通知
- 应用是否在后台运行

### 连接失败

检查：
- 后端服务器是否运行
- `API_BASE_URL` 配置是否正确
- 网络连接是否正常

## 许可证

MIT
