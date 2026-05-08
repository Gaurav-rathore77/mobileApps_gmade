# 🎯 Centralized IP Configuration

## 📖 Kaise Use Karein

### IP Address Change Karne Ke Liye:

**SIRF EK JAGAH CHANGE KAREIN:**
```
shared-config.js
```

File me ye line dhundhein aur change karein:
```javascript
SERVER_IP: '192.168.1.8',  // 🎯 YAHAN CHANGE KAREIN
```

### Kyun Ye Approach:

1. **Single Source of Truth**: `shared-config.js` me IP change karein, sab jagah apply ho jayega
2. **Backend**: `backend/config/server.js` automatically `shared-config.js` se padhta hai
3. **Frontend**: `app/config/mobile.ts` `shared-config.js` ke IP se sync hota hai

### Files Structure:

```
firstOne/
├── shared-config.js              # 🎯 MAIN CONFIG FILE - YAHAN CHANGE KAREIN
├── backend/
│   ├── config/
│   │   └── server.js             # Uses shared-config.js
│   └── .env.example              # Environment variables template
└── app/
    └── config/
        └── mobile.ts             # Uses shared-config.js IP
```

### IP Change Karne Ka Process:

1. **Terminal me ipconfig run karein:**
   ```bash
   ipconfig
   ```

2. **IPv4 Address copy karein** (jaise: 192.168.1.8)

3. **shared-config.js me IP update karein:**
   ```javascript
   SERVER_IP: '192.168.1.8',  // New IP paste karein
   ```

4. **Backend restart karein:**
   ```bash
   cd backend
   npm start
   ```

5. **Frontend reload karein** (Metro bundler)

### Console Logs Check Karne:

**Backend Console:**
```
🔧 Server Config Loaded (from shared-config):
   📡 Server IP: 192.168.1.8
   🌐 Server URL: http://192.168.1.8:3000
```

**Frontend Console:**
```
🔧 Shared Config Loaded:
   📡 Server IP: 192.168.1.8
   🌐 Server URL: http://192.168.1.8:3000
```

### Environment Variables (Optional):

Agar environment variables use karna chahte hain, toh:
1. `backend/.env.example` copy karke `.env` banaayein
2. `.env` me IP set karein:
   ```
   SERVER_IP=192.168.1.8
   ```

### Benefits:

✅ **Ek jagah change, sab jagah apply**  
✅ **No manual IP changes in multiple files**  
✅ **Easy to maintain**  
✅ **Less chance of errors**  
✅ **Clear console logs for debugging**

### Troubleshooting:

**Agar IP change ke baad connection fail ho raha hai:**
1. Console logs check karein - IP sahi hai ya nahi
2. Backend restart karein
4. Frontend Metro bundler restart karein
5. Firewall check karein

**Agar warnings aa rahi hain:**
- Console me dekhein IP match kar raha hai ya nahi
- `shared-config.js`, `mobile.ts`, aur `server.js` me same IP hona chahiye
