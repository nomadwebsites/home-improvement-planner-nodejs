#!/bin/bash

echo "=========================================="
echo "Home Improvement Planner - Setup Script"
echo "=========================================="
echo ""

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "Warning: This script is designed for Ubuntu. Proceed with caution on other distributions."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Step 1: Updating system packages..."
sudo apt-get update

echo ""
echo "Step 2: Installing Node.js and npm..."
# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

echo ""
echo "Step 3: Installing build-essential (required for native modules)..."
sudo apt-get install -y build-essential

echo ""
echo "Step 4: Creating data directory..."
mkdir -p data

echo ""
echo "Step 5: Installing Node.js dependencies..."
npm install

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "The app will be available at:"
echo "  http://localhost:3000"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "To run in the background:"
echo "  nohup npm start > app.log 2>&1 &"
echo ""
echo "To set up as a systemd service (recommended for production):"
echo "  sudo cp home-improvement-planner.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable home-improvement-planner"
echo "  sudo systemctl start home-improvement-planner"
echo ""
