#!/bin/bash
# update-network.sh - Quick network configuration update

# Get current IP address (works on most systems)
if command -v ip &> /dev/null; then
    # Linux with ip command
    CURRENT_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+')
elif command -v route &> /dev/null; then
    # macOS/Linux with route command
    CURRENT_IP=$(route get default | grep interface | awk '{print $2}' | xargs ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)
else
    # Fallback - ask user
    echo "Cannot auto-detect IP. Please enter your current IP address:"
    read CURRENT_IP
fi

if [ -z "$CURRENT_IP" ]; then
    echo "Could not determine IP address. Please enter manually:"
    read CURRENT_IP
fi

echo "Setting network configuration to: $CURRENT_IP"

# Update .env file
cat > .env << EOF
REACT_APP_API_HOST=$CURRENT_IP
REACT_APP_API_PORT=8000
REACT_APP_FRONTEND_PORT=3000

API_CORS_FRONTEND_HOST=$CURRENT_IP
API_CORS_FRONTEND_PORT=3000
API_CORS_MOBILE_HOST=$CURRENT_IP
EOF

echo "✅ Network configuration updated!"
echo "Frontend will connect to: http://$CURRENT_IP:8000"
echo "Backend will allow CORS from: http://$CURRENT_IP:3000"
echo ""
echo "Now restart your servers:"
echo "  Backend: python run_api.py"
echo "  Frontend: npm start"