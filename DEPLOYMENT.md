# Deployment Guide - Tony Mission Control

This guide covers deploying Mission Control to production on your server.

---

## 🎯 Deployment Overview

**Current Setup:**
- Server: srv1296870 (168.231.111.241)
- User: clawdbot
- OS: Linux (Ubuntu/Debian)
- Existing: OpenClaw Gateway running

**Target Configuration:**
- **Application:** Mission Control Dashboard
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **Port:** 3000 (internal), 80/443 (external)
- **Domain:** mission.cytsoftware.com (or subdomain TBD)
- **SSL:** Let's Encrypt (optional)

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed (`sudo apt install nginx`)
- [ ] Repository cloned to server
- [ ] Dependencies installed (`npm install`)
- [ ] Data synced (`npm run sync`)
- [ ] Production build tested (`npm run build && npm start`)

---

## 🚀 Step-by-Step Deployment

### 1. Prepare the Application

```bash
# Navigate to project directory
cd ~/dev/tony-mission-control

# Install production dependencies
npm ci --production=false

# Build the application
npm run build

# Sync initial data
npm run sync

# Test production build locally
npm start
# Verify at http://localhost:3000, then Ctrl+C to stop
```

### 2. Configure PM2

The project includes `ecosystem.config.js`. Review and adjust if needed:

```javascript
module.exports = {
  apps: [{
    name: 'mission-control',
    script: 'npm',
    args: 'start',
    cwd: '/home/clawdbot/dev/tony-mission-control',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLAWD_PATH: '/home/clawdbot/clawd'
    }
  }]
}
```

**Start with PM2:**

```bash
# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs mission-control

# Monitor resources
pm2 monit
```

**Save PM2 configuration:**

```bash
# Save current PM2 processes
pm2 save

# Generate startup script (run once)
pm2 startup

# This will output a command to run with sudo
# Execute that command to enable auto-start on reboot
```

### 3. Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/mission-control
```

**Basic Configuration (HTTP):**

```nginx
server {
    listen 80;
    server_name mission.cytsoftware.com;  # Change to your domain

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE endpoint (disable buffering)
    location /api/stream {
        proxy_pass http://localhost:3000;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Optional: Basic auth for security
    # auth_basic "Mission Control";
    # auth_basic_user_file /etc/nginx/.htpasswd;
}
```

**Enable the site:**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mission-control /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Set Up SSL (Optional but Recommended)

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d mission.cytsoftware.com

# Certbot will automatically update Nginx config for HTTPS
# It also sets up auto-renewal via cron
```

**Verify auto-renewal:**

```bash
sudo certbot renew --dry-run
```

### 5. Configure Firewall

If using UFW (Ubuntu Firewall):

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Or specific ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

---

## 🔄 Data Sync Strategy

Mission Control needs periodic data sync from `~/clawd/` to SQLite cache.

### Option 1: Cron Job (Recommended)

```bash
# Edit crontab
crontab -e

# Add sync job (every 5 minutes)
*/5 * * * * cd /home/clawdbot/dev/tony-mission-control && npm run sync >> /home/clawdbot/logs/mission-control-sync.log 2>&1

# Or use the file watcher (runs continuously)
# PM2 can manage this as a separate process
```

### Option 2: PM2 Cron Module

```bash
# Install PM2 cron module
pm2 install pm2-cron

# Configure in ecosystem.config.js
{
  name: 'mission-control-sync',
  script: 'npm',
  args: 'run sync',
  cron_restart: '*/5 * * * *',  // Every 5 minutes
  autorestart: false
}
```

### Option 3: File Watcher (Real-time)

The application includes a file watcher that can run continuously:

```bash
# Add to ecosystem.config.js
{
  name: 'mission-control-watcher',
  script: 'npm',
  args: 'run watch',  // You'll need to create this script
  autorestart: true
}
```

---

## 📊 Monitoring & Logging

### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs mission-control

# View last 100 lines
pm2 logs mission-control --lines 100

# Clear logs
pm2 flush
```

### Log Files

Configure log rotation in `ecosystem.config.js`:

```javascript
{
  error_file: '/home/clawdbot/logs/mission-control-error.log',
  out_file: '/home/clawdbot/logs/mission-control-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  max_memory_restart: '500M'
}
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based dashboard (optional)
pm2 install pm2-server-monit
```

---

## 🔐 Security Considerations

### 1. Basic Authentication (Nginx)

```bash
# Install apache2-utils
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd chris

# Enter password when prompted

# Uncomment auth lines in Nginx config
```

### 2. Environment Variables

Create `.env.local` with sensitive data:

```env
DASHBOARD_TOKEN=your-secret-token-here
DATABASE_PATH=/home/clawdbot/dev/tony-mission-control/data/mission-control.db
```

**Never commit `.env.local` to git!**

### 3. File Permissions

```bash
# Ensure proper ownership
chown -R clawdbot:clawdbot ~/dev/tony-mission-control

# Protect sensitive files
chmod 600 .env.local
```

### 4. Firewall Rules

Only expose necessary ports:

```bash
# Close direct access to app port
sudo ufw deny 3000/tcp

# Only allow Nginx
sudo ufw allow 'Nginx Full'
```

---

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Stop the application
pm2 stop mission-control

# Pull latest changes
cd ~/dev/tony-mission-control
git pull origin master

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart mission-control

# Or use PM2 reload for zero-downtime
pm2 reload mission-control
```

### Database Backups

```bash
# Create backup script
cat > ~/dev/tony-mission-control/scripts/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
cp ~/dev/tony-mission-control/data/mission-control.db \
   ~/backups/mission-control-$DATE.db
# Keep only last 7 days
find ~/backups -name "mission-control-*.db" -mtime +7 -delete
EOF

chmod +x ~/dev/tony-mission-control/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /home/clawdbot/dev/tony-mission-control/scripts/backup-db.sh
```

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs mission-control --err

# Check port availability
sudo lsof -i :3000

# Verify build
cd ~/dev/tony-mission-control
npm run build
```

### Nginx errors

```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database issues

```bash
# Check database file
ls -lh ~/dev/tony-mission-control/data/mission-control.db

# Re-sync data
cd ~/dev/tony-mission-control
npm run sync

# Check file permissions
chmod 644 data/mission-control.db
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

---

## 📈 Performance Optimization

### 1. Enable Caching

Add to Nginx config:

```nginx
# Static assets caching
location /_next/static {
    proxy_cache_valid 200 60m;
    proxy_cache_bypass $http_pragma;
    add_header Cache-Control "public, max-age=3600";
    proxy_pass http://localhost:3000;
}
```

### 2. Compression

Add to Nginx config:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_proxied any;
gzip_vary on;
```

### 3. PM2 Cluster Mode

For better resource utilization:

```javascript
// ecosystem.config.js
{
  instances: 2,  // Or 'max' for all CPU cores
  exec_mode: 'cluster'
}
```

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain/IP
- [ ] All pages loading correctly
- [ ] Data syncing properly
- [ ] Real-time updates working
- [ ] SSL certificate installed (if applicable)
- [ ] PM2 auto-start configured
- [ ] Logs rotating properly
- [ ] Backups scheduled
- [ ] Firewall configured
- [ ] Authentication working (if enabled)

---

## 🆘 Support

**Common Commands:**

```bash
# Application management
pm2 status
pm2 restart mission-control
pm2 logs mission-control
pm2 monit

# Nginx management
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# View logs
pm2 logs mission-control --lines 100
sudo tail -f /var/log/nginx/access.log

# Sync data manually
cd ~/dev/tony-mission-control && npm run sync
```

---

**Deployment completed successfully!** 🚀

Your Mission Control dashboard should now be accessible at your configured domain.
