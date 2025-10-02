// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { validatePayload, generateCitation } = require('./src/citation');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态资源（前端）- 在 /mla 路径下
app.use('/mla', express.static(path.join(__dirname, 'public')));

// 健康检查
app.get('/mla/api/health', (req, res) => res.json({ ok: true }));

// 测试多路由：简单联通性测试（与 /mla 平行）
app.get('/hello', (req, res) => res.type('text/plain').send('hello'));

// 生成 MLA 9 引文
app.post('/mla/api/generate', (req, res) => {
  try {
    const { type, data } = req.body || {};
    const errors = validatePayload(type, data || {});
    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }
    const result = generateCitation(type, data || {});
    return res.json({ ok: true, type, data, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: '服务器内部错误' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MLA Generator server running at http://localhost:${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}/mla`);
  });
}

module.exports = app;
