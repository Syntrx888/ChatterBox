// 后台运行脚本
// 用于保持 WebSocket 连接和接收消息通知

addEventListener('backgroundEvent', (resolve, reject, args) => {
  console.log('Background event triggered', args);
  
  // 这里可以执行后台任务
  // 例如：检查新消息、发送本地通知等
  
  resolve();
});

// 保持应用活跃
console.log('Background runner started');
