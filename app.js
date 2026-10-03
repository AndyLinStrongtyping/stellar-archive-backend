require('dotenv').config({ quiet: true });

const express = require('express');
const adminRouter = require('./routers/admin.router');
const authRouter = require('./routers/auth.router');
const favoriteRouter = require('./routers/favorite.router');
const { galaxyRouter, planetRouter } = require('./routers/catalog.router');
const healthRouter = require('./routers/health.router');
const cors = require('cors');

const app = express();

const allowURL = [
  'http://localhost:5173',
  'https://2026nodeclass.github.io',
];

const corsOptions = {
  origin: allowURL,
};

app.use(cors(corsOptions));
app.use(express.json());

// 全域 middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next(); // 沒有結束回應，一定要 next() 才能往下走
});



app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/galaxies', galaxyRouter);
app.use('/api/planets', planetRouter);

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// 統一處理資料庫限制與非預期錯誤，避免把 SQL 細節暴露給前端。
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === '23505') {
    const message = err.constraint === 'users_email_unique_lower_idx'
      ? '此 Email 已註冊'
      : '資料已存在，請確認 ID 或座標是否重複';
    return res.status(409).json({ message });
  }
  if (err.code === '23503') {
    const message = req.method === 'DELETE'
      ? '此星系仍有行星，無法刪除'
      : '指定的星系不存在';
    return res.status(409).json({ message });
  }
  if (['23502', '23514', '22P02', '22001'].includes(err.code)) {
    return res.status(400).json({ message: '欄位格式或數值不符合規則' });
  }

  res.status(500).json({ message: '伺服器發生錯誤' });
});

module.exports = app;
