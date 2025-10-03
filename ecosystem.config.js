// PM2 配置文件
module.exports = {
  apps: [{
    name: 'citation-generator',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // 开发环境
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      CREEM_API_KEY: 'creem_test_4Fie5qeiWHO9bL99G5Yw6b',
      CREEM_PRODUCT_ID: 'prod_1hcYYAaYx0bWMGwtuGTPft'
    },
    
    // 生产环境
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      CREEM_API_KEY: 'your_production_api_key_here',
      CREEM_PRODUCT_ID: 'your_production_product_id_here',
      CREEM_WEBHOOK_SECRET: 'your_webhook_secret_here'
    }
  }]
};
