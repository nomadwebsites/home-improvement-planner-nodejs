# Quick Start Guide

## For Ubuntu 22.04 LTS VM on Proxmox

### 1. Transfer Files to Your VM

Choose one of these methods:

**Option A: Using Git (Recommended)**
```bash
# On your Ubuntu VM
cd ~
git clone <your-repository-url> home-improvement-planner
cd home-improvement-planner
```

**Option B: Using SCP from your local machine**
```bash
# From your local machine
scp -r /path/to/project/* user@vm-ip-address:~/home-improvement-planner/
```

**Option C: Manual download**
- Download files as ZIP
- Upload to VM via SFTP or Proxmox console
- Extract in your home directory

### 2. Run Setup

```bash
cd ~/home-improvement-planner
chmod +x setup.sh
./setup.sh
```

This will:
- Install Node.js 18.x
- Install build tools
- Install npm dependencies
- Create data directory

### 3. Start the Application

```bash
npm start
```

You should see:
```
Server running on port 3000
Access the app at http://localhost:3000
```

### 4. Access from Your Network

Find your VM's IP address:
```bash
hostname -I
```

Open firewall port (if needed):
```bash
sudo ufw allow 3000
```

Access from any device on your network:
```
http://YOUR_VM_IP:3000
```

Example: `http://192.168.1.100:3000`

### 5. Set Up as a Service (Optional but Recommended)

Edit the service file:
```bash
nano home-improvement-planner.service
```

Update:
- Line 6: `User=YOUR_USERNAME` → your Ubuntu username
- Line 7: `WorkingDirectory=/path/to/home-improvement-planner` → full path (e.g., `/home/youruser/home-improvement-planner`)

Install service:
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

## Using the App

1. **Add a project**: Click "+ Add New Project"
2. **Add costs**: Click "+ Add Cost" on any project
3. **Reorder**: Drag and drop projects to set priority
4. **Edit**: Click ✏️ icon or Edit button
5. **Delete**: Click 🗑️ icon or Delete button

Changes sync in real-time across all devices! 🎉

## Troubleshooting

**Can't access from phone/tablet?**
- Check VM IP: `hostname -I`
- Open firewall: `sudo ufw allow 3000`
- Verify Proxmox VM network is in bridge mode

**Port 3000 already in use?**
```bash
PORT=8080 npm start
```

**View logs:**
```bash
# If running as service
sudo journalctl -u home-improvement-planner -f

# If running manually
# Output is in the terminal
```

## Data Safety

✅ Your data is stored in `data/projects.db`
✅ The `data/` folder is in `.gitignore`
✅ Git updates won't overwrite your data
✅ Backup recommendation: `cp -r data data-backup-$(date +%Y%m%d)`

## Need Help?

Check the full README.md for detailed documentation!
