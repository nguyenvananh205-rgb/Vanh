#!/bin/bash
# Start both backend and frontend

echo "=== Zalo Message Manager ==="

# Backend
echo "[1/2] Khởi động backend (FastAPI)..."
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Khởi động frontend (React + Vite)..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Đã khởi động:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Nhấn Ctrl+C để dừng."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
