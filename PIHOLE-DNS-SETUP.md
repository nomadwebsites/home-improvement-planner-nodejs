# 🔍 Pi-hole DNS Setup Guide

Quick guide for configuring Pi-hole to access your app at `homeimprovements.local`

---

## 📋 What You Need

- ✅ Pi-hole installed and running on your network
- ✅ Home Improvement Planner running on your Ubuntu VM
- ✅ VM's IP address (get it with: `hostname -I`)

---

## 🎯 Setup Steps

### Step 1: Get Your VM's IP Address

On your Ubuntu VM, run:

```bash
hostname -I
```

Example output: `192.168.1.100` (use your actual IP)

### Step 2: Access Pi-hole Admin Panel

Open your browser and go to your Pi-hole admin interface:
- Usually: `http://pi.hole/admin` or `http://YOUR_PIHOLE_IP/admin`

### Step 3: Add Local DNS Record

1. **Click:** "Local DNS" in the left menu
2. **Click:** "DNS Records" tab
3. **Add new record:**
   ```
   Domain: homeimprovements.local
   IP Address: 192.168.1.100    (your VM's IP)
   ```
4. **Click:** "Add" button

### Step 4: Verify DNS Record

In the list, you should now see:
```
homeimprovements.local → 192.168.1.100
```

### Step 5: Test DNS Resolution

From any device on your network:

**On Windows:**
```cmd
nslookup homeimprovements.local
```

**On Mac/Linux:**
```bash
nslookup homeimprovements.local
# or
dig homeimprovements.local
# or
ping homeimprovements.local
```

You should see it resolve to your VM's IP address!

### Step 6: Access the App

Open your browser and go to:
```
http://homeimprovements.local
```

🎉 No port number needed!

---

## 🌐 Alternative Hostnames

You can add multiple DNS records if you want different names:

| Domain | Purpose |
|--------|---------|
| `homeimprovements.local` | Main access (recommended) |
| `renovations.local` | Alternative name |
| `projects.local` | Alternative name |
| `home-planner.local` | Alternative name |

Just add each one in Pi-hole pointing to the same IP!

---

## 🔧 Troubleshooting

### DNS not resolving

1. **Check Pi-hole is your DNS server:**
   - On your device, check network settings
   - DNS should be your Pi-hole's IP

2. **Flush DNS cache:**
   - **Windows:** `ipconfig /flushdns`
   - **Mac:** `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - **Linux:** `sudo systemd-resolve --flush-caches`
   - **Browser:** Clear cache or try incognito/private mode

3. **Check Pi-hole is running:**
   ```bash
   pihole status
   ```

4. **Check DNS record was added:**
   - Go back to Pi-hole admin → Local DNS → DNS Records
   - Verify the record is listed

### Can access via IP but not hostname

- **Issue:** DNS cache needs clearing
- **Solution:** Flush DNS cache (see above)

- **Issue:** Device not using Pi-hole as DNS
- **Solution:** Check device network settings

### "Connection refused" or "Can't connect"

- **Issue:** App or nginx not running
- **Check:**
  ```bash
  sudo systemctl status home-improvement-planner
  sudo systemctl status nginx
  ```

- **Issue:** Firewall blocking port 80
- **Fix:**
  ```bash
  sudo ufw allow 80
  ```

---

## 📱 Mobile Device Setup

Make sure your phones/tablets are using Pi-hole for DNS:

### Android
1. Settings → Wi-Fi
2. Long-press your network → Modify
3. Advanced options → IP settings → Static
4. DNS 1: `YOUR_PIHOLE_IP`
5. Save

### iPhone/iPad
1. Settings → Wi-Fi
2. Tap (i) next to your network
3. Configure DNS → Manual
4. Add Server: `YOUR_PIHOLE_IP`
5. Save

### Or Configure Router (Easier!)
Set your router's DHCP to use Pi-hole as DNS server. Then all devices automatically use it!

---

## 🔐 HTTPS with Custom Domain

If you want `https://homeimprovements.local`:

1. **Generate self-signed certificate** (see AUTO-START-SETUP.md)
2. **Configure nginx for SSL**
3. **Add HTTPS to firewall:**
   ```bash
   sudo ufw allow 443
   ```
4. **Accept certificate warning** in browser (one-time)

Note: Self-signed certs will show a warning. For production, use Let's Encrypt with a real domain.

---

## 🎨 Custom DNS Record Examples

### For Multiple Apps on Same VM

If you run multiple apps on different ports:

```
# Pi-hole DNS Records
homeimprovements.local → 192.168.1.100
plex.local            → 192.168.1.100
nextcloud.local       → 192.168.1.100
```

Then configure nginx to route by hostname:
```nginx
server {
    server_name homeimprovements.local;
    proxy_pass http://localhost:3000;
}

server {
    server_name plex.local;
    proxy_pass http://localhost:32400;
}
```

---

## ✅ Final Check

After setup, you should be able to:

✅ Open `http://homeimprovements.local` in any browser  
✅ Access from phone, tablet, laptop  
✅ No port number needed  
✅ Works instantly (DNS cached)  
✅ Bookmark it for easy access  

---

## 📚 Additional Resources

- **Pi-hole Documentation:** https://docs.pi-hole.net/
- **Local DNS Guide:** https://docs.pi-hole.net/ftldns/local-dns/
- **Nginx Reverse Proxy:** https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/

---

## 🎉 You're Done!

Your home improvement planner is now accessible via a friendly URL!

**Bookmark:** `http://homeimprovements.local` 🏠✨

**Pro tip:** Add to your phone's home screen for quick access!
- **iPhone:** Share → Add to Home Screen
- **Android:** Menu → Add to Home Screen
