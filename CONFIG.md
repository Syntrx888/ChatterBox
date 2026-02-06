# ChatterBox 配置指南

本文档详细说明如何配置 ChatterBox 的各项功能。

## 目录

- [前端配置](#前端配置)
- [后端配置](#后端配置)
- [常见配置场景](#常见配置场景)
- [部署配置](#部署配置)

## 前端配置

前端配置文件位于：`client/src/config.js`

### 配置项说明

```javascript
export default {
  API_BASE_URL: 'http://localhost:3000',
  chatRoomName: 'ChatterBox',
  faviconUrl: '',
  defaultAvatar: ''
}
```

#### API_BASE_URL
- **类型**: String
- **默认值**: `'http://localhost:3000'`
- **说明**: 后端 API 的基础地址
- **示例**:
  - 开发环境: `'http://localhost:3000'`
  - 生产环境: `'https://api.yourdomain.com'`

#### chatRoomName
- **类型**: String
- **默认值**: `'ChatterBox'`
- **说明**: 聊天室的显示名称，会显示在页面标题和欢迎界面
- **示例**: `'我的聊天室'`, `'技术交流群'`

#### faviconUrl
- **类型**: String
- **默认值**: `''` (空字符串)
- **说明**: 网站图标的 URL
- **注意**: 留空时不显示图标
- **示例**: `'https://your-domain.com/favicon.png'`

#### defaultAvatar
- **类型**: String
- **默认值**: `''` (空字符串)
- **说明**: 用户默认头像的 URL
- **注意**: 留空时使用内置的占位图
- **示例**: `'https://your-domain.com/default-avatar.png'`

## 后端配置

后端配置文件位于：`server/config.js`

### 配置项说明

```javascript
module.exports = {
  port: 3000,
  host: '0.0.0.0',
  jwtSecret: 'chatterbox-secret-key-2024',
  defaultAvatar: ''
}
```

#### port
- **类型**: Number
- **默认值**: `3000`
- **说明**: 服务器监听的端口号
- **注意**: 确保端口未被其他服务占用
- **示例**: `8080`, `3000`

#### host
- **类型**: String
- **默认值**: `'0.0.0.0'`
- **说明**: 服务器监听的地址
- **说明**:
  - `'0.0.0.0'` - 监听所有网络接口（推荐用于生产环境）
  - `'localhost'` - 仅本地访问（推荐用于开发环境）
  - `'127.0.0.1'` - 仅本地访问

#### jwtSecret
- **类型**: String
- **默认值**: `'chatterbox-secret-key-2024'`
- **说明**: JWT Token 签名的密钥
- **重要**: 生产环境必须修改为强随机字符串
- **生成方法**: 使用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### defaultAvatar
- **类型**: String
- **默认值**: `''` (空字符串)
- **说明**: 用户注册时的默认头像
- **注意**: 应与前端配置保持一致
- **示例**: `'https://your-domain.com/default-avatar.png'`

## 常见配置场景

### 场景 1：本地开发环境

**前端配置** (`client/src/config.js`):
```javascript
export default {
  API_BASE_URL: 'http://localhost:3000',
  chatRoomName: '开发测试聊天室',
  faviconUrl: '',
  defaultAvatar: ''
}
```

**后端配置** (`server/config.js`):
```javascript
module.exports = {
  port: 3000,
  host: 'localhost',
  jwtSecret: 'dev-secret-key',
  defaultAvatar: ''
}
```

### 场景 2：生产环境部署

**前端配置** (`client/src/config.js`):
```javascript
export default {
  API_BASE_URL: 'https://api.yourdomain.com',
  chatRoomName: '公司内部聊天室',
  faviconUrl: 'https://your-domain.com/favicon.png',
  defaultAvatar: 'https://your-domain.com/default-avatar.png'
}
```

**后端配置** (`server/config.js`):
```javascript
module.exports = {
  port: 3000,
  host: '0.0.0.0',
  jwtSecret: 'your-strong-random-secret-key-here',
  defaultAvatar: 'https://your-domain.com/default-avatar.png'
}
```

### 场景 3：使用图床服务

如果你使用第三方图床服务（如阿里云 OSS、腾讯云 COS、GitHub 等）：

**前端配置** (`client/src/config.js`):
```javascript
export default {
  API_BASE_URL: 'http://localhost:3000',
  chatRoomName: 'ChatterBox',
  faviconUrl: 'https://your-oss-bucket.oss-cn-hangzhou.aliyuncs.com/favicon.png',
  defaultAvatar: 'https://your-oss-bucket.oss-cn-hangzhou.aliyuncs.com/default-avatar.png'
}
```

**后端配置** (`server/config.js`):
```javascript
module.exports = {
  port: 3000,
  host: '0.0.0.0',
  jwtSecret: 'your-secret-key',
  defaultAvatar: 'https://your-oss-bucket.oss-cn-hangzhou.aliyuncs.com/default-avatar.png'
}
```

## 部署配置

### 使用 Nginx 反向代理

如果你使用 Nginx 作为反向代理，需要配置 WebSocket 支持：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态文件
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用 PM2 管理进程

推荐使用 PM2 来管理 Node.js 进程：

**安装 PM2**:
```bash
npm install -g pm2
```

**启动后端**:
```bash
cd server
pm2 start index.js --name chatterbox-server
```

**查看状态**:
```bash
pm2 status
```

**查看日志**:
```bash
pm2 logs chatterbox-server
```

**开机自启**:
```bash
pm2 startup
pm2 save
```

## 安全建议

1. **修改 JWT 密钥**: 生产环境务必使用强随机字符串作为 `jwtSecret`
2. **使用 HTTPS**: 生产环境建议使用 HTTPS 协议
3. **配置防火墙**: 只开放必要的端口
4. **定期备份**: 定期备份数据库文件
5. **更新依赖**: 定期更新 npm 依赖包以修复安全漏洞

## 故障排查

### 问题 1：前端无法连接后端

**检查清单**:
- 确认 `API_BASE_URL` 配置正确
- 确认后端服务已启动
- 检查防火墙设置
- 查看浏览器控制台的错误信息

### 问题 2：WebSocket 连接失败

**检查清单**:
- 确认 Nginx 配置支持 WebSocket
- 检查 `API_BASE_URL` 使用的是 HTTP 还是 HTTPS
- 查看后端日志的连接信息

### 问题 3：头像显示异常

**检查清单**:
- 确认图片 URL 可访问
- 检查图片格式是否支持（.jpg, .jpeg, .png, .gif, .webp）
- 查看浏览器控制台的图片加载错误

## 更多帮助

如有其他问题，请查看 [README.md](./README.md) 或提交 Issue。
