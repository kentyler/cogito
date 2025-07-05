# Docker WSL Integration Troubleshooting

## "Cannot Connect Extensions" Error Solutions

This error typically occurs when Docker Desktop can't properly communicate with WSL distributions.

### Solution 1: Restart Docker Desktop and WSL

**From Windows (not WSL):**
```powershell
# In PowerShell as Administrator:
wsl --shutdown
```

**Then:**
1. Close Docker Desktop completely (check system tray)
2. Wait 10 seconds
3. Restart Docker Desktop
4. Wait for Docker to fully start
5. Reopen WSL terminal

### Solution 2: Reset WSL Integration

**In Docker Desktop:**
1. Settings → Resources → WSL Integration
2. **Uncheck** "Enable integration with my default WSL distro"
3. **Uncheck** all individual distributions
4. Click "Apply & Restart"
5. Wait for restart to complete
6. Go back to WSL Integration settings
7. **Check** "Enable integration with my default WSL distro"
8. **Check** your Ubuntu distribution
9. Click "Apply & Restart" again

### Solution 3: Reset Docker Desktop

**Complete Docker Reset:**
1. Docker Desktop → Settings → Troubleshoot
2. Click "Reset to factory defaults"
3. Confirm reset (this will remove all containers/images)
4. Restart Docker Desktop
5. Re-enable WSL integration (Solution 2 steps)

### Solution 4: Manual WSL Distribution Detection

**From Windows PowerShell:**
```powershell
# List all WSL distributions
wsl --list --verbose

# Set your distribution as default if needed
wsl --set-default Ubuntu-22.04  # or your distro name
```

### Solution 5: Check Windows Features

**Ensure these Windows features are enabled:**
1. Windows Subsystem for Linux
2. Virtual Machine Platform
3. Hyper-V (if available on your Windows edition)

**Enable via PowerShell (as Administrator):**
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### Solution 6: Update WSL Kernel

**From Windows PowerShell:**
```powershell
wsl --update
wsl --shutdown
```

### Solution 7: Firewall/Antivirus

- Temporarily disable Windows Firewall
- Add Docker Desktop to antivirus exceptions
- Check if corporate firewall is blocking Docker

### Testing Docker Integration

**Once fixed, test with these commands from WSL:**
```bash
# Should show Docker version
docker --version

# Should show running containers (if any)
docker ps

# Test with hello-world
docker run hello-world
```

### Alternative: PostgreSQL Without Docker

If Docker WSL integration continues to fail, you can install PostgreSQL directly:

**Option A: PostgreSQL on Windows**
1. Download PostgreSQL for Windows
2. Install with default settings
3. Use `localhost:5432` from WSL
4. Update `.env` file accordingly

**Option B: PostgreSQL in WSL**
```bash
# Install PostgreSQL in WSL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database and user
sudo -u postgres createuser --interactive cogito
sudo -u postgres createdb cogito_multi
```

## Most Common Fix

The most frequently successful solution is **Solution 2** (Reset WSL Integration) followed by **Solution 1** (Restart both services).

Try these in order, testing `docker --version` from WSL after each attempt.