const express = require("express");
const path = require("path");
const app = express();
const SERVER_CONFIG = require("./config/server");
const port = SERVER_CONFIG.PORT || 3000;

require("dotenv").config();
const userRoutes = require("./routes/user");
const cors = require("cors");
const dbConnect = require("./config/db");
const productRoutes = require("./routes/product");
const profileRoutes = require("./routes/profile");
const proxyRoutes = require("./routes/proxy");
const mediaRoutes = require("./routes/media-simple");
const notificationRoutes = require("./routes/notification");
const pdfRoutes = require("./routes/pdf");
const imagekit = require("./config/image");

dbConnect();

// Configure CORS for web and mobile using centralized config
app.use(cors({
  origin: SERVER_CONFIG.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use("/user", userRoutes);
app.use("/product", productRoutes);
app.use("/profile", profileRoutes);
app.use("/proxy", proxyRoutes);
app.use("/media", mediaRoutes);
app.use("/notification", notificationRoutes);
app.use("/pdf", pdfRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.send("Backend is running! ✅");    
});

app.get("/test", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend connection test successful",
    timestamp: new Date().toISOString()
  });    
});

app.get("/test-uploads", (req, res) => {
  try {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'uploads');
    const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
    
    res.json({ 
      status: "OK", 
      message: "Uploads directory test",
      uploadsPath: uploadsPath,
      files: files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Uploads test failed",
      details: error.message 
    });
  }
});

// Mobile connectivity test endpoint
app.get("/mobile-test", (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  res.json({ 
    status: "OK", 
    message: "Mobile connectivity test successful",
    serverInfo: {
      clientIP: clientIP,
      userAgent: userAgent,
      timestamp: new Date().toISOString(),
      hostname: req.hostname,
      headers: req.headers
    }
  });
});

app.get("/auth/imagekit", (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

app.listen(SERVER_CONFIG.PORT, "0.0.0.0", () => {
  console.log(`Server running on ${SERVER_CONFIG.SERVER_URL}`);
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });