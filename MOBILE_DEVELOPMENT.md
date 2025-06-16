# Mobile Development Setup

## Quick Start for Mobile Testing

### 1. Install Ngrok
```bash
npm install -g ngrok
```

### 2. Start Your Services
```bash
# Terminal 1: Start API
python run_api.py

# Terminal 2: Start frontend  
npm start
```

### 3. Create Secure Tunnel
```bash
# Terminal 3: Create tunnel for API
ngrok http 8000
```

### 4. Update Frontend for Mobile
```bash
# Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
# Update .env temporarily:
REACT_APP_API_BASE_URL=https://abc123.ngrok.io/api
```

### 5. Test on Mobile
- Restart your frontend: `npm start`
- Open browser on phone: `http://localhost:3000` or the ngrok URL
- Your mobile device can now access your local API securely!

## Benefits

✅ **Secure HTTPS** - All mobile traffic encrypted  
✅ **Works anywhere** - Home, office, coffee shop  
✅ **No IP configuration** - Automatic network handling  
✅ **Professional workflow** - Industry standard approach  

## Production Deployment

For production, use relative URLs:
```bash
REACT_APP_API_BASE_URL=/api
```

No ngrok needed in production - the app uses the same domain.
