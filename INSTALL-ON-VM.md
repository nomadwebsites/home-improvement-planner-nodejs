# 🚀 3-Step Installation for Ubuntu 22.04 LTS VM

## Step 1: Transfer Files to Your VM

### Option A: Using Git (Recommended)
```bash
# SSH into your Ubuntu VM, then:
cd ~
git clone YOUR_REPO_URL home-improvement-planner
cd home-improvement-planner
```

### Option B: Using SCP
```bash
# From your local machine:
scp -r /path/to/project/* user@vm-ip-address:~/home-improvement-planner/
# Then SSH into VM:
ssh user@vm-ip-address
cd ~/home-improvement-planner
```

---

## Step 2: Run Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

This installs:
- ✅ Node.js 18.x
- ✅ Build tools (gcc, make, python)
- ✅ All npm dependencies
- ✅ Creates data directory

---

## Step 3: Start the Application

### Option A: Run Manually (for testing)
```bash
npm start
```

Find your VM's IP and open firewall:
```bash
hostname -I                    # Shows your VM IP (e.g., 192.168.1.100)
sudo ufw allow 3000           # Open firewall port
```

Access from any device on your network:
```
http://YOUR_VM_IP:3000
```

### Option B: Install as Service (recommended for production)

Edit the service file:
```bash
nano home-improvement-planner.service
```

Update these two lines:
```ini
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/home-improvement-planner
```

Install and start:
```bash
sudo cp home-improvement-planner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable home-improvement-planner
sudo systemctl start home-improvement-planner
```

Check status:
```bash
sudo systemctl status home-improvement-planner
```

---

## 🎉 Done!

Access your app from any device:
- **From phones/tablets**: `http://YOUR_VM_IP:3000`
- **From computers**: `http://YOUR_VM_IP:3000`
- **From VM itself**: `http://localhost:3000`

---

## 📱 Quick Feature Guide

### Add a Project
1. Click **"+ Add New Project"**
2. Enter name, value-add (optional), and description (optional)
3. Click **"Save Project"**

### Add Costs
1. Find your project card
2. Click **"+ Add Cost"**
3. Enter description and amount
4. Click **"Save Cost"**

### Reorder Projects
- **Drag and drop** project cards to reorder by priority

### Edit/Delete
- Click **✏️** to edit projects
- Click **🗑️** to delete projects
- Click **"Edit"** or **"Delete"** buttons for individual costs

### Real-time Sync
All changes sync instantly across all connected devices! 🎉

---

## 🔧 Common Commands

```bash
# Start service
sudo systemctl start home-improvement-planner

# Stop service
sudo systemctl stop home-improvement-planner

# Restart service (after updates)
sudo systemctl restart home-improvement-planner

# View logs
sudo journalctl -u home-improvement-planner -f

# Check status
sudo systemctl status home-improvement-planner

# Backup database
cp data/projects.db data/projects-backup-$(date +%Y%m%d).db
```

---

## 🔄 Updating the App

When you pull new code from git:

```bash
cd ~/home-improvement-planner
git pull                                  # Get updates
npm install                              # Install new dependencies
sudo systemctl restart home-improvement-planner  # Restart
```

✅ **Your data is safe!** The `data/` directory is in `.gitignore` and won't be overwritten.

---

## 🆘 Troubleshooting

### Can't access from phone/tablet?
```bash
# Check VM IP
hostname -I

# Open firewall
sudo ufw allow 3000

# Verify service is running
sudo systemctl status home-improvement-planner
```

### Port 3000 already in use?
```bash
# Change port by editing service file
sudo nano /etc/systemd/system/home-improvement-planner.service

# Add this line under [Service]:
Environment=PORT=8080

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart home-improvement-planner

# Open new port
sudo ufw allow 8080
```

### View error logs
```bash
sudo journalctl -u home-improvement-planner -n 50
```

---

## 📚 Full Documentation

For detailed information, see:
- **README.md** - Complete feature documentation
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **QUICKSTART.md** - Quick setup guide

---

## 💾 Data Safety

✅ All data stored in `data/projects.db`  
✅ Protected from git updates (in `.gitignore`)  
✅ Survives app updates  
✅ Easy to backup: `cp data/projects.db ~/backup/`

---

## 🔒 Security Note

⚠️ This app has **no authentication** and is designed for **local network use only**.

Do NOT expose it directly to the internet!

For remote access, use a VPN to connect to your home network.

---

**Need help?** Check DEPLOYMENT.md for detailed troubleshooting!

**Enjoy your home improvement planner!** 🏠✨
