const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 配置 Socket.IO，适配 Vercel 环境
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io/', // 明确指定路径
    transports: ['websocket', 'polling'], // 支持 WebSocket 和轮询
    pingTimeout: 60000,
});

app.use(cors());
app.use(express.static('public'));

// 健康检查路由
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// 添加基本的错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const users = new Map();

// Socket.IO 连接处理
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // 处理用户加入
    socket.on('user join', (username) => {
        users.set(socket.id, username);
        io.emit('user joined', {
            username: username,
            users: Array.from(users.values())
        });
        console.log(`${username} joined the chat`);
    });

    // 处理聊天消息
    socket.on('chat message', (msg) => {
        const username = users.get(socket.id);
        if (!username) return; // 安全检查

        const messageData = {
            username: username,
            message: msg,
            timestamp: new Date().toISOString()
        };
        
        io.emit('chat message', messageData);
        console.log(`Message from ${username}:`, msg);
    });

    // 处理断开连接
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (!username) return;

        users.delete(socket.id);
        io.emit('user left', {
            username: username,
            users: Array.from(users.values())
        });
        console.log(`${username} left the chat`);
    });

    // 错误处理
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// 导出 app 和 server 供 Vercel 使用
module.exports = app;

// 优雅退出处理
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});