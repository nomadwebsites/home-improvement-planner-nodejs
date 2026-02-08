#!/bin/bash

echo "=========================================="
echo "Setting up Nginx Reverse Proxy"
echo "=========================================="
echo ""

# Install nginx
echo "Step 1: Installing nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# Stop nginx temporarily
sudo systemctl stop nginx

# Create nginx configuration
echo ""
echo "Step 2: Creating nginx configuration..."

sudo tee /etc/nginx/sites-available/home-improvement-planner > /dev/null << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    
    server_name homeimprovements.local _;
    
    # Increase timeouts for real-time connections
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for Socket.IO
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward real IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO specific settings
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        
        # Timeouts for long-lived connections
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # Forward real IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINXCONF

# Enable the site
echo ""
echo "Step 3: Enabling the nginx site..."
sudo ln -sf /etc/nginx/sites-available/home-improvement-planner /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo ""
echo "Step 4: Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "Step 5: Starting nginx..."
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    echo ""
    echo "=========================================="
    echo "Nginx Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Nginx is now forwarding:"
    echo "  http://YOUR_VM_IP → http://localhost:3000"
    echo "  http://homeimprovements.local → http://localhost:3000"
    echo ""
    echo "Open firewall for HTTP:"
    echo "  sudo ufw allow 80"
    echo ""
    echo "Make sure your Node.js app is running on port 3000!"
    echo ""
else
    echo ""
    echo "ERROR: Nginx configuration test failed!"
    echo "Please check the configuration."
    exit 1
fi
