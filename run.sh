#!/bin/bash

# NexusStitch 360 - One-Command Launcher Script
# Starts both FastAPI Backend (port 8000) and Vite React Frontend (port 3000)

echo "=========================================================================="
echo "          Launching NexusStitch 360 (AMEX Centurion Platform)            "
echo "=========================================================================="

# Check Python environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install fastapi uvicorn pydantic numpy networkx websockets torch --quiet
else
    source venv/bin/activate
fi

# Kill any previous processes on 8000 or 3000
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start Backend Server in Background
echo "Starting FastAPI Backend Server on http://127.0.0.1:8000 ..."
python3 -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# Check Backend Health
curl -s http://127.0.0.1:8000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ FastAPI Backend initialized successfully!"
else
    echo "⚠️ Backend starting up..."
fi

# Check Frontend Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing Frontend Dependencies..."
    npm install --prefix frontend
fi

# Start Frontend Dev Server
echo "Starting React Vite Frontend Server on http://localhost:3000 ..."
npm run dev --prefix frontend -- --port 3000 --host 0.0.0.0 &
FRONTEND_PID=$!

echo "=========================================================================="
echo "🚀 NexusStitch 360 is live!"
echo "   - Frontend Analyst Dashboard: http://localhost:3000"
echo "   - Backend REST & WebSockets: http://127.0.0.1:8000"
echo "   - Interactive Swagger Docs:  http://127.0.0.1:8000/docs"
echo "=========================================================================="
echo "Press CTRL+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '\nServers stopped.'; exit" INT
wait
