# 🔒 HTTPS Setup Guide for OrderApp

## Quick Start (Development)

### Option 1: Vite HTTPS (Recommended for Development)

I've already enabled HTTPS in your Vite config. Now run:

```bash
# Frontend (HTTPS enabled)
cd frontend
npm run dev

# Backend (HTTP - will work with HTTPS frontend)
cd backend
npm start
```

**Access your app at:** `https://localhost:3000`

### Option 2: Using mkcert (Better for Development)

1. **Install mkcert:**
   ```bash
   # Windows (using Chocolatey)
   choco install mkcert
   
   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create certificates:**
   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Update Vite config to use custom certificates:**
   ```typescript
   // frontend/vite.config.ts
   import fs from 'fs';
   
   export default defineConfig(({ mode }) => ({
     server: {
       host: "0.0.0.0",
       port: 3000,
       https: {
         key: fs.readFileSync('localhost-key.pem'),
         cert: fs.readFileSync('localhost.pem'),
       },
       proxy: {
         '/api': {
           target: 'http://localhost:5000',
           changeOrigin: true,
           secure: false,
         },
       },
     },
   }));
   ```

## Production HTTPS Setup

### Option 1: Using Nginx (Recommended)

1. **Install Nginx**
2. **Create SSL certificates** (Let's Encrypt recommended)
3. **Configure Nginx:**

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Option 2: Using Docker with HTTPS

1. **Create docker-compose.override.yml:**
```yaml
version: '3.8'
services:
  frontend:
    ports:
      - "443:80"
    environment:
      - HTTPS=true
    volumes:
      - ./ssl:/etc/nginx/ssl
    command: nginx -g "daemon off;"
```

2. **Update nginx config for HTTPS**

### Option 3: Using Cloudflare (Easiest for Production)

1. **Add your domain to Cloudflare**
2. **Enable "Always Use HTTPS"**
3. **Set SSL/TLS mode to "Full"**
4. **Deploy your app normally**

## Testing HTTPS

### Check if HTTPS is working:

1. **Open browser dev tools**
2. **Go to Console**
3. **Try the geolocation feature**
4. **Should work without "secure origins" error**

### Verify SSL Certificate:

```bash
# Check certificate
openssl s_client -connect localhost:3000 -servername localhost

# Or visit in browser and check the lock icon
```

## Troubleshooting

### Common Issues:

1. **"Not Secure" warning in browser:**
   - Click "Advanced" → "Proceed to localhost"
   - Or use mkcert for trusted certificates

2. **CORS errors:**
   - Make sure backend allows HTTPS origins (already configured)

3. **Mixed content errors:**
   - Ensure all resources use HTTPS
   - Check API calls are using HTTPS

### Development vs Production:

- **Development:** Use Vite HTTPS or mkcert
- **Production:** Use Nginx + Let's Encrypt or Cloudflare

## Quick Commands

```bash
# Start with HTTPS (development)
cd frontend && npm run dev
cd backend && npm start

# Access: https://localhost:3000

# Check if geolocation works
# Open browser console - should see no "secure origins" errors
```

## Security Notes

- ✅ HTTPS enables geolocation API
- ✅ Secure data transmission
- ✅ Better SEO ranking
- ✅ Required for PWA features
- ✅ Required for service workers

Your OrderApp will now work with geolocation on HTTPS! 🎉

