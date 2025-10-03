#!/usr/bin/env node
// 日志清理脚本 - 删除超过指定天数的日志文件

const fs = require('fs');
const path = require('path');

const LOGS_DIR = 'logs';
const KEEP_DAYS = 30; // 保留30天的日志

function cleanupLogs() {
  if (!fs.existsSync(LOGS_DIR)) {
    console.log('📁 日志目录不存在，无需清理');
    return;
  }

  const files = fs.readdirSync(LOGS_DIR);
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - (KEEP_DAYS * 24 * 60 * 60 * 1000));

  let deletedCount = 0;
  let totalSize = 0;

  files.forEach(file => {
    if (file.endsWith('.log')) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = fs.statSync(filePath);
      const fileDate = new Date(stats.mtime);

      if (fileDate < cutoffDate) {
        const fileSize = stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
        totalSize += fileSize;
        console.log(`🗑️  删除过期日志: ${file} (${(fileSize / 1024).toFixed(2)} KB)`);
      }
    }
  });

  console.log(`✅ 日志清理完成:`);
  console.log(`   - 删除文件: ${deletedCount} 个`);
  console.log(`   - 释放空间: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - 保留天数: ${KEEP_DAYS} 天`);
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupLogs();
}

module.exports = cleanupLogs;
