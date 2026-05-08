// Centralized Server Configuration
// 🎯 CHANGE IP ADDRESS IN shared-config.js ONLY - WILL APPLY EVERYWHERE 🎯

const SHARED_CONFIG = require('../../shared-config');

const SERVER_CONFIG = {
  // Use shared config IP
  IP: process.env.SERVER_IP || SHARED_CONFIG.SERVER_IP,
  PORT: process.env.PORT || SHARED_CONFIG.PORT,
  
  // Auto-generated URLs
  get SERVER_URL() {
    return `http://${this.IP}:${this.PORT}`;
  },
  
  // Allowed origins for CORS - use shared config
  get ALLOWED_ORIGINS() {
    return SHARED_CONFIG.ALLOWED_ORIGINS;
  },
  
  // Database configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app',
  
  // ImageKit Configuration - use shared config
  IMAGEKIT: SHARED_CONFIG.IMAGEKIT
};

module.exports = SERVER_CONFIG;

// Log configuration on load
console.log('🔧 Server Config Loaded (from shared-config):');
console.log(`   📡 Server IP: ${SERVER_CONFIG.IP}`);
console.log(`   🌐 Server URL: ${SERVER_CONFIG.SERVER_URL}`);
console.log(`   🔗 Port: ${SERVER_CONFIG.PORT}`);
console.log(`   📸 ImageKit: ${SERVER_CONFIG.IMAGEKIT.URL_ENDPOINT}`);
