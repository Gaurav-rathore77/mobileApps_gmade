// 🎯 SHARED CONFIGURATION - SINGLE SOURCE OF TRUTH 🎯
// Change IP address here only - applies to both frontend and backend

const SHARED_CONFIG = {
  // 🎯 CHANGE THIS IP ADDRESS ONLY HERE 🎯
  SERVER_IP: '192.168.1.6',
  
  // Server Configuration
  PORT: 3000,
  
  // Auto-generated URLs
  get SERVER_URL() {
    return `http://${this.SERVER_IP}:${this.PORT}`;
  },
  
  // Allowed origins for CORS
  get ALLOWED_ORIGINS() {
    return [
      `http://${this.SERVER_IP}:${this.PORT}`,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'exp://192.168.1.6:8081', // Expo development
      'exp://localhost:8081'
    ];
  },
  
  // API URLs for frontend
  get API_URLS() {
    return [
      `http://${this.SERVER_IP}:${this.PORT}`,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
  },
  
  // ImageKit Configuration
  IMAGEKIT: {
    URL_ENDPOINT: 'https://ik.imagekit.io/hvyv0mo68',
    DEFAULT_FOLDER: 'profiles'
  }
};

// For Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SHARED_CONFIG;
}

// Log configuration
console.log('🔧 Shared Config Loaded:');
console.log(`   📡 Server IP: ${SHARED_CONFIG.SERVER_IP}`);
console.log(`   🌐 Server URL: ${SHARED_CONFIG.SERVER_URL}`);
console.log(`   🔗 Port: ${SHARED_CONFIG.PORT}`);
