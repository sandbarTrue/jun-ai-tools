# Creem Webhook 测试指南

## 🚀 快速开始

### 1. 启动服务器
```bash
npm start
```

### 2. 本地测试（推荐）
```bash
# 在另一个终端运行
npm run test:webhook
```

## 🌐 真实Webhook测试

### 方法1：使用ngrok（推荐）

1. **安装ngrok**
```bash
npm install -g ngrok
```

2. **启动服务器**
```bash
npm start
```

3. **启动ngrok隧道**
```bash
ngrok http 3000
```

4. **获取公网URL**
ngrok会显示类似：`https://abc123.ngrok.io`

5. **配置Creem Webhook**
- 登录Creem仪表板
- 进入Developers > Webhooks
- 设置Webhook URL: `https://abc123.ngrok.io/creem/webhook`
- 选择要监听的事件类型

### 方法2：使用其他隧道工具

#### localtunnel
```bash
npx localtunnel --port 3000
```

#### serveo
```bash
ssh -R 80:localhost:3000 serveo.net
```

## 🧪 测试流程

### 1. 测试支付流程
```bash
# 访问测试支付页面
http://localhost:3000/payment-test

# 或直接访问支付链接
http://localhost:3000/testPay
```

### 2. 使用测试卡
- 卡号：`4242 4242 4242 4242`
- 过期日期：任意未来日期
- CVV：任意3位数字

### 3. 查看日志
```bash
# 查看webhook日志
tail -f creem-payments.log
```

## 📊 监控和调试

### 1. 日志文件
所有webhook事件都会记录在 `creem-payments.log` 中：
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Checkout completed successfully",
  "data": {
    "checkout_id": "ch_4l0N34kxo16AhRKUHFUuXr",
    "customer_email": "test@example.com",
    "amount": 449
  }
}
```

### 2. 测试端点
- **支付测试**: `GET /testPay`
- **支付状态**: `GET /payment/status/:checkoutId`
- **成功页面**: `GET /payment/success`
- **Webhook**: `POST /creem/webhook`

### 3. 健康检查
```bash
curl http://localhost:3000/hello
curl http://localhost:3000/mla/api/health
```

## 🔐 安全配置

### 1. 环境变量
创建 `.env` 文件：
```env
CREEM_API_KEY=creem_test_4Fie5qeiWHO9bL99G5Yw6b
CREEM_PRODUCT_ID=prod_1hcYYAaYx0bWMGwtuGTPft
CREEM_WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000
```

### 2. 签名验证
Webhook会自动验证Creem签名，确保请求真实性。

## 📝 支持的事件类型

- `checkout.completed` - 支付完成
- `subscription.active` - 订阅激活
- `subscription.paid` - 订阅付费
- `subscription.canceled` - 订阅取消
- `subscription.expired` - 订阅过期
- `subscription.trialing` - 试用开始
- `subscription.paused` - 订阅暂停
- `subscription.update` - 订阅更新
- `refund.created` - 退款创建
- `dispute.created` - 争议创建

## 🐛 常见问题

### 1. Webhook未收到
- 检查ngrok是否正常运行
- 确认Creem仪表板中的webhook URL正确
- 查看服务器日志是否有错误

### 2. 签名验证失败
- 确认webhook secret配置正确
- 检查请求头中的`creem-signature`

### 3. 测试卡被拒绝
- 使用官方测试卡：`4242 4242 4242 4242`
- 确认在测试模式下运行

## 📞 支持

如有问题，请查看：
- Creem官方文档
- 项目日志文件
- 服务器控制台输出
