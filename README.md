# 🏠 Home Improvement Planner

A web-based application for planning and estimating home improvement projects. Track multiple projects, manage costs, calculate value-add, and prioritize your home renovations.

## Features

- ✨ **Multiple Projects**: Add and manage multiple home improvement projects
- 💰 **Cost Tracking**: Add individual cost items for each project with automatic total calculation
- 📈 **Value Add Estimation**: Track estimated value-add and ROI for each project
- 🎯 **Priority Management**: Drag and drop projects to set priorities
- 📱 **Mobile Friendly**: Responsive design works on phones, tablets, and desktops
- ⚡ **Real-time Updates**: Changes sync instantly across all connected devices
- 💾 **Persistent Storage**: Data saved in SQLite database (not overwritten by git updates)

## Technology Stack

- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Installation on Ubuntu 22.04 LTS

### Quick Setup

1. Clone this repository to your Ubuntu VM:
```bash
cd ~
git clone https://github.com/nomadwebsites/home-improvement-planner-nodejs.git
cd home-improvement-planner-nodejs
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

3. Start the application:
```bash
npm start
```

4. Access the app in your browser:
- From the VM: `http://localhost:3000`
- From other devices on your network: `http://YOUR_VM_IP:3000`

### 🌟 Auto-Start Setup (Recommended)

For automatic startup and access without a port number:

1. **Set up auto-start on boot:**
   - See: `AUTO-START-SETUP.md` for complete guide
   - Configures systemd service for automatic startup
   - Sets up nginx reverse proxy (access without port number)

2. **Configure Pi-hole DNS** (optional):
   - See: `PIHOLE-DNS-SETUP.md`
   - Access via friendly URL like `http://homeimprovements.local`
   - No port number needed!

### Manual Setup

If you prefer manual installation:

```bash
# Update system
sudo apt-get update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Create data directory
mkdir -p data

# Install dependencies
npm install

# Start the app
npm start
```

## Running as a Service (Recommended)

To run the app automatically on system boot:

1. Edit the service file with your details:
```bash
nano home-improvement-planner.service
```

Update these lines:
- `User=YOUR_USERNAME` → Your Ubuntu username
- `WorkingDirectory=/path/to/home-improvement-planner` → Full path to the app directory

2. Install and enable the service:
```bash
sudo cp home-improvement-planner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable home-improvement-planner
sudo systemctl start home-improvement-planner
```

3. Check service status:
```bash
sudo systemctl status home-improvement-planner
```

4. View logs:
```bash
sudo journalctl -u home-improvement-planner -f
```

## Usage

### Adding a Project

1. Click **"+ Add New Project"** button
2. Enter project name (required)
3. Optionally add estimated value-add ($) and description
4. Click **"Save Project"**

### Adding Costs to a Project

1. Find your project card
2. Click **"+ Add Cost"** button
3. Enter cost description and amount
4. Click **"Save Cost"**

The project total will automatically update!

### Editing Projects or Costs

- Click the **✏️ (edit)** icon on any project or the **Edit** button on any cost
- Update the information
- Click **"Save"**

### Reordering Projects (Setting Priorities)

- Simply **drag and drop** project cards to reorder them
- The order is saved automatically
- The priority number updates to reflect the new position

### Viewing Summary

Scroll to the bottom to see:
- Total number of projects
- Total cost across all projects  
- Total value-add across all projects
- Net value (value-add minus costs)

## Data Persistence

- All data is stored in `data/projects.db` (SQLite database)
- The `data/` directory is in `.gitignore` and won't be overwritten by git updates
- **Backup recommendation**: Periodically backup the `data/` directory

## Accessing from Other Devices

To access the app from your phone or other devices on your network:

1. Find your VM's IP address:
```bash
hostname -I
```

2. Make sure your VM's firewall allows port 3000:
```bash
sudo ufw allow 3000
```

3. Access from any device on your network:
```
http://YOUR_VM_IP:3000
```

Example: `http://192.168.1.100:3000`

## Configuration

### Changing the Port

Edit `server.js` or set the PORT environment variable:

```bash
PORT=8080 npm start
```

Or in the systemd service file:
```
Environment=PORT=8080
```

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

(Requires nodemon, already included in devDependencies)

## Troubleshooting

### Port Already in Use

If port 3000 is already taken:
```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the process or change the port (see Configuration above)
```

### Can't Access from Other Devices

1. Check firewall:
```bash
sudo ufw status
sudo ufw allow 3000
```

2. Ensure the server is listening on all interfaces (0.0.0.0):
   - This is already configured in `server.js`

3. Verify VM network settings in Proxmox:
   - VM should be in bridge mode for network access

### Database Issues

If you encounter database errors:
```bash
# Stop the app
sudo systemctl stop home-improvement-planner

# Backup current database
cp data/projects.db data/projects.db.backup

# Restart the app (it will recreate tables if needed)
sudo systemctl start home-improvement-planner
```

## Updating the Application

To update when you pull new changes from git:

```bash
cd ~/home-improvement-planner
git pull
npm install  # Install any new dependencies
sudo systemctl restart home-improvement-planner  # Restart the service
```

Your data in the `data/` directory will be preserved!

## Security Notes

- This app has no authentication and is designed for **local network use only**
- Do NOT expose it to the public internet without adding authentication
- For internet access, consider:
  - Setting up a VPN to your home network
  - Using a reverse proxy with authentication (nginx + basic auth)
  - Adding a proper authentication system to the app

## License

MIT License - Feel free to modify and use as needed!

## Support

For issues or questions, please check:
1. Service logs: `sudo journalctl -u home-improvement-planner -f`
2. Application logs: `cat app.log` (if running with nohup)
3. Browser console for frontend errors (F12 in most browsers)
