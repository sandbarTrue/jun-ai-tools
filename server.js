// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const { validatePayload, generateCitation } = require('./src/citation');

const app = express();
const PORT = process.env.PORT || 3000;

// 环境检测 - 支持多种方式
let environment = 'development'; // 默认开发环境

// 1. 优先从环境变量读取
if (process.env.NODE_ENV) {
  environment = process.env.NODE_ENV;
}
// 2. 从配置文件读取 (如果存在)
else if (fs.existsSync('.env')) {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const envMatch = envFile.match(/NODE_ENV\s*=\s*(\w+)/);
    if (envMatch) {
      environment = envMatch[1];
    }
  } catch (error) {
    console.log('⚠️ 无法读取 .env 文件，使用默认环境');
  }
}
// 3. 从机器环境变量读取
else if (process.env.ENVIRONMENT) {
  environment = process.env.ENVIRONMENT;
}

const isProduction = environment === 'production';
const isDevelopment = !isProduction;

// Creem API 配置 - 根据环境自动切换
const CREEM_API_KEY = process.env.CREEM_API_KEY || (isProduction ? 'your_production_api_key_here' : 'creem_test_4Fie5qeiWHO9bL99G5Yw6b');
const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID || (isProduction ? 'your_production_product_id_here' : 'prod_1hcYYAaYx0bWMGwtuGTPft');
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || 'your_webhook_secret_here';

// Creem API 端点配置
const CREEM_API_BASE_URL = isProduction ? 'https://api.creem.io' : 'https://test-api.creem.io';

console.log(`🔧 Environment: ${environment.toUpperCase()} (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})`);
console.log(`🔗 Creem API: ${CREEM_API_BASE_URL}`);
console.log(`🔑 API Key: ${CREEM_API_KEY.substring(0, 10)}...`);
console.log(`📁 Config source: ${process.env.NODE_ENV ? 'NODE_ENV' : fs.existsSync('.env') ? '.env file' : process.env.ENVIRONMENT ? 'ENVIRONMENT' : 'default'}`);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志记录功能 - 按日期分割
const getLogFileName = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // 本地开发环境使用相对路径，生产环境使用绝对路径
  const logDir = process.env.LOG_DIR || (isDevelopment ? './logs' : '/home/ztshkzhkyl/log');
  return `${logDir}/app-${today}.log`;
};

const ensureLogsDir = () => {
  const logDir = process.env.LOG_DIR || (isDevelopment ? './logs' : '/home/ztshkzhkyl/log');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

const logToFile = (message, data = null, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data: data || {}
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  ensureLogsDir();
  const logFile = getLogFileName();
  fs.appendFileSync(logFile, logLine);
  
  // 控制台输出 - 带颜色
  const levelColor = {
    'INFO': '\x1b[36m',    // 青色
    'WARN': '\x1b[33m',    // 黄色
    'ERROR': '\x1b[31m',   // 红色
    'SUCCESS': '\x1b[32m'  // 绿色
  };
  const resetColor = '\x1b[0m';
  const color = levelColor[level] || levelColor['INFO'];
  
  console.log(`${color}[${timestamp}] [${level}]${resetColor} ${message}`, 
    data ? JSON.stringify(data, null, 2) : '');
};

// 根路径 - 导航页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MLA引文生成器页面
app.get('/mla', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mla.html'));
});

// 法律页面路由 - 在 /mla 路径下
app.get('/mla/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/mla/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/mla/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

// 静态资源（前端）- 在 /mla 路径下
// 静态文件服务 - 为 /mla 路径下的静态资源提供服务
app.use('/mla/static', express.static(path.join(__dirname, 'public')));

// 支付测试页面
app.get('/payment-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-test.html'));
});

// 健康检查
app.get('/mla/api/health', (req, res) => res.json({ ok: true }));

// 测试多路由：简单联通性测试（与 /mla 平行）
app.get('/hello', (req, res) => res.type('text/plain').send('hello'));

// 支付页面路由
app.get('/testPay', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment - Citation Generator</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div class="text-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800 mb-2">💳 Citation Generator Pro</h1>
                <p class="text-gray-600">Unlock unlimited citations with premium features</p>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-semibold text-blue-800">Premium Plan</h3>
                        <p class="text-sm text-blue-600">Unlimited citations • All formats • Priority support</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-blue-800">$4.49</div>
                        <div class="text-sm text-blue-600">one-time</div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-center text-sm text-gray-600">
                    <span class="text-green-500 mr-2">✓</span>
                    MLA, APA, Chicago, Harvard, IEEE formats
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <span class="text-green-500 mr-2">✓</span>
                    Unlimited citation generation
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <span class="text-green-500 mr-2">✓</span>
                    Export to multiple formats
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <span class="text-green-500 mr-2">✓</span>
                    Priority customer support
                </div>
            </div>
            
            <div class="mt-6">
                <button 
                    id="payButton" 
                    class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    🚀 Pay $4.49 Now
                </button>
                
                <div id="loading" class="hidden text-center mt-4">
                    <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p class="text-sm text-gray-600 mt-2">Creating payment session...</p>
                </div>
            </div>
            
            <div class="mt-4 text-center">
                <a href="/mla" class="text-sm text-gray-500 hover:text-gray-700">
                    ← Back to Citation Generator
                </a>
            </div>
        </div>

        <script>
            document.getElementById('payButton').addEventListener('click', async function() {
                const button = this;
                const loading = document.getElementById('loading');
                
                button.disabled = true;
                button.classList.add('opacity-50');
                loading.classList.remove('hidden');
                
                try {
                    const response = await fetch('/api/create-checkout', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_id: '${CREEM_PRODUCT_ID}',
                            metadata: {
                                userId: 'user_' + Date.now(),
                                source: 'citation_generator'
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to create checkout session');
                    }
                    
                    const data = await response.json();
                    window.location.href = data.checkout_url;
                    
                } catch (error) {
                    console.error('Payment error:', error);
                    alert('Payment setup failed. Please try again.');
                    button.disabled = false;
                    button.classList.remove('opacity-50');
                    loading.classList.add('hidden');
                }
            });
        </script>
    </body>
    </html>
  `);
});

// 创建结账会话的API
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { product_id, metadata } = req.body;
    
    logToFile('Creating Creem checkout session', {
      product_id: product_id || CREEM_PRODUCT_ID,
      metadata: metadata
    }, 'INFO');

    // 使用测试API端点
    const response = await axios.post(
      `${CREEM_API_BASE_URL}/v1/checkouts`,
      {
        product_id: product_id || CREEM_PRODUCT_ID,
        request_id: `checkout_${Date.now()}`,
        metadata: metadata || {
          userId: 'user_' + Date.now(),
          source: 'citation_generator'
        },
        success_url: `${req.protocol}://${req.get('host')}/payment/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment/cancel`
      },
      {
        headers: { 
          'x-api-key': CREEM_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    logToFile('Creem checkout session created successfully', {
      checkout_url: response.data.checkout_url,
      checkout_id: response.data.id,
      request_id: response.data.request_id
    }, 'SUCCESS');

    res.json({
      success: true,
      checkout_url: response.data.checkout_url,
      checkout_id: response.data.id
    });

  } catch (error) {
    logToFile('Error creating Creem checkout session', {
      error: error.message,
      response: error.response && error.response.data,
      status: error.response && error.response.status
    }, 'ERROR');
    
    console.error('Error creating checkout:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// 验证Creem签名
const verifyCreemSignature = (payload, signature, secret) => {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return computedSignature === signature;
};

// Creem Webhook 处理 - 轻量级备份处理
app.post('/creem/webhook', (req, res) => {
  try {
    const webhookData = req.body;
    const eventType = webhookData.eventType || webhookData.type;
    const creemSignature = req.headers['creem-signature'];
    
    // 验证签名（可选，但推荐）
    if (creemSignature && CREEM_WEBHOOK_SECRET !== 'your_webhook_secret_here') {
      const payload = JSON.stringify(req.body);
      const isValidSignature = verifyCreemSignature(payload, creemSignature, CREEM_WEBHOOK_SECRET);
      
      if (!isValidSignature) {
        logToFile('Invalid webhook signature', {
          received_signature: creemSignature,
          event_type: eventType
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    logToFile('Creem webhook received', {
      event_type: eventType,
      webhook_id: webhookData.id,
      created_at: webhookData.created_at
    });

    // 轻量级处理 - 只记录关键事件，不做复杂业务逻辑
    switch (eventType) {
      case 'checkout.completed':
        logToFile('✅ Webhook: Checkout completed (backup confirmation)', {
          checkout_id: webhookData.object && webhookData.object.id,
          request_id: webhookData.object && webhookData.object.request_id,
          customer_email: webhookData.object && webhookData.object.customer && webhookData.object.customer.email,
          amount: webhookData.object && webhookData.object.order && webhookData.object.order.amount,
          note: 'Primary handling via redirect URL'
        });
        break;

      case 'subscription.paid':
        logToFile('💰 Webhook: Subscription payment received', {
          subscription_id: webhookData.object && webhookData.object.id,
          customer_email: webhookData.object && webhookData.object.customer && webhookData.object.customer.email,
          amount: webhookData.object && webhookData.object.product && webhookData.object.product.price,
          next_payment: webhookData.object && webhookData.object.next_transaction_date
        });
        break;

      case 'subscription.canceled':
        logToFile('❌ Webhook: Subscription cancelled', {
          subscription_id: webhookData.object && webhookData.object.id,
          customer_email: webhookData.object && webhookData.object.customer && webhookData.object.customer.email,
          canceled_at: webhookData.object && webhookData.object.canceled_at
        });
        break;

      case 'refund.created':
        logToFile('💸 Webhook: Refund processed', {
          refund_id: webhookData.object && webhookData.object.id,
          amount: webhookData.object && webhookData.object.refund_amount,
          reason: webhookData.object && webhookData.object.reason
        });
        break;

      case 'dispute.created':
        logToFile('⚠️ Webhook: Dispute created', {
          dispute_id: webhookData.object && webhookData.object.id,
          amount: webhookData.object && webhookData.object.amount,
          customer_email: webhookData.object && webhookData.object.customer && webhookData.object.customer.email
        });
        break;

      default:
        logToFile('📝 Webhook: Other event', {
          event_type: eventType,
          webhook_id: webhookData.id,
          note: 'Event logged for reference'
        });
    }

    // 返回成功响应给 Creem
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event_type: eventType
    });

  } catch (error) {
    logToFile('Error processing Creem webhook', {
      error: error.message,
      webhook_data: req.body
    });
    
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to process webhook'
    });
  }
});

// 支付状态查询路由
app.get('/payment/status/:checkoutId', async (req, res) => {
  try {
    const { checkoutId } = req.params;
    
    logToFile('Checking payment status', { checkout_id: checkoutId });

    // 使用测试API端点
    const response = await axios.get(
      `${CREEM_API_BASE_URL}/v1/checkouts/${checkoutId}`,
      {
        headers: { 
          'x-api-key': CREEM_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    logToFile('Payment status retrieved', {
      checkout_id: checkoutId,
      status: response.data.status,
      request_id: response.data.request_id,
      metadata: response.data.metadata
    });

    res.json({
      success: true,
      checkout_id: checkoutId,
      status: response.data.status,
      request_id: response.data.request_id,
      metadata: response.data.metadata,
      created_at: response.data.created_at,
      mode: response.data.mode
    });

  } catch (error) {
    logToFile('Error checking payment status', {
      checkout_id: req.params.checkoutId,
      error: error.message,
      status: error.response && error.response.status
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to check payment status',
      details: error.message
    });
  }
});

// 验证Creem重定向签名
const verifyRedirectSignature = (params, signature, apiKey) => {
  const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id } = params;
  
  // 构建签名字符串（根据Creem文档）
  const data = [
    `checkout_id=${checkout_id || ''}`,
    `order_id=${order_id || ''}`,
    `customer_id=${customer_id || ''}`,
    `subscription_id=${subscription_id || ''}`,
    `product_id=${product_id || ''}`,
    `request_id=${request_id || ''}`,
    `salt=${apiKey}`
  ].join('|');
  
  const computedSignature = crypto.createHash('sha256').update(data).digest('hex');
  return computedSignature === signature;
};

// 支付成功页面
app.get('/payment/success', async (req, res) => {
  const { checkout_id, order_id, customer_id, subscription_id, product_id, request_id, signature } = req.query;
  
  logToFile('Payment success page accessed', {
    checkout_id,
    order_id,
    customer_id,
    subscription_id,
    product_id,
    request_id,
    signature: signature ? signature.substring(0, 10) + '...' : null
  });

  let paymentStatus = 'unknown';
  let paymentDetails = {};
  let signatureValid = false;

  // 验证签名
  if (signature && checkout_id) {
    const params = { checkout_id, order_id, customer_id, subscription_id, product_id, request_id };
    signatureValid = verifyRedirectSignature(params, signature, CREEM_API_KEY);
    
    if (signatureValid) {
      logToFile('Payment signature verified successfully', { checkout_id });
      
      // 查询支付状态
      try {
        const response = await axios.get(
          `${CREEM_API_BASE_URL}/v1/checkouts/${checkout_id}`,
          {
            headers: { 
              'x-api-key': CREEM_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        paymentStatus = response.data.status;
        paymentDetails = {
          amount: response.data.amount,
          currency: response.data.currency,
          created_at: response.data.created_at
        };
        
        logToFile('Payment status retrieved', {
          checkout_id,
          status: paymentStatus,
          amount: paymentDetails.amount
        });
        
      } catch (error) {
        logToFile('Error retrieving payment status', {
          checkout_id,
          error: error.message
        });
      }
    } else {
      logToFile('Invalid payment signature', { checkout_id, signature: signature.substring(0, 10) + '...' });
    }
  }

  // 根据支付状态显示不同内容
  const isPaymentSuccessful = paymentStatus === 'completed' || paymentStatus === 'paid';
  const isPaymentFailed = paymentStatus === 'failed' || paymentStatus === 'declined';
  const isPaymentCancelled = paymentStatus === 'cancelled' || paymentStatus === 'canceled';
  const isPaymentPending = paymentStatus === 'pending' || paymentStatus === 'processing';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment ${isPaymentSuccessful ? 'Successful' : isPaymentFailed ? 'Failed' : isPaymentCancelled ? 'Cancelled' : 'Status'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div class="text-${isPaymentSuccessful ? 'green' : isPaymentFailed ? 'red' : isPaymentCancelled ? 'yellow' : 'blue'}-500 text-6xl mb-4">
                ${isPaymentSuccessful ? '✅' : isPaymentFailed ? '❌' : isPaymentCancelled ? '⚠️' : '⏳'}
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">
                ${isPaymentSuccessful ? 'Payment Successful!' : 
                  isPaymentFailed ? 'Payment Failed' : 
                  isPaymentCancelled ? 'Payment Cancelled' : 
                  'Payment Processing...'}
            </h1>
            <p class="text-gray-600 mb-6">
                ${isPaymentSuccessful 
                  ? 'Thank you for your payment. Your subscription is now active.' 
                  : isPaymentFailed
                  ? 'We were unable to process your payment. Please try again or use a different payment method.'
                  : isPaymentCancelled
                  ? 'Your payment was cancelled. No charges have been made to your account.'
                  : 'We are processing your payment. You will receive a confirmation email shortly.'}
            </p>
            
            <div class="bg-gray-50 p-4 rounded-lg text-left text-sm mb-4">
                <h3 class="font-semibold mb-2">Payment Details:</h3>
                <p><strong>Checkout ID:</strong> ${checkout_id || 'N/A'}</p>
                <p><strong>Order ID:</strong> ${order_id || 'N/A'}</p>
                <p><strong>Customer ID:</strong> ${customer_id || 'N/A'}</p>
                <p><strong>Subscription ID:</strong> ${subscription_id || 'N/A'}</p>
                <p><strong>Request ID:</strong> ${request_id || 'N/A'}</p>
                <p><strong>Status:</strong> ${paymentStatus}</p>
                <p><strong>Signature Valid:</strong> ${signatureValid ? 'Yes' : 'No'}</p>
                ${paymentDetails.amount ? `<p><strong>Amount:</strong> ${paymentDetails.amount} ${paymentDetails.currency}</p>` : ''}
            </div>
            
            ${isPaymentSuccessful ? `
            <div class="bg-green-50 p-4 rounded-lg mb-4">
                <h3 class="font-semibold text-green-800 mb-2">🎉 Pro Features Unlocked!</h3>
                <ul class="text-sm text-green-700 space-y-1">
                    <li>✓ All citation formats (MLA, APA, Chicago, Harvard, IEEE)</li>
                    <li>✓ Unlimited citation generation</li>
                    <li>✓ Export to HTML format</li>
                    <li>✓ Priority customer support</li>
                </ul>
            </div>
            ` : ''}
            
            <div class="mt-6">
                ${isPaymentSuccessful ? `
                    <a href="/mla" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Continue to Citation Generator
                    </a>
                ` : isPaymentFailed ? `
                    <div class="space-y-3">
                        <a href="/testPay" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block">
                            Try Again
                        </a>
                        <a href="/mla" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors block">
                            Continue with Free Version
                        </a>
                    </div>
                ` : isPaymentCancelled ? `
                    <div class="space-y-3">
                        <a href="/testPay" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block">
                            Try Again
                        </a>
                        <a href="/mla" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors block">
                            Continue with Free Version
                        </a>
                    </div>
                ` : `
                    <a href="/mla" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Continue to Citation Generator
                    </a>
                `}
            </div>
            
            ${!isPaymentSuccessful ? `
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    If you have any questions, contact us at 
                    <a href="mailto:support@junaitools.com" class="text-blue-600 hover:underline">
                        support@junaitools.com
                    </a>
                </p>
            </div>
            ` : ''}
        </div>
    </body>
    </html>
  `);
});

// 支付取消页面
app.get('/payment/cancel', (req, res) => {
  const { checkout_id, reason } = req.query;
  
  logToFile('Payment cancelled by user', {
    checkout_id,
    reason: reason || 'user_cancelled'
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Cancelled</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div class="text-yellow-500 text-6xl mb-4">⚠️</div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>
            <p class="text-gray-600 mb-6">Your payment was cancelled. No charges have been made to your account.</p>
            
            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
                <h3 class="font-semibold text-yellow-800 mb-2">What happened?</h3>
                <p class="text-sm text-yellow-700">
                    You cancelled the payment process. This could be because you:
                </p>
                <ul class="text-sm text-yellow-700 mt-2 space-y-1 text-left">
                    <li>• Changed your mind</li>
                    <li>• Wanted to review the terms first</li>
                    <li>• Had technical difficulties</li>
                </ul>
            </div>
            
            <div class="space-y-3">
                <a href="/testPay" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block">
                    Try Again
                </a>
                <a href="/mla" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors block">
                    Continue with Free Version
                </a>
            </div>
            
            <div class="mt-6">
                <p class="text-sm text-gray-500">
                    Need help? Contact us at 
                    <a href="mailto:support@junaitools.com" class="text-blue-600 hover:underline">
                        support@junaitools.com
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 支付失败页面
app.get('/payment/failed', (req, res) => {
  const { checkout_id, error, reason } = req.query;
  
  logToFile('Payment failed', {
    checkout_id,
    error,
    reason
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div class="text-red-500 text-6xl mb-4">❌</div>
            <h1 class="text-2xl font-bold text-gray-800 mb-4">Payment Failed</h1>
            <p class="text-gray-600 mb-6">We were unable to process your payment. Please try again or use a different payment method.</p>
            
            <div class="bg-red-50 p-4 rounded-lg mb-6">
                <h3 class="font-semibold text-red-800 mb-2">Common reasons for payment failure:</h3>
                <ul class="text-sm text-red-700 space-y-1 text-left">
                    <li>• Insufficient funds</li>
                    <li>• Card declined by bank</li>
                    <li>• Incorrect card details</li>
                    <li>• Card expired</li>
                    <li>• International transaction blocked</li>
                </ul>
            </div>
            
            <div class="space-y-3">
                <a href="/testPay" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block">
                    Try Again
                </a>
                <a href="/mla" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors block">
                    Continue with Free Version
                </a>
            </div>
            
            <div class="mt-6">
                <p class="text-sm text-gray-500">
                    Still having trouble? Contact us at 
                    <a href="mailto:support@junaitools.com" class="text-blue-600 hover:underline">
                        support@junaitools.com
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `);
});

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
    console.log(`🚀 Citation Generator server running at http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔗 Creem API: ${CREEM_API_BASE_URL}`);
    console.log(`📚 Access the application at: http://localhost:${PORT}/mla`);
    console.log(`💳 Test Creem payment at: http://localhost:${PORT}/testPay`);
    console.log(`🔗 Creem webhook endpoint: http://localhost:${PORT}/creem/webhook`);
    console.log(`📊 Payment status check: http://localhost:${PORT}/payment/status/:checkoutId`);
    console.log(`📄 Legal pages:`);
    console.log(`   - Terms: http://localhost:${PORT}/mla/terms`);
    console.log(`   - Privacy: http://localhost:${PORT}/mla/privacy`);
    console.log(`   - Pricing: http://localhost:${PORT}/mla/pricing`);
    const logDir = process.env.LOG_DIR || '/home/ztshkzhkyl/log';
    console.log(`📝 Logs will be saved to: ${logDir}/app-YYYY-MM-DD.log`);
    
    // 记录应用启动日志
    logToFile('Application started', {
      port: PORT,
      environment: isProduction ? 'production' : 'development',
      creem_api: CREEM_API_BASE_URL,
      timestamp: new Date().toISOString()
    }, 'SUCCESS');
  });
  
  // 优雅关闭处理
  process.on('SIGTERM', () => {
    logToFile('Application shutting down (SIGTERM)', {}, 'WARN');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    logToFile('Application shutting down (SIGINT)', {}, 'WARN');
    process.exit(0);
  });
}

module.exports = app;
