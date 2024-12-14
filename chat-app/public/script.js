const socket = io();

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// 添加消息到聊天窗口
function appendMessage(message, isOwnMessage) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.textAlign = isOwnMessage ? 'right' : 'left';
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 发送消息到服务器
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        appendMessage(`You: ${message}`, true);
        socket.emit('chat message', message);
        messageInput.value = '';
    }
});

// 接收消息
socket.on('chat message', (message) => {
    appendMessage(`Other: ${message}`, false);
});