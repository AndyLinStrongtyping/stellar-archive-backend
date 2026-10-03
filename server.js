require('dotenv').config({ quiet: true });

const app = require('./app');
const { pool } = require('./db/pg');
const { AppDataSource } = require('./db/typeorm/data-source');

let server;

async function closeDatabases() {
  const closingTasks = [pool.end()];
  if (AppDataSource.isInitialized) {
    closingTasks.push(AppDataSource.destroy());
  }
  await Promise.allSettled(closingTasks);
}

async function shutdown(signal) {
  console.log(`收到 ${signal}，正在關閉伺服器`);

  if (!server) {
    await closeDatabases();
    process.exit(0);
  }

  server.close(async (error) => {
    await closeDatabases();
    process.exit(error ? 1 : 0);
  });
}

async function startServer() {
  await AppDataSource.initialize();
  const port = process.env.PORT || 3010;

  server = app.listen(port, () => {
    console.log(`Server 啟動在 port ${port}`);
  });

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(async (error) => {
  console.error('伺服器啟動失敗：', error);
  await closeDatabases();
  process.exit(1);
});
