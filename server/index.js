const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const JWT_SECRET = config.jwtSecret;
const PORT = config.port;
const HOST = config.host;

app.use(cors());
app.use(compression());
app.use(express.json());

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('认证失败'));
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Token无效'));
  }
  socket.userId = decoded.userId;
  socket.username = decoded.username;
  socket.avatar = decoded.avatar;
  next();
});

io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.username} (ID: ${socket.userId})`);

  db.all('SELECT * FROM messages WHERE is_revoked = 0 ORDER BY created_at DESC LIMIT 200', [], (err, messages) => {
    if (!err) {
      socket.emit('historyMessages', messages.reverse());
      console.log(`发送历史消息给 ${socket.username}: ${messages.length} 条`);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { content, token } = data;
    
    if (!token) {
      socket.emit('error', { message: '未授权，请重新登录' });
      console.log(`消息发送失败: ${socket.username} - 未授权`);
      return;
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      socket.emit('error', { message: '登录已过期，请重新登录' });
      console.log(`消息发送失败: ${socket.username} - Token无效`);
      return;
    }
    
    const userId = decoded.userId;
    const username = decoded.username;
    const avatar = decoded.avatar;
    
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('获取用户信息失败:', err);
        socket.emit('error', { message: '获取用户信息失败' });
        return;
      }

      if (!user) {
        socket.emit('error', { message: '该用户已被注销' });
        console.log(`消息发送失败: ${username} - 用户不存在`);
        return;
      }

      const message = {
        user_id: userId,
        username: username,
        avatar: user.avatar,
        content: content,
        is_revoked: 0
      };

      db.run('INSERT INTO messages (user_id, username, avatar, content, is_revoked) VALUES (?, ?, ?, ?, ?)',
        [message.user_id, message.username, message.avatar, message.content, message.is_revoked],
        function(err) {
          if (err) {
            console.error('保存消息失败:', err);
            return;
          }

          db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, msg) => {
            if (!err && msg) {
              io.emit('newMessage', msg);
              console.log(`新消息: ${username} - ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`);
            }
          });
        }
      );
    });
  });

  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.username} (ID: ${socket.userId})`);
  });
});

app.get('/api/check-username', (req, res) => {
  const { username } = req.query;
  const trimmedUsername = username ? username.trim() : '';

  if (!trimmedUsername) {
    return res.status(400).json({ error: '用户名不能为空' });
  }

  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
  }

  db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [trimmedUsername], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ error: '该昵称已被占用' });
    }

    res.json({ available: true });
  });
});

app.post('/api/register', async (req, res) => {
  const { username, password, avatar, self_description } = req.body;
  const trimmedUsername = username ? username.trim() : '';
  const trimmedPassword = password ? password.trim() : '';

  if (!trimmedUsername || !trimmedPassword) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return res.status(400).json({ error: '用户名长度必须在3-20个字符之间' });
  }

  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [trimmedUsername], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ error: '该昵称已被占用' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAvatar = avatar || config.defaultAvatar;

    db.run('INSERT INTO users (username, password, avatar, self_description) VALUES (?, ?, ?, ?)', [trimmedUsername, hashedPassword, userAvatar, self_description || ''], function(err) {
      if (err) {
        return res.status(500).json({ error: '注册失败' });
      }

      const token = jwt.sign({ userId: this.lastID, username: trimmedUsername, avatar: userAvatar }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, username: trimmedUsername, userId: this.lastID, avatar: userAvatar });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, username: user.username, userId: user.id, avatar: user.avatar });
  });
});

app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token无效' });
  }

  res.json({ valid: true, username: decoded.username, userId: decoded.userId });
});

app.get('/api/members', (req, res) => {
  db.all('SELECT id, username, avatar, self_description, created_at FROM users ORDER BY created_at DESC', [], (err, members) => {
    if (err) {
      return res.status(500).json({ error: '获取成员列表失败' });
    }
    res.json(members);
  });
});

app.post('/api/admin/setup', async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码长度至少为6位' });
  }

  db.get('SELECT * FROM admin_config', [], async (err, config) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (config) {
      return res.status(400).json({ error: '管理员密码已设置' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO admin_config (password) VALUES (?)', [hashedPassword], (err) => {
      if (err) {
        return res.status(500).json({ error: '设置失败' });
      }
      res.json({ success: true });
    });
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  db.get('SELECT * FROM admin_config', [], async (err, config) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!config) {
      return res.status(400).json({ error: '管理员密码未设置' });
    }

    const isValidPassword = await bcrypt.compare(password, config.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  });
});

app.get('/api/admin/check-setup', (req, res) => {
  db.get('SELECT * FROM admin_config', [], (err, config) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ isSetup: !!config });
  });
});

app.get('/api/admin/messages', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.isAdmin) {
    return res.status(401).json({ error: '未授权' });
  }

  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: '获取消息失败' });
    }
    res.json(messages);
  });
});

app.post('/api/admin/revoke-message', (req, res) => {
  const { messageId } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.isAdmin) {
    return res.status(401).json({ error: '未授权' });
  }

  db.run('DELETE FROM messages WHERE id = ?', [messageId], function(err) {
    if (err) {
      return res.status(500).json({ error: '撤回失败' });
    }

    io.emit('messageDeleted', { messageId });

    res.json({ success: true });
  });
});

app.get('/api/admin/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.isAdmin) {
    return res.status(401).json({ error: '未授权' });
  }

  db.all('SELECT id, username, avatar, self_description, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: '获取用户列表失败' });
    }
    res.json(users);
  });
});

app.delete('/api/admin/users/:userId', (req, res) => {
  const { userId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.isAdmin) {
    return res.status(401).json({ error: '未授权' });
  }

  db.run('DELETE FROM messages WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error('删除用户消息失败:', err);
    }
  });

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除用户失败' });
    }

    res.json({ success: true });
  });
});

app.get('/api/user/info', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: '未授权' });
  }

  db.get('SELECT id, username, avatar, self_description FROM users WHERE id = ?', [decoded.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '获取用户信息失败' });
    }
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  });
});

app.post('/api/user/avatar', (req, res) => {
  const { avatar } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: '未授权' });
  }

  if (!avatar) {
    return res.status(400).json({ error: '头像不能为空' });
  }

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const url = avatar.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => url.endsWith(ext));

  if (!hasValidExtension) {
    return res.status(400).json({ error: '只支持 .jpg, .jpeg, .png, .gif, .webp 格式的图片' });
  }

  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, decoded.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: '更新头像失败' });
    }
    res.json({ success: true, avatar });
  });
});

app.post('/api/user/description', (req, res) => {
  const { self_description } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: '未授权' });
  }

  if (self_description && self_description.length > 100) {
    return res.status(400).json({ error: '个人描述不能超过100个字符' });
  }

  db.run('UPDATE users SET self_description = ? WHERE id = ?', [self_description || '', decoded.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: '更新个人描述失败' });
    }
    res.json({ success: true });
  });
});

app.post('/api/user/password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: '未授权' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId], function(err) {
      if (err) {
        return res.status(500).json({ error: '修改密码失败' });
      }
      res.json({ success: true });
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log('ChatterBox Server 启动成功！');
  console.log('='.repeat(50));
  console.log(`服务器地址: http://${HOST}:${PORT}`);
  console.log(`Socket.IO 已就绪`);
  console.log(`数据库: SQLite`);
  console.log(`JWT 密钥: ${JWT_SECRET.substring(0, 20)}...`);
  console.log('='.repeat(50));
  console.log('等待客户端连接...\n');
});
