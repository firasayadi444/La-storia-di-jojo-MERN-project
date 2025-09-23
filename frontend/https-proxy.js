const https = require('https');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

// Create a simple self-signed certificate for development
const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

const options = {
  key: pems.private,
  cert: pems.cert,
};

// Create HTTPS server
const httpsServer = https.createServer(options, (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Proxy to Vite dev server
  const proxy = createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  });
  
  proxy(req, res);
});

const PORT = 3443;

httpsServer.listen(PORT, () => {
  console.log(`🔒 HTTPS Proxy running on https://localhost:${PORT}`);
  console.log(`📱 Access your app at: https://localhost:${PORT}`);
  console.log(`⚠️  You may need to accept the self-signed certificate in your browser`);
});

// Handle errors
httpsServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    httpsServer.listen(PORT + 1);
  } else {
    console.error('HTTPS Server error:', err);
  }
});

