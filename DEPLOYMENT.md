# 🚀 Deployment Guide for Proxmox Ubuntu 22.04 LTS VM

## What You're Getting

A fully functional home improvement planning web app with:
- ✅ **Multiple Projects** - Add unlimited home improvement projects
- ✅ **Cost Tracking** - Individual cost items per project with auto-calculated totals
- ✅ **Value-Add Estimates** - Optional ROI tracking with descriptions
- ✅ **Priority System** - Drag-and-drop reordering of projects
- ✅ **Mobile Friendly** - Responsive design for phones, tablets, and desktops
- ✅ **Real-time Sync** - Live updates across all devices using Socket.IO
- ✅ **Persistent Storage** - SQLite database (protected from git updates)
- ✅ **No Authentication** - Perfect for local network use

## Deployment Steps

### Option 1: Quick Setup (Recommended)

1. **Transfer files to your Ubuntu VM**
   ```bash
   # If you have git repository:
   cd ~
   git clone YOUR_REPO_URL home-improvement-planner
   cd home-improvement-planner
   
   # Or use SCP from your local machine:
   # scp -r /path/to/project/* user@vm-ip:~/home-improvement-planner/
   ```

2. **Run automated setup**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   
   This installs:
   - Node.js 18.x
   - Build tools (gcc, make, python)
   - All npm dependencies
   - Creates data directory

3. **Start the application**
   ```bash
   npm start
   ```
   
   You should see:
   ```
   Server running on port 3000
   Access the app at http://localhost:3000
   ```

4. **Access from your network**
   
   Find your VM's IP address:
   ```bash
   hostname -I
   ```
   
   Open firewall (if enabled):
   ```bash
   sudo ufw allow 3000
   ```
   
   Access from any device on your network:
   ```
   http://YOUR_VM_IP:3000
   ```
   
   Example: `http://192.168.1.100:3000`

### Option 2: Manual Setup

If you prefer step-by-step control:

```bash
# 1. Update system
sudo apt-get update

# 2. Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# 3. Navigate to project directory
cd ~/home-improvement-planner

# 4. Create data directory
mkdir -p data

# 5. Install dependencies
npm install

# 6. Start the app
npm start
```

## Running as a System Service (Recommended)

This makes the app start automatically when your VM boots.

1. **Edit the service file**
   ```bash
   nano home-improvement-planner.service
   ```
   
   Update these two lines:
   ```ini
   User=YOUR_USERNAME          # Replace with your Ubuntu username
   WorkingDirectory=/home/YOUR_USERNAME/home-improvement-planner  # Full path
   ```

2. **Install the service**
   ```bash
   sudo cp home-improvement-planner.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable home-improvement-planner
   sudo systemctl start home-improvement-planner
   ```

3. **Verify it's running**
   ```bash
   sudo systemctl status home-improvement-planner
   ```

4. **Useful service commands**
   ```bash
   # Stop the service
   sudo systemctl stop home-improvement-planner
   
   # Restart after updates
   sudo systemctl restart home-improvement-planner
   
   # View logs
   sudo journalctl -u home-improvement-planner -f
   
   # Disable auto-start
   sudo systemctl disable home-improvement-planner
   ```

## Proxmox VM Configuration

### Network Settings

For the app to be accessible from other devices:

1. **VM Network Mode**: Use **Bridge mode** (not NAT)
   - In Proxmox: VM → Hardware → Network Device → Bridge mode

2. **Static IP (Optional but Recommended)**
   
   Edit netplan configuration:
   ```bash
   sudo nano /etc/netplan/00-installer-config.yaml
   ```
   
   Example configuration:
   ```yaml
   network:
     version: 2
     ethernets:
       ens18:  # Your interface name (might be different)
         dhcp4: no
         addresses:
           - 192.168.1.100/24  # Your desired static IP
         gateway4: 192.168.1.1
         nameservers:
           addresses:
             - 8.8.8.8
             - 8.8.4.4
   ```
   
   Apply changes:
   ```bash
   sudo netplan apply
   ```

### Firewall Configuration

If UFW is enabled:

```bash
# Check status
sudo ufw status

# Allow port 3000
sudo ufw allow 3000

# If you want to restrict to local network only:
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

### Resource Allocation

Recommended VM specs:
- **CPU**: 1-2 cores
- **RAM**: 1-2 GB
- **Disk**: 10 GB (plenty for SQLite database)

The app is very lightweight - it will run smoothly on minimal resources.

## Using the Application

### Adding Your First Project

1. Click **"+ Add New Project"**
2. Enter project name (e.g., "Kitchen Remodel")
3. Add estimated value-add: `25000`
4. Add description: "Modern kitchen with updated appliances"
5. Click **"Save Project"**

### Adding Costs

1. Find your project card
2. Click **"+ Add Cost"**
3. Enter description: "Cabinets"
4. Enter amount: `8500`
5. Click **"Save Cost"**

Repeat for all cost items. The total updates automatically!

### Reordering Projects

- **Drag and drop** project cards to reorder
- The priority number updates automatically
- Changes sync in real-time to all connected devices

### Editing

- Click the **✏️ (edit)** icon on projects
- Click **"Edit"** button on individual costs
- Changes sync instantly

### Deleting

- Click the **🗑️ (delete)** icon to remove projects
- Click **"Delete"** button to remove individual costs
- Deleting a project also removes all its costs

## Data Management

### Where Data is Stored

```
home-improvement-planner/
├── data/
│   └── projects.db     ← Your SQLite database (PROTECTED)
```

### Data Protection

✅ The `data/` directory is in `.gitignore`
✅ Git updates will NOT overwrite your data
✅ Database persists across app updates

### Backing Up Your Data

**Recommended**: Set up automatic backups

```bash
# Create backup script
nano ~/backup-home-planner.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR=~/home-improvement-backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
cp ~/home-improvement-planner/data/projects.db $BACKUP_DIR/projects_$DATE.db
# Keep only last 30 days of backups
find $BACKUP_DIR -name "projects_*.db" -mtime +30 -delete
```

Make it executable:
```bash
chmod +x ~/backup-home-planner.sh
```

**Add to crontab** for daily backups:
```bash
crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * /home/YOUR_USERNAME/backup-home-planner.sh
```

### Manual Backup

```bash
# Quick backup
cp data/projects.db data/projects.db.backup

# Backup with timestamp
cp data/projects.db data/projects-$(date +%Y%m%d).db

# Copy to another location
scp data/projects.db your-pc@192.168.1.50:~/backups/
```

### Restoring from Backup

```bash
# Stop the service
sudo systemctl stop home-improvement-planner

# Replace database
cp data/projects.db.backup data/projects.db

# Restart service
sudo systemctl start home-improvement-planner
```

## Updating the Application

When you pull updates from git:

```bash
cd ~/home-improvement-planner

# Backup database first (just in case)
cp data/projects.db data/projects.db.backup

# Pull updates
git pull

# Install any new dependencies
npm install

# Restart the service
sudo systemctl restart home-improvement-planner
```

Your data in `data/projects.db` will be preserved! ✅

## Customization

### Change Port Number

**Method 1: Environment variable**
```bash
PORT=8080 npm start
```

**Method 2: Edit service file**
```bash
sudo nano /etc/systemd/system/home-improvement-planner.service
```

Add under `[Service]`:
```ini
Environment=PORT=8080
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart home-improvement-planner
```

Don't forget to update firewall:
```bash
sudo ufw allow 8080
```

### Change Application Title

Edit `/workspace/project/public/index.html` line 6:
```html
<title>Your Custom Title</title>
```

And line 13:
```html
<h1>🏠 Your Custom Title</h1>
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using it
sudo lsof -i :3000

# Kill the process
sudo kill -9 PID_NUMBER

# Or change the port (see Customization above)
```

### Can't Access from Phone/Tablet

1. **Check VM IP**
   ```bash
   hostname -I
   ```

2. **Check firewall**
   ```bash
   sudo ufw status
   sudo ufw allow 3000
   ```

3. **Check if service is running**
   ```bash
   sudo systemctl status home-improvement-planner
   ```

4. **Check Proxmox network mode**
   - Must be Bridge mode, not NAT

5. **Test from VM itself**
   ```bash
   curl http://localhost:3000
   ```

### Real-time Updates Not Working

This usually means Socket.IO can't connect:

1. **Check browser console** (F12 → Console tab)
   - Look for Socket.IO connection errors

2. **Check firewall** - Make sure port 3000 is open

3. **Check server logs**
   ```bash
   sudo journalctl -u home-improvement-planner -f
   ```

### Database Errors

```bash
# Stop service
sudo systemctl stop home-improvement-planner

# Check database file permissions
ls -la data/projects.db

# Fix permissions if needed
chmod 644 data/projects.db

# Restart
sudo systemctl start home-improvement-planner
```

### Application Won't Start

```bash
# Check logs
sudo journalctl -u home-improvement-planner -n 50

# Common issues:
# 1. Node.js not installed
node -v  # Should show v18.x or higher

# 2. Dependencies not installed
cd ~/home-improvement-planner
npm install

# 3. Data directory missing
mkdir -p data

# 4. Port already in use (see above)
```

## Performance Optimization

### For Many Projects (100+)

The SQLite database will handle hundreds of projects easily. If you experience slowness:

1. **Add indexes** (edit `server.js` database initialization):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_project_priority ON projects(priority);
   CREATE INDEX IF NOT EXISTS idx_costs_project ON costs(project_id);
   ```

2. **Enable SQLite WAL mode** for better concurrent access:
   ```javascript
   db.pragma('journal_mode = WAL');
   ```

### For Multiple Concurrent Users

The app supports multiple users viewing/editing simultaneously thanks to Socket.IO. However, for optimal performance:

1. **Increase VM resources** if needed:
   - 2 CPU cores
   - 2 GB RAM

2. **Enable production optimizations** in `server.js`:
   ```javascript
   db.pragma('cache_size = -2000');  // 2MB cache
   ```

## Security Considerations

⚠️ **Important**: This app has NO authentication

✅ **Safe for**:
- Home network use only
- Trusted family members
- Local LAN access

❌ **DO NOT**:
- Expose directly to the internet
- Use on untrusted networks
- Store sensitive financial information

### If You Need Internet Access

**Option 1: VPN** (Recommended)
- Set up a VPN server (WireGuard, OpenVPN)
- Connect to your home network remotely
- Access the app normally

**Option 2: Reverse Proxy with Authentication**
```bash
# Install nginx
sudo apt-get install nginx apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd youruser

# Configure nginx reverse proxy with basic auth
# (Full nginx config not included - consult nginx docs)
```

**Option 3: Add Authentication to the App**
- This requires code modifications
- Consider using express-basic-auth or passport.js

## Advanced: Running Multiple Instances

If you want separate apps for different purposes:

```bash
# Instance 1 (Port 3000)
cd ~/home-improvement-planner
npm start

# Instance 2 (Port 3001)
cp -r ~/home-improvement-planner ~/home-remodeling-planner
cd ~/home-remodeling-planner
PORT=3001 npm start
```

Each will have its own database!

## Getting Help

If you run into issues:

1. **Check service status**
   ```bash
   sudo systemctl status home-improvement-planner
   ```

2. **View logs**
   ```bash
   sudo journalctl -u home-improvement-planner -f
   ```

3. **Test manually**
   ```bash
   cd ~/home-improvement-planner
   npm start
   # Watch for error messages
   ```

4. **Check browser console**
   - Open app in browser
   - Press F12
   - Look for errors in Console tab

## Enjoy Your App! 🎉

You now have a fully functional home improvement planner that you and your wife can use from any device on your network!

Key features to remember:
- 📱 Works on phones, tablets, and computers
- ⚡ Real-time sync across all devices
- 💾 Your data is safe and persistent
- 🎯 Drag-and-drop to prioritize projects
- 📊 Automatic cost calculations and summaries

Happy planning! 🏠✨
