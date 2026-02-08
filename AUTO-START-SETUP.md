# 🚀 Auto-Start Setup Guide

This guide will configure your Home Improvement Planner to:
1. ✅ Run automatically when the VM starts
2. ✅ Be accessible at `homeimprovements.local` without a port number
3. ✅ Restart automatically if it crashes

---

## 📋 Prerequisites

Make sure you've already:
- ✅ Cloned the repository to your Ubuntu VM
- ✅ Run `./setup.sh` to install Node.js and dependencies
- ✅ Tested that `npm start` works

---

## 🎯 Step-by-Step Setup

### Step 1: Configure the Systemd Service

Edit the service file to add your username:

```bash
cd ~/home-improvement-planner-nodejs
nano home-improvement-planner.service
```

**Find these two lines and update them:**

```ini
User=YOUR_USERNAME          # Change to your actual username
WorkingDirectory=/home/YOUR_USERNAME/home-improvement-planner-nodejs
```

**Example** (if your username is `john`):
```ini
User=john
WorkingDirectory=/home/john/home-improvement-planner-nodejs
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 2: Install the Node.js App as a Service

```bash
# Copy service file to systemd
sudo cp home-improvement-planner.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable home-improvement-planner

# Start the service now
sudo systemctl start home-improvement-planner

# Check that it's running
sudo systemctl status home-improvement-planner
```

You should see **"Active: active (running)"** in green! ✅

### Step 3: Set Up Nginx Reverse Proxy

This allows access without a port number:

```bash
cd ~/home-improvement-planner-nodejs
chmod +x nginx-setup.sh
sudo ./nginx-setup.sh
```

This will:
- Install nginx
- Configure it to forward port 80 → port 3000
- Enable and start nginx automatically

### Step 4: Configure Firewall

```bash
# Allow HTTP traffic (port 80)
sudo ufw allow 80

# You can close port 3000 now (optional, for security)
# sudo ufw delete allow 3000

# Check firewall status
sudo ufw status
```

### Step 5: Configure Pi-hole DNS

Now set up your Pi-hole to point `homeimprovements.local` to your VM:

1. **Log into your Pi-hole admin interface**

2. **Go to:** Local DNS → DNS Records

3. **Add a new DNS record:**
   - **Domain:** `homeimprovements.local`
   - **IP Address:** Your VM's IP (e.g., `192.168.1.100`)

4. **Save**

### Step 6: Test Everything

```bash
# Find your VM's IP
hostname -I

# Test that the app responds on port 80
curl http://localhost

# Test from another device
# Open browser: http://homeimprovements.local
```

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# Check Node.js app status
sudo systemctl status home-improvement-planner

# Check nginx status
sudo systemctl status nginx

# Check that both are enabled for auto-start
systemctl is-enabled home-improvement-planner
systemctl is-enabled nginx

# View app logs
sudo journalctl -u home-improvement-planner -n 50

# View nginx logs
sudo tail -f /var/log/nginx/access.log
```

All should show **"enabled"** and **"active (running)"**! ✅

---

## 🔄 Useful Commands

### Managing the Node.js App

```bash
# Start the app
sudo systemctl start home-improvement-planner

# Stop the app
sudo systemctl stop home-improvement-planner

# Restart the app
sudo systemctl restart home-improvement-planner

# View real-time logs
sudo journalctl -u home-improvement-planner -f

# View last 100 log lines
sudo journalctl -u home-improvement-planner -n 100

# Check status
sudo systemctl status home-improvement-planner
```

### Managing Nginx

```bash
# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Restart nginx
sudo systemctl restart nginx

# Reload config without dropping connections
sudo systemctl reload nginx

# Test config before applying
sudo nginx -t

# Check status
sudo systemctl status nginx
```

### Disable Auto-Start (if needed)

```bash
# Disable Node.js app auto-start
sudo systemctl disable home-improvement-planner

# Disable nginx auto-start
sudo systemctl disable nginx
```

---

## 🌐 Access Methods

After setup, you can access the app via:

1. **From any device on your network:**
   - `http://homeimprovements.local` ← **Recommended!**
   - `http://YOUR_VM_IP` (e.g., `http://192.168.1.100`)

2. **From the VM itself:**
   - `http://localhost`
   - `http://127.0.0.1`
   - `http://homeimprovements.local`

---

## 🔧 Troubleshooting

### App won't start

```bash
# Check logs for errors
sudo journalctl -u home-improvement-planner -n 50

# Common issues:
# 1. Wrong username in service file
# 2. Wrong working directory path
# 3. Node.js not installed
# 4. Dependencies not installed (run: npm install)
```

### Can't access without port number

```bash
# Check nginx is running
sudo systemctl status nginx

# Check nginx config
sudo nginx -t

# Check if port 80 is open
sudo netstat -tlnp | grep :80

# Check firewall
sudo ufw status

# Restart nginx
sudo systemctl restart nginx
```

### Real-time updates not working

```bash
# Check that Socket.IO traffic is being proxied
# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Make sure WebSocket upgrade headers are configured
# (already done in nginx-setup.sh)
```

### Pi-hole DNS not working

1. **Check Pi-hole is set as DNS** on your devices
2. **Flush DNS cache** on your device:
   - **Windows:** `ipconfig /flushdns`
   - **Mac:** `sudo dscacheutil -flushcache`
   - **Linux:** `sudo systemd-resolve --flush-caches`
3. **Test DNS resolution:**
   ```bash
   nslookup homeimprovements.local
   # or
   ping homeimprovements.local
   ```

### Port 80 already in use

```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# If Apache is running:
sudo systemctl stop apache2
sudo systemctl disable apache2

# Then restart nginx
sudo systemctl restart nginx
```

---

## 🔒 Security Notes

### Current Setup

- ✅ No authentication (fine for home network)
- ✅ Only accessible on local network
- ✅ Services run as non-root user
- ✅ Nginx handles external traffic

### If You Want HTTPS

For `https://homeimprovements.local`:

1. **Generate self-signed certificate:**
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/homeimprovements.key \
     -out /etc/ssl/certs/homeimprovements.crt \
     -subj "/CN=homeimprovements.local"
   ```

2. **Update nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/home-improvement-planner
   ```
   
   Add SSL configuration (see DEPLOYMENT.md for full example).

3. **Open HTTPS port:**
   ```bash
   sudo ufw allow 443
   ```

---

## 📊 Resource Usage

Typical resource usage:
- **Node.js app:** ~50-100 MB RAM
- **Nginx:** ~5-10 MB RAM
- **CPU:** Minimal (<1% idle, <5% active)

Very lightweight! ✅

---

## 🎉 You're Done!

After following these steps:

✅ App starts automatically when VM boots  
✅ Accessible at `http://homeimprovements.local`  
✅ No port number needed  
✅ Automatically restarts if it crashes  
✅ Works on all devices (phones, tablets, computers)  
✅ Real-time sync works perfectly  

**Test it:** Reboot your VM and see if you can access the app at `http://homeimprovements.local` without doing anything!

```bash
sudo reboot
```

After reboot, just go to `http://homeimprovements.local` in your browser! 🚀

---

## 📝 Summary of What Was Configured

1. **Systemd service** - Runs Node.js app on port 3000
   - Auto-starts on boot
   - Auto-restarts on failure
   - Logs to systemd journal

2. **Nginx reverse proxy** - Forwards port 80 to 3000
   - Handles HTTP traffic
   - Supports WebSocket (Socket.IO)
   - Auto-starts on boot

3. **Firewall** - Allows HTTP traffic
   - Port 80 open for web access
   - Port 3000 can be closed (app only accessed via nginx)

4. **Pi-hole DNS** - Resolves friendly hostname
   - `homeimprovements.local` → Your VM's IP

---

**Enjoy your always-on home improvement planner!** 🏠✨
