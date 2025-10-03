#!/usr/bin/env node
// 测试Creem webhook的脚本

const axios = require('axios');

// 模拟checkout.completed事件
const mockCheckoutCompleted = {
  "id": "evt_5WHHcZPv7VS0YUsberIuOz",
  "eventType": "checkout.completed",
  "created_at": Date.now(),
  "object": {
    "id": "ch_4l0N34kxo16AhRKUHFUuXr",
    "object": "checkout",
    "request_id": "test_123456789",
    "order": {
      "id": "ord_4aDwWXjMLpes4Kj4XqNnUA",
      "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
      "product": "prod_d1AY2Sadk9YAvLI0pj97f",
      "amount": 449,
      "currency": "USD",
      "status": "paid",
      "type": "recurring",
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString(),
      "mode": "test"
    },
    "product": {
      "id": "prod_d1AY2Sadk9YAvLI0pj97f",
      "name": "test",
      "description": "test pay",
      "price": 449,
      "currency": "USD",
      "billing_type": "recurring",
      "billing_period": "every-month",
      "status": "active",
      "mode": "test"
    },
    "customer": {
      "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
      "object": "customer",
      "email": "test@example.com",
      "name": "Test User",
      "country": "US",
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString(),
      "mode": "test"
    },
    "subscription": {
      "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
      "object": "subscription",
      "product": "prod_d1AY2Sadk9YAvLI0pj97f",
      "customer": "cust_1OcIK1GEuVvXZwD19tjq2z",
      "collection_method": "charge_automatically",
      "status": "active",
      "canceled_at": null,
      "created_at": new Date().toISOString(),
      "updated_at": new Date().toISOString(),
      "metadata": {
        "userId": "test_user_123",
        "source": "citation_generator"
      },
      "mode": "test"
    },
    "custom_fields": [],
    "status": "completed",
    "metadata": {
      "userId": "test_user_123",
      "source": "citation_generator"
    },
    "mode": "test"
  }
};

// 模拟subscription.paid事件
const mockSubscriptionPaid = {
  "id": "evt_21mO1jWmU2QHe7u2oFV7y1",
  "eventType": "subscription.paid",
  "created_at": Date.now(),
  "object": {
    "id": "sub_6pC2lNB6joCRQIZ1aMrTpi",
    "object": "subscription",
    "product": {
      "id": "prod_d1AY2Sadk9YAvLI0pj97f",
      "name": "test",
      "description": "test pay",
      "price": 449,
      "currency": "USD",
      "billing_type": "recurring",
      "billing_period": "every-month",
      "status": "active",
      "mode": "test"
    },
    "customer": {
      "id": "cust_1OcIK1GEuVvXZwD19tjq2z",
      "object": "customer",
      "email": "test@example.com",
      "name": "Test User",
      "country": "US",
      "mode": "test"
    },
    "collection_method": "charge_automatically",
    "status": "active",
    "last_transaction_id": "tran_5yMaWzAl3jxuGJMCOrYWwk",
    "last_transaction_date": new Date().toISOString(),
    "next_transaction_date": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "current_period_start_date": new Date().toISOString(),
    "current_period_end_date": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "canceled_at": null,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString(),
    "metadata": {
      "userId": "test_user_123",
      "source": "citation_generator"
    },
    "mode": "test"
  }
};

async function testWebhook(eventData, eventName) {
  try {
    console.log(`🧪 Testing ${eventName} webhook...`);
    
    const response = await axios.post('https://junaitools.com/creem/webhook', eventData, {
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': 'test_signature_123' // 模拟签名
      }
    });
    
    console.log(`✅ ${eventName} webhook test successful:`, response.data);
  } catch (error) {
    console.error(`❌ ${eventName} webhook test failed:`, error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Creem webhook tests...\n');
  
  // 测试checkout.completed
  await testWebhook(mockCheckoutCompleted, 'checkout.completed');
  
  console.log('\n---\n');
  
  // 测试subscription.paid
  await testWebhook(mockSubscriptionPaid, 'subscription.paid');
  
  console.log('\n📝 Check creem-payments.log for detailed logs');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhook, mockCheckoutCompleted, mockSubscriptionPaid };
