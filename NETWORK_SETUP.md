# Network Setup Guide

This guide explains how to set up your Finance Tracker to work on any network without hardcoded IP addresses.

## Quick Start

### 1. Initial Setup
```bash
# Copy the environment template
cp .env.example .env

# Make the network script executable
chmod +x update-network.sh

# Run the network detection script
./update-network.sh
```

### 2. When You Change Networks
```bash
# Just run this one command
./update-network.sh
```

That's it! All your services will automatically use the new IP address.

## What This Fixes

Before this setup, you had hardcoded IP addresses in:
- ✅ Frontend API service (`src/services/api.ts`)
- ✅ Backend CORS configuration (`src/api/main.py`) 
- ✅ Upload components (`ManualBalanceEntry.tsx`)
- ✅ Legacy API client (`src/api/api-client.js`)

Now everything reads from environment variables that update automatically.

## How It Works

### Environment Variables
All network configuration is stored in `.env`:
```bash
CURRENT_IP=192.168.1.226  # Your current network IP
REACT_APP_API_BASE_URL=http://192.168.1.226:8000/api
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.226:3000
```

### Automatic Detection
The `update-network.sh` script:
1. Detects your current IP address automatically
2. Updates the `.env` file with new values
3. All services read from this file

### Service Integration
- **Frontend**: Uses `process.env.REACT_APP_API_BASE_URL`
- **Backend**: Uses `os.getenv("CORS_ORIGINS")`
- **Components**: Use the centralized API service

## Troubleshooting

### Script Won't Run
```bash
# Make sure it's executable
chmod +x update-network.sh
```

### IP Detection Fails
```bash
# Run script and enter IP manually when prompted
./update-network.sh
```

### Services Don't Pick Up Changes
```bash
# Restart both services after running update-network.sh
python run_api.py
npm start
```

### Check Current Configuration
```bash
# View your current .env file
cat .env
```

## Manual Configuration

If automatic detection doesn't work, edit `.env` directly:
```bash
# Edit the file
nano .env

# Update this line with your current IP
CURRENT_IP=your.current.ip.here
```

## Production Deployment

For production, the system automatically uses relative URLs:
- Frontend: `/api` (relative path)
- Backend: CORS configured for your production domain

No IP addresses needed in production!

## Network Types

This setup works with:
- ✅ Home WiFi networks
- ✅ Office networks  
- ✅ Mobile hotspots
- ✅ VPN connections
- ✅ Any IPv4 network

## Files Created/Modified

### New Files:
- `.env` - Your network configuration
- `.env.example` - Template for other developers
- `update-network.sh` - Network detection script
- `NETWORK_SETUP.md` - This guide

### Modified Files:
- `src/services/api.ts` - Uses environment variables
- `src/api/main.py` - Dynamic CORS configuration
- `src/components/upload/ManualBalanceEntry.tsx` - Uses API service

## Benefits

- 🚀 **One command** to update everything
- 🌐 **Works on any network** without code changes
- 👥 **Team friendly** - other developers just run the script
- 🔧 **No more hunting** for hardcoded IP addresses
- 📱 **Mobile testing** works automatically