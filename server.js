// server.js (根目录的桥梁文件)
import app from './backend/src/app.js'; // 👈 指向你真正的后端入口

// Vercel Serverless 需要导出一个函数，而不是监听端口
export default app;