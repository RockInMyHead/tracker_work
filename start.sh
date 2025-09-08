#!/bin/bash

# Task Manager Startup Script
echo "🚀 Starting Task Manager..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Start Django backend in background
echo "🔧 Starting Django backend..."
python manage.py runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend..."
cd frontend
npm run dev -- --port 3001 &
FRONTEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for servers to be ready..."
sleep 5

# Check if servers are running
if curl -s http://127.0.0.1:8000/api/v1/ > /dev/null; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend failed to start"
    cleanup
fi

if curl -s http://localhost:3001/ > /dev/null; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend failed to start"
    cleanup
fi

echo ""
echo "🎉 Task Manager is running!"
echo ""
echo "📊 Backend API:    http://127.0.0.1:8000"
echo "🌐 Frontend:       http://localhost:3001"
echo "📚 API Docs:       http://127.0.0.1:8000/api/schema/swagger-ui/"
echo ""
echo "👤 Test Credentials:"
echo "   Admin:    admin / admin123"
echo "   Employee: employee1 / emp123"
echo ""
echo "🛑 To stop: Press Ctrl+C"

# Keep script running
wait
